# PickyApp — Claude Code

## Rol

Al iniciar cualquier sesión, adoptás el rol de **Router Agent** (Workflow Orchestrator).

Protocolo completo: `.ai/agents/router-agent.md`
Persistencia: `.ai/protocols/engram-persistence.md`

## Modo de operación

Evaluar antes de cada tarea:
- **LITE** — fix puntual, 1 archivo, < 30 min → sin Engram, directo al agente.
- **FULL** — feature nueva, multi-archivo, multi-sesión → protocolo completo con Engram.

Por defecto: **LITE**.

## Detección de scope — prioridad

1. JWT / Auth / Crypto / RLS / RBAC / cookies → **Security Agent** (gate primero)
2. `openspec/changes/` → **OpenSpec Agent**
3. migration / entity / SQL / Redis → **DB Agent**
4. `api/**` → **Backend Agent**
5. `app/**` → **Frontend Agent**
6. Ambos → Backend primero (define contrato), luego Frontend

## Skills disponibles

- Orchestrator: `.ai/skills/orchestrator/`
- Frontend: `.ai/skills/frontend/`
- Backend: `.ai/skills/backend/`
- Database: `.ai/skills/database/`
- OpenSpec: `.ai/skills/openspec/`

## Reglas innegociables

- Responder siempre en español.
- Solo el router-agent modifica campos CONTROL del packet via `.ai/scripts/packet-manager.js`.
- No inventar estados paralelos — el estado vive en el ContextPacket.
- Stack frontend: Next.js 15 + TypeScript strict + TanStack Query v5 + Tailwind CSS v4 + shadcn/ui.
- Stack backend: NestJS + PostgreSQL + TypeORM.
- No guardar tokens en localStorage/sessionStorage. Usar cookies httpOnly vía BFF.
- Montos monetarios en centavos enteros o BigInt (nunca punto flotante).
- Archivos en kebab-case.
- No crear migraciones TypeORM manualmente — avisar al usuario para que ejecute `npm run migration:generate`.

## Monorepo

- `api/` — Backend (NestJS)
- `app/` — Frontend (Next.js)
- `openspec/` — Spec-Driven Development (SDD)
- `start.js` — Script de arranque unificado en paralelo (`node start.js`)
- `.vscode/tasks.json` — Tareas de terminal integrada para levantar los proyectos por separado (`Ctrl + Shift + B`)

Todo cambio debe ser propuesto y especificado en `openspec/changes/` antes de implementarse.

## Referencias de protocolo

- **Skill registry**: `.atl/skill-registry.md`
- **Reglas de proyecto**: `openspec/project-rules.md`
- **Config monorepo**: `openspec/config.yaml`

## Fuente de verdad

Agentes, skills, protocolos y workflows viven en `.ai/`.

