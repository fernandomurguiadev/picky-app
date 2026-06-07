# Tasks: Control Rápido de Stock / Disponibilidad

## Phase 1 — Backend Schema & Migration
- [x] 1.1 Agregar columna `inStock boolean DEFAULT true` a `product.entity.ts` con índice `[tenantId, inStock]`
- [x] 1.2 Generar y revisar migración TypeORM (`1780845183167-Migration.ts`)
- [x] 1.3 Correr `npm run migration:run`

## Phase 2 — Backend DTOs & Endpoint
- [x] 2.1 Agregar `inStock?: boolean` a `CreateProductDto` y `UpdateProductDto`
- [x] 2.2 Crear `toggle-product-stock.dto.ts` con `ToggleProductStockDto`
- [x] 2.3 Agregar `updateProductStock()` a `catalog.service.ts`
- [x] 2.4 Agregar endpoint `PATCH /:id/stock` a `products.controller.ts`

## Phase 3 — Order Validation
- [x] 3.1 Validar `product.inStock === true` en `orders.service.ts` al crear orden

## Phase 4 — Frontend Types & Hook
- [x] 4.1 Agregar `inStock: boolean` a `Product` y `ProductFormData` en `catalog.ts`
- [x] 4.2 Crear `useToggleProductStock()` en `use-products.ts`

## Phase 5 — Admin UI
- [x] 5.1 Agregar switch "Stock" en `products/page.tsx`
- [x] 5.2 Agregar switch "Disponible (en stock)" en `product-form/index.tsx`

## Phase 6 — Storefront UI
- [x] 6.1 `ProductCard`: badge "Sin stock" + deshabilitar botón/click cuando `!inStock`
- [x] 6.2 `ProductDetailSheet`: deshabilitar agregar al carrito cuando `!inStock`
