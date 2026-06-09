## Exploration: Gestión de Inventario por Movimientos (Stock Ledger)

### Problema

El change `shared-product-stock-control` implementó un toggle binario `inStock` para controlar
disponibilidad de forma manual. Sin embargo, muchos merchants necesitan un control cuantitativo
real donde el stock se descuenta automáticamente con cada venta.

El problema central es que el stock **no es un número estático** — es el resultado acumulado
de múltiples movimientos a lo largo del tiempo:

```
Día 1: compra 10 unidades  → +10  (stock: 10)
Día 1: se venden 5         → -5   (stock: 5)
Día 2: compra 10 unidades  → +10  (stock: 15)
Día 2: se venden 3         → -3   (stock: 12)
Día 3: ajuste por pérdida  → -2   (stock: 10)
```

Un simple campo `stockQuantity: integer` no resuelve esto porque:
- No guarda historial de entradas y salidas
- No permite auditar quién cargó qué y cuándo
- No diferencia entre tipos de movimiento (compra, venta, pérdida, devolución)
- No soporta reponer stock sin sobrescribir el valor actual

### Estado actual

- `inStock: boolean` — toggle manual, ya implementado. El merchant lo apaga cuando quiere.
- No existe ningún campo de cantidad ni historial de movimientos.
- Las órdenes no decrementan stock (solo validan `inStock === true`).

### Affected Areas (estimadas)

**Backend:**
- Nueva entidad `StockMovement` (tabla `stock_movements`)
- Nueva entidad `StockSummary` o vista materializada (stock calculado por producto)
- Módulo `inventory/` en NestJS
- `orders.service.ts` — insertar movimiento `sale_out` al confirmar orden
- `catalog.service.ts` — integrar lectura de stock calculado en respuesta de producto

**Frontend:**
- Nueva sección en admin: `/admin/inventory`
- Vista de stock por producto con historial de movimientos
- Formulario para registrar entradas de stock (compras, ajustes)
- Indicador de stock en la grilla de productos (reemplaza/complementa switch inStock)

### Approaches

#### Opción A: Tabla de movimientos pura (ledger)

```sql
stock_movements
  id          uuid PK
  tenantId    uuid FK
  productId   uuid FK
  type        ENUM(purchase_in, sale_out, adjustment, waste, return)
  quantity    integer  -- positivo (entrada) o negativo (salida)
  notes       text nullable
  orderId     uuid nullable  -- FK si fue por una orden
  createdBy   uuid nullable  -- admin que lo registró
  createdAt   timestamp
```

Stock actual = `SELECT SUM(quantity) FROM stock_movements WHERE productId = X AND tenantId = Y`.

- Pros: historial completo, auditable, inmutable.
- Cons: query de stock es un SUM sobre toda la historia (mitigable con índice y snapshot periódico).

#### Opción B: Campo de cantidad + tabla de movimientos

```
products.stockQuantity  integer nullable  -- cache del stock actual
stock_movements         -- historial
```

Al insertar un movimiento, se actualiza `products.stockQuantity` atómicamente. El stock
se lee directo de `products.stockQuantity` (rápido), y los movimientos sirven para auditoría.

- Pros: lectura O(1) del stock actual, historial completo.
- Cons: requiere mantener la consistencia entre el campo y los movimientos (uso de transacciones).

### Recommendation

**Opción B** es la arquitectura correcta para producción. La Opción A es puramente relacional
pero puede ser lenta a escala. Con B se obtiene lo mejor de ambos: lectura rápida del stock
actual en `products.stockQuantity` y trazabilidad completa en `stock_movements`.

La integración con `inStock` existente: cuando `stockQuantity` llega a 0 por una venta,
`inStock` se apaga automáticamente. Cuando el admin registra una entrada y `stockQuantity > 0`,
`inStock` se enciende automáticamente.

Los productos sin control de cantidad (toggle manual) tendrán `stockQuantity = null` y el
comportamiento actual de `inStock` se mantiene sin cambios.

### Risks

- **Concurrencia**: dos órdenes simultáneas del último ítem. Mitigación: `UPDATE ... WHERE stockQuantity >= qty RETURNING *` en transacción + validación post-update.
- **Migración de productos existentes**: todos los productos existentes arrancan con `stockQuantity = null` (modo manual). Sin breaking change.
- **Complejidad de UI**: la sección de inventario es una feature importante que requiere diseño cuidadoso.

### Ready for Proposal

Sí. Scope claro, arquitectura definida, riesgos identificados.
