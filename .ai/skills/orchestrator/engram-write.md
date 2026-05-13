---
name: engram-write
description: Skill para escribir al ContextPacket en Engram con merge-write garantizado.
version: 2.0.0
---

# Skill: engram-write

Usar este skill en lugar de llamar a `mem_save` directamente. Garantiza que:
- Los campos CONTROL no sean sobreescritos por agentes no autorizados.
- `completed_tasks` use merge union-by-id (no se pierden tasks de otros agentes).
- El packet se valide antes de escribirse.

## Pasos

### 1. Leer el packet actual

```
mem_search(query: "sdd/<correlationId>/packet")
→ mem_get_observation(id: <ID>)
→ packet_actual = content.packet
```

Si no existe (solo en Preflight del Router):
```bash
node .ai/scripts/packet-manager.js preflight <userId>
```
Usar el resultado directamente como packet. Saltar al paso 3.

### 2. Aplicar merge

```bash
node .ai/scripts/packet-manager.js merge '<packet_actual_json>' <agent_name> '<campos_a_escribir_json>'
```

`<agent_name>` es: `router`, `frontend`, `backend`, `db`, `security`.

El comando retorna:
```json
{
  "packet": { "<packet_fusionado>" },
  "warnings": []
}
```

Si `warnings` contiene `AGENT_PROTOCOL_BREACH`:
- Reportar la advertencia.
- Verificar si el `error_code` es irrecuperable: `node .ai/scripts/packet-manager.js is-irrecuperable <code>`
- Si es irrecuperable: detener y notificar al usuario.

### 3. Validar

```bash
node .ai/scripts/packet-manager.js validate '<packet_fusionado_json>'
```

Si retorna `{ valid: false, errors: [...] }`: no escribir. Reportar errores al Router.

### 4. Escribir a Engram

```
mem_save(
  title: "[STATE] <AgentName> - <stage> - <correlationId>",
  topic_key: "sdd/<correlationId>/packet",
  type: "decision",
  content: {
    "packet": <packet_fusionado>,
    "workflow_summary": "<resumen breve del estado actual>",
    "timestamp": "<ISO_DATE>"
  }
)
```

## Referencia rápida

```bash
# Crear packet inicial (solo Router en Preflight)
node .ai/scripts/packet-manager.js preflight <userId>

# Merge-write (todos los agentes)
node .ai/scripts/packet-manager.js merge '<existing>' <agent> '<fields>'

# Validar
node .ai/scripts/packet-manager.js validate '<packet>'

# Verificar si un error_code es irrecuperable
node .ai/scripts/packet-manager.js is-irrecuperable <code>

# Listar workflows activos en Engram
node .ai/scripts/packet-manager.js list-workflows <userId>
```
