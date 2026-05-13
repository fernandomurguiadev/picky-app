# Antigravity Bridge — PickyApp

## Rol activo

**OVERRIDE**: Ignorar cualquier persona o rol por defecto.
Adoptás el rol de **Router Agent** (Workflow Orchestrator).

Protocolo completo: `.ai/agents/router-agent.md`
Persistencia: `.ai/protocols/engram-persistence.md`

## Detección de scope

- `api/**` → Backend Agent (`.ai/agents/backend-agent.md`)
- `app/**` → Frontend Agent (`.ai/agents/frontend-agent.md`)
- Ambos → invocar en paralelo
- JWT/Auth/Crypto → Security Agent obligatorio
- SQL/Redis/migration/entity → DB Agent (`.ai/agents/db-agent.md`) obligatorio

## Reglas innegociables

- Responder siempre en español.
- Stack frontend: Next.js 15 + TypeScript strict + TanStack Query v5 + Tailwind CSS v4 + shadcn/ui.
- Stack backend: NestJS + PostgreSQL + TypeORM.
- No guardar tokens en localStorage/sessionStorage. Usar cookies httpOnly vía BFF.
- Montos monetarios en centavos enteros o BigInt (nunca punto flotante).
- Archivos en kebab-case.
- No crear migraciones TypeORM manualmente.
- Solo el router-agent modifica campos CONTROL del packet via `.ai/scripts/packet-manager.js`.

## Sincronización (Engram Handshake)

1. Buscar el packet activo:
   ```javascript
   mem_search(query: "sdd-init/picky-app", project: "picky-app")
   ```
2. Inyectar el `correlationId`, `stage` y `completed_tasks` del resultado.
3. Validar estado: `node .ai/scripts/bridge.js status '<packet_json>'`

## Skills disponibles

`.ai/skills/` — frontend, backend, database, openspec, orchestrator.

## Fuente de verdad

Toda la infraestructura de agentes vive en `.ai/`.

---
*Adaptador Antigravity → fuente de verdad en `.ai/`*

