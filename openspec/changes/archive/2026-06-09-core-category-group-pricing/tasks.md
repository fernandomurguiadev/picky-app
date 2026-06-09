# Tasks: Precios Grupales por Categoría

- [x] 1. **Base de Datos (TypeORM)**
  - [x] Agregar `isGroupPricingEnabled` (`boolean`, default: `false`) y `groupPrice` (`integer`, nullable) a la entidad `Category`.
  - [x] Correr migración con `npm run migration:generate`.

- [x] 2. **Backend: Category Service**
  - [x] Modificar DTO de `UpdateCategory` y `CreateCategory` para aceptar los nuevos campos.
  - [x] Validar que si `isGroupPricingEnabled` es true, `groupPrice` sea >= 0.
  - [x] Implementar la transacción en `updateCategory`: sincronizar precios de productos con `manager.update(Product, { categoryId, tenantId }, { price: groupPrice })`.
  - [x] Retornar `{ category, updatedProductsCount }` desde `updateCategory`.
  - [x] `createCategory` pasa `isGroupPricingEnabled` y `groupPrice` al `repo.create()`.

- [x] 3. **Backend: Product Service**
  - [x] En `createProduct`: si la categoría tiene `isGroupPricingEnabled`, forzar `price = category.groupPrice`.
  - [x] En `updateProduct`: misma lógica, aplicada sobre la categoría destino (incluye cambio de categoría).

- [x] 4. **Frontend: Admin Panel — CategoryForm**
  - [x] Agregar `Switch` "Precio grupal" al formulario.
  - [x] Agregar input numérico condicional para `groupPrice` (visible solo si el switch está activo).
  - [x] Al guardar, mostrar toast con count: *"Se sincronizaron N productos."* usando `updatedProductsCount`.

- [x] 5. **Frontend: Admin Panel — ProductForm**
  - [x] Derivar `selectedCategory` desde el `categoryId` observado con `watch`.
  - [x] Si `isGroupPricingEnabled` → `disabled={true}` en el input de precio + Alert informativo.
  - [x] Auto-poblar el precio desde `category.groupPrice` via `useEffect` al cambiar categoría.
  - [x] Warning inline si el producto venía de categoría grupal y se mueve a una normal.

- [x] 6. **Frontend: Storefront — Catalog View**
  - [x] Banner "Todo a $X" encima del grid si `category.isGroupPricingEnabled === true`.
  - [x] Las tarjetas de producto no requieren cambios.

- [ ] 7. **Validación y QA**
  - [ ] Habilitar precio grupal en categoría existente → verificar sincronización masiva en DB.
  - [ ] Cambiar el precio grupal → verificar que los productos se actualizan y el toast muestra el count.
  - [ ] Deshabilitar precio grupal → verificar que los productos conservan el precio y `groupPrice` persiste en DB.
  - [ ] Crear producto en categoría grupal → verificar que el campo precio está deshabilitado y el backend ignora el payload.
  - [ ] Mover producto a categoría grupal → verificar que hereda el nuevo precio.
  - [ ] Mover producto a categoría normal → verificar conservación de precio + warning en UI.
  - [ ] Agregar variante con modificador a producto grupal y verificar precio final en `OrderItem`.
