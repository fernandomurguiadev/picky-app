# Trae Bridge

Este archivo es el punto de entrada nativo de **Trae** para este repositorio.
La fuente de verdad de agentes, skills y protocolos vive en `.ai/`.

## Agentes disponibles

| Agente | Definición | Responsabilidad |
|--------|-----------|-----------------|
| **Router Agent** | `.ai/agents/router-agent.md` | Orquestador central — dispatch y CONTROL del ContextPacket |
| **Backend Agent** | `.ai/agents/backend-agent.md` | NestJS / Arquitectura hexagonal / RLS |
| **Frontend Agent** | `.ai/agents/frontend-agent.md` | Next.js 15 / App Router / BFF |
| **DB Agent** | `.ai/agents/db-agent.md` | TypeORM / Migraciones / Redis |
| **OpenSpec Agent** | `.ai/agents/openspec-agent.md` | SDD workflow — propose / apply / archive |
| **Security Agent** | `.ai/agents/security-agent.md` | JWT / Auth / Crypto / RLS / RBAC |

## Detección de scope

| Condición | Agente |
|-----------|--------|
| `api/**` o NestJS | Backend Agent |
| `app/**` o React/Next.js | Frontend Agent |
| `openspec/changes/**` | OpenSpec Agent |
| JWT / Auth / Crypto / cookies / RLS | Security Agent |
| SQL / Redis / migration / entity | DB Agent |
| Ambos proyectos | Backend + Frontend en paralelo |

## Estado centralizado

Persistencia via Engram MCP. Topic: `sdd/<correlationId>/packet`.

```bash
# Ver estado actual del workflow
node .ai/scripts/packet-manager.js list-workflows <userId>

# Recuperar packet
node .ai/scripts/bridge.js status '<packet_json>'
```

## Skills

`.ai/skills/` — `backend/` (7), `frontend/` (11), `database/` (1), `openspec/` (5), `orchestrator/` (1).

## Referencias

- Skill registry: `.atl/skill-registry.md`
- Mapa del orquestador: `.ai/ORCHESTRATOR-MAP.md`
- Protocolo completo: `.ai/BRIDGE.md`
