# Tasks — api-fase-3-tenants

## Fase de implementación: FASE 3 — Módulo Tenants / Configuración de Tienda

---

## DTOs

### B3-DTO.1 — `DayScheduleDto` con validación custom

- [x] Crear `api/src/modules/tenants/dto/day-schedule.dto.ts`
- [x] `ShiftDto`: `open` y `close` con `@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)`
- [x] `DayScheduleDto`: `day` (`@IsIn(['monday',...'sunday'])`), `isOpen` (`@IsBoolean()`), `shifts` (`@ArrayMaxSize(2)`, `@ValidateNested({ each: true })`)
- [x] Decorador custom `@ValidShifts()` a nivel de clase: valida `open < close`, sin overlaps, `shifts` vacío si `isOpen: false`

**Criterio de done:** DTO rechaza con 400 si horario malformado o turnos se solapan.

---

### B3-DTO.2 — `UpdateStoreSettingsDto`

- [x] Crear `api/src/modules/tenants/dto/update-store-settings.dto.ts`
- [x] Todos los campos opcionales con decoradores correspondientes:
  - `description`, `logoUrl`, `phone`, `whatsapp`, `address`: `@IsOptional() @IsString()`
  - `schedule`: `@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DayScheduleDto)`
  - `timezone`: `@IsOptional() @IsString()`
  - `primaryColor`, `accentColor`: `@IsOptional() @Matches(/^#[0-9A-Fa-f]{6}$/)`
  - `deliveryCost`, `deliveryMinOrder`: `@IsOptional() @IsInt() @Min(0)`
  - booleanos: `@IsOptional() @IsBoolean()`
  - `transferAlias`: `@IsOptional() @IsString()`

**Criterio de done:** Campos de color validan formato hex. Montos son integer (centavos).

---

## TenantsService

### B3.1 — `getTenantId(slug)`

- [x] Buscar tenant por slug, seleccionar solo `{ id }` (sin joins)
- [x] Lanzar `CommonErrors.notFound('Store', slug)` si no existe

**Criterio de done:** Response < 50ms (sin StoreSettings join). Usado por middleware frontend.

---

### B3.2 — `getPublicStore(slug)`

- [x] Buscar tenant por slug + `leftJoinAndSelect` de `storeSettings`
- [x] 404 si no existe o `isActive: false`
- [x] Retornar objeto con: nombre, descripción, logo, tema, schedule, timezone, delivery, pagos

**Criterio de done:** Retorna `StoreSettings` embebido en respuesta pública.

---

### B3.3 — `getStoreStatus(slug)`

- [x] Resolver tenant + settings por slug
- [x] Calcular hora actual en timezone del tenant con `Intl.DateTimeFormat` (sin dependencias externas)
- [x] Determinar día de la semana en inglés lowercase (`'monday'`, etc.)
- [x] Buscar `DaySchedule` del día actual en `settings.schedule`
- [x] Si `!isOpen` o sin schedule → `{ isOpen: false, nextChange: null }`
- [x] Iterar shifts: si `currentTime >= open && currentTime <= close` → `{ isOpen: true, nextChange: shift.close }`
- [x] Si ningún turno activo → buscar próxima apertura del mismo día → `{ isOpen: false, nextChange: nextOpen | null }`

**Criterio de done:** Calcula correctamente con timezone `America/Argentina/Buenos_Aires`.

---

### B3.4 — `getMySettings(tenantId)`

- [x] Buscar `StoreSettings` por `tenantId`
- [x] Si no existe → retornar objeto vacío con defaults (o lanzar `CommonErrors.notFound`)

**Criterio de done:** Requiere JWT. Retorna configuración completa del tenant autenticado.

---

### B3.5 — `updateMySettings(tenantId, dto)`

- [x] Buscar `StoreSettings` por `tenantId`
- [x] Si no existe → crear nuevo: `this.settingsRepo.create({ tenantId, ...dto })`
- [x] Si existe → `Object.assign(settings, dto)`
- [x] `save()` y retornar resultado

**Criterio de done:** Upsert funcional. Actualización parcial (solo campos enviados).

---

## TenantsController

### B3.6 — Rutas públicas + admin

- [x] Crear `api/src/modules/tenants/tenants.controller.ts` con `@Controller('stores')`
- [x] Declarar rutas en orden correcto (rutas fijas antes que parámetros):
  1. `@Get('me/settings')` + `@UseGuards(JwtAuthGuard)` → `getMySettings(tenantId)`
  2. `@Patch('me')` + `@UseGuards(JwtAuthGuard)` → `updateMySettings(tenantId, dto)`
  3. `@Get(':slug/tenant-id')` → `{ tenantId: result.id }`
  4. `@Get(':slug/status')` → `getStoreStatus(slug)`
  5. `@Get(':slug')` → `getPublicStore(slug)`

**Criterio de done:** `GET /stores/me/settings` no colisiona con `GET /stores/:slug`.

---

## Módulo

### B3.7 — `TenantsModule` actualizado

- [x] Agregar `TenantsService` a `providers`
- [x] Agregar `TenantsController` a `controllers`
- [x] Agregar `TenantsService` a `exports`

---

## Verificación

### B3.8 — Typecheck

- [x] Ejecutar `npm run typecheck` en `api/` → 0 errores

### B3.9 — Migración

- [x] Verificar que no hay cambios de schema pendientes (`StoreSettings` ya existe)
