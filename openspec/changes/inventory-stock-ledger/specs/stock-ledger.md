# Spec: Gestión de Inventario por Movimientos

## Capability: inventory-stock-ledger

### Requirement: Activación de control por cantidad
El admin DEBE poder activar el control cuantitativo por producto desde el formulario de edición.

#### Scenario: Activar control de stock en un producto existente
- GIVEN un producto con `stockQuantity = null` (modo toggle manual)
- WHEN el admin activa "Control por cantidad" e ingresa `50` como stock inicial
- THEN el producto DEBE quedar con `stockQuantity = 50` e `inStock = true`
- AND el campo `inStock` NO DEBE ser editable manualmente mientras `stockQuantity !== null`

#### Scenario: Desactivar control de stock vuelve al modo toggle
- GIVEN un producto con `stockQuantity = 20`
- WHEN el admin desactiva "Control por cantidad" en el formulario
- THEN el producto DEBE quedar con `stockQuantity = null`
- AND el switch `inStock` DEBE volver a ser editable manualmente

---

## Capability: auto-stock-depletion

### Requirement: Decremento automático al crear orden
Al procesar una orden, el stock de los productos con control cuantitativo DEBE decrementarse atómicamente.

#### Scenario: Orden con stock suficiente
- GIVEN un producto con `stockQuantity = 5` e `inStock = true`
- WHEN se crea una orden con ese producto `quantity: 2`
- THEN `stockQuantity` DEBE ser `3`
- AND DEBE existir un movimiento `sale_out` con `quantity = 2` y `orderId` de la orden

#### Scenario: Orden que agota el stock exactamente
- GIVEN un producto con `stockQuantity = 3`
- WHEN se crea una orden con ese producto `quantity: 3`
- THEN `stockQuantity` DEBE ser `0`
- AND `inStock` DEBE ser `false`
- AND DEBE existir un movimiento `sale_out` con `quantity = 3`

#### Scenario: Orden con stock insuficiente
- GIVEN un producto con `stockQuantity = 2`
- WHEN se intenta crear una orden con ese producto `quantity: 5`
- THEN la API DEBE retornar `422 Unprocessable Entity`
- AND `stockQuantity` NO DEBE modificarse
- AND NO DEBE crearse ningún movimiento

#### Scenario: Race condition — dos órdenes simultáneas del último ítem
- GIVEN un producto con `stockQuantity = 1`
- WHEN dos requests concurrentes intentan crear una orden de 1 unidad
- THEN exactamente una orden DEBE procesarse exitosamente
- AND la otra DEBE recibir `422`
- AND `stockQuantity` final DEBE ser `0`

#### Scenario: Producto en modo toggle manual no afecta stock
- GIVEN un producto con `stockQuantity = null` e `inStock = true`
- WHEN se crea una orden con ese producto
- THEN la orden DEBE procesarse normalmente
- AND `stockQuantity` DEBE seguir siendo `null`
- AND NO DEBE crearse ningún movimiento de stock

---

## Capability: auto-stock-restoration

### Requirement: Restauración al cancelar orden
Al cancelar una orden, el stock de los productos con control cuantitativo DEBE restaurarse.

#### Scenario: Cancelar orden restaura el stock
- GIVEN una orden con `status: CONFIRMED` que decrementó 3 unidades de un producto
- WHEN el admin cancela la orden (`PATCH /admin/orders/:id/status { status: 'cancelled' }`)
- THEN `stockQuantity` DEBE incrementarse en 3
- AND DEBE existir un movimiento `cancellation_return` con `quantity = 3` y `orderId` de la orden
- AND si `stockQuantity` post-restauración > 0, `inStock` DEBE ser `true`

#### Scenario: Cancelar orden de producto en modo manual no afecta stock
- GIVEN una orden con un producto `stockQuantity = null`
- WHEN el admin cancela la orden
- THEN `stockQuantity` DEBE seguir siendo `null`
- AND NO DEBE crearse ningún movimiento

#### Scenario: Doble cancelación no duplica restauración
- GIVEN una orden ya en estado `CANCELLED`
- WHEN se intenta cancelar nuevamente
- THEN la API DEBE retornar error de transición inválida
- AND `stockQuantity` NO DEBE modificarse

---

## Capability: stock-replenishment

### Requirement: Entrada manual de stock
El admin DEBE poder registrar entradas de stock desde `/admin/inventory`.

#### Scenario: Registrar compra de mercadería
- GIVEN un producto con `stockQuantity = 5`
- WHEN el admin registra un movimiento `{ type: 'purchase_in', quantity: 10, notes: 'Proveedor X' }`
- THEN `stockQuantity` DEBE ser `15`
- AND `inStock` DEBE ser `true`
- AND DEBE existir un movimiento con `createdBy = adminUserId` y `orderId = null`

#### Scenario: Registrar pérdida o merma
- GIVEN un producto con `stockQuantity = 10`
- WHEN el admin registra `{ type: 'waste', quantity: 3, notes: 'Vencimiento' }`
- THEN `stockQuantity` DEBE ser `7`
- AND si `stockQuantity` llega a `0`, `inStock` DEBE ser `false`

#### Scenario: Tipos automáticos no aceptados en endpoint manual
- WHEN el admin intenta enviar `{ type: 'sale_out', quantity: 1 }`
- THEN la API DEBE retornar `400 Bad Request`
- AND el tipo `cancellation_return` también DEBE rechazarse

---

## Capability: product-stock-toggle (modificada)

### Requirement: Toggle manual bloqueado en modo cantidad
El endpoint `PATCH /admin/products/:id/stock` DEBE rechazar peticiones cuando el producto usa control cuantitativo.

#### Scenario: Toggle manual en producto con stockQuantity activo
- GIVEN un producto con `stockQuantity = 5`
- WHEN se llama `PATCH /admin/products/:id/stock { inStock: false }`
- THEN la API DEBE retornar `409 Conflict` con mensaje descriptivo

#### Scenario: Toggle manual en producto sin stockQuantity funciona normalmente
- GIVEN un producto con `stockQuantity = null`
- WHEN se llama `PATCH /admin/products/:id/stock { inStock: false }`
- THEN `inStock` DEBE ser `false`

---

## Capability: storefront-out-of-stock-display (sin cambios)

El comportamiento de `inStock` en el storefront no cambia. Cuando el sistema lleva stock cuantitativo y llega a 0, `inStock` se apaga automáticamente y la tienda muestra el badge "Sin stock" por la lógica ya implementada.

---

## RLS / Multi-tenancy

#### Scenario: Tenant A no puede ver movimientos de Tenant B
- GIVEN dos tenants con productos propios
- WHEN un request autenticado como Tenant A consulta `/admin/inventory/products`
- THEN SOLO DEBE ver productos de Tenant A
- AND la política RLS de `stock_movements` DEBE impedir SELECT/INSERT/UPDATE de otro tenant
