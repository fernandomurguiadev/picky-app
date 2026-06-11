## Context

El módulo `platform` gestiona los planes (`Plan`) y los tenants. Actualmente `Tenant` tiene un campo `planId` que referencia `plans.id`. El `PlatformPlansService` expone CRUD de planes y `PlatformModule` exporta `TypeOrmModule` (lo que permite que otros módulos inyecten repositorios del módulo platform).

El sistema necesita distinguir entre dos tipos de restricciones:
- **Cuantitativas** (`maxProducts`, `maxCategories`, etc.) — permanecen en `plans`.
- **Cualitativas** (features comerciales) — nueva capa `features` + `plan_features`.

## Goals / Non-Goals

**Goals:**
- Crear entidades `Feature` y `PlanFeature` en TypeORM dentro del módulo `platform`.
- Exponer `FeatureService.hasFeature(tenantId, featureCode)` como servicio exportable.
- Crear endpoints de gestión (CRUD de features + asignación a planes) para superadmin.
- Seeder que cargue las 7 features base y las asigne según la configuración inicial por plan.
- Mantener compatibilidad total con `plan.entity.ts` existente (sin eliminar columnas).

**Non-Goals:**
- UI/Frontend de gestión de features — queda para un cambio `app-` posterior.
- Integración con pasarela de pagos o subscriptions.
- Override de features por tenant individual (la granularidad es plan, no tenant).
- Cache distribuido para `hasFeature` — se puede agregar como optimización futura.

## Decisions

### D1 — Entidad `Feature` separada de `Plan`

**Decisión**: tabla `features` independiente con `code` como identificador semántico (ej. `REMOVE_BRANDING`).

**Rationale**: permite referenciar features por código string en guards y decoradores sin depender de UUIDs. Un enum `FeatureCode` en TypeScript garantiza type-safety.

**Alternativa descartada**: columnas booleanas en `plans` — genera migración por cada feature nueva y acopla el esquema al roadmap comercial.

### D2 — `PlanFeature` como tabla pivote explícita

**Decisión**: entidad `PlanFeature` con PK compuesta `(planId, featureId)` en lugar de relación `ManyToMany` implícita de TypeORM.

**Rationale**: control explícito sobre la tabla pivote, posibilidad de agregar metadata futura (ej. `overrideValue`, `enabledAt`) sin migración destructiva. TypeORM ManyToMany implícito no permite agregar columnas a la tabla intermedia.

**Alternativa descartada**: `@ManyToMany` con `@JoinTable` — conveniente pero inflexible para extensión.

### D3 — `FeatureService` exportado desde `PlatformModule`

**Decisión**: `FeatureService` vive en `platform/` y se agrega a `exports` de `PlatformModule`.

**Rationale**: `PlatformModule` ya exporta `TypeOrmModule`, por lo que todos los módulos que lo importen podrán inyectar `FeatureService` sin crear dependencias circulares.

### D4 — Resolución del plan activo vía `Tenant.planId`

**Decisión**: `hasFeature` resuelve el plan del tenant consultando `tenants.planId` y luego `plan_features`.

**Rationale**: la fuente de verdad del plan activo ya es `tenant.planId`. No se duplica estado.

**Query path**: `tenant(tenantId).planId` → `plan_features WHERE plan_id = ?` → `features WHERE code = ?`.

### D5 — Enum `FeatureCode` en TypeScript

**Decisión**: crear `feature-code.enum.ts` con los códigos válidos como string enum.

**Rationale**: type-safety en guards, evita strings mágicos dispersos en el código.

## Estructura de archivos resultante

```
api/src/modules/platform/
├── entities/
│   ├── plan.entity.ts          (sin cambios en columnas, +relation)
│   ├── feature.entity.ts       (NUEVO)
│   └── plan-feature.entity.ts  (NUEVO)
├── enums/
│   └── feature-code.enum.ts    (NUEVO)
├── dto/
│   ├── platform-create-feature.dto.ts   (NUEVO)
│   ├── platform-update-feature.dto.ts   (NUEVO)
│   └── platform-assign-features.dto.ts  (NUEVO)
├── feature.service.ts          (NUEVO)
├── platform-features.controller.ts  (NUEVO)
├── platform-plans.service.ts   (ampliar: getFeatures, assignFeatures)
├── platform.module.ts          (actualizar: registrar entidades, service, controller)
└── seeders/
    └── feature.seeder.ts       (NUEVO)
```

## API Endpoints (superadmin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/platform/features` | Listar todas las features |
| POST | `/platform/features` | Crear feature |
| PATCH | `/platform/features/:id` | Editar feature |
| DELETE | `/platform/features/:id` | Eliminar feature (si no está asignada) |
| GET | `/platform/plans/:id/features` | Features asignadas a un plan |
| PUT | `/platform/plans/:id/features` | Reemplazar features de un plan (bulk assign) |

## Seeder inicial

| Plan | Features habilitadas |
|------|---------------------|
| FREE | — (ninguna) |
| STARTER | `REMOVE_BRANDING`, `ANALYTICS` |
| PRO | `REMOVE_BRANDING`, `ANALYTICS`, `CUSTOM_DOMAIN`, `PRIORITY_SUPPORT` |
| BUSINESS | Todas (`REMOVE_BRANDING`, `CUSTOM_DOMAIN`, `ANALYTICS`, `PRIORITY_SUPPORT`, `MULTI_BRANCH`, `API_ACCESS`, `AI_ASSISTANT`) |

## Risks / Trade-offs

- **Sin cache en `hasFeature`** → N+1 potencial si se llama en loops. Mitigación: el método acepta eager loading del plan en el futuro; por ahora las llamadas son por request.
- **Seeder no idempotente por defecto** → usar `upsert` en el seeder para evitar duplicados en re-ejecuciones.
- **Eliminación de features asignadas** → el endpoint DELETE debe verificar que la feature no esté en ningún `plan_features` antes de eliminar.

## Migration Plan

1. Ejecutar `npm run migration:generate -- --name=add-feature-tables` tras crear las entidades.
2. Revisar la migración generada (debe crear `features` y `plan_features`, y agregar la relación en `plans`).
3. Ejecutar `npm run migration:run`.
4. Ejecutar el seeder manualmente (o como parte del startup en dev).
5. Rollback: eliminar `plan_features` y `features` (sin FK hacia `plans` desde las columnas existentes, el rollback es limpio).

## Open Questions

- ¿El seeder debe ejecutarse automáticamente en `npm run start:dev` o de forma explícita?
- ¿Se requiere endpoint público (`/public/plans/:id/features`) para que el frontend muestre features del plan en la landing?
