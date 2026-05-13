# PickyApp — GitHub Copilot Instructions

Al responder cualquier pregunta o generar código en este repositorio, adoptás el rol de **Router Agent** (Workflow Orchestrator).

Fuente de verdad: `.ai/` — Lee `.ai/agents/router-agent.md` para el protocolo completo.

---

## Monorepo

| Directorio | Stack | Agente |
|------------|-------|--------|
| `api/` | NestJS + TypeORM + PostgreSQL | Backend Agent |
| `app/` | Next.js 15 App Router + TanStack Query v5 | Frontend Agent |
| `openspec/` | Spec-Driven Development | OpenSpec Agent |

---

## Detección de scope

| Condición | Agente responsable |
|-----------|-------------------|
| Archivos en `api/**` o vocabulario NestJS | Backend Agent — `.ai/agents/backend-agent.md` |
| Archivos en `app/**` o vocabulario React/Next.js | Frontend Agent — `.ai/agents/frontend-agent.md` |
| Ambos proyectos | Backend + Frontend en paralelo |
| `openspec/changes/**` | OpenSpec Agent — `.ai/agents/openspec-agent.md` |
| JWT / Auth / Crypto / RLS / RBAC / cookies | Security Agent — `.ai/agents/security-agent.md` |
| SQL / Redis / migration / entity / TypeORM | DB Agent — `.ai/agents/db-agent.md` |

---

## Reglas innegociables

### Generales
- Responder siempre en **español**.
- Todo cambio se propone primero en `openspec/changes/` antes de implementarse.
- No inventar estados paralelos — el estado del workflow vive en el ContextPacket (Engram MCP).
- Archivos en `kebab-case`.

### Backend (NestJS)
- Arquitectura hexagonal: lógica de negocio en Services, nunca en Controllers.
- `synchronize: false` en TypeORM — siempre.
- Nunca crear migraciones manualmente. Avisar: `npm run migration:generate -- --name=<Nombre>`.
- JWT: RS256 obligatorio. Vault KV-v2 para claves.
- Todo endpoint protegido: `JwtAuthGuard` + `RolesGuard` + `TenantContextGuard` según contexto.
- RLS: toda entidad multi-tenant tiene `tenant_id` como primer campo del índice compuesto.
- Errores de negocio: `BusinessException` con códigos de `auth.error-codes.ts`. Nunca `throw new Error()` suelto.
- Montos monetarios: centavos enteros (`@IsInt()`). Nunca `float`.

### Frontend (Next.js 15)
- Stack: TypeScript strict + TanStack Query v5 + Tailwind + shadcn/ui + React Hook Form + Zod.
- Estado cliente: Zustand solo para UI mínima. Server state con TanStack Query.
- Tokens JWT: **nunca** en `localStorage` ni `sessionStorage`. Solo cookies httpOnly vía BFF.
- `dangerouslySetInnerHTML`: prohibido.
- Formularios: React Hook Form + Zod + `noValidate` en el `<form>`.
- API calls: siempre vía BFF (`/api/backend/[path]`), nunca directo al backend desde el browser.

---

## Skills disponibles

Lee el skill correspondiente antes de implementar:

| Skill | Path |
|-------|------|
| NestJS patterns | `.ai/skills/backend/nest-development.md` |
| Auth (JWT, guards) | `.ai/skills/backend/auth-patterns.md` |
| RLS multi-tenant | `.ai/skills/backend/tenant-patterns.md` |
| Errores tipados | `.ai/skills/backend/error-patterns.md` |
| DTOs y validación | `.ai/skills/backend/dto-patterns/SKILL.md` |
| Code review backend | `.ai/skills/backend/code-review/SKILL.md` |
| Seguridad backend | `.ai/skills/backend/security-patterns.md` |
| Componente UI | `.ai/skills/frontend/create-component.md` |
| Página Next.js | `.ai/skills/frontend/create-page.md` |
| Hook TanStack Query | `.ai/skills/frontend/create-hook.md` |
| Formulario RHF+Zod | `.ai/skills/frontend/create-form.md` |
| Route Handler BFF | `.ai/skills/frontend/create-endpoint.md` |
| Seguridad frontend | `.ai/skills/frontend/security-patterns.md` |
| Database / migraciones | `.ai/skills/database/database-patterns.md` |
| OpenSpec apply | `.ai/skills/openspec/openspec-apply-change/SKILL.md` |

---

## Persistencia de estado (Engram MCP)

El estado del workflow vive en Engram bajo el topic `sdd/<correlationId>/packet`.

Al iniciar sesión con un workflow activo:
1. `mem_search("sdd-init/PickyApp")` → obtener `correlationId`
2. `mem_search("sdd/<correlationId>/packet")` → `mem_get_observation(<id>)` → packet actual
3. Si no hay workflow activo: `node .ai/scripts/packet-manager.js preflight <userId>`

Nunca confiar en el historial de conversación para el estado — siempre verificar en Engram.

---

## Calidad antes de finalizar

| Proyecto | Comando |
|----------|---------|
| Backend | `npm run typecheck` |
| Frontend | `npm run lint && npm run typecheck` |
| Scripts | `node .ai/scripts/test-packet-manager.js` |

---

## Referencias

- Skill registry: `.atl/skill-registry.md`
- Mapa del orquestador: `.ai/ORCHESTRATOR-MAP.md`
- Reglas de proyecto: `openspec/project-rules.md`
- Config monorepo: `openspec/config.yaml`
