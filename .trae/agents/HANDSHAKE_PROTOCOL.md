# HANDSHAKE_PROTOCOL.md — Protocolo de Interfaz entre Agentes

Este documento define los **Contratos de Handshake**, el **Context Packet** y el formato de outputs. Todo agente debe comunicarse únicamente usando estos schemas.

---

## 🤝 1. El Concepto de "Handshake"

Un handshake ocurre cuando un agente termina su fase y delega a otro. Para que sea exitoso, el agente emisor **DEBE** proporcionar un `AgentOutput` válido.

### Estándar de Comunicación
Cada traspaso debe incluir:
1. **ContextPacket** actualizado.
2. **compact_output** (máximo 500 tokens).
3. **full_output** disponible solo para el Supervisor.

---

## 📦 2. Contratos de Datos (Schemas)

```typescript
type WorkflowStage =
  | 'intake'
  | 'spec_proposed'
  | 'spec_designed'
  | 'spec_validated'
  | 'spec_applying'
  | 'gate_security'
  | 'gate_ci'
  | 'gate_qa'
  | 'spec_applied'
  | 'archived'
  | 'error'
  | 'recovering'

type GateSeverity = 'blocking' | 'warning'

type SpecStatus =
  | 'proposed'
  | 'designed'
  | 'validated'
  | 'applied'
  | 'archived'
  | 'rejected'

interface OpenSpec {
  id: string
  version: string
  status: SpecStatus
  title: string
  proposal: string
  design: Record<string, unknown>
  acceptanceCriteria: string[]
  relatedSpecIds: string[]
  appliedAt?: string
  archivedAt?: string
}

interface Decision {
  agentId: string
  skill: string
  description: string
  timestamp: string
  rationale: string
}

interface AgentError {
  agentId: string
  skill: string
  reason: string
  recoverable: boolean
  retryCount: number
  timestamp: string
}

interface GateFeedback {
  gateAgentId: string
  passed: boolean
  failedCriteria: string[]
  suggestedFix: string
  severity: GateSeverity
  affectsSecurityBoundary: boolean
  timestamp: string
}

interface ContextPacket {
  requestId: string
  correlationId: string
  parentRequestId?: string
  spec: OpenSpec
  stage: WorkflowStage
  decisions: Decision[]
  errors: AgentError[]
  gateFeedback: GateFeedback[]
  compact_summary?: string
}

type WorkflowEventType =
  | 'spec_proposed'
  | 'spec_designed'
  | 'spec_validated'
  | 'spec_validation_failed'
  | 'spec_applied'
  | 'gate_passed'
  | 'gate_failed'
  | 'agent_error'
  | 'workflow_recovered'
  | 'workflow_completed'
  | 'workflow_aborted'

interface WorkflowEvent {
  type: WorkflowEventType
  agentId: string
  contextPacket: ContextPacket
  timestamp: string
}

interface AgentOutput {
  full_output: Record<string, unknown>
  compact_output: string
  updatedContextPacket: ContextPacket
  emittedEvents: WorkflowEvent[]
}

interface ValidationError {
  type: 'schema' | 'criteria_ambiguity' | 'spec_conflict'
  field?: string
  description: string
  attempt: number
}
```

---

## Tracing Distribuido

### requestId
- Generado por el Router al recibir la solicitud del usuario.
- Formato: UUID v4
- Scope: identifica una invocación de un agente.
- Cada vez que el Router invoca un agente, genera un nuevo requestId.
- El agente incluye este requestId en su AgentOutput y en todos los WorkflowEvents que emite.

### correlationId
- Generado por el Router al iniciar el workflow completo.
- Formato: UUID v4
- Scope: identifica todo el workflow desde la solicitud hasta el archive.
- El correlationId no cambia durante todo el workflow, incluyendo reintentos.
- Cuando el Supervisor redispara el SDD Agent, el nuevo requestId es diferente pero el correlationId es el mismo.
- El correlationId es el campo a usar para reconstruir un workflow completo en logs.

### Regla de herencia
Todo agente que genera un sub-ContextPacket debe:
1. Generar nuevo requestId (UUID v4)
2. Heredar el correlationId del ContextPacket padre sin modificación
3. Registrar el requestId padre en parentRequestId

## Gate Flow Architecture Decision

Se adopta la **Opción A — Router controla el flujo completo** para mantener el control secuencial de gates en un solo punto y simplificar la trazabilidad del flujo principal.

## 📜 3. Matriz de Comunicación (Definitiva)

**Quién puede invocar a quién (delegación):**
- Router Agent → Jira Reader Agent, Tech Agent, SDD Agent, Security Auditor Agent, CI Auditor Agent, QA Agent
- Supervisor Agent → SDD Agent (reintento por `GateFeedback` blocking)
- Supervisor Agent → Router Agent (escalada de error irrecuperable)
- Change Tracker Agent → Jira Writer Agent (via `WorkflowEvent`)

**Quién puede diagnosticar a quién (observación):**
- Supervisor Agent ↔ Jira Reader Agent, Tech Agent, SDD Agent, Security Auditor Agent, CI Auditor Agent, QA Agent, Jira Writer Agent

**Quién emite `WorkflowEvent`:**
- Todos los agentes → Change Tracker Agent (asíncrono, no bloquea)

**Restricciones explícitas (quién NO puede comunicarse con quién):**
- SDD Agent ✗ Security Auditor Agent, CI Auditor Agent, QA Agent
- Router Agent ✗ Jira Writer Agent
- Cualquier agente ✗ otro agente directamente (toda comunicación pasa por Router o Supervisor)
- REGLA: Cuando un gate re-approval ocurre por blocking feedback, solo el gate que emitió el blocking feedback necesita re-aprobar la spec modificada. Los gates anteriores que ya aprobaron no se reinvocan, a menos que GateFeedback.affectsSecurityBoundary = true.

---

## Condición de avance entre gates

Un gate avanza al siguiente cuando:
- GateFeedback.passed = true
o
- GateFeedback.passed = false y GateFeedback.severity = 'warning'

Un gate detiene el flujo cuando:
- GateFeedback.passed = false y GateFeedback.severity = 'blocking'

### Comportamiento con warnings acumulados
1. Todos los GateFeedback se acumulan en ContextPacket.gateFeedback
2. El workflow completa hasta 'archived'
3. El AgentOutput final incluye warningsSummary con todos los warnings
4. El usuario recibe los warnings como parte del output final

### Comportamiento con blocking
1. El flujo se detiene en ese gate
2. El Supervisor ejecuta Gate Re-dispatch
3. Los gates anteriores que pasaron no se reinvocan salvo affectsSecurityBoundary = true

## Gate Re-approval: Casos y Decisiones

### Caso 1: CI Auditor bloquea, SDD modifica spec
- SA re-aprueba: NO
- CIA re-aprueba: SÍ
- QA re-aprueba: NO

### Caso 2: QA bloquea, SDD modifica spec
- SA re-aprueba: NO
- CIA re-aprueba: NO
- QA re-aprueba: SÍ

### Caso 3: CI Auditor bloquea con affectsSecurityBoundary = true
- SA re-aprueba: SÍ
- CIA re-aprueba: SÍ
- QA re-aprueba: NO

### Regla general
Solo el gate que emitió el blocking GateFeedback re-aprueba, excepto cuando affectsSecurityBoundary = true, en cuyo caso SA también re-aprueba.

## 🧨 4. Flujo de Errores y Recuperación

1. Un agente reporta `AgentError`.
2. El Supervisor ejecuta `error-recovery`.
3. Si `recoverable = true` y `retryCount < 3`, reintenta.
4. Si `retryCount >= 3`, marca `recovering` y escala al Router.
5. Si `recoverable = false`, marca `error`, emite `workflow_aborted` y notifica al Router.

## 🔁 5. Feedback Loop de Gates

1. Gate Agents (Security, CI, QA) generan `GateFeedback` y lo retornan al Router.
2. El Router evalúa la condición de avance.
3. Si `blocking`, delega al Supervisor el Gate Re-dispatch.
4. Si `warning`, el workflow continúa y el feedback queda registrado.

## Timeouts y SLAs por agente

| Agente | Timeout | Acción si se agota |
|--------|---------|-------------------|
| Router Agent | 5s | AgentError recoverable=false — abortar |
| Supervisor Agent | 10s | Escalar al Router con error |
| Jira Reader Agent | 15s | AgentError recoverable=true — retry x1 |
| Tech Agent | 60s | AgentError recoverable=true — retry x2 |
| SDD Agent | 120s por skill | AgentError recoverable=true — retry x1 |
| Security Auditor | 30s | AgentError recoverable=true — retry x1 |
| CI Auditor | 30s | AgentError recoverable=true — retry x1 |
| QA Agent | 30s | AgentError recoverable=true — retry x1 |
| Change Tracker | 20s | AgentError recoverable=false — no bloquea workflow |
| Jira Writer | 15s | AgentError recoverable=true — retry x3 async |

### Regla general
Si un agente con recoverable=true agota sus reintentos, el error se convierte en recoverable=false y se escala al Supervisor → Router → usuario.
El SDD Agent tiene timeout por skill individual, no por ciclo completo. El ciclo completo puede durar hasta: 5 skills × 120s × 3 intentos = 18 minutos.

## Responsabilidades de emisión de WorkflowEvent

| EventType | Quién lo emite | Cuándo |
|-----------|---------------|--------|
| spec_proposed | SDD Agent | Al completar openspec-propose |
| spec_designed | SDD Agent | Al completar openspec-design |
| spec_validated | SDD Agent | Al pasar openspec-validate exitosamente |
| spec_validation_failed | SDD Agent | Cuando openspec-validate falla (cada intento) |
| spec_applied | SDD Agent | Al completar openspec-apply |
| gate_passed | SA / CIA / QA | Cuando GateFeedback.passed = true |
| gate_failed | SA / CIA / QA | Cuando GateFeedback.passed = false |
| agent_error | Cualquier agente | Al generar un AgentError |
| workflow_recovered | Supervisor | Al completar un reintento exitoso |
| workflow_completed | Router | Al recibir AgentOutput final con spec 'archived' |
| workflow_aborted | Supervisor / Router | Al encontrar error irrecuperable |

### Regla
Ningún agente puede emitir un WorkflowEvent que no está en su fila de la tabla.
El Change Tracker procesa todos los eventos.
El Jira Writer solo actúa sobre: spec_applied, gate_failed, workflow_completed, workflow_aborted.

---
*Este protocolo es obligatorio para todos los agentes.*
