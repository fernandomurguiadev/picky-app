# Agent Bridge Protocol

Este archivo es el punto de entrada para cualquier agente que trabaje en este repositorio.
La fuente de verdad de agentes, skills y protocolos vive en `.ai/`.

## Modo de operación — elegir antes de actuar

| Criterio | Modo |
|----------|------|
| Fix puntual, 1 archivo, < 30 min, sin estado persistente | **LITE** — sin Engram, directo al agente |
| Feature nueva, multi-archivo, multi-sesión, o change OpenSpec activo | **FULL** — protocolo completo con Engram |

Por defecto: **LITE**.

## Handshake — al iniciar sesión

1. Leer `.ai/agents/router-agent.md` como instrucción base.
2. En modo FULL: buscar workflow activo antes de crear uno nuevo.
3. Respetar el ContextPacket — no inventar estados paralelos.

## Recuperación de contexto (modo FULL)

Si hay un `correlationId` activo o la sesión fue interrumpida:

```bash
# Listar workflows activos
node .ai/scripts/packet-manager.js list-workflows <userId>
# → retorna la query de mem_search a ejecutar

# Recuperar packet completo
mem_search("sdd/<correlationId>/packet") → mem_get_observation(<id>)
```

Sin correlationId activo: iniciar workflow nuevo con `preflight`.

```bash
node .ai/scripts/packet-manager.js preflight <userId>
```

## Reglas de Oro

- **Solo el router-agent escribe CONTROL**: `correlationId` y `stage` via `packet-manager.js`.
- **Cierre de sesión (modo FULL)**: llamar `mem_session_summary` al terminar.
- **Skills disponibles**: ver `.atl/skill-registry.md`.

## Agentes disponibles

| Agente | Definición | Responsabilidad |
|--------|-----------|-----------------|
| **Router Agent** | `.ai/agents/router-agent.md` | Orquestador central — dispatch y CONTROL del ContextPacket |
| **Backend Agent** | `.ai/agents/backend-agent.md` | NestJS / Modular / Multi-tenancy |
| **Frontend Agent** | `.ai/agents/frontend-agent.md` | Next.js 15 / App Router / BFF |
| **DB Agent** | `.ai/agents/db-agent.md` | TypeORM / Migraciones / Postgres |
| **OpenSpec Agent** | `.ai/agents/openspec-agent.md` | SDD workflow — propose / apply / archive |
| **Security Agent** | `.ai/agents/security-agent.md` | JWT / Auth / Crypto / Tenant isolation |

## Detección de scope — prioridad

```
1. JWT / Auth / Crypto / Tenant isolation / cookies → Security Agent (gate)
2. openspec/changes/                               → OpenSpec Agent
3. migration / entity / SQL / Postgres             → DB Agent
4. api/**                                          → Backend Agent
5. app/**                                          → Frontend Agent
6. Ambos proyectos                                 → Backend primero, luego Frontend
```

## Referencias

- Skill registry: `.atl/skill-registry.md`
- Protocolo Engram: `.ai/protocols/engram-persistence.md`
- Mapa del orquestador: `.ai/ORCHESTRATOR-MAP.md`

---
*PickyApp Agent Infrastructure · Router Agent v3.0.0*

