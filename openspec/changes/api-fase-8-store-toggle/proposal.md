# Proposal — api-fase-8-store-toggle

## Resumen

Toggle manual de apertura/cierre de tienda. El administrador puede forzar
el estado de su comercio (abierto o cerrado) sobreescribiendo el horario
configurado, con un solo `PATCH /stores/me/status`. El endpoint público
`GET /stores/:slug/status` ya existente considera el override antes de
calcular el estado por horario.

## Motivación

El admin spec (CA-004) exige un toggle visible en el dashboard que
sobreescriba los horarios configurados. Sin esta lógica el comerciante
no puede cerrar la tienda ante imprevistos (falta de insumos, cierre
temporal) ni abrirla fuera del horario habitual. Es un campo trivial pero
bloquea la UX del panel principal.

## Alcance

### Backend (`api/`)

**Entidad modificada:**
- `modules/tenants/entities/store-settings.entity.ts` — nueva columna `isManualOpen: boolean | null`

**Nuevos archivos:**
- `modules/tenants/dto/toggle-store-status.dto.ts` — DTO del PATCH

**Archivos modificados:**
- `modules/tenants/tenants.service.ts` — nuevo método `toggleStoreStatus`, lógica en `getStoreStatus`
- `modules/tenants/tenants.controller.ts` — nuevo endpoint `PATCH /stores/me/status`

**Migración:**
- Nueva migración para agregar columna `is_manual_open` a `store_settings`

### No incluido

- Expiración automática del override (ej. "cerrar hasta las 20 hs") — mejora futura
- Historial de cambios de estado — mejora futura

## Rutas

### Admin (requiere JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| PATCH | `/stores/me/status` | Establece `isManualOpen`. `null` = volver al horario. |

### Pública (sin auth) — modificada

| Método | Ruta | Cambio |
|--------|------|--------|
| GET | `/stores/:slug/status` | Ahora considera `isManualOpen` antes de calcular por horario |

## Contrato PATCH `/stores/me/status`

**Body:**
```json
{ "isManualOpen": true }   // forzar apertura
{ "isManualOpen": false }  // forzar cierre
{ "isManualOpen": null }   // volver al horario configurado
```

**Respuesta:**
```json
{ "data": { "isManualOpen": true } }
```

## Lógica de `getStoreStatus`

```
si isManualOpen === true  → { isOpen: true,  source: 'manual' }
si isManualOpen === false → { isOpen: false, source: 'manual' }
si isManualOpen === null  → calcular por DaySchedule (lógica existente)
```

## Criterios de aceptación

- `PATCH /stores/me/status` sin JWT → 401
- `PATCH /stores/me/status` con `{ isManualOpen: true }` → `GET /stores/:slug/status` retorna `{ isOpen: true, source: 'manual' }`
- `PATCH /stores/me/status` con `{ isManualOpen: null }` → comportamiento vuelve al horario configurado
- Tenant A no puede modificar el estado de tenant B
