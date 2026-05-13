# Proposal — api-fase-5-ordenes

## Resumen

Módulo REST completo para gestión de pedidos. Incluye el endpoint público de creación
(tienda pública → backend), los endpoints admin de consulta y gestión, y la emisión de
eventos WebSocket para notificaciones en tiempo real (gateway definido en FASE 6).

## Motivación

El flujo de pedidos es el núcleo del negocio. Sin él la plataforma no genera valor.
Las entidades `Order` y `OrderItem` ya existen desde FASE 1; esta fase implementa
toda la lógica de negocio, DTOs, controladores y módulo.

## Alcance

### Backend (`api/`)

- `modules/orders/dto/` — DTOs para creación pública, creación admin, query, status, notas
- `modules/orders/errors/` — códigos y fábrica de errores tipados
- `modules/orders/orders.service.ts` — lógica de negocio
- `modules/orders/orders.controller.ts` — rutas públicas + admin
- `modules/orders/orders.module.ts` — módulo NestJS con imports

### No incluido

- Envío de email/WhatsApp de confirmación (mejora futura)
- Pago online (mejora futura)

## Rutas

### Pública (sin auth)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/orders` | Crear pedido desde tienda pública |

### Admin (requieren JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/orders` | Listado con filtros (status, fecha) y paginación |
| GET | `/admin/orders/:id` | Detalle con items y opciones |
| PATCH | `/admin/orders/:id/status` | Cambiar estado (transiciones válidas) |
| POST | `/admin/orders` | Crear pedido manual desde admin |
| PATCH | `/admin/orders/:id/notes` | Actualizar notas internas |

## Reglas de negocio clave

1. **`orderNumber`**: formato `ORD-YYYYMMDD-XXXX` (XXXX = 4 dígitos aleatorios, padded). Único por tenant.
2. **Monto mínimo delivery**: si `StoreSettings.deliveryMinOrder > 0` y `deliveryMethod === DELIVERY`, `subtotal >= deliveryMinOrder`.
3. **Métodos habilitados**: validar que `deliveryMethod` y `paymentMethod` estén habilitados en `StoreSettings` del tenant.
4. **Transiciones de estado válidas**:
   - `PENDING → CONFIRMED | CANCELLED`
   - `CONFIRMED → PREPARING | CANCELLED`
   - `PREPARING → READY | CANCELLED`
   - `READY → DELIVERED | CANCELLED`
   - `DELIVERED`, `CANCELLED` → terminales (sin transición)
5. **`statusHistory`**: cada cambio de estado agrega entrada en el array JSONB `{ status, changedAt, note? }`.
6. **RLS**: admin solo ve órdenes de su `tenantId` (del JWT).
7. **Post-creación**: emitir evento `order:new` al gateway (si está disponible — inyección opcional).

## Criterios de aceptación

- `POST /orders` sin auth crea pedido con status `PENDING` y retorna el pedido completo
- Delivery con subtotal < mínimo retorna 422 con mensaje claro
- Método de pago deshabilitado en la tienda retorna 422
- `PATCH /admin/orders/:id/status` con transición inválida retorna 422
- Admin no puede ver órdenes de otro tenant (403)
