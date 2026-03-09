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
  retryCount: number    // OWNERSHIP: el Supervisor incrementa este campo
                        // en cada reintento. El agente siempre emite
                        // retryCount = 0. El Supervisor copia el AgentError,
                        // incrementa retryCount, y lo persiste en ContextPacket.
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

interface GateRetryContext {
  retryReason: string[]        // copia de GateFeedback.failedCriteria
  suggestedFix: string         // copia de GateFeedback.suggestedFix
  gateAgentId: string          // qué gate bloqueó
  retryAttempt: number         // intento actual (1 o 2)
  maxRetries: 2                // constante, no configurable
  affectsSecurityBoundary: boolean  // copia de GateFeedback.affectsSecurityBoundary
  previousFeedback: GateFeedback[]  // historial de intentos anteriores
}

interface ContextPacket {
  version: number           // empieza en 1, incrementa en cada escritura canónica
  requestId: string
  correlationId: string
  parentRequestId?: string
  spec: OpenSpec
  stage: WorkflowStage
  executionMode: 'lite' | 'full'   // Asignado por Router.selectMode, determina pipeline
  decisions: Decision[]
  errors: AgentError[]
  gateFeedback: GateFeedback[]
  compact_summary?: string
  gateRetryContext?: GateRetryContext   // presente solo durante re-dispatch
  jiraContext?: string   // TEMPORAL: presente solo entre pasos 1 y 3
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
  warningsSummary?: WarningsSummary    // presente cuando hay warnings acumulados
  telemetry: AgentTelemetry    // NUEVO — obligatorio
}

interface AgentTelemetry {
  agentId: string
  skill: string
  inputTokens: number           // estimado del input recibido
  outputTokens: number          // tokens del output generado
  compactOutputTokens: number   // tokens del compact_output
  compactOutputViolation: boolean  // true si > 480 tokens
  executionMs: number           // tiempo de ejecución en ms
  contextPacketVersion: number  // version del CP recibido
}

interface WarningsSummary {
  total: number
  warnings: {
    gateAgentId: string
    criteria: string[]
    timestamp: string
  }[]
}

interface ValidationError {
  type: 'schema' | 'criteria_ambiguity' | 'spec_conflict'
  field?: string
  description: string
  attempt: number
}

interface ValidationLoopState {
  attempt: number              // iteración actual: 1, 2, o 3
  maxAttempts: 3               // constante
  validationErrors: ValidationError[]  // acumulado de todos los intentos
}
```

---

## Ciclo de vida de campos del ContextPacket

No todos los campos del ContextPacket deben persistir durante todo el workflow.
Los siguientes campos se purgan en puntos específicos para controlar el crecimiento.

### Campo: contexto externo de Jira (jiraContext)

Agregar campo temporal a ContextPacket:
```typescript
interface ContextPacket {
  // ... campos existentes ...
  jiraContext?: string   // TEMPORAL: presente solo entre pasos 1 y 3
}
```

Ciclo de vida:
- **Creado en:** Jira Reader Agent (paso 1 en FULL)
- **Usado por:** Tech Agent, SDD Agent openspec-propose
- **Purgado en:** Router, inmediatamente después de que SDD Agent
  confirma haber recibido el ContextPacket en openspec-propose
- **Por qué:** El contexto de Jira ya está incorporado en el proposal
  y en el design. No necesita viajar hasta QA Agent.

### Campo: decisions[]

Ciclo de vida:
- **Creado:** se acumula durante todo el workflow
- **Usado por:** Change Tracker (para changelog), Supervisor (para diagnóstico)
- **Purgado:** NO se purga del ContextPacket activo
- **Alternativa:** Después de spec_applied, el Router copia decisions[]
  al AgentOutput.full_output y lo reemplaza en el CP por un resumen
  de 1 línea por decisión

```typescript
// Antes de purgar:
decisions: [
  { agentId: 'tech', skill: 'architecture-design', description: '...', rationale: '...', timestamp: '...' },
  { agentId: 'sdd', skill: 'openspec-propose', description: '...', rationale: '...', timestamp: '...' },
  // ... más decisions
]
// Después de purgar (en stage: 'spec_applied'):
decisions: [
  { summary: '2 architecture decisions. Full log in AgentOutput.full_output' }
]
```

Tokens ahorrados: ~400-600 por workflow con múltiples decisions

### Campo: gateFeedback[] — iteraciones anteriores

Ciclo de vida:
- Cuando hay re-dispatch por blocking, el GateFeedback del intento anterior
  se mueve a gateRetryContext.previousFeedback y se elimina de gateFeedback[]
- Solo el GateFeedback del intento más reciente permanece en gateFeedback[]

```typescript
interface GateRetryContext {
  // ... campos existentes ...
  previousFeedback: GateFeedback[]  // historial de intentos anteriores
}
```

Tokens ahorrados: ~200-400 en workflows con re-dispatch

### Resumen de ahorro por purga

| Campo | Momento de purga | Tokens ahorrados |
|-------|-----------------|-----------------|
| jiraContext | Después de openspec-propose | 400-600 |
| decisions[] summary | Después de spec_applied | 400-600 |
| gateFeedback anteriores | En cada re-dispatch | 200-400 |
| **Total estimado** | | **800-1,200 por workflow** |

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
- Router Agent → Jira Reader Agent, Tech Agent, SDD Agent, Security Auditor Agent, QA Agent
- Supervisor Agent → SDD Agent (reintento por `GateFeedback` blocking)
- Supervisor Agent → Router Agent (escalada de error irrecuperable)
- Change Tracker Agent → Jira Writer Agent (via `WorkflowEvent`)

**Quién puede diagnosticar a quién (observación):**
- Supervisor Agent ↔ Jira Reader Agent, Tech Agent, SDD Agent, Security Auditor Agent, QA Agent, Jira Writer Agent

**Quién emite `WorkflowEvent`:**
- Todos los agentes → Change Tracker Agent (asíncrono, no bloquea)

**Restricciones explícitas (quién NO puede comunicarse con quién):**
- SDD Agent ✗ Security Auditor Agent, QA Agent
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

### Caso 1: QA bloquea, SDD modifica spec
- SA re-aprueba: NO
- QA re-aprueba: SÍ

### Caso 2: Security Auditor bloquea
- SA re-aprueba: SÍ
- QA re-aprueba: NO (aún no llegó)

### Regla general
Solo el gate que emitió el blocking GateFeedback re-aprueba, excepto cuando affectsSecurityBoundary = true, en cuyo caso SA también re-aprueba.

## 🧨 4. Flujo de Errores y Recuperación

1. Un agente reporta `AgentError`.
2. El Supervisor ejecuta `error-recovery`.
3. Si `recoverable = true` y `retryCount < 3`, reintenta.
4. Si `retryCount >= 3`, marca `recovering` y escala al Router.
5. Si `recoverable = false`, marca `error`, emite `workflow_aborted` y notifica al Router.

## 🔁 5. Feedback Loop de Gates

1. Gate Agents (Security, QA) generan `GateFeedback` y lo retornan al Router.
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
| gate_passed | SA / QA | Cuando GateFeedback.passed = true |
| gate_failed | SA / QA | Cuando GateFeedback.passed = false |
| agent_error | Cualquier agente | Al generar un AgentError |
| workflow_recovered | Supervisor | Al completar un reintento exitoso |
| workflow_completed | Router | Al recibir AgentOutput final con spec 'archived' |
| workflow_aborted | Supervisor / Router | Al encontrar error irrecuperable |

### Regla
Ningún agente puede emitir un WorkflowEvent que no está en su fila de la tabla.
El Change Tracker procesa todos los eventos.
El Jira Writer solo actúa sobre: spec_applied, gate_failed, workflow_completed, workflow_aborted.

## 6. Reglas de escritura del ContextPacket

### Regla 1 — Solo Router y Supervisor persisten el ContextPacket
Ningún agente escribe directamente el ContextPacket al archivo de estado.
Todo agente produce `AgentOutput.updatedContextPacket` con sus cambios,
pero no lo persiste. El Router y el Supervisor son los únicos autorizados
a escribir el estado canónico.

  Permitido escribir:  Router Agent, Supervisor Agent
  No permitido:        SDD Agent, Tech Agent, Jira Reader Agent,
                       Jira Writer Agent, Change Tracker Agent,
                       Security Auditor Agent, QA Agent

### Regla 2 — El Router espera al Supervisor antes de avanzar
Mientras el Supervisor está procesando un error
(ContextPacket.stage = 'recovering' o 'error'), el Router no invoca
nuevos agentes. El Router reanuda el flujo únicamente cuando el Supervisor
devuelve un AgentOutput con stage diferente a 'recovering' y diferente a 'error'.

  Estado bloqueante para el Router:  stage = 'recovering' | 'error'
  Estado que habilita continuar:     cualquier otro stage

### Regla 3 — Verificación de versión antes de escribir
Antes de persistir un ContextPacket actualizado, el agente escritor
(Router o Supervisor) verifica que la versión es exactamente
`stored.version + 1`. Si no coincide, resuelve el conflicto antes de escribir:

  Lógica de resolución de conflicto:
  1. Releer el ContextPacket almacenado (versión más reciente)
  2. Reaplica los cambios propios sobre la versión más reciente
  3. Incrementar version en 1
  4. Reintentar la escritura
  5. Si el conflicto persiste más de 3 veces → AgentError {
       agentId: 'router' | 'supervisor',
       skill: 'context-write',
       reason: 'version_conflict_unresolvable',
       recoverable: false
     }

### Regla 4 — Aislamiento de escritura (transaction isolation)

Dado que el sistema no usa una base de datos con transacciones nativas,
el aislamiento se implementa con un lock de archivo:

1. Antes de escribir: crear archivo `.contextpacket.lock` en el mismo
   directorio que el ContextPacket almacenado
2. Si `.contextpacket.lock` ya existe → esperar 500ms y reintentar
   (máximo 3 reintentos antes de reportar version_conflict_unresolvable)
3. Escribir el ContextPacket actualizado
4. Eliminar `.contextpacket.lock`

### Garantía
Este mecanismo garantiza que en ningún momento dos agentes escriben
simultáneamente, incluso si el polling del Router coincide exactamente
con una escritura del Supervisor.

### Límite conocido
Este lock es local al proceso. Si el sistema corre en múltiples instancias
o nodos, este mecanismo NO es suficiente. En ese caso se requiere un
distributed lock (Redis, etcd, etc.). Esta es deuda técnica intencional.
Documentar en WORKSPACE_GUIDE.md bajo deuda técnica.

## Mecanismo de notificación Router ↔ Supervisor

### Problema
El Router se bloquea cuando stage = 'recovering' | 'error'.
Necesita un mecanismo para saber cuándo el Supervisor terminó y puede reanudar.

### Solución: polling con backoff
El Router implementa polling del ContextPacket almacenado con backoff exponencial:

1. Router detecta que stage = 'recovering'
2. Router entra en bucle de polling:
   - Espera 1s → lee ContextPacket almacenado → verifica stage
   - Si stage sigue en 'recovering' → espera 2s → reintenta
   - Si stage sigue en 'recovering' → espera 4s → reintenta
   - Si stage sigue en 'recovering' → espera 8s → reintenta
   - Si después de 4 intentos (15s total) stage no cambió →
     AgentError { agentId: 'router', reason: 'supervisor_timeout',
     recoverable: false }
3. Cuando stage cambia a cualquier valor distinto de 'recovering' | 'error':
   Router reanuda el flujo con el ContextPacket actualizado

### Por qué polling y no pub/sub
El sistema actual es secuencial y de baja frecuencia. El polling con backoff
es suficiente y no agrega dependencias de infraestructura (message broker,
websockets, etc.). Cuando el sistema escale a workflows paralelos, esta
decisión debe revisarse y reemplazarse por un mecanismo de eventos.
Esta es deuda técnica intencional documentada.

### Timeout del Supervisor durante recovery
Si el Supervisor no responde en 30s (4 ciclos de polling):
- Router genera AgentError { recoverable: false, reason: 'supervisor_timeout' }
- stage → 'error'
- El usuario recibe notificación con el último ContextPacket conocido

---
*Este protocolo es obligatorio para todos los agentes.*
