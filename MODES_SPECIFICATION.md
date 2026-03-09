# Modos de Ejecución: Descripción Técnica Completa
**Actualizado:** Sin CI Auditor Agent (eliminado)

---

## MODO FULL — Ejecución Completa

### Qué comprende
```
Router → Jira Reader → Tech Agent → SDD Agent → Security Auditor → QA Agent → Change Tracker
```

### Agentes involucrados (6)
1. **Router Agent** — Orquestador central
2. **Jira Reader Agent** — Obtiene contexto de Jira
3. **Tech Agent** — Planning técnico (master-planning + technical-slicing + architecture-design)
4. **SDD Agent** — Ciclo completo de especificación
5. **Security Auditor Agent** — Gate de seguridad
6. **QA Agent** — Gate de testability
7. **Change Tracker Agent** (async) — Registra eventos y sincroniza Jira

### Skills (10 total)
```
Jira Reader:
  • requirement-sync

Tech Agent:
  • master-planning
  • technical-slicing
  • architecture-design

SDD Agent:
  • openspec-propose
  • openspec-design
  • openspec-validate
  • openspec-apply
  • openspec-archive

Change Tracker:
  • change-tracking
  • changelog-management
```

### Gates (2)
- ✅ Security Auditor (seguridad, permisos, datos sensibles)
- ✅ QA Agent (testability, acceptance criteria)

### Tokens consumidos (por tarea pequeña: "agregar last_login")
```
Router init:           400 tokens
Jira Reader:         1,850 tokens
Tech Agent:          3,370 tokens (master-planning 1020 + slicing 1050 + design 1300)
SDD Agent:           6,630 tokens (propose 1380 + design 1980 + validate 1650 + apply 1620 + archive 1000)
Security Auditor:    1,870 tokens
QA Agent:            1,520 tokens
Change Tracker:      2,650 tokens (tracking 1100 + changelog 600 + jira-write 950)
────────────────
TOTAL FULL:         19,290 tokens
```

### Cuándo usar FULL
- ✅ Tareas medianas (multicomponente, requieren decisiones arquitectónicas)
- ✅ Tareas grandes (cross-sistema, refactoring, migraciones)
- ✅ Equipo >= 5 personas (Jira sync valioso)
- ✅ Seguridad crítica (autenticación, permisos, datos sensitivos)

### Salida FULL
```
ContextPacket completo con:
  • spec detallado (proposal → design → validated → applied → archived)
  • 2x GateFeedback (Security + QA)
  • Changelog entry generado
  • Jira issue actualizado (async)
  • Full audit trail de decisiones
```

---

## MODO LITE — Ejecución Optimizada

### Qué comprende
```
Router → [condicional: Jira Reader] → SDD Agent → [condicional: Security Auditor] → QA Agent
```

### Agentes involucrados (3-4)
1. **Router Agent** — Orquestador
2. **Jira Reader Agent** — OPCIONAL (solo si task.relatedEpic O task.keywords.jira)
3. **SDD Agent** — Ciclo completo
4. **Security Auditor Agent** — OPCIONAL (solo si task.keywords.match: auth|security|permission|crypto|token)
5. **QA Agent** — Siempre
6. **Change Tracker Agent** — OPCIONAL (solo si config.team_size >= 5)

### Skills (5 base + condicionales)
```
Obligatorios:
  • openspec-propose
  • openspec-design
  • openspec-validate
  • openspec-apply
  • openspec-archive
  • implementation-audit (QA)

Condicionales:
  • requirement-sync (si Jira Reader activado)
  • security-audit (si Security Auditor activado)
  • change-tracking (si Change Tracker activado)
  • changelog-management (si Change Tracker activado)
```

### Gates (1 siempre + 1 opcional)
- ✅ **QA Agent** (SIEMPRE) — testability validation
- ⚠️ Security Auditor (CONDICIONAL) — solo si keywords match

### Tokens consumidos (por tarea pequeña: "agregar last_login")
```
Router init:             400 tokens
[skip Jira Reader]:       —
[skip Tech Agent]:        —
SDD Agent:             6,630 tokens (mismo que FULL)
Security Auditor:        —  (optional, skip si no security keywords)
QA Agent:             1,520 tokens
[skip Change Tracker]:    —
────────────────
TOTAL LITE (sin componentes opcionales): 8,550 tokens
TOTAL LITE (con Security, sin CT):       10,420 tokens
```

### Cuándo usar LITE
- ✅ Tareas pequeñas (<=4 componentes, criterios obvios)
- ✅ Equipo < 5 personas (Change Tracker overhead)
- ✅ Sin requisitos de integración Jira
- ✅ Cualquier task donde "solo necesito spec clara"

### Salida LITE
```
ContextPacket con:
  • spec detallado (completo ciclo SDD)
  • 1-2x GateFeedback (QA + opcional Security)
  • NO Jira sync (asíncrono)
  • NO planning técnico enlatado
  • Estructura válida para implementación
```

---

## MODO ULTRA — Especificación Solo

### Qué comprende
```
Router → SDD Agent (solo propose + design)
```

### Agentes involucrados (2)
1. **Router Agent** — Orquestador
2. **SDD Agent** — Solo proposal y design

### Skills (2)
```
  • openspec-propose
  • openspec-design
```

### Gates (0)
- ❌ Sin gates
- ❌ Sin validación
- ❌ Sin auditoría

### Tokens consumidos
```
Router init:             400 tokens
SDD propose:           1,380 tokens
SDD design:            1,980 tokens
────────────────
TOTAL ULTRA:           3,760 tokens
```

### Cuándo usar ULTRA
- ✅ Demos rápidas
- ✅ Prototipos iniciales (antes de real planning)
- ✅ Lluvia de ideas rápida
- ✅ **NO USAR en producción**

### Salida ULTRA
```
ContextPacket con:
  • spec en mitad del ciclo (proposal + design, sin validación)
  • SIN gates checks
  • SIN acceptance criteria verification
  • "Rough draft" de la idea
  • Requiere refinamiento manual
```

---

## Matriz Comparativa: Qué Incluye Cada Modo

| Componente | FULL | LITE | ULTRA |
|-----------|------|------|-------|
| **Router** | ✅ | ✅ | ✅ |
| **Jira Reader** | ✅ | ⚠️ cond | ❌ |
| **Tech Agent** | ✅ | ❌ | ❌ |
| **SDD Agent** | ✅ | ✅ | ✅ prop+design |
| **Security Auditor** | ✅ | ⚠️ cond | ❌ |
| **QA Agent** | ✅ | ✅ | ❌ |
| **Change Tracker** | ✅ | ⚠️ cond | ❌ |
| | | | |
| **openspec-propose** | ✅ | ✅ | ✅ |
| **openspec-design** | ✅ | ✅ | ✅ |
| **openspec-validate** | ✅ | ✅ | ❌ |
| **openspec-apply** | ✅ | ✅ | ❌ |
| **openspec-archive** | ✅ | ✅ | ❌ |
| | | | |
| **security-audit skill** | ✅ | ⚠️ si keywords | ❌ |
| **implementation-audit** | ✅ | ✅ | ❌ |
| **master-planning** | ✅ | ❌ | ❌ |
| **technical-slicing** | ✅ | ❌ | ❌ |
| **architecture-design** | ✅ | ❌ | ❌ |
| **requirement-sync** | ✅ | ⚠️ si epic | ❌ |
| **change-tracking** | ✅ | ⚠️ si team>3 | ❌ |
| **changelog-management** | ✅ | ⚠️ si team>3 | ❌ |

---

## Cálculo de Tokens SIN CI Auditor

### Actualización de baseline (con CI eliminado)

```
MODO FULL (sin CI):
  Router: 400
  Jira Reader: 1,850
  Tech Agent: 3,370
  SDD Agent: 6,630
  Security Auditor: 1,870
  QA Agent: 1,520
  Change Tracker: 2,650
  ────────────
  TOTAL: 19,290 tokens

MODO LITE (default, sin opcionales):
  Router: 400
  SDD Agent: 6,630
  QA Agent: 1,520
  ────────────
  TOTAL: 8,550 tokens

MODO ULTRA:
  Router: 400
  SDD propose: 1,380
  SDD design: 1,980
  ────────────
  TOTAL: 3,760 tokens

Single LLM baseline (unchanged):
  TOTAL: 10,700 tokens
```

### Eficiencia sin CI

| Modo | Tokens | vs Baseline | Overhead |
|------|--------|------------|----------|
| FULL | 19,290 | +80% | Alto pero justificado |
| LITE | 8,550 | -20% | Mejor que baseline |
| ULTRA | 3,760 | -65% | Pero sin validación |

**Conclusión**: Sin CI Auditor, FULL se vuelve más eficiente (eliminamos 1,730 tokens de posible redundancia)

---

## Criterios de Activación Automática

### Basados en task input

```javascript
// Pseudocódigo de decisión
function selectMode(task) {

  // ULTRA: solo para demos/prototipos
  if (task.type === 'prototype' || task.isDemonstration) {
    return ULTRA;
  }

  // LITE: pequeñas tareas sin Jira/seguridad
  if (task.estimatedComponents <= 4 &&
      !hasKeyword(task, /auth|security|crypto|permission|token/) &&
      !task.relatedEpicId) {
    return LITE;
  }

  // FULL: todo lo demás
  return FULL;
}

// Refinamientos condicionales
function refineMode(mode, config) {

  if (mode === LITE) {
    // Agregar Security Auditor si keywords match
    if (hasKeyword(task, /auth|security|crypto|permission|token/)) {
      addAgent(Security Auditor);
    }

    // Agregar Jira Reader si epic relacionado
    if (task.relatedEpicId) {
      addAgent(Jira Reader);
    }

    // Agregar Change Tracker si equipo > 3
    if (config.teamSize >= 5) {
      addAgent(Change Tracker);
    }
  }

  return mode;
}
```

---

## Configuración en project-config.json (ACTUALIZADO SIN CI)

```json
{
  "execution_modes": {
    "enabled": true,
    "default_mode": "auto",

    "modes": {
      "FULL": {
        "description": "All agents + all skills. For complex tasks.",
        "agents": [
          "router",
          "jira-reader",
          "tech-agent",
          "sdd-agent",
          "security-auditor",
          "qa-agent",
          "change-tracker"
        ],
        "budget_tokens": 25000,
        "expected_tokens": 19290
      },

      "LITE": {
        "description": "Core workflow only. For small tasks.",
        "agents": [
          "router",
          "sdd-agent",
          "qa-agent"
        ],
        "agents_conditional": {
          "security-auditor": "task.keywords MATCHES (auth|security|permission|crypto|token)",
          "jira-reader": "task.relatedEpic OR task.keywords MATCHES (jira|epic)",
          "change-tracker": "config.teamSize >= 5"
        },
        "budget_tokens": 12000,
        "expected_tokens": 8550
      },

      "ULTRA": {
        "description": "Specification draft only. For prototypes.",
        "agents": [
          "router",
          "sdd-agent"
        ],
        "skills_limited": ["openspec-propose", "openspec-design"],
        "budget_tokens": 5000,
        "expected_tokens": 3760,
        "warning": "Output requires manual refinement before production use"
      }
    },

    "mode_selection_rules": {
      "auto": [
        {
          "condition": "task.isDemonstration",
          "mode": "ULTRA"
        },
        {
          "condition": "task.estimatedComponents <= 4 AND !hasSecurityKeywords AND !hasEpic",
          "mode": "LITE"
        },
        {
          "condition": "default",
          "mode": "FULL"
        }
      ]
    }
  }
}
```

---

## Salida Esperada por Modo

### FULL Output Example
```yaml
ContextPacket:
  version: 5
  stage: archived
  spec:
    status: archived
    version: 1.0.0
    proposal: [completo]
    design: [detallado]
    acceptanceCriteria: [verificado]
    appliedAt: [timestamp]
    archivedAt: [timestamp]

  decisions: [10-15 decisiones del workflow]

  gateFeedback:
    - gateAgentId: security-auditor
      passed: true
      severity: null
    - gateAgentId: qa-agent
      passed: true
      severity: null

  errors: []
  compact_summary: "✓ Spec completeto, auditoría de seguridad OK, testability validada"

Change Tracker (async):
  - Jira issue USER-1000 transitioned to DONE
  - changelog.md entry generated
```

### LITE Output Example (mismo spec, menos processing)
```yaml
ContextPacket:
  version: 3
  stage: archived
  spec:
    status: archived
    version: 1.0.0
    proposal: [completo]
    design: [completo]
    acceptanceCriteria: [verificado]
    appliedAt: [timestamp]
    archivedAt: [timestamp]

  decisions: [4-6 decisiones críticas]

  gateFeedback:
    - gateAgentId: qa-agent
      passed: true
      severity: null

  errors: []
  compact_summary: "✓ Spec válida, testability OK"

Change Tracker: skipped (unless config enables)
```

### ULTRA Output Example (no es para ver deployment)
```yaml
ContextPacket:
  version: 1
  stage: designed
  spec:
    status: designed  # ← NO validado, NO aplicado
    version: 0.1.0
    proposal: [texto del usuario + structuring]
    design: [solución propuesta]
    acceptanceCriteria: [] # ← vacío, no procesado
    # NO appliedAt, NO archivedAt

  decisions: []
  gateFeedback: []
  errors: []
  compact_summary: "⚠️ Diseño borrador. Requiere refinamiento manual antes de usar."
```

---

## Resumen: Qué Comprende Cada Modo

| Aspecto | FULL | LITE | ULTRA |
|--------|------|------|-------|
| **Objetivo** | Spec production-ready | Spec válido, rápido | Idea estructurada |
| **Agentes activos** | 7 | 3-5 | 2 |
| **Skills** | 10 | 5-8 | 2 |
| **Gates** | 2 (SA + QA) | 1-2 (QA + cond SA) | 0 |
| **Validación** | Completa | Completa | Parcial (solo diseño) |
| **Tokens** | 19,290 | 8,550 | 3,760 |
| **Tiempo** | ~15s | ~6s | ~3s |
| **Salida listo para** | Implementación | Implementación | Discusión/refinamiento |
| **Cuando usar** | Medianas + grandes | Pequeñas | Demos/prototipos |

---

*Configuración actualizada sin CI Auditor (eliminado por redundancia con QA).*
