# Tasks — api-fase-8-store-toggle

## Fase de implementación: FASE 8 — Toggle Manual de Tienda

---

### B8.1 — Entidad `StoreSettings`

- [x] Agregar columna en `api/src/modules/tenants/entities/store-settings.entity.ts`:
  ```typescript
  @Column({ type: 'boolean', nullable: true, default: null })
  isManualOpen!: boolean | null;
  ```
- [x] Colocar el campo antes de `createdAt`

**Criterio de done:** TypeScript compila. El campo es `boolean | null`, no `boolean`.

---

### B8.2 — Migración

- [ ] Avisar al usuario para ejecutar:
  ```bash
  cd api && npm run migration:generate -- --name=AddIsManualOpenToStoreSettings
  ```
- [ ] Verificar que el archivo generado contiene `ADD COLUMN "is_manual_open" boolean DEFAULT NULL`
- [ ] Ejecutar `npm run migration:run` para aplicarla

**Criterio de done:** Migración ejecuta sin errores. Columna existe en la BD.

---

### B8.3 — `ToggleStoreStatusDto`

- [x] Crear `api/src/modules/tenants/dto/toggle-store-status.dto.ts`
- [x] Campo `isManualOpen: boolean | null` con decorador `@IsBoolean()` + `@IsOptional()`
- [x] Valor por defecto `null`

**Criterio de done:** `{ isManualOpen: true }`, `{ isManualOpen: false }` y `{ isManualOpen: null }` pasan validación. Body vacío `{}` también pasa (valor es `null` por defecto).

---

### B8.4 — `TenantsService`

- [x] Actualizar `StoreStatusResult` en `tenants.service.ts` para agregar campo `source: 'manual' | 'schedule'`
- [x] Modificar `getStoreStatus(slug)`:
  1. Agregar `isManualOpen` al `select` de la query de `settingsRepo`
  2. Si `isManualOpen === true` → retornar `{ isOpen: true, nextChange: null, source: 'manual' }`
  3. Si `isManualOpen === false` → retornar `{ isOpen: false, nextChange: null, source: 'manual' }`
  4. Si `isManualOpen === null` → flujo existente + agregar `source: 'schedule'` al retorno
- [x] Agregar método `toggleStoreStatus(tenantId, isManualOpen)`:
  - Cargar `StoreSettings` del tenant (o crear si no existe)
  - Asignar `settings.isManualOpen = isManualOpen`
  - `save` y retornar `{ isManualOpen }`

**Criterio de done:** Con `isManualOpen = true` en BD, `getStoreStatus` retorna `isOpen: true` sin importar el horario. Con `isManualOpen = null`, respeta el horario.

---

### B8.5 — `TenantsController`

- [x] Agregar endpoint en `api/src/modules/tenants/tenants.controller.ts`:
  - `@Patch('me/status')` + `@UseGuards(JwtAuthGuard)`
  - Recibe `@Body() dto: ToggleStoreStatusDto`
  - Recibe `@TenantId() tenantId: string`
  - Llama `tenantsService.toggleStoreStatus(tenantId, dto.isManualOpen)`
  - Retorna `{ data: { isManualOpen } }`
- [x] Importar `ToggleStoreStatusDto` en el controller

**Criterio de done:** `PATCH /stores/me/status` con `{ "isManualOpen": true }` → 200. Sin JWT → 401. Tenant A no puede afectar a tenant B (garantizado por `@TenantId()` del JWT).

---

### B8.6 — Verificación final

- [x] `npm run typecheck` sin errores en `api/`
- [ ] Flujo completo:
  1. `PATCH /stores/me/status` con `{ "isManualOpen": false }` → tienda cerrada
  2. `GET /stores/:slug/status` → `{ isOpen: false, source: 'manual' }`
  3. `PATCH /stores/me/status` con `{ "isManualOpen": null }` → vuelve al horario
  4. `GET /stores/:slug/status` → `{ isOpen: ..., source: 'schedule' }`

**Criterio de done:** Los cuatro pasos responden correctamente.
