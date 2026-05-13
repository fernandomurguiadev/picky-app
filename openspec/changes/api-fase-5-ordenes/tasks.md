# Tasks — api-fase-5-ordenes

## Fase de implementación: FASE 5 — Módulo Órdenes

---

### B5.0 — Errores del dominio

- [ ] Crear `api/src/modules/orders/errors/orders.error-codes.ts` con constantes:
  `ORDER_NOT_FOUND`, `ORDER_FORBIDDEN`, `INVALID_STATUS_TRANSITION`, `DELIVERY_NOT_ENABLED`, `PAYMENT_METHOD_NOT_ENABLED`, `BELOW_MINIMUM_ORDER`, `TENANT_SETTINGS_NOT_FOUND`
- [ ] Crear `api/src/modules/orders/errors/orders.errors.ts` con fábrica `OrderErrors`:
  - `notFound(id)` → 404
  - `forbidden(id)` → 403
  - `invalidTransition(from, to)` → 422
  - `deliveryNotEnabled()` → 422
  - `paymentNotEnabled(method)` → 422
  - `belowMinimumOrder(min, actual)` → 422
  - `settingsNotFound(tenantId)` → 404

**Criterio de done:** `OrderErrors.notFound(id)` retorna `ErrorDefinition` tipado con statusCode 404.

---

### B5.1 — DTOs

- [ ] Crear `api/src/modules/orders/dto/selected-option.dto.ts` con `groupId`, `groupName`, `itemId`, `itemName`, `priceModifier` (integer)
- [ ] Crear `api/src/modules/orders/dto/create-order-item.dto.ts` con `productId`, `productName`, `unitPrice`, `quantity`, `selectedOptions`, `itemNote?`
- [ ] Crear `api/src/modules/orders/dto/customer-info.dto.ts` con `name`, `phone?`, `address?`
- [ ] Crear `api/src/modules/orders/dto/create-order.dto.ts` con `tenantId`, `deliveryMethod`, `paymentMethod`, `customer`, `items[]`, `notes?`
- [ ] Crear `api/src/modules/orders/dto/create-order-admin.dto.ts` — igual a `CreateOrderDto` pero sin `tenantId` (viene del JWT)
- [ ] Crear `api/src/modules/orders/dto/update-order-status.dto.ts` con `status: OrderStatus`, `note?: string`
- [ ] Crear `api/src/modules/orders/dto/update-order-notes.dto.ts` con `internalNotes: string | null`
- [ ] Crear `api/src/modules/orders/dto/orders-query.dto.ts` con `status?`, `from?`, `to?`, `page?`, `limit?`

**Criterio de done:** DTOs usan `@Type(() => ...)` para `@ValidateNested`. Todos los montos son `@IsInt()`.

---

### B5.2 — `OrdersService`

- [ ] Crear `api/src/modules/orders/orders.service.ts`
- [ ] Inyectar: `@InjectRepository(Order)`, `@InjectRepository(OrderItem)`, `@InjectRepository(StoreSettings)`, `DataSource`
- [ ] Mapa de transiciones válidas `VALID_TRANSITIONS` como constante de módulo
- [ ] Método privado `generateOrderNumber(): string` → `ORD-YYYYMMDD-XXXX` (4 dígitos random)
- [ ] Método `createOrder(dto: CreateOrderDto)`:
  1. Cargar `StoreSettings` por `tenantId` → 404 si no existe
  2. Validar `deliveryMethod` habilitado (delivery/takeaway/inStore) → 422
  3. Validar `paymentMethod` habilitado (cash/transfer/card) → 422
  4. Calcular `subtotal` sumando `(unitPrice + sum(option.priceModifier)) * quantity` por item
  5. Validar monto mínimo para delivery → 422
  6. `deliveryCost = deliveryMethod === DELIVERY ? settings.deliveryCost : 0`
  7. `total = subtotal + deliveryCost`
  8. Persistir `Order` + `OrderItem[]` en transacción (QueryRunner)
  9. Retornar orden con items
- [ ] Método `getAdminOrders(tenantId, query)` → QueryBuilder con filtros, paginación `{ data, total }`
- [ ] Método `getAdminOrderById(tenantId, id)` → carga con `relations: ['items']`, verifica ownership
- [ ] Método `updateOrderStatus(tenantId, id, dto)`:
  1. Cargar orden, verificar ownership
  2. Verificar que `dto.status` está en `VALID_TRANSITIONS[current]` → 422 si no
  3. Actualizar `status`
  4. Push a `statusHistory`: `{ status: dto.status, changedAt: new Date().toISOString(), note: dto.note }`
  5. Guardar y retornar
- [ ] Método `createAdminOrder(tenantId, dto: CreateOrderAdminDto)` → llama `createOrder` inyectando `tenantId`
- [ ] Método `updateOrderNotes(tenantId, id, dto)` → verifica ownership, actualiza solo `internalNotes`

**Criterio de done:** Crear orden pública sin auth funciona. Transición inválida retorna 422 con código `INVALID_STATUS_TRANSITION`.

---

### B5.3 — `OrdersController`

- [ ] Crear `api/src/modules/orders/orders.controller.ts`
- [ ] Controlador público `StorefrontOrdersController`:
  - `@Controller('orders')`
  - `POST /orders` → `createOrder(dto: CreateOrderDto)` — sin guard
- [ ] Controlador admin `AdminOrdersController`:
  - `@Controller('admin/orders')`
  - `@UseGuards(JwtAuthGuard)` a nivel de clase
  - `GET /` con `@Query()` → `getAdminOrders(tenantId, query)`
  - `GET /:id` con `@Param('id', ParseUUIDPipe)` → `getAdminOrderById(tenantId, id)`
  - `POST /` → `createAdminOrder(tenantId, dto: CreateOrderAdminDto)`
  - `PATCH /:id/status` → `updateOrderStatus(tenantId, id, dto)`
  - `PATCH /:id/notes` → `updateOrderNotes(tenantId, id, dto)`

**Criterio de done:** `POST /orders` con body válido retorna orden con `orderNumber`. `PATCH /admin/orders/:id/status` con transición inválida retorna 422.

---

### B5.4 — `OrdersModule`

- [ ] Crear `api/src/modules/orders/orders.module.ts`
- [ ] `TypeOrmModule.forFeature([Order, OrderItem, StoreSettings])`
- [ ] Providers: `OrdersService`
- [ ] Controllers: `StorefrontOrdersController`, `AdminOrdersController`
- [ ] `exports: [OrdersService]` (para el gateway en FASE 6)

---

### B5.5 — Registrar en `AppModule`

- [ ] Importar `OrdersModule` en `api/src/app.module.ts`

**Criterio de done:** `npm run typecheck` sin errores. Rutas disponibles.
