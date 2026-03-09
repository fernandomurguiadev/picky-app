# AGENT_ROADMAP.md — Evolución del Sistema Multi-Agente

Este documento detalla los puntos de mejora detectados y las fases de evolución para el ecosistema de agentes de PickyApp.

---

## 🚀 Fase 2: Blindaje y Calidad (En Progreso)

### 0. Router + Supervisor Split 🧭🛡️
- **Estado**: ✅ **Completado**
- **Misión**: Separar routing y supervisión para evitar un "god agent".
- **Skills**: Router (`agent-factory`, `skill-factory`), Supervisor (`workflow-supervision`, `context-compaction`, `error-recovery`).

### 1. Security Auditor Agent 🛡️
- **Estado**: ✅ **Completado**
- **Misión**: Auditar cada diseño técnico (`design.md`) y lista de tareas (`tasks.md`) buscando vulnerabilidades OWASP y fallos de aislamiento multi-tenant.
- **Skill**: `security-audit` (Basada en los specs de `openspec/specs/security/`).
- **Trigger**: Se activa después de que el SDD Agent termina el diseño.

### 2. CI Auditor Agent 🔍
- **Estado**: ✅ **Completado**
- **Misión**: Analizar deltas de código (`git diff`) para detectar inconsistencias, violaciones de estilo y regresiones.
- **Skill**: `ci-audit`.
- **Trigger**: Manual (por ahora), activado por el Router Agent sobre un conjunto de cambios.


### 3. QA / Verification Agent 🧪
- **Estado**: ✅ **Completado**
- **Misión**: Cerrar el abismo entre el diseño y el código final. Verifica que la implementación cumpla con los criterios de aceptación.
- **Skill**: `implementation-audit`. Lee el código fuente y lo compara con el `design.md` antes de archivar el cambio.
- **Trigger**: Se activa al finalizar la fase de implementación.

### 4. Context Compaction (Skill para el Supervisor) 🧠
- **Estado**: ✅ **Completado**
- **Misión**: Mantener la ventana de contexto de la IA limpia y enfocada. 
- **Skill**: `context-compaction`. Genera un resumen ejecutivo del estado del proyecto en `PROJECT_STATUS.md` cada N cambios completados.

### 5. Jira Reader + Jira Writer Split 📥📤
- **Estado**: ✅ **Completado**
- **Misión**: Separar lectura y escritura de Jira para evitar ambigüedad.
- **Skills**: Reader (`requirement-sync`), Writer (`mcp-jira-management`, `requirement-sync`).

### 6. OpenSpec Validate ✅
- **Estado**: ✅ **Completado**
- **Misión**: Validar diseño y criterios antes de aplicar cambios.
- **Skill**: `openspec-validate`.

---

## 🔭 Fase 3: Paralelismo y Autogestión (Futuro)

### 1. Workstream Parallelism
- Permitir que el Router dispare flujos en paralelo para Frontend y Backend una vez que el contrato de API esté bloqueado (`API_LOCKED`).

### 2. Technical Debt Auditor
- Skill para el Tech Agent que escanea el repositorio buscando duplicación de código o violaciones de los `coding-standards.md` acumuladas durante las entregas rápidas.

### 3. Automatic Documentation Sync
- Agente encargado de mantener Swagger (OpenAPI) y Storybook sincronizados con los specs de OpenSpec sin intervención humana.

---
*Roadmap gestionado por Router + Supervisor como Arquitectura Evolutiva.*
