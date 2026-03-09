# Validation Schema — OpenSpec System
# Uso: openspec-validate lee SOLO este archivo, no HANDSHAKE_PROTOCOL.md completo

## Interfaces requeridas para validación

```typescript
type WorkflowStage =
  | 'intake' | 'spec_proposed' | 'spec_designed' | 'spec_validated'
  | 'spec_applying' | 'gate_security' | 'gate_ci' | 'gate_qa'
  | 'spec_applied' | 'archived' | 'error' | 'recovering'

type SpecStatus =
  | 'proposed' | 'designed' | 'validated' | 'applied' | 'archived' | 'rejected'

interface OpenSpec {
  id: string
  version: string
  status: SpecStatus
  title: string
  proposal: string
  design: Record<string, unknown>
  acceptanceCriteria: string[]
  relatedSpecIds: string[]
  appliedAt?: string
  archivedAt?: string
}

interface ValidationError {
  type: 'schema' | 'criteria_ambiguity' | 'spec_conflict'
  field?: string
  description: string
  attempt: number
}
```

## Reglas de validación

### Schema validation
- `OpenSpec.id` debe ser UUID v4
- `OpenSpec.version` debe ser semver (X.Y.Z)
- `OpenSpec.acceptanceCriteria` no puede estar vacío
- `OpenSpec.design` no puede ser objeto vacío `{}`
- `OpenSpec.status` debe coincidir con el stage actual del workflow

### Criteria validation
Los siguientes patrones en acceptanceCriteria invalidan el criterio:
- Contiene: "debería", "podría", "en general", "aproximadamente",
  "cuando sea posible", "idealmente", "mejor si"
- No contiene ningún verbo verificable: "retorna", "persiste", "valida",
  "rechaza", "acepta", "lanza", "emite", "actualiza"

### Conflict validation
Una spec en diseño tiene conflicto bloqueante si:
- Define el mismo endpoint que una spec en status 'applied' o 'archived'
  con comportamiento diferente
- Modifica el mismo campo de base de datos con tipo incompatible
- Contradice explícitamente una decisión documentada en spec archivada

## Tamaño de este archivo
Este archivo NO incluye: GateFeedback, AgentOutput, ContextPacket,
WorkflowEvent, ni ninguna interface no necesaria para validación.
Tamaño objetivo: ≤ 350 tokens.
