# Design: Control Rápido de Stock / Disponibilidad

## Architecture

Toggle binario `inStock: boolean` (default `true`) en la entidad `Product`. Desacopla disponibilidad temporal de la visibilidad en catálogo (`isActive`).

## Backend

### Entity
```
product.entity.ts
  @Column({ type: 'boolean', default: true })
  inStock: boolean
  @Index(['tenantId', 'inStock'])
```

### DTOs
- `CreateProductDto` / `UpdateProductDto`: campo `@IsBoolean() @IsOptional() inStock?: boolean`
- `ToggleProductStockDto`: campo `@IsBoolean() @Transform(...) inStock!: boolean`

### Service
`catalog.service.ts` → `updateProductStock(tenantId, productId, dto)` — patrón análogo a `updateProductStatus`.

### Controller
`PATCH /admin/products/:id/stock` → `ToggleProductStockDto` → `{ id, inStock }`

### Order validation
`orders.service.ts`: al crear orden, rechaza ítems con `inStock === false` antes de decrementar stock (guard previo al inventario cuantitativo).

### Migration
`1780845183167-Migration.ts` — agrega columna `inStock BOOLEAN DEFAULT true NOT NULL` + índice compuesto `(tenantId, inStock)`.

## Frontend

### Types
`catalog.ts`: `Product.inStock: boolean`, `ProductFormData.inStock?: boolean`

### Hook
`useToggleProductStock()` en `use-products.ts` — mutation optimista a `PATCH /admin/products/:id/stock`.

### Admin UI
- `products/page.tsx`: switch "Stock" junto al de "Activo" en la grilla de productos.
- `product-form/index.tsx`: switch "Disponible (en stock)" en sección "Publicar producto".

### Storefront UI
- `ProductCard`: badge "Sin stock" absoluto sobre imagen + botón agregar deshabilitado cuando `!inStock`.
- `ProductDetailSheet`: reemplaza selector de cantidad + botón por mensaje "Sin stock — no disponible para compra".
- Aplica en cards de grid (1-col, 2-col) y en lista horizontal.
