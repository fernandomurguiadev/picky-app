# Tasks: Gestión de Inventario por Movimientos

## Phase 1: Database & Entidad

- [ ] 1.1 Crear `api/src/modules/inventory/entities/stock-movement.entity.ts` con enum `StockMovementType` y relaciones a `Product` y `Order`.
- [ ] 1.2 Agregar `stockQuantity: number | null` a `api/src/modules/catalog/entities/product.entity.ts` (nullable, default null).
- [ ] 1.3 Ejecutar `npm run migration:generate -- --name=AddInventoryStockLedger` y revisar la migración generada.
- [ ] 1.4 Crear manualmente `api/src/migrations/XXXXXX-stock-movements-rls.ts` con políticas RLS para `stock_movements` (patrón idéntico al de `EnableTenantRls`).

## Phase 2: Backend — InventoryModule

- [ ] 2.1 Crear `api/src/modules/inventory/dto/create-movement.dto.ts` con validación de tipos permitidos (`purchase_in | adjustment | waste`).
- [ ] 2.2 Crear `api/src/modules/inventory/inventory.service.ts` con métodos:
  - `decrementStock(tenantId, productId, qty, orderId, runner)` — UPDATE atómico + INSERT movement
  - `restoreStock(tenantId, productId, qty, orderId, runner)` — verificar stockQuantity !== null + restore + movement
  - `createAdminMovement(tenantId, productId, dto, createdBy, runner)` — para endpoints admin
  - `getStockProducts(tenantId)` — products con stockQuantity !== null
  - `getMovements(tenantId, productId, page, limit)` — historial paginado
- [ ] 2.3 Crear `api/src/modules/inventory/inventory.controller.ts` con endpoints:
  - `GET /admin/inventory/products`
  - `GET /admin/inventory/products/:id/movements`
  - `POST /admin/inventory/products/:id/movements`
- [ ] 2.4 Crear `api/src/modules/inventory/inventory.module.ts`. Exportar `InventoryService`. Importar `TypeOrmModule.forFeature([StockMovement, Product])`.
- [ ] 2.5 Registrar `InventoryModule` en `api/src/app.module.ts`.

## Phase 3: Backend — Integración con Catálogo

- [ ] 3.1 Agregar `stockQuantity?: number | null` con validadores en `api/src/modules/catalog/dto/create-product.dto.ts` y `update-product.dto.ts`.
- [ ] 3.2 Incluir `stockQuantity` en los dos branches de `createProduct` en `catalog.service.ts`. Derivar `inStock` de `stockQuantity` cuando está presente.
- [ ] 3.3 En `updateProduct` de `catalog.service.ts`, derivar `inStock` de `stockQuantity` cuando se actualiza.
- [ ] 3.4 En `catalog.service.ts — updateProductStock()`, retornar `ConflictException` si `product.stockQuantity !== null`.
- [ ] 3.5 Actualizar el controlador `products.controller.ts` para reflejar el 409 (si se maneja en controller en lugar del service).

## Phase 4: Backend — Integración con Órdenes

- [ ] 4.1 En `api/src/modules/orders/orders.module.ts`, importar `InventoryModule` e inyectar `InventoryService` en `OrdersService`.
- [ ] 4.2 En `OrdersService.createOrder()`:
  - Construir `stockProductsMap` durante la validación de items (productos con `stockQuantity !== null`).
  - Validar que `stockQuantity >= item.quantity` → 422 si no.
  - Dentro de la transacción, después de `save(OrderItems)`, llamar `inventoryService.decrementStock()` por cada item del map.
- [ ] 4.3 En `OrdersService.updateOrderStatus()`:
  - Si `dto.status === CANCELLED`, cargar `OrderItem[]` de la orden.
  - Por cada item, llamar `inventoryService.restoreStock()` dentro del `queryRunner` existente.

## Phase 5: Frontend — Tipos y Hooks

- [ ] 5.1 Agregar `stockQuantity: number | null` a la interfaz `Product` y `ProductFormData` en `app/src/lib/types/catalog.ts`.
- [ ] 5.2 Crear `app/src/lib/hooks/admin/use-inventory.ts` con:
  - `useStockProducts()` — GET /admin/inventory/products
  - `useProductMovements(productId)` — GET /admin/inventory/products/:id/movements
  - `useCreateMovement()` — POST /admin/inventory/products/:id/movements

## Phase 6: Frontend — Admin UI

- [ ] 6.1 Agregar "Inventario" a `navItems` en `app/src/components/admin/sidebar/index.tsx` (icono `Warehouse` o `BoxesIcon` de lucide-react).
- [ ] 6.2 Agregar "Inventario" a `navItems` en `app/src/components/admin/mobile-nav/index.tsx`.
- [ ] 6.3 Crear página `app/src/app/(admin)/admin/inventory/page.tsx`:
  - Tabla de productos con control de cantidad (nombre, stock actual, estado).
  - Modal o panel lateral para registrar movimiento (`purchase_in | adjustment | waste`).
  - Historial de movimientos por producto (expandible).
- [ ] 6.4 En `app/src/components/admin/product-form/index.tsx`, agregar sección "Control de stock":
  - Toggle "Controlar por cantidad".
  - Input numérico para `stockQuantity` cuando está activado.
  - Ocultar switch `inStock` cuando `stockQuantity !== null` (es derivado).
- [ ] 6.5 En `app/src/app/(admin)/admin/catalog/products/page.tsx`, reemplazar el switch "Stock" por un badge de cantidad (`{n} uds`) cuando `product.stockQuantity !== null`.

## Phase 7: Verificación

- [ ] 7.1 Crear orden con producto con stock → verificar decremento y movimiento `sale_out`.
- [ ] 7.2 Cancelar la orden → verificar restauración y movimiento `cancellation_return`.
- [ ] 7.3 Dos requests concurrentes de la última unidad → uno 200, otro 422.
- [ ] 7.4 `PATCH /admin/products/:id/stock` en producto con stockQuantity → verificar 409.
- [ ] 7.5 Producto con `stockQuantity = null` → comportamiento toggle manual sin cambios.
- [ ] 7.6 RLS: query de tenant A no retorna movimientos de tenant B.
