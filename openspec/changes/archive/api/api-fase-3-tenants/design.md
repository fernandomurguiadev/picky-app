# Design — api-fase-3-tenants

## Estructura de archivos resultante

```
api/
└── src/
    └── modules/
        └── tenants/
            ├── dto/
            │   ├── day-schedule.dto.ts          ← NUEVO
            │   └── update-store-settings.dto.ts ← NUEVO
            ├── tenants.service.ts               ← NUEVO
            ├── tenants.controller.ts            ← NUEVO
            └── tenants.module.ts                ← MODIFICADO
```

---

## DTOs

### `day-schedule.dto.ts`

```typescript
class ShiftDto {
  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) open: string;
  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) close: string;
}

class DayScheduleDto {
  @IsIn(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'])
  day: string;
  @IsBoolean() isOpen: boolean;
  @IsArray() @ArrayMaxSize(2) @ValidateNested({ each: true }) @Type(() => ShiftDto)
  shifts: ShiftDto[];
}
```

**Validador custom `@ValidShifts()`** (a nivel de clase `DayScheduleDto`):
- Si `isOpen: false` → `shifts` debe ser array vacío.
- Cada shift: `open < close` (string HH:mm compara lexicográficamente).
- Sin overlaps: `shift[n].close <= shift[n+1].open`.

### `update-store-settings.dto.ts`

Todos los campos opcionales, mapeados directamente a `StoreSettings`:

```typescript
class UpdateStoreSettingsDto {
  // Info
  description?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  // Horarios
  schedule?: DayScheduleDto[];   // @ValidateNested({ each: true })
  timezone?: string;             // @IsTimeZone() de class-validator
  // Tema
  primaryColor?: string;         // @Matches(/^#[0-9A-Fa-f]{6}$/)
  accentColor?: string;          // @Matches(/^#[0-9A-Fa-f]{6}$/)
  // Entrega
  deliveryEnabled?: boolean;
  deliveryCost?: number;         // @IsInt() @Min(0)
  deliveryMinOrder?: number;     // @IsInt() @Min(0)
  takeawayEnabled?: boolean;
  inStoreEnabled?: boolean;
  // Pagos
  cashEnabled?: boolean;
  transferEnabled?: boolean;
  transferAlias?: string | null;
  cardEnabled?: boolean;
}
```

---

## TenantsService — métodos

| Método | Visibilidad | Descripción |
|--------|------------|-------------|
| `getTenantId(slug)` | public | Find tenant.id por slug (solo `id`). 404 si no existe. |
| `getPublicStore(slug)` | public | Tenant + StoreSettings join. 404 si inactivo. |
| `getStoreStatus(slug)` | public | Calcular abierto/cerrado con Intl.DateTimeFormat. |
| `getMySettings(tenantId)` | public | StoreSettings completo del tenant autenticado. |
| `updateMySettings(tenantId, dto)` | public | Upsert StoreSettings (crea si no existe). |

### Algoritmo `getStoreStatus`

```typescript
// Sin dependencias externas — usa Intl.DateTimeFormat
function getCurrentTimeInTz(timezone: string): { day: string; time: string } {
  const now = new Date();
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: timezone })
    .format(now).toLowerCase();
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone
  }).format(now); // "HH:mm"
  return { day: dayName, time };
}
```

Respuesta: `{ isOpen: boolean, nextChange: string | null }` donde `nextChange` es el
próximo cierre (si abierto) o próxima apertura del mismo día (si cerrado con turno pendiente).

### `updateMySettings` — upsert

```typescript
// Busca StoreSettings del tenantId
// Si no existe: crea nuevo con { tenantId, ...dto }
// Si existe: Object.assign(settings, dto) → save
// Retorna StoreSettings actualizado
```

---

## TenantsController

### Rutas públicas — `@Controller('stores')`

| Decorador | Ruta completa | Descripción |
|-----------|--------------|-------------|
| `@Get(':slug/tenant-id')` | `GET /stores/:slug/tenant-id` | `{ tenantId }` — sin joins |
| `@Get(':slug/status')` | `GET /stores/:slug/status` | `{ isOpen, nextChange }` |
| `@Get(':slug')` | `GET /stores/:slug` | Datos públicos del comercio |

> ⚠️ El orden importa: `:slug/tenant-id` y `:slug/status` deben declararse **antes** de `:slug`.

### Rutas admin — mismo `@Controller('stores')` + `@UseGuards(JwtAuthGuard)`

| Decorador | Ruta completa | Descripción |
|-----------|--------------|-------------|
| `@Get('me/settings')` | `GET /stores/me/settings` | Configuración completa (JWT) |
| `@Patch('me')` | `PATCH /stores/me` | Actualización parcial — retorna settings actualizado |

> ⚠️ `me/settings` y `me` deben declararse **antes** de `:slug` para evitar colisión de rutas.

---

## TenantsModule actualizado

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Tenant, StoreSettings])],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TypeOrmModule, TenantsService],
})
export class TenantsModule {}
```
