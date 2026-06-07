# Proposal: Gestión de Inventario por Movimientos (Stock Ledger)

## Intent

Permitir a los merchants controlar el stock de sus productos de forma cuantitativa y trazable.
El stock no se ingresa como un número estático sino como el resultado de movimientos acumulados
(entradas por compra, salidas por venta, ajustes manuales). Cuando el stock calculado llega a 0,
el campo `inStock` se apaga automáticamente. Las órdenes decrementan el stock en tiempo real.

Complementa el toggle `inStock` existente: los productos sin control de cantidad siguen
funcionando como antes (toggle manual).

## Scope

### In Scope

- Nueva tabla `stock_movements` para registrar todos los movimientos de stock por producto.
- Campo `stockQuantity: integer | null` en `products` como cache del stock actual calculado (null = modo toggle manual).
- Módulo NestJS `inventory` con endpoints para listar y crear movimientos.
- Integración en `orders.service.ts`: al confirmar orden, insertar movimiento `sale_out` y decrementar `stockQuantity` atómicamente. Si llega a 0, apagar `inStock` automáticamente.
- Integración en `catalog.service.ts`: exponer `stockQuantity` en la respuesta de producto (admin y storefront).
- Sección de admin `/admin/inventory`: listado de productos con stock actual y formulario para registrar entradas.
- Vista de historial de movimientos por producto.
- Indicador de stock en la grilla de productos (reemplaza el switch de Stock cuando `stockQuantity !== null`).
- Campo de cantidad en el formulario de producto con opción de activar control por cantidad.

### Out of Scope

- Múltiples almacenes / ubicaciones (single warehouse).
- Gestión de proveedores o órdenes de compra.
- Alertas automáticas de stock bajo (puede ser un change futuro).
- Gestión por lotes o números de serie.
- Stock por variante/opción de producto (solo por producto base).

## Capabilities

### New Capabilities

- `inventory-stock-ledger`: Registro histórico e inmutable de todos los movimientos de stock.
- `auto-stock-depletion`: Al completar una orden, el stock se descuenta automáticamente y se apaga `inStock` si llega a 0.
- `stock-replenishment`: El admin puede registrar entradas de stock (compras, devoluciones, ajustes) desde el panel.

### Modified Capabilities

- `product-stock-toggle`: Cuando `stockQuantity !== null`, `inStock` pasa a ser derivado automáticamente (no editable manualmente).

## Approach

1. **Database Schema**: Nueva tabla `stock_movements`. Agregar `stockQuantity: integer | null` a `products` (null = toggle manual, default null).
2. **Módulo inventory**: Entidad `StockMovement`, servicio con métodos `createMovement()`, `getMovements()`, `getStockSummary()`.
3. **Integración con órdenes**: En `orders.service.ts`, dentro de la transacción de creación de orden, insertar `sale_out` y actualizar `stockQuantity` atómicamente con `WHERE stockQuantity >= qty` para proteger contra race conditions.
4. **Integración con catálogo**: Exponer `stockQuantity` en DTOs de producto.
5. **Admin UI — Inventario**: Página `/admin/inventory` con tabla de productos (con stock) y formulario de entrada.
6. **Admin UI — Producto**: Sección "Control de stock" en formulario: checkbox para activar control por cantidad + input numérico inicial.
7. **Admin UI — Grilla**: Mostrar badge de cantidad (`3 uds`) en lugar del switch de Stock cuando `stockQuantity !== null`.

## Database Schema

```sql
-- Nuevo campo en products
ALTER TABLE products ADD COLUMN "stockQuantity" integer NULL DEFAULT NULL;

-- Nueva tabla
CREATE TABLE stock_movements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"   uuid NOT NULL REFERENCES tenants(id),
  "productId"  uuid NOT NULL REFERENCES products(id),
  type         varchar(20) NOT NULL,  -- purchase_in | sale_out | adjustment | waste | return
  quantity     integer NOT NULL,      -- positivo (entrada) o negativo (salida)
  notes        text,
  "orderId"    uuid REFERENCES orders(id),
  "createdBy"  uuid,
  "createdAt"  timestamp DEFAULT now()
);

CREATE INDEX ON stock_movements ("tenantId", "productId");
CREATE INDEX ON stock_movements ("orderId");
```

## API Contract

### GET /admin/inventory/products
Lista productos con `stockQuantity !== null` y su stock actual.

### GET /admin/inventory/products/:id/movements
Historial de movimientos de un producto. Paginado.

### POST /admin/inventory/products/:id/movements
Registrar entrada o ajuste manual.
```json
{ "type": "purchase_in", "quantity": 10, "notes": "Compra proveedor X" }
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/src/modules/catalog/entities/product.entity.ts` | Modificado | Agregar `stockQuantity: number \| null`. |
| `api/src/modules/catalog/dto/create-product.dto.ts` | Modificado | Aceptar `stockQuantity` opcional. |
| `api/src/modules/catalog/dto/update-product.dto.ts` | Modificado | Aceptar `stockQuantity` opcional. |
| `api/src/modules/inventory/` | Nuevo | Módulo completo: entidad, servicio, controlador. |
| `api/src/modules/orders/orders.service.ts` | Modificado | Insertar `sale_out` y decrementar `stockQuantity` en transacción. |
| `app/src/lib/types/catalog.ts` | Modificado | Agregar `stockQuantity: number \| null` a `Product`. |
| `app/src/app/(admin)/admin/inventory/` | Nuevo | Página de gestión de inventario. |
| `app/src/app/(admin)/admin/catalog/products/page.tsx` | Modificado | Badge de stock cuando `stockQuantity !== null`. |
| `app/src/components/admin/product-form/index.tsx` | Modificado | Sección "Control de stock" con activación y cantidad inicial. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Race condition en stock | Media | `UPDATE products SET stockQuantity = stockQuantity - $qty WHERE stockQuantity >= $qty` dentro de la transacción de la orden. Si 0 rows → 422. |
| Inconsistencia cache/ledger | Baja | Toda mutación de `stockQuantity` pasa por `createMovement()` que actualiza ambos en la misma transacción. |
| Productos existentes afectados | Ninguna | `stockQuantity = null` por default — comportamiento de toggle manual sin cambios. |

## Rollback Plan

1. Revertir código vía Git.
2. `npm run migration:revert` para eliminar `stock_movements` y la columna `stockQuantity`.

## Success Criteria

- [ ] El admin puede activar "control por cantidad" en un producto e ingresar stock inicial.
- [ ] Al confirmar una orden, `stockQuantity` se decrementa automáticamente.
- [ ] Cuando `stockQuantity` llega a 0, `inStock` se apaga solo.
- [ ] Dos órdenes simultáneas del último ítem resultan en una exitosa y una con error 422.
- [ ] El admin puede registrar una entrada de stock desde `/admin/inventory`.
- [ ] El historial de movimientos muestra cada venta como un `sale_out` con referencia a la orden.
- [ ] Los productos con `stockQuantity = null` siguen funcionando con toggle manual sin cambios.
