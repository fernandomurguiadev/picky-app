## 1. Entidades y Enum

- [x] 1.1 Crear `api/src/modules/platform/enums/feature-code.enum.ts` con los 7 códigos (`REMOVE_BRANDING`, `CUSTOM_DOMAIN`, `ANALYTICS`, `PRIORITY_SUPPORT`, `MULTI_BRANCH`, `API_ACCESS`, `AI_ASSISTANT`)
- [x] 1.2 Crear `api/src/modules/platform/entities/feature.entity.ts` (id, code, name, description, timestamps)
- [x] 1.3 Crear `api/src/modules/platform/entities/plan-feature.entity.ts` con PK compuesta `(planId, featureId)` y relaciones a `Plan` y `Feature`
- [x] 1.4 Agregar relación `@OneToMany(() => PlanFeature, ...)` en `plan.entity.ts` (sin columnas nuevas)

## 2. Migración

- [x] 2.1 Ejecutar `npm run migration:generate -- --name=add-feature-tables` en `api/`
- [x] 2.2 Revisar la migración generada: debe crear `features` y `plan_features` con FK correctas
- [x] 2.3 Ejecutar `npm run migration:run` para aplicar la migración

## 3. DTOs

- [x] 3.1 Crear `api/src/modules/platform/dto/platform-create-feature.dto.ts` (`code`, `name`, `description?`) con `@ApiProperty` y validaciones
- [x] 3.2 Crear `api/src/modules/platform/dto/platform-update-feature.dto.ts` (PartialType de create, solo `name` y `description`)
- [x] 3.3 Crear `api/src/modules/platform/dto/platform-assign-features.dto.ts` (`featureIds: string[]`)

## 4. FeatureService

- [x] 4.1 Crear `api/src/modules/platform/feature.service.ts` con inyección de repos `Feature`, `PlanFeature`, `Tenant`
- [x] 4.2 Implementar `findAll(): Promise<Feature[]>` ordenado por `code`
- [x] 4.3 Implementar `create(dto): Promise<Feature>` con validación de unicidad de `code` (409 si duplicado)
- [x] 4.4 Implementar `update(id, dto): Promise<Feature>` con validación de existencia
- [x] 4.5 Implementar `remove(id): Promise<void>` con validación: 409 si feature está asignada a algún plan
- [x] 4.6 Implementar `getFeaturesForPlan(planId): Promise<Feature[]>`
- [x] 4.7 Implementar `assignFeaturesToPlan(planId, featureIds): Promise<Feature[]>` — reemplaza el conjunto actual de forma atómica (delete + insert en transacción)
- [x] 4.8 Implementar `hasFeature(tenantId, featureCode): Promise<boolean>` — resuelve plan del tenant, consulta `plan_features`, nunca lanza excepción

## 5. Controller

- [x] 5.1 Crear `api/src/modules/platform/platform-features.controller.ts` con guard de superadmin
- [x] 5.2 Implementar `GET /platform/features` → `featureService.findAll()`
- [x] 5.3 Implementar `POST /platform/features` → `featureService.create(dto)`
- [x] 5.4 Implementar `PATCH /platform/features/:id` → `featureService.update(id, dto)`
- [x] 5.5 Implementar `DELETE /platform/features/:id` → `featureService.remove(id)`
- [x] 5.6 Implementar `GET /platform/plans/:id/features` en `platform-plans.controller.ts` → `featureService.getFeaturesForPlan(id)`
- [x] 5.7 Implementar `PUT /platform/plans/:id/features` en `platform-plans.controller.ts` → `featureService.assignFeaturesToPlan(id, dto.featureIds)`

## 6. Registro en PlatformModule

- [x] 6.1 Agregar `Feature` y `PlanFeature` a `TypeOrmModule.forFeature([...])` en `platform.module.ts`
- [x] 6.2 Agregar `FeatureService` a `providers` y a `exports` de `PlatformModule`
- [x] 6.3 Agregar `PlatformFeaturesController` a `controllers` de `PlatformModule`

## 7. Seeder

- [x] 7.1 Crear `api/src/modules/platform/seeders/feature.seeder.ts`
- [x] 7.2 Implementar upsert de las 7 features base por `code`
- [x] 7.3 Implementar asignación idempotente de features a planes (FREE, STARTER, PRO, BUSINESS) según la tabla del spec
- [x] 7.4 Documentar cómo ejecutar el seeder (comentario en el archivo o sección en README del módulo)

## 8. Verificación

- [x] 8.1 Verificar que `hasFeature` devuelve `true` para un tenant en plan BUSINESS con cualquier feature
- [x] 8.2 Verificar que `hasFeature` devuelve `false` para un tenant en plan FREE
- [x] 8.3 Verificar que DELETE de feature asignada devuelve 409
- [x] 8.4 Verificar que PUT `/platform/plans/:id/features` con array vacío desactiva todas las features
- [x] 8.5 Verificar que la migración es reversible (down migration limpia las tablas)
