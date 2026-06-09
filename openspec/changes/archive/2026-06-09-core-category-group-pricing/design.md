# Technical Design: Precios Grupales por Categoría

## Database Schema Changes
Target: `picky-app/api` — TypeORM entity + migración generada con `npm run migration:generate`

Modificar entidad `Category`:
- `isGroupPricingEnabled` (`boolean`, default: `false`)
- `groupPrice` (`integer`, nullable) — en centavos, consistente con `product.price`

> `groupPrice` se conserva en DB cuando `isGroupPricingEnabled` se pone en `false`. Esto permite reactivar el precio grupal sin que el admin tenga que reingresarlo.

## Backend (API) Changes — Patrón de Sincronización

El precio se sincroniza físicamente en `products.price` para mantener consultas simples y sin JOINs.

### 1. Category Service — `updateCategory`

Al guardar la categoría:
- Si `isGroupPricingEnabled` pasa a `true` **o** `groupPrice` cambia mientras ya estaba activo → ejecutar bulk update dentro de la misma transacción:
  ```ts
  await manager.update(Product, { categoryId: id, tenantId }, { price: groupPrice })
  ```
- Si `isGroupPricingEnabled` pasa a `false` → no tocar precios de productos (quedan con el último valor grupal).
- Response incluye `updatedProductsCount: number` (cantidad de productos sincronizados; 0 si no hubo sync).

### 2. Product Service — `createProduct` / `updateProduct`

Al crear o actualizar un producto:
1. Leer la categoría destino (el `categoryId` del DTO).
2. Si `category.isGroupPricingEnabled === true` → ignorar `dto.price` y forzar `price = category.groupPrice`.

**Cambio de categoría** (`updateProduct` con nuevo `categoryId`):
- Si la categoría nueva tiene precio grupal → aplicar ese precio automáticamente.
- Si la categoría nueva es normal → conservar el precio que traía el producto (que puede ser el último precio grupal). El endpoint devuelve un flag `priceInherited: true` para que el frontend muestre el warning.

### 3. Cart/Checkout Service

Sin cambios. Lee `product.price` directamente (ya sincronizado) y suma los `priceModifier` de las opciones seleccionadas.

## Frontend (Admin Panel) Changes

### CategoryForm
- Agregar un `Switch` "Habilitar Precio Grupal".
- Input numérico condicional para `groupPrice` (visible solo si el switch está activo).
- Al guardar, mostrar toast: *"Precio grupal actualizado. Se sincronizaron N productos."* usando `updatedProductsCount` del response.

### ProductForm
- Al seleccionar una categoría, leer `category.isGroupPricingEnabled` de los datos ya cargados.
- Si es `true` → campo `price` con `disabled={true}` + Alert: *"El precio está fijado por la categoría ($XX.XXX)."*
- Si la categoría es normal y el producto venía de una categoría grupal (`priceInherited: true`) → Alert de advertencia: *"Este producto conserva el precio de su categoría anterior. Revisá si debés actualizarlo."*

## Frontend (Storefront) Changes

### API pública
`getPublicCategories` ya retorna todos los campos de la entidad, por lo que `isGroupPricingEnabled` y `groupPrice` quedan disponibles sin cambios en el endpoint. No se exponen en el endpoint de productos (sería información redundante).

### Catalog View
- Si `category.isGroupPricingEnabled === true` → renderizar un banner destacado encima del grid: *"Todo a $X"*.
- Las tarjetas de producto siguen leyendo `product.price` normalmente (código sin cambios).
