# Design: Gestión de Inventario por Movimientos (Stock Ledger)

## Architecture Decisions

### Decision: Cuándo decrementar stock
| Opción | Trade-off | Decisión |
|--------|-----------|----------|
| **Al crear orden (PENDING)** | Stock reservado inmediatamente. Si se cancela, se restaura via `cancellation_return`. Simple, consistente con la validación `inStock` existente. | **SELECTED** |
| Al confirmar orden (CONFIRMED) | Stock disponible durante el PENDING. Riesgo de vender el mismo ítem dos veces en paralelo. | Rechazado: permite race condition entre órdenes paralelas. |

### Decision: Signo de quantity en stock_movements
| Opción | Trade-off | Decisión |
|--------|-----------|----------|
| **Siempre positivo, type indica dirección** | `purchase_in qty=5`, `sale_out qty=5`. Más legible en reportes, no se necesita parsear signos. | **SELECTED** |
| Positivo/negativo libre | Mezcla de `+10` y `-3`. Más compacto pero propenso a errores de signo. | Rechazado. |

### Decision: Dónde vive la lógica de decremento
| Opción | Trade-off | Decisión |
|--------|-----------|----------|
| **InventoryService (inyectado en OrdersService)** | Separa responsabilidades. `OrdersModule` importa `InventoryModule`. Sin circular deps. | **SELECTED** |
| Directo en OrdersService con raw SQL | Evita la dependencia de módulo, pero mezcla responsabilidades de inventario en órdenes. | Rechazado. |

### Decision: stockQuantity en products como cache
| Opción | Trade-off | Decisión |
|--------|-----------|----------|
| **Cache en `products.stockQuantity` + historial en `stock_movements`** | Lectura O(1) del stock actual. Historial completo para auditoría. Requiere consistencia transaccional. | **SELECTED** |
| Solo ledger (SUM de movimientos) | Un solo source of truth, sin cache. Consulta de stock = SUM sobre toda la tabla. Lento a escala. | Rechazado para producción. |

---

## Data Flow

### Creación de orden (con stock)

```
[Cliente] POST /orders
      │
      ▼
OrdersService.createOrder()
  ├─ Validar settings, delivery, pago
  ├─ Por cada item:
  │   ├─ findOne(product) → if !inStock → 422
  │   └─ if stockQuantity !== null && stockQuantity < item.qty → 422
  │       └─ stockProductsMap.set(productId, stockQuantity)
  ├─ Calcular subtotal, total
  └─ [Transacción queryRunner]
       ├─ set_config tenant_id (RLS)
       ├─ save(Order) → status: PENDING
       ├─ save(OrderItems[])
       ├─ Por cada item en stockProductsMap:
       │   └─ InventoryService.decrementStock(tenantId, productId, qty, orderId, runner)
       │       ├─ UPDATE products SET stockQuantity -= qty,
       │       │   inStock = CASE WHEN stockQuantity - qty <= 0 THEN false ELSE inStock END
       │       │   WHERE id = productId AND stockQuantity >= qty   ← race condition guard
       │       └─ INSERT stock_movements (type: sale_out, qty, orderId)
       └─ commitTransaction()
```

### Cancelación de orden

```
[Admin] PATCH /admin/orders/:id/status { status: 'cancelled' }
      │
      ▼
OrdersService.updateOrderStatus()
  ├─ queryRunner.connect() + startTransaction()
  ├─ SELECT order FOR UPDATE (pessimistic_write) — previene doble cancelación
  ├─ Validar transición → CANCELLED permitido
  ├─ Si dto.status === CANCELLED:
  │   ├─ SELECT order_items WHERE orderId = id
  │   └─ Por cada item:
  │       └─ InventoryService.restoreStock(tenantId, productId, qty, orderId, runner)
  │           ├─ findOne(product) → if stockQuantity === null → skip (toggle manual)
  │           ├─ UPDATE products SET stockQuantity += qty,
  │           │   inStock = CASE WHEN stockQuantity + qty > 0 THEN true ELSE inStock END
  │           └─ INSERT stock_movements (type: cancellation_return, qty, orderId)
  ├─ order.status = CANCELLED + statusHistory
  ├─ save(order)
  └─ commitTransaction()
```

### Entrada manual de stock (admin)

```
[Admin] POST /admin/inventory/products/:id/movements
  { type: 'purchase_in', quantity: 10, notes: 'Compra proveedor X' }
      │
      ▼
InventoryController → InventoryService.createAdminMovement()
  [RlsRunner runner desde interceptor]
  ├─ findOne(product) → 404 si no existe
  ├─ Validar type ∈ {purchase_in, adjustment, waste}
  ├─ Si waste → decrementar (quantity negativo efectivo)
  ├─ Si purchase_in/adjustment positivo → incrementar
  ├─ UPDATE products SET stockQuantity += qty (o -= para waste),
  │   inStock = CASE WHEN result > 0 THEN true ELSE false END
  ├─ INSERT stock_movements (type, qty, orderId: null, createdBy: userId)
  └─ RETURN { product, movement }
```

---

## Module Dependency

```
AppModule
  ├── InventoryModule  ← exports InventoryService
  │     ├── TypeOrmModule.forFeature([StockMovement, Product])
  │     ├── InventoryService
  │     └── InventoryController (PATCH /admin/inventory/...)
  │
  └── OrdersModule  ← imports InventoryModule
        ├── TypeOrmModule.forFeature([Order, OrderItem, StoreSettings, Product])
        ├── InventoryModule   ← NEW import
        ├── OrdersService     ← inyecta InventoryService
        └── OrdersGateway
```

> No existe dependencia circular: `InventoryModule` no importa `OrdersModule`.

---

## TypeScript Interfaces

### StockMovementType (enum)
```typescript
export enum StockMovementType {
  PURCHASE_IN        = 'purchase_in',
  SALE_OUT           = 'sale_out',
  ADJUSTMENT         = 'adjustment',
  WASTE              = 'waste',
  CANCELLATION_RETURN = 'cancellation_return',
}
```

### StockMovement Entity
```typescript
interface StockMovement {
  id: string;          // uuid
  tenantId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;    // siempre positivo; type determina si es entrada o salida
  notes: string | null;
  orderId: string | null;    // null para movimientos manuales
  createdBy: string | null;  // null para movimientos automáticos (órdenes)
  createdAt: Date;
}
```

### Admin API Response — GET /admin/inventory/products
```typescript
interface StockProductSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  category: { id: string; name: string } | null;
  stockQuantity: number;
  inStock: boolean;
}
```

### Admin API — POST /admin/inventory/products/:id/movements
```typescript
// Request
interface CreateMovementDto {
  type: 'purchase_in' | 'adjustment' | 'waste';
  quantity: number;  // entero positivo >= 1
  notes?: string;
}

// Response
interface MovementResponse {
  movement: StockMovement;
  stockQuantity: number;  // nuevo valor tras el movimiento
}
```

---

## Migration Strategy

Dos migraciones independientes:

**Migración 1 — Schema** (`npm run migration:generate`):
- `ALTER TABLE products ADD COLUMN "stockQuantity" integer NULL DEFAULT NULL`
- `CREATE TABLE stock_movements (...)` con tipo varchar para el ENUM

**Migración 2 — RLS** (manual, patrón idéntico a `EnableTenantRls`):
- `ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY`
- Políticas SELECT (public), INSERT/UPDATE/DELETE restringidas a `app.current_tenant_id`

Todos los productos existentes quedan con `stockQuantity = null` (modo toggle manual). Sin breaking change.

---

## Testing Strategy

- **Race condition**: Dos requests concurrentes contra el mismo producto con stockQuantity=1 → uno obtiene 200, el otro 422.
- **Cancelación**: Crear orden → cancelar → verificar `stockQuantity` restaurado y movimiento `cancellation_return` registrado.
- **Toggle manual sin cambios**: Producto con `stockQuantity = null` → crear orden → `inStock` sigue siendo el único control.
- **RLS**: Request de tenant A no puede ver ni modificar movimientos de tenant B.
