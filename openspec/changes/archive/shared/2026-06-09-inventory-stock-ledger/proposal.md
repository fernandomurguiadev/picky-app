# Proposal: Gestión de Inventario por Movimientos (Stock Ledger)

## Intent

Permitir a los merchants controlar el stock de sus productos de forma cuantitativa y trazable.
El stock no se ingresa como un número estático sino como el resultado de movimientos acumulados
(entradas por compra, salidas por venta, ajustes manuales). Cuando el stock calculado llega a 0,
el campo `inStock` se apaga automáticamente. Cuando se crea una orden, el stock se descuenta en
la misma transacción. Cuando una orden se cancela, el stock se restaura automáticamente con un
movimiento de tipo `cancellation_return`.

Complementa el toggle `inStock` existente: los productos con `stockQuantity = null` siguen
funcionando como antes (toggle manual, sin cambios).

## Scope

### In Scope

- Campo `stockQuantity: integer | null` en `products` como cache del stock actual (null = modo toggle manual, default null).
- Nueva entidad y tabla `stock_movements` con historial inmutable de todos los movimientos.
- Enum `StockMovementType`: `purchase_in | sale_out | adjustment | waste | cancellation_return`.
- Módulo NestJS `inventory/` con endpoints admin para listar y crear movimientos.
- Integración en `orders.service.ts — createOrder`: dentro de la transacción de creación de orden (estado PENDING), decrementar `stockQuantity` atómicamente y registrar movimiento `sale_out`. Si el stock es insuficiente → 422.
- Integración en `orders.service.ts — updateOrderStatus`: cuando una orden pasa a `CANCELLED`, restaurar `stockQuantity` con un movimiento `cancellation_return` para cada ítem, dentro de la transacción ya existente con `pessimistic_write`.
- RLS (Row Level Security) para `stock_movements`: políticas de PostgreSQL en migración dedicada, consistentes con el patrón existente en `EnableTenantRls`.
- Registro de `InventoryModule` en `app.module.ts`.
- `OrdersModule` importa `InventoryModule` para inyectar `InventoryService`.
- Sección de admin `/admin/inventory`: listado de productos con control por cantidad y formulario para registrar entradas.
- Vista de historial de movimientos por producto.
- Agregar "Inventario" a `AdminSidebar` (desktop) y `AdminMobileNav` (mobile) — ambos tienen `navItems` estáticos propios.
- Indicador de stock en la grilla de productos (badge de cantidad visible cuando `stockQuantity !== null`, oculta el switch de toggle manual en ese caso).
- Sección "Control de stock" en formulario de producto: toggle para activar, input numérico para cantidad inicial.
- Endpoint `PATCH /admin/products/:id/stock` existente debe retornar error 409 si el producto ya tiene `stockQuantity !== null` (inStock es derivado, no manual en ese modo).

### Out of Scope

- Múltiples almacenes / ubicaciones (single warehouse).
- Gestión de proveedores o purchase orders.
- Alertas automáticas de stock bajo.
- Gestión por lotes o números de serie.
- Stock por variante/opción de producto (solo por producto base).
- Visibilidad de cantidad al consumidor final en el storefront (solo se muestra `inStock`).
- Reserva de stock para órdenes en estado PENDING sin confirmación (no hay `reservedQuantity`).

## Decisión: ¿cuándo decrementar?

El stock se descuenta al **crear la orden** (estado PENDING), no al confirmarla. Razones:
- La validación de `inStock` ya ocurre en `createOrder`, es consistente hacerlo todo junto.
- Evita que múltiples órdenes paralelas se aprueben contra el mismo stock.

Trade-off: si la orden queda en PENDING indefinidamente y luego se cancela, el stock fue "retenido" ese tiempo. Mitigación: el movimiento `cancellation_return` lo restaura inmediatamente al cancelar.

## Capabilities

### New Capabilities

- `inventory-stock-ledger`: Registro histórico e inmutable de todos los movimientos de stock.
- `auto-stock-depletion`: Al crear una orden, el stock se descuenta y se apaga `inStock` si llega a 0.
- `auto-stock-restoration`: Al cancelar una orden, el stock se restaura con un movimiento `cancellation_return`.
- `stock-replenishment`: El admin puede registrar entradas de stock (compras, ajustes) desde `/admin/inventory`.

### Modified Capabilities

- `product-stock-toggle` (`PATCH /admin/products/:id/stock`): Retorna error 409 si el producto tiene `stockQuantity !== null`, porque `inStock` es derivado en ese modo.
- `admin-products-grid`: Reemplaza el switch "Stock" por un badge de cantidad cuando `stockQuantity !== null`.

## Approach

1. **Database Schema**: Nueva tabla `stock_movements` con tipo ENUM en TypeScript y varchar en DB. Campo `stockQuantity: integer | null` en `products`. Dos migraciones: schema + RLS.
2. **InventoryModule**: Entidad `StockMovement`, `InventoryService` con `createMovement()` y `getMovements()`. Exporta `InventoryService`.
3. **OrdersModule** importa `InventoryModule` para usar `InventoryService` en `createOrder` y `updateOrderStatus`.
4. **createOrder**: Dentro de la transacción existente (mismo `queryRunner`), después de guardar `OrderItem`, ejecutar para cada ítem con `stockQuantity !== null`:
   ```sql
   UPDATE products SET "stockQuantity" = "stockQuantity" - $qty,
     "inStock" = CASE WHEN "stockQuantity" - $qty <= 0 THEN false ELSE "inStock" END
   WHERE id = $productId AND "tenantId" = $tenantId AND "stockQuantity" >= $qty
   ```
   Si `0 rows updated` → rollback → 422. Luego insertar movimiento `sale_out` en la misma transacción.
5. **updateOrderStatus → CANCELLED**: Dentro de la transacción existente (ya usa `pessimistic_write`), para cada ítem de la orden que tenga `stockQuantity !== null`, insertar movimiento `cancellation_return` e incrementar `stockQuantity`. Si `inStock` estaba apagado y el nuevo valor > 0, reencenderlo.
6. **app.module.ts**: Registrar `InventoryModule`.
7. **Frontend**: Hook `use-inventory.ts`, página `/admin/inventory`, actualizar sidebar y mobile nav, actualizar grilla de productos y formulario.

## Database Schema

```sql
-- Campo nuevo en products (migración 1)
ALTER TABLE products ADD COLUMN "stockQuantity" integer NULL DEFAULT NULL;

-- Nueva tabla (migración 1)
CREATE TYPE stock_movement_type AS ENUM (
  'purchase_in', 'sale_out', 'adjustment', 'waste', 'cancellation_return'
);

CREATE TABLE stock_movements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"    uuid NOT NULL REFERENCES tenants(id),
  "productId"   uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  type          stock_movement_type NOT NULL,
  quantity      integer NOT NULL CHECK (quantity > 0),  -- siempre positivo; el tipo indica dirección
  notes         text,
  "orderId"     uuid REFERENCES orders(id) ON DELETE SET NULL,
  "createdBy"   uuid,  -- null para movimientos automáticos (sale_out, cancellation_return)
  "createdAt"   timestamp NOT NULL DEFAULT now()
);

CREATE INDEX ON stock_movements ("tenantId", "productId");
CREATE INDEX ON stock_movements ("orderId");

-- RLS (migración 2)
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements FORCE ROW LEVEL SECURITY;
CREATE POLICY sm_select ON stock_movements FOR SELECT USING (true);
CREATE POLICY sm_insert ON stock_movements FOR INSERT
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY sm_update ON stock_movements FOR UPDATE
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY sm_delete ON stock_movements FOR DELETE
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```

> **Convención de cantidad**: `quantity` siempre es un entero positivo. El tipo (`sale_out`, `purchase_in`, etc.) determina si es entrada o salida. El stock actual = `SUM(entrada) - SUM(salida)` sobre los movimientos — equivalente a sumar `stockQuantity` directamente del campo cache.

## API Contract

### GET /admin/inventory/products
Lista productos con `stockQuantity !== null` del tenant. Retorna `{ id, name, stockQuantity, inStock }[]`.

### GET /admin/inventory/products/:id/movements?page&limit
Historial paginado de movimientos de un producto.

### POST /admin/inventory/products/:id/movements
Registrar entrada o ajuste manual.
```json
{ "type": "purchase_in", "quantity": 10, "notes": "Compra proveedor X" }
```
Solo acepta `purchase_in | adjustment | waste`. `sale_out` y `cancellation_return` son exclusivos del sistema.
Actualiza `stockQuantity` y enciende `inStock` si `quantity > 0` post-movimiento.

## Module Dependency

```
AppModule
  ├── InventoryModule (exports InventoryService)
  └── OrdersModule (imports InventoryModule → inyecta InventoryService)
```

`InventoryModule` importa: `TypeOrmModule.forFeature([StockMovement, Product])`
`OrdersModule` importa: `InventoryModule` (además de lo existente)

No hay dependencia circular: `InventoryModule` no importa `OrdersModule`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/src/modules/inventory/` | Nuevo | Módulo completo: entidad `StockMovement`, `InventoryService`, `InventoryController`. |
| `api/src/modules/catalog/entities/product.entity.ts` | Modificado | Agregar `stockQuantity: number \| null` (nullable, default null). |
| `api/src/modules/catalog/dto/create-product.dto.ts` | Modificado | Aceptar `stockQuantity` opcional. |
| `api/src/modules/catalog/dto/update-product.dto.ts` | Modificado | Aceptar `stockQuantity` opcional. |
| `api/src/modules/catalog/products.controller.ts` | Modificado | `PATCH /:id/stock` retorna 409 si `stockQuantity !== null`. |
| `api/src/modules/orders/orders.service.ts` | Modificado | `createOrder`: decrementar stock + movimiento `sale_out`. `updateOrderStatus`: restaurar stock + movimiento `cancellation_return` al cancelar. |
| `api/src/modules/orders/orders.module.ts` | Modificado | Importar `InventoryModule`. |
| `api/src/app.module.ts` | Modificado | Registrar `InventoryModule`. |
| `api/src/migrations/XXXXXX-add-stock-quantity.ts` | Nuevo | Columna `stockQuantity` + tabla `stock_movements`. Generar con `npm run migration:generate`. |
| `api/src/migrations/XXXXXX-stock-movements-rls.ts` | Nuevo | Políticas RLS para `stock_movements`. Crear manualmente (no TypeORM autogenerable). |
| `app/src/lib/types/catalog.ts` | Modificado | Agregar `stockQuantity: number \| null` a `Product`. |
| `app/src/lib/hooks/admin/use-inventory.ts` | Nuevo | Hooks para listar productos con stock, movimientos y crear entradas. |
| `app/src/app/(admin)/admin/inventory/` | Nuevo | Página de gestión de inventario con tabla y formulario de entrada. |
| `app/src/components/admin/product-form/index.tsx` | Modificado | Sección "Control de stock": toggle + input de cantidad inicial. |
| `app/src/app/(admin)/admin/catalog/products/page.tsx` | Modificado | Badge de cantidad en lugar de switch Stock cuando `stockQuantity !== null`. |
| `app/src/components/admin/sidebar/index.tsx` | Modificado | Agregar "Inventario" a `navItems`. |
| `app/src/components/admin/mobile-nav/index.tsx` | Modificado | Agregar "Inventario" a `navItems` (tiene su propia lista estática, separada del sidebar). |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Race condition en stock | Media | `UPDATE ... WHERE stockQuantity >= qty` dentro de la transacción. Si 0 rows → 422, rollback automático. |
| Stock no restaurado al cancelar | Alta sin mitigation | `updateOrderStatus` restaura stock para cada ítem en la misma transacción (ya usa `pessimistic_write`). |
| Dependencia circular de módulos | Media | Diseño unidireccional: `OrdersModule → InventoryModule`, nunca al revés. |
| RLS no aplicado a `stock_movements` | Alta sin mitigation | Migración separada de RLS, obligatoria junto al schema. Patrón idéntico al de `EnableTenantRls`. |
| `PATCH /admin/products/:id/stock` en modo cantidad | Baja | Endpoint retorna 409 explicativo cuando `stockQuantity !== null`. |
| Órdenes admin (`createAdminOrder`) sin decremento | Ninguna | `createAdminOrder` delega a `createOrder`, aplica la misma lógica automáticamente. |
| Inconsistencia cache vs ledger | Baja | Toda escritura a `stockQuantity` pasa por `InventoryService.createMovement()` en la misma transacción. |

## Rollback Plan

1. Revertir código vía Git.
2. `npm run migration:revert` (dos veces: RLS primero, luego schema).

## Success Criteria

- [ ] El admin puede activar "control por cantidad" en un producto e ingresar stock inicial.
- [ ] Al crear una orden, `stockQuantity` se decrementa y se registra un movimiento `sale_out`.
- [ ] Cuando `stockQuantity` llega a 0, `inStock` se apaga automáticamente.
- [ ] Al cancelar una orden, `stockQuantity` se restaura con un movimiento `cancellation_return`.
- [ ] Dos órdenes simultáneas del último ítem → una con éxito, la otra con 422.
- [ ] El admin puede registrar entradas de stock desde `/admin/inventory`.
- [ ] El historial de movimientos muestra cada venta con referencia a la orden y cada entrada con el admin que la creó.
- [ ] Los productos con `stockQuantity = null` siguen funcionando con toggle manual sin ningún cambio de comportamiento.
- [ ] `PATCH /admin/products/:id/stock` retorna 409 si el producto tiene `stockQuantity !== null`.
- [ ] La tabla `stock_movements` tiene RLS activo: un tenant no puede leer ni escribir movimientos de otro.
- [ ] `AdminSidebar` y `AdminMobileNav` incluyen el enlace a `/admin/inventory`.
