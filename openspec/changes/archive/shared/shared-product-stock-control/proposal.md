# Proposal: Control Rápido de Stock / Disponibilidad (Opción D)

## Intent
Permitir a los comerciantes administrar la disponibilidad inmediata de sus productos (stock) de forma rápida e independiente del estado de catálogo (activo/inactivo). Esto evita que tengan que editar detalladamente el producto o sacarlo de la carta digital, mostrándolo en la tienda pública con una etiqueta de "Sin stock" y bloqueando su compra.

## Scope

### In Scope
- Creación de la columna `inStock` (boolean, default true) en la tabla `products` de la base de datos PostgreSQL.
- Generación de la migración TypeORM correspondiente.
- Actualización de los DTOs de entrada de creación y edición de producto en el backend NestJS.
- Creación del endpoint `PATCH /admin/products/:id/stock` con DTO `{ inStock: boolean }`, siguiendo el patrón existente de `PATCH /admin/products/:id/status`.
- Actualización de las interfaces TypeScript en el frontend `app` (`Product` y `ProductFormData`).
- Adición de un switch rápido de "Stock" en la grilla de productos de administración.
- Adición de un switch en el formulario del producto.
- Modificación del `ProductCard` para mostrar badge "Sin stock" y deshabilitar la apertura/interacción.
- Modificación del `ProductDetailSheet` para deshabilitar el botón "Agregar al carrito" cuando `inStock === false`.
- Validación en `orders.service.ts` al crear una orden: rechazar ítems con `inStock === false` (evita bypass por API directa).
- Aplicar badge "Sin stock" a productos destacados (`isFeatured`) que también estén sin stock.

### Out of Scope
- Control de inventario cuantitativo (ej. descontar unidades numéricas al vender). Solo es un toggle binario (Disponible/Agotado).
- Notificaciones automáticas por falta de stock.
- Excluir productos sin stock de la sección de destacados (se muestran con badge, no se ocultan).

## Capabilities

### New Capabilities
- `product-stock-toggle`: Permite alternar la disponibilidad de un producto al instante desde el listado administrativo.
- `storefront-out-of-stock-display`: Bloquea y etiqueta los productos sin stock en la tienda pública para el consumidor final.

## Approach
1. **Database Schema**: Agregar `inStock` a la entidad `Product`. Crear la migración correspondiente con `default: true`.
2. **DTOs & Backend**: Extender `CreateProductDto` y `UpdateProductDto`. Crear `ToggleProductStockDto`. El servicio actualizará el campo mediante `updateProductStock()` en `catalog.service.ts`.
3. **Endpoint**: `PATCH /admin/products/:id/stock` → `{ inStock: boolean }`. Consistente con el patrón de `PATCH /admin/products/:id/status`.
4. **Validación en Órdenes**: En `orders.service.ts`, dentro del `validatedItems`, verificar `product.inStock === true` y lanzar excepción si no.
5. **Frontend Types**: Agregar `inStock: boolean` a la interfaz `Product` y a `ProductFormData` en `catalog.ts`.
6. **Frontend Hook**: Crear `useToggleProductStock()` en `use-products.ts`, análogo a `useToggleProductStatus()`.
7. **Admin UI**: Agregar switch "Stock" junto al de "Activo" en la grilla de productos y en la sección "Publicar producto" del formulario.
8. **Storefront UI**: En `ProductCard`, mostrar badge "Sin stock" y deshabilitar el click/botón. En `ProductDetailSheet`, deshabilitar el botón de agregar al carrito.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/src/modules/catalog/entities/product.entity.ts` | Modificado | Agregar columna `inStock` (boolean, default: true) con índice en `[tenantId, inStock]`. |
| `api/src/modules/catalog/dto/create-product.dto.ts` | Modificado | Aceptar `inStock` opcional. |
| `api/src/modules/catalog/dto/update-product.dto.ts` | Modificado | Aceptar `inStock` opcional. |
| `api/src/modules/catalog/dto/toggle-product-stock.dto.ts` | Nuevo | DTO para `PATCH /admin/products/:id/stock` con `inStock: boolean`. |
| `api/src/modules/catalog/catalog.service.ts` | Modificado | Agregar método `updateProductStock()` análogo a `updateProductStatus()`. |
| `api/src/modules/catalog/products.controller.ts` | Modificado | Agregar endpoint `PATCH /:id/stock`. |
| `api/src/modules/orders/orders.service.ts` | Modificado | Validar `product.inStock === true` al procesar ítems de una orden. |
| `app/src/lib/types/catalog.ts` | Modificado | Agregar `inStock: boolean` a `Product` y `ProductFormData`. |
| `app/src/lib/hooks/admin/use-products.ts` | Modificado | Añadir `useToggleProductStock()` con mutation a `PATCH /admin/products/:id/stock`. |
| `app/src/app/(admin)/admin/catalog/products/page.tsx` | Modificado | Agregar switch "Stock" junto al de "Activo" en cada tarjeta de producto. |
| `app/src/components/admin/product-form/index.tsx` | Modificado | Agregar switch "Producto en stock" en la sección "Publicar producto". |
| `app/src/components/store/product-card/index.tsx` | Modificado | Mostrar badge "Sin stock" y deshabilitar el botón/click cuando `inStock === false`. |
| `app/src/components/store/product-detail-sheet/index.tsx` | Modificado | Deshabilitar el botón "Agregar al carrito" cuando `inStock === false`. |

## API Contract

### PATCH /admin/products/:id/stock

**Request body:**
```json
{ "inStock": false }
```

**Response:**
```json
{ "id": "uuid", "inStock": false }
```

**Errors:** `404 Not Found` si el producto no existe o no pertenece al tenant.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incompatibilidad con productos existentes | Baja | El campo `inStock` se crea con `default: true` en la migración — todos los productos existentes quedan disponibles. |
| Bypass por API directa al crear orden | Alta | Agregar validación de `inStock` en `orders.service.ts` al resolver ítems — no solo frontend. |
| Badge ausente en productos destacados | Media | Aplicar la misma lógica `inStock` en el componente de featured products del storefront. |

## Rollback Plan
1. Revertir cambios de código vía Git: `git checkout .`
2. Correr `npm run migration:revert` en el backend para remover la columna de base de datos.

## Success Criteria
- [ ] Los administradores pueden apagar el stock de un producto con un switch en `/admin/catalog/products`.
- [ ] Los administradores pueden apagar el stock desde el formulario de edición del producto.
- [ ] `PATCH /admin/products/:id/stock` persiste el campo `inStock` en la base de datos y lo devuelve en la respuesta.
- [ ] Los productos marcados "Sin stock" figuran visibles en la carta de la tienda pública con el badge "Sin stock".
- [ ] El botón de agregar al carrito está deshabilitado en `ProductCard` y `ProductDetailSheet` cuando `inStock === false`.
- [ ] Intentar crear una orden con un producto sin stock desde la API devuelve un error 4xx.
- [ ] Los productos destacados (`isFeatured`) sin stock muestran el badge en la sección de destacados.
- [ ] Todos los productos existentes en producción mantienen `inStock = true` tras la migración.
