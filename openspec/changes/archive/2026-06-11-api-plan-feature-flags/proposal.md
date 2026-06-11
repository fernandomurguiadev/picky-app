## Why

La tabla `plans` crece en columnas booleanas cada vez que se agrega una funcionalidad comercial nueva, lo que genera migraciones innecesarias y acopla el modelo de negocio al esquema relacional. Se necesita un sistema de feature flags por plan que permita habilitar/deshabilitar capacidades sin alterar el esquema de `plans`.

## What Changes

- **Nueva tabla `features`**: catálogo de funcionalidades habilitables (code, name, description).
- **Nueva tabla `plan_features`**: tabla pivote que asocia features a planes (many-to-many).
- **Nuevas entidades TypeORM**: `Feature` y `PlanFeature`.
- **Nuevo `FeatureService`**: servicio reutilizable con `hasFeature(tenantId, featureCode)`.
- **Seeder inicial**: poblar features y asignarlas a los planes existentes (FREE, STARTER, PRO, BUSINESS).
- La tabla `plans` **no se modifica** — los límites cuantitativos permanecen en ella.

## Capabilities

### New Capabilities

- `feature-catalog`: CRUD administrativo de features (code, name, description) y su asociación con planes.
- `plan-feature-guard`: servicio `FeatureService` con método `hasFeature(tenantId, featureCode)` para validar acceso a funcionalidades premium desde cualquier módulo.

### Modified Capabilities

<!-- ninguna — no cambia el comportamiento existente de plans -->

## Impact

**Multi-tenancy**: `hasFeature` resuelve el plan activo del tenant vía `tenant.planId`, consulta `plan_features` y devuelve un booleano. No se expone `tenant_id` directamente en las nuevas tablas; la resolución pasa por el plan asignado al tenant.

**Panel Admin**: nueva sección para gestionar el catálogo de features y su asignación a planes (superadmin).

**Tienda Pública**: sin impacto directo. El guard se usa internamente en servicios de backend.

**Módulos afectados**:
- `api/src/modules/platform/` — entidades `Feature`, `PlanFeature`; `FeatureService`; seeder
- `api/src/modules/platform/entities/plan.entity.ts` — agregar relación `OneToMany` a `PlanFeature` (sin columnas nuevas)
- Migrations: dos nuevas tablas (`features`, `plan_features`)
