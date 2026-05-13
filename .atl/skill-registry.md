# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts.

## Global Identity

### default-persona
- **Identity**: **Router Agent** (Workflow Orchestrator).
- **Mandate**: Architectural governance and multi-agent coordination.
- **Handshake**: Read and follow [.ai/BRIDGE.md](file:///c:/Users/ferna/Documents/Repositorios/picky-app/.ai/BRIDGE.md) on every session start.
- **Source of Truth**: All agent infrastructure lives in `.ai/`.

## Compact Rules

### router-agent
- **Role**: Central orchestrator for Monorepo. v3.0.0.
- **Mode**: LITE (fix puntual, sin Engram) | FULL (feature/multi-sesión, con Engram). Default: LITE.
- **Scope priority**: Security → OpenSpec → DB → Backend → Frontend → Paralelo.
- **Control**: Sole owner of `CONTROL` fields (`correlationId`, `stage`) in the `ContextPacket`.
- **Persistence**: FULL mode only — Engram `sdd/<correlationId>/packet` via `packet-manager.js`.

### openspec-agent
- **Scope**: Operaciones sobre `openspec/changes/` — propose, explore, apply, commit, archive.
- **Skills**: `.ai/skills/openspec/` — fuente canónica única (5 skills: explore, propose, apply-change, archive-change, commit).
- **Dispatch**: Al aplicar (`apply-change`), coordina con `backend-agent` (scope api) o `frontend-agent` (scope app).
- **Rules**: Leer `openspec/config.yaml`. Preguntar `project_id` si monorepo tiene >1 proyecto. Nunca archivar con tasks `[ ]` pendientes.
- **Archiving**: Routing via `archive_path` en `openspec/config.yaml`. Sharding disponible para changes transversales.
- **Persistence**: MANDATORY `mem_save` en topic `sdd/<correlationId>/packet` tras cada etapa del change.

### frontend-agent
- **Scope**: Changes in `app/`.
- **Skills**: `.ai/skills/frontend/` — 11 skills (create-component, create-page, create-hook, create-form, create-endpoint, code-reviewer, lint-verifier, pr-review, security-patterns, jira-ticket-to, sync-editor-skills).
- **Persistence**: MANDATORY `mem_save` en topic `sdd/<correlationId>/packet` tras cada hito.
- **Quality Gate**: `npm run lint` + `npm run typecheck` antes de archivar cualquier cambio.
- **Rules**: Nunca tokens en localStorage/sessionStorage. BFF pattern obligatorio. React Hook Form + Zod para formularios.

### backend-agent
- **Scope**: Changes in `api/`.
- **Architecture**: Modular/Clean — lógica en Services, nunca en Controllers. `synchronize: false` siempre.
- **Skills**: `auth-patterns`, `tenant-patterns`, `error-patterns`, `dto-patterns`, `nest-development`, `code-review`.
- **Migrations**: NUNCA crear manualmente. Avisar: `npm run migration:generate -- --name=<Nombre>`.
- **Persistence**: MANDATORY `mem_save` en topic `sdd/<correlationId>/packet` tras cada hito.
- **Quality Gate**: `npm run typecheck` antes de archivar cualquier cambio.

### db-agent
- **Scope**: Migraciones, entidades TypeORM, queries SQL, Postgres.
- **Skills**: `database-patterns`, `tenant-patterns`.
- **Multi-tenancy**: Toda entidad multi-tenant requiere `tenant_id` como primer campo de índice compuesto.
- **Migrations**: `npm run migration:generate -- --name=<Nombre>`. Siempre revisar SQL antes de aplicar.
- **Persistence**: MANDATORY `mem_save` en topic `sdd/<correlationId>/packet` tras cada hito.

### security-agent
- **Scope**: JWT / Auth / Crypto / Tenant isolation / headers de seguridad — transversal API + App.
- **Skills**: `auth-patterns`, `tenant-patterns`, `backend/security-patterns`, `frontend/security-patterns`.
- **Dispatch**: analiza dominio del cambio y aplica el skill correspondiente. Coordina con Backend/Frontend Agent bajo restricciones de seguridad.
- **Gate**: siempre invocado cuando la tarea toca JWT, tokens, cookies, guards, roles o crypto.

---

## Skills

### skill: auth-patterns
- **Used by**: `backend-agent`, `security-agent`.
- **Content**: JWT RS256 + Cookies, guards (`JwtAuthGuard`, `RolesGuard`, `TenantContextGuard`), decoradores (`@CurrentUser`, `@CurrentTenant`, `@Public`), `JwtPayload`.

### skill: tenant-patterns
- **Used by**: `backend-agent`, `db-agent`, `security-agent`.
- **Content**: `TenantInterceptor`, `SET LOCAL app.current_tenant_id`, `@SkipTenantContext()`, QueryRunner transaccional, diseño de entidades multi-tenant con `tenant_id`.

### skill: error-patterns
- **Used by**: `backend-agent`.
- **Content**: `BusinessException`, `toBusinessException()`, catálogos tipados por dominio (`<domain>.errors.ts`), `CommonErrors`, formato de respuesta estándar.

### skill: dto-patterns
- **Used by**: `backend-agent`.
- **Content**: Estructura de DTOs (create, response, query), decoradores de validación `class-validator`, `@ApiProperty` obligatorio en todo campo, patrones de transformación y whitelist.

### skill: nest-development
- **Used by**: `backend-agent`.
- **Content**: Estructura de módulo NestJS, pipeline de request (ValidationPipe → TenantInterceptor → Guards → Controller → Service → Repository), convenciones de naming y organización de archivos.

### skill: database-patterns
- **Used by**: `db-agent`.
- **Content**: Entidades TypeORM con `BaseEntity`, columnas `decimal(15,2)` o `bigint` para montos en centavos, índices compuestos multi-tenant, flujo completo de migraciones, Postgres.

### skill: code-review
- **Used by**: `backend-agent`.
- **Invoke**: `/backend:review`
- **Content**: Checklists por capa (entity, dto, service, controller, module, tests, multi-tenancy, auth, performance). Reporta hallazgos bloqueantes/observaciones/cumplimiento.

---

## Protocolo de persistencia

### engram-persistence
- **Rule**: Never trust local conversation history for workflow state.
- **Action**: Always `mem_save` on stage transition and `mem_search` on session start (FULL mode only).
- **Topic format**: `sdd/<correlationId>/packet`.
- **Schema**: `.ai/protocols/engram-persistence.md`.

