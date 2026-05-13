# Protocolo Engram — Referencia Completa

> **Para agentes**: usar el skill `engram-write.md` en lugar de leer este documento entero.
> Este archivo es la spec técnica para mantenimiento e implementación.

---

## Reglas esenciales

1. El `ContextPacket` en Engram es la única fuente de verdad del estado del workflow.
2. Antes de cualquier `mem_save`, llamar al skill `engram-write` — nunca escribir el packet desde cero (excepto en Preflight).
3. Al inicio de cualquier interacción con `correlationId`: hacer `mem_search("sdd/<id>/packet")` para recuperar estado.

---

## Schema del ContextPacket

### Sección CONTROL — Solo Router escribe

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `correlationId` | string | `<userId>-<yyyyMMddHHmm>-<rand4>` |
| `stage` | string | `intake \| executing \| done \| error` |

### Sección STATE — Cualquier agente puede merge-escribir

| Campo | Tipo | Merge strategy |
|-------|------|----------------|
| `status` | string | last-write-wins (`ok \| error \| blocked`) |
| `scope` | string[] | last-write-wins |
| `current_task` | `{id, name}` | last-write-wins |
| `completed_tasks` | `{id, name}[]` | union-by-id |
| `error_code` | string\|null | last-write-wins |
| `blocked_reason` | string\|null | last-write-wins |

---

## Protocolo merge-write (implementado en `packet-manager.js`)

```bash
# Todos los agentes (excepto Router en Preflight):
node .ai/scripts/packet-manager.js merge '<packet_json>' <agent_name> '<fields_json>'
# → retorna { packet, warnings }
# Usar packet resultante en mem_save
```

**Excepción Preflight**: Primera escritura del workflow. Router crea packet desde cero:
```bash
node .ai/scripts/packet-manager.js preflight <userId>
```

**Protección CONTROL**: Si un agente no-Router intenta escribir `correlationId` o `stage`,
`packet-manager.js` lo rechaza y setea `error_code: AGENT_PROTOCOL_BREACH`.

---

## Errores irrecuperables

```
SCHEMA_VIOLATION | ENGRAM_WRITE_FAILURE | AGENT_PROTOCOL_BREACH | UNRESOLVABLE_CONFLICT
```

Verificar: `node .ai/scripts/packet-manager.js is-irrecuperable <code>`

Ante un error irrecuperable: detener el workflow, notificar al usuario con `error_code` + `blocked_reason`.

---

## Recuperación de contexto

```
mem_search("sdd/<correlationId>/packet")
→ mem_get_observation(id)
→ verificar stage y status
```

Para listar workflows activos sin conocer el correlationId:
```bash
node .ai/scripts/packet-manager.js list-workflows <userId>
# → retorna la query de mem_search a ejecutar
```
