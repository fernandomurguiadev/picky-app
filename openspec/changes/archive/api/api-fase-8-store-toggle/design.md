# Design — api-fase-8-store-toggle

## Estructura de cambios

```
api/
└── src/
    └── modules/
        └── tenants/
            ├── dto/
            │   └── toggle-store-status.dto.ts   ← NUEVO
            ├── entities/
            │   └── store-settings.entity.ts      ← MODIFICAR (nueva columna)
            ├── tenants.service.ts                ← MODIFICAR (nuevo método + lógica en getStoreStatus)
            └── tenants.controller.ts             ← MODIFICAR (nuevo endpoint)
└── migrations/
    └── <timestamp>-AddIsManualOpenToStoreSettings.ts  ← NUEVO (generar con CLI)
```

---

## Cambio en `store-settings.entity.ts`

```typescript
// Agregar antes de createdAt:
@Column({ type: 'boolean', nullable: true, default: null })
isManualOpen!: boolean | null;
```

---

## `toggle-store-status.dto.ts`

```typescript
import { IsBoolean, IsOptional } from 'class-validator';

export class ToggleStoreStatusDto {
  @IsBoolean()
  @IsOptional()    // permite enviar null explícito para resetear
  isManualOpen: boolean | null = null;
}
```

> **Nota**: se acepta `null` como valor explícito para volver al horario.
> Usar `@Transform(({ value }) => value === null ? null : Boolean(value))` si se necesita aceptar `null` via JSON.

---

## Cambios en `tenants.service.ts`

### Actualizar `StoreStatusResult`

```typescript
export interface StoreStatusResult {
  isOpen: boolean;
  nextChange: string | null;
  source: 'manual' | 'schedule';  // NUEVO campo
}
```

### Actualizar `getStoreStatus`

```typescript
async getStoreStatus(slug: string): Promise<StoreStatusResult> {
  const tenant = await this.tenantRepo.findOne({ where: { slug, isActive: true } });
  if (!tenant) throw toBusinessException(CommonErrors.notFound('Store', { slug }));

  const settings = await this.settingsRepo.findOne({
    where: { tenantId: tenant.id },
    select: { schedule: true, timezone: true, isManualOpen: true },  // AGREGAR isManualOpen
  });

  // Override manual tiene prioridad sobre el horario
  if (settings?.isManualOpen === true) {
    return { isOpen: true, nextChange: null, source: 'manual' };
  }
  if (settings?.isManualOpen === false) {
    return { isOpen: false, nextChange: null, source: 'manual' };
  }

  // isManualOpen === null → calcular por horario (comportamiento original)
  return {
    ...calcStoreStatus(
      settings?.schedule ?? null,
      settings?.timezone ?? 'America/Argentina/Buenos_Aires',
    ),
    source: 'schedule',
  };
}
```

### Nuevo método `toggleStoreStatus`

```typescript
async toggleStoreStatus(
  tenantId: string,
  isManualOpen: boolean | null,
): Promise<{ isManualOpen: boolean | null }> {
  let settings = await this.settingsRepo.findOne({ where: { tenantId } });

  if (!settings) {
    settings = this.settingsRepo.create({ tenantId, isManualOpen });
  } else {
    settings.isManualOpen = isManualOpen;
  }

  await this.settingsRepo.save(settings);
  return { isManualOpen };
}
```

---

## Cambios en `tenants.controller.ts`

```typescript
// Agregar después de PATCH /stores/me:
@Patch('me/status')
@UseGuards(JwtAuthGuard)
async toggleStatus(
  @TenantId() tenantId: string,
  @Body() dto: ToggleStoreStatusDto,
): Promise<{ data: { isManualOpen: boolean | null } }> {
  const result = await this.tenantsService.toggleStoreStatus(tenantId, dto.isManualOpen);
  return { data: result };
}
```

---

## Migración

No crear manualmente. Ejecutar:

```bash
npm run migration:generate -- --name=AddIsManualOpenToStoreSettings
```

La migración resultante debe contener:

```sql
ALTER TABLE "store_settings" ADD COLUMN "is_manual_open" boolean DEFAULT NULL;
```

---

## Respuesta pública actualizada — `GET /stores/:slug/status`

```json
{
  "data": {
    "isOpen": true,
    "nextChange": null,
    "source": "manual"
  }
}
```

Cuando sigue el horario:
```json
{
  "data": {
    "isOpen": true,
    "nextChange": "20:30",
    "source": "schedule"
  }
}
```
