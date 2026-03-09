# AGENTS.md - PickyApp

Este archivo es el **README para Robots**. Proporciona el contexto operativo y las reglas de orquestación para que los agentes de IA trabajen en PickyApp siguiendo el estándar de [agents.md](https://agents.md/).

> **Ver guía completa de archivos y carpetas**: [WORKSPACE_GUIDE.md](WORKSPACE_GUIDE.md)

## 🚀 Guía de Inicio Rápido para Agentes

### Configuración del Entorno
- **Install deps**: `npm install`
- **Start dev server**: `npm run dev`
- **Backend server**: `npm run start:dev` (en carpeta backend)
- **Database**: PostgreSQL vía Docker (`docker-compose up -d`)

## 🤖 Mapa de Agentes (Orquestación)
<!-- Este es el Manifiesto Público de todas las capacidades de IA del proyecto. -->
PickyApp utiliza un sistema de agentes especializados coordinados por Router + Supervisor.

| Agente | Definición Técnica | Responsabilidad Principal | Skills Clave |
| :--- | :--- | :--- | :--- |
| **Router Agent** | [.trae/agents/router-agent.md](.trae/agents/router-agent.md) | **Enrutador**. Ordena invocaciones y encadena `compact_output`. | `agent-factory`, `skill-factory` |
| **Supervisor Agent** | [.trae/agents/supervisor-agent.md](.trae/agents/supervisor-agent.md) | **Supervisor**. Maneja errores, reintentos y compactación. | `workflow-supervision`, `context-compaction`, `error-recovery` |
| **SDD Agent** | [.trae/agents/sdd-agent.md](.trae/agents/sdd-agent.md) | **Experto en Protocolo**. Gestiona el ciclo de vida OpenSpec. | `openspec-propose`, `openspec-design`, `openspec-validate`, `openspec-apply-change`, `openspec-archive-change` |
| **Jira Reader Agent** | [.trae/agents/jira-reader-agent.md](.trae/agents/jira-reader-agent.md) | **Lector**. Obtiene requisitos desde Jira. | `requirement-sync` |
| **Jira Writer Agent** | [.trae/agents/jira-writer-agent.md](.trae/agents/jira-writer-agent.md) | **Escritor**. Sincroniza cambios con Jira. | `mcp-jira-management`, `requirement-sync` |
| **Tech Agent** | [.trae/agents/tech-agent.md](.trae/agents/tech-agent.md) | **Arquitecto**. Transforma historias en Master Plans técnicos. | `master-planning`, `technical-slicing`, `architecture-design` |
| **Change Tracker Agent** | [.trae/agents/change-tracker-agent.md](.trae/agents/change-tracker-agent.md) | **Observer**. Registra eventos y cambios sin bloquear. | `change-tracking`, `changelog-management` |
| **Security Auditor Agent** | [.trae/agents/security-auditor-agent.md](.trae/agents/security-auditor-agent.md) | **Gate Seguridad**. Audita diseños. | `security-audit` |
| **CI Auditor Agent** | [.trae/agents/ci-auditor-agent.md](.trae/agents/ci-auditor-agent.md) | **Gate CI**. Analiza deltas de código. | `ci-audit` |
| **QA / Verification Agent** | [.trae/agents/qa-agent.md](.trae/agents/qa-agent.md) | **Gate QA**. Verifica implementación. | `implementation-audit` |

---

## Reglas de Invocación

- **SDD Agent**: El ciclo `propose → design → validate → apply → archive` es interno. El SDD Agent nunca invoca agentes externos. Su único canal de salida es un `AgentOutput` hacia el Router o un `AgentError` hacia el Supervisor.
- **Security Auditor Agent, CI Auditor Agent, QA Agent**: Son invocados por el Router con el `ContextPacket` en status `applied`.

---

## 📂 Registro de Artefactos (¿Dónde guardar qué?)

Para evitar confusiones, los agentes deben seguir estrictamente estas rutas de registro:

| Artefacto | Ubicación | Descripción |
| :--- | :--- | :--- |
| **Fuente de Verdad** | `openspec/specs/` | Especificaciones actuales del sistema (Arquitectura, API, Datos). |
| **Cambios Activos** | `openspec/changes/` | Carpeta temporal por cada feature (proposal, design, tasks). |
| **Planes Técnicos** | `openspec/plans/` | Master Plans generados por el Tech Agent antes de la implementación. |
| **Tareas de Jira** | `openspec/jira/` | Copia local de las historias y tareas sincronizadas desde Jira. |
| **Nomenclatura** | `openspec/specs/jira-specs/` | Reglas de nombrado para Epics, Stories y Tasks. |

---

## 🛠️ Estilo de Código y Convenciones

Los valores se parametrizan en `.trae/project-config.json` para permitir portabilidad entre proyectos.

### Frontend
- **Framework**: `frontend.framework`
- **Convenciones**: `frontend.conventions`
- **Reglas de lint**: `frontend.lint_rules`

### Backend
- **Framework**: `backend.framework`
- **Multi-tenancy**: `backend.multi_tenancy_field`
- **Validación DTO**: `backend.dto_validation_library`
- **API Response**: `backend.api_response_envelope_spec`

## 📝 Instrucciones de Trabajo

1. **Antes de editar**: Consultar siempre [project.md](openspec/specs/project.md) para entender el impacto funcional.
2. **Relevamiento de Cambios**: Al modificar cualquier archivo en `specs/`, invocar al **Change Tracker Agent**.
3. **Sincronización Jira**: Al iniciar una tarea, invocar al **Jira Reader Agent** para obtener el contexto.

---
*Para la visión de conjunto del proyecto, consultar [openspec/specs/project.md](openspec/specs/project.md).*
