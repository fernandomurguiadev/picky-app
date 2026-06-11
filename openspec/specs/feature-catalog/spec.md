# feature-catalog Specification

## Purpose
TBD - created by archiving change api-plan-feature-flags. Update Purpose after archive.
## Requirements
### Requirement: Gestión de catálogo de features

El sistema SHALL proveer un CRUD de features accesible solo para superadmin, donde cada feature tiene un `code` único (string en mayúsculas, ej. `REMOVE_BRANDING`), un `name` legible y una `description` opcional.

**Tabla de funcionalidades:**

| Funcionalidad | Prioridad | Descripción |
|---------------|-----------|-------------|
| Listar features | Alta | GET /platform/features — devuelve todas las features |
| Crear feature | Alta | POST /platform/features — valida unicidad de `code` |
| Editar feature | Media | PATCH /platform/features/:id — permite cambiar name/description |
| Eliminar feature | Media | DELETE /platform/features/:id — solo si no está asignada a ningún plan |

**Interfaces TypeScript:**

```typescript
interface Feature {
  id: string;           // UUID
  code: string;         // ej. "REMOVE_BRANDING"
  name: string;         // ej. "Remover marca Picky"
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateFeatureDto {
  code: string;   // uppercase, max 100
  name: string;   // max 100
  description?: string;
}
```

#### Scenario: Listar features exitosamente
- **WHEN** un superadmin hace GET `/platform/features`
- **THEN** el sistema devuelve `200` con un array de todas las features ordenadas por `code`

#### Scenario: Crear feature con code único
- **WHEN** un superadmin hace POST `/platform/features` con `{ code: "AI_ASSISTANT", name: "IA Asistente" }`
- **THEN** el sistema crea la feature y devuelve `201` con la feature creada

#### Scenario: Crear feature con code duplicado
- **WHEN** un superadmin hace POST `/platform/features` con un `code` que ya existe
- **THEN** el sistema devuelve `409 Conflict`

#### Scenario: Eliminar feature no asignada
- **WHEN** un superadmin hace DELETE `/platform/features/:id` y la feature no está en ningún `plan_features`
- **THEN** el sistema elimina la feature y devuelve `200`

#### Scenario: Eliminar feature asignada a un plan
- **WHEN** un superadmin hace DELETE `/platform/features/:id` y la feature está asignada a al menos un plan
- **THEN** el sistema devuelve `409 Conflict` con mensaje descriptivo

---

### Requirement: Asignación de features a planes

El sistema SHALL permitir consultar y reemplazar (bulk) el conjunto de features asignadas a un plan. La operación de asignación SHALL ser atómica (reemplaza todo el conjunto).

**Interfaces TypeScript:**

```typescript
interface AssignFeaturesDto {
  featureIds: string[];  // array de UUIDs de features a asignar (reemplaza el conjunto actual)
}
```

#### Scenario: Consultar features de un plan
- **WHEN** un superadmin hace GET `/platform/plans/:id/features`
- **THEN** el sistema devuelve `200` con el array de features asignadas al plan

#### Scenario: Asignar features a un plan
- **WHEN** un superadmin hace PUT `/platform/plans/:id/features` con `{ featureIds: ["uuid1", "uuid2"] }`
- **THEN** el sistema reemplaza todas las asignaciones previas del plan y devuelve `200` con las features resultantes

#### Scenario: Asignar array vacío desactiva todas las features
- **WHEN** un superadmin hace PUT `/platform/plans/:id/features` con `{ featureIds: [] }`
- **THEN** el sistema elimina todas las asignaciones del plan y devuelve `200` con array vacío

#### Scenario: Asignar con featureId inválido
- **WHEN** el payload incluye un UUID que no corresponde a ninguna feature existente
- **THEN** el sistema devuelve `404` con el ID que no existe

