# Proposal — api-fase-3-tenants

## Resumen

Módulo Tenants completo: endpoints públicos de tienda, cálculo de estado abierto/cerrado y
configuración autenticada (GET + PATCH). Implementa el contrato del middleware frontend que
resuelve `tenantId` desde `slug`.

## Motivación

El frontend (storefront público y panel admin) necesita:
1. Resolver `tenantId` desde el `slug` del subdominio/path.
2. Mostrar datos públicos del comercio (nombre, logo, tema, horarios).
3. Calcular si la tienda está abierta en tiempo real.
4. Permitir al admin configurar toda la tienda (info, horarios, entrega, pagos, tema).

Sin estos endpoints el storefront no puede inicializar y el panel de configuración queda inoperativo.

## Alcance

### Backend (`api/`)

**Nuevos archivos:**
- `modules/tenants/tenants.service.ts` — lógica de negocio
- `modules/tenants/tenants.controller.ts` — rutas
- `modules/tenants/dto/update-store-settings.dto.ts` — DTO de actualización
- `modules/tenants/dto/day-schedule.dto.ts` — DTO + validación custom `DaySchedule`

**Archivos modificados:**
- `modules/tenants/tenants.module.ts` — agregar Service + Controller
- `app.module.ts` — ya importa TenantsModule (sin cambios necesarios)

## Rutas

### Públicas (sin auth)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/stores/:slug/tenant-id` | Respuesta mínima `{ tenantId }`. Usado por middleware de resolución. Response < 50ms, sin joins. |
| GET | `/stores/:slug` | Datos públicos: nombre, descripción, logo, tema, horarios, métodos de entrega/pago. |
| GET | `/stores/:slug/status` | Estado abierto/cerrado calculado con timezone del tenant. Retorna `{ isOpen, nextChange? }`. |

### Admin (requieren JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/stores/me/settings` | Configuración completa del tenant autenticado. |
| PATCH | `/stores/me` | Actualización parcial de cualquier sección. |

## Contratos de respuesta

### `GET /stores/:slug`
```json
{
  "data": {
    "name": "Mi Panadería",
    "description": "...",
    "logoUrl": "https://...",
    "primaryColor": "#e63946",
    "accentColor": "#457b9d",
    "schedule": [...],
    "timezone": "America/Argentina/Buenos_Aires",
    "delivery": {
      "deliveryEnabled": true,
      "deliveryCost": 50000,
      "deliveryMinOrder": 200000
    },
    "takeaway": {
      "takeawayEnabled": true
    },
    "payments": {
      "cashEnabled": true,
      "transferEnabled": true,
      "transferAlias": "mipanaderia.mp",
      "cardEnabled": false
    }
  }
}
```

### `GET /stores/:slug/status`
```json
{
  "data": {
    "isOpen": true,
    "nextChange": "21:00"
  }
}
```

### `GET /stores/me/settings`
Retorna `StoreSettings` completo del tenant autenticado.

### `PATCH /stores/me`
Body: `UpdateStoreSettingsDto` — todos los campos opcionales.
Retorna `StoreSettings` actualizado.

## Schema DaySchedule (existente en `schedule.interface.ts`)

```typescript
interface Shift {
  open: string;  // "HH:mm"
  close: string; // "HH:mm"
}

interface DaySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  shifts: Shift[]; // max 2 por día
}
```

**Validaciones en `DayScheduleDto`:**
- `shifts.length <= 2`
- Formato HH:mm (`/^([01]\d|2[0-3]):[0-5]\d$/`)
- `open < close` en cada turno
- Sin overlaps entre turnos del mismo día

## Cálculo de estado abierto/cerrado

```typescript
// Algoritmo (sin dependencias externas):
// 1. Obtener hora actual en timezone del tenant (usando Intl.DateTimeFormat)
// 2. Resolver DaySchedule del día actual (por nombre del día en inglés)
// 3. Si !isOpen → return { isOpen: false, nextChange: próxima apertura }
// 4. Iterar shifts: si currentTime entre open y close → return { isOpen: true, nextChange: shift.close }
// 5. Si ningún turno → { isOpen: false }
```

> **Sin dependencias externas** (no `date-fns-tz`): usar `Intl.DateTimeFormat` nativo de Node.js 18+.

## Criterios de aceptación

- `GET /stores/:slug/tenant-id` responde aunque `StoreSettings` no exista para el tenant.
- `GET /stores/:slug` retorna 404 si el slug no existe o `isActive: false`.
- `PATCH /stores/me` crea `StoreSettings` si no existe (upsert).
- `DayScheduleDto` rechaza con 400 si turnos se solapan o formato HH:mm inválido.
- `npm run typecheck` → 0 errores.
- No se requiere nueva migración (entidades ya existen desde FASE 1).
