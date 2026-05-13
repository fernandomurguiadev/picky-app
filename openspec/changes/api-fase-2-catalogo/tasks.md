# Tasks — api-fase-2-catalogo

## Fase de implementación: FASE 2 — Módulo Catálogo

---

## Infraestructura de errores (common/)

### B2-ERR.1 — Interfaz `ErrorDefinition`

- [x] Crear `api/src/common/errors/error-definition.ts` con la interfaz `ErrorDefinition { statusCode: HttpStatus; code: string; message: string; details?: Record<string, unknown> }`

**Criterio de done:** Interfaz exportada y tipable por otras clases.

---

### B2-ERR.2 — `BusinessException`

- [x] Crear `api/src/common/errors/business.exception.ts`
- [x] `BusinessException extends HttpException` — constructor recibe `ErrorDefinition`, llama a `super({ code, message, details }, statusCode)`
- [x] Exportar función helper `toBusinessException(def: ErrorDefinition): BusinessException`
- [x] Compatible con `HttpExceptionFilter` existente sin modificaciones

**Criterio de done:** `throw toBusinessException(CatalogErrors.xxx())` es manejado por el filtro global.

---

### B2-ERR.3 — `CommonErrors`

- [x] Crear `api/src/common/errors/common.errors.ts`
- [x] `CommonErrors.notFound(entity, context?)` → 404
- [x] `CommonErrors.forbidden(reason?)` → 403
- [x] `CommonErrors.conflict(entity, field, value)` → 409

**Criterio de done:** Reutilizable desde cualquier módulo.

---

### B2-ERR.4 — Barrel `common/index.ts`

- [x] Agregar exports de `BusinessException`, `toBusinessException`, `CommonErrors`, `ErrorDefinition` al barrel `api/src/common/index.ts`

---

## Errores del dominio Catálogo

### B2.0 — Error codes y fábrica

- [x] Crear `api/src/modules/catalog/errors/catalog.error-codes.ts` con constantes string: `CATEGORY_NOT_FOUND`, `CATEGORY_HAS_ACTIVE_PRODUCTS`, `CATEGORY_FORBIDDEN`, `PRODUCT_NOT_FOUND`, `PRODUCT_FORBIDDEN`, `PRODUCT_HAS_ACTIVE_ORDERS`, `TENANT_NOT_FOUND`, `REORDER_FORBIDDEN`
- [x] Crear `api/src/modules/catalog/errors/catalog.errors.ts` con fábrica `CatalogErrors` que retorna `ErrorDefinition` por caso de negocio

**Criterio de done:** `CatalogErrors.productForbidden(id)` retorna `ErrorDefinition` con statusCode 403.

---

## DTOs

### B2.1 — `CreateCategoryDto`

- [x] Crear `api/src/modules/catalog/dto/create-category.dto.ts`
- [x] `name`: `@IsString()`, `@MaxLength(255)`, requerido
- [x] `imageUrl`: opcional, `@IsString()`
- [x] `isActive`: opcional, `@IsBoolean()`

---

### B2.2 — `UpdateCategoryDto`

- [x] Crear `api/src/modules/catalog/dto/update-category.dto.ts`
- [x] Todos los campos opcionales
- [x] `imageUrl`: puede ser `string | null`
- [x] `order`: `@IsInt()`, `@Min(0)`

---

### B2.3 — `ReorderCategoriesDto`

- [x] Crear `api/src/modules/catalog/dto/reorder-categories.dto.ts`
- [x] `ids`: `@IsArray()`, `@ArrayMinSize(1)`, `@IsUUID('4', { each: true })`

---

### B2.4 — `CreateProductDto`

- [x] Crear `api/src/modules/catalog/dto/create-product.dto.ts`
- [x] `categoryId`: `@IsUUID()`
- [x] `name`: `@IsString()`, `@MaxLength(255)`
- [x] `price`: `@IsInt()`, `@Min(0)` — centavos, nunca float
- [x] Campos opcionales: `description`, `imageUrl`, `isFeatured`, `isActive`, `order`
- [x] `optionGroups?`: `@ValidateNested({ each: true })` + `@Type(() => CreateOptionGroupDto)`
- [x] `CreateOptionGroupDto`: `name`, `type` (enum `OptionGroupType`), opcionales: `isRequired`, `minSelections`, `maxSelections`, `order`, `items: CreateOptionItemDto[]`
- [x] `CreateOptionItemDto`: `name`, `priceModifier` (`@IsInt()`, `@Min(0)`), opcionales: `isDefault`, `order`

---

### B2.5 — `UpdateProductDto`

- [x] Crear `api/src/modules/catalog/dto/update-product.dto.ts`
- [x] Misma estructura que `CreateProductDto` pero todos los campos opcionales
- [x] `UpdateOptionGroupDto` y `UpdateOptionItemDto` anidados con validación opcional

---

### B2.6 — `PaginationQueryDto` / `ProductsQueryDto`

- [x] Crear `api/src/modules/catalog/dto/pagination-query.dto.ts`
- [x] `PaginationQueryDto`: `page?` (default 1), `limit?` (default 20, max 100), usar `@Type(() => Number)`
- [x] `ProductsQueryDto extends PaginationQueryDto`: agrega `categoryId?` (UUID), `isActive?` (string), `q?`

---

## CatalogService

### B2.7 — Servicio completo

- [x] Crear `api/src/modules/catalog/catalog.service.ts`
- [x] Inyectar repositorios: `categoryRepo`, `productRepo`, `optionGroupRepo`, `optionItemRepo`, `tenantRepo`, `orderRepo`, `DataSource`
- [x] `resolveTenantBySlug(slug)` — private, throw si no existe o `isActive: false`
- [x] `getPublicCategories(slug)` — solo `isActive: true`, ordenadas por `order ASC`
- [x] `getAdminCategories(tenantId)` — todas, sin filtro de isActive
- [x] `createCategory(tenantId, dto)` — save
- [x] `updateCategory(tenantId, id, dto)` — find + ownership check + assign + save
- [x] `deleteCategory(tenantId, id)` — ownership check + count active products → conflict si > 0
- [x] `reorderCategories(tenantId, dto)` — transacción: cada id en dto.ids recibe `order = index`; throw `reorderForbidden` si alguno no pertenece al tenant
- [x] `getPublicProducts(slug, catId, page, limit)` — active, con relations `optionGroups.items`, paginado
- [x] `getFeaturedProducts(slug)` — `isFeatured: true`, max 10, con relations
- [x] `searchProducts(slug, q)` — ILIKE en `name` y `description`, max 50
- [x] `getAdminProducts(tenantId, query)` — QueryBuilder con filtros opcionales + `skip/take`
- [x] `createProduct(tenantId, dto)` — transacción: save product + `saveOptionGroups`
- [x] `updateProduct(tenantId, id, dto)` — transacción: update + delete old groups + insert new
- [x] `updateProductStatus(tenantId, id, isActive)` — ownership + save `{ isActive }`
- [x] `deleteProduct(tenantId, id)` — ownership + active orders count check → conflict si > 0
- [x] `saveOptionGroups(manager, productId, groups)` — private, crea `OptionGroup` + `OptionItem[]` via `EntityManager`

**Criterio de done:** Todos los métodos lanzan `BusinessException` (nunca `throw new Error()`). Precios en centavos.

---

## Controladores

### B2.8 — `CategoriesController`

- [x] Crear `api/src/modules/catalog/categories.controller.ts`
- [x] `@Controller('admin/categories')` + `@UseGuards(JwtAuthGuard)` a nivel de clase
- [x] `GET /` → `getAdminCategories(tenantId)`
- [x] `POST /` → `createCategory(tenantId, dto)`
- [x] `PUT /:id` → `updateCategory(tenantId, id, dto)` con `ParseUUIDPipe`
- [x] `DELETE /:id` → `deleteCategory(tenantId, id)` — 204 No Content
- [x] `PATCH /reorder` → `reorderCategories(tenantId, dto)` — 204 No Content

---

### B2.9 — `ProductsController` (público + admin)

- [x] Crear `api/src/modules/catalog/products.controller.ts` con DOS controladores exportados
- [x] `StorefrontCatalogController` — `@Controller('stores/:slug')`, sin auth:
  - `GET /categories` → `getPublicCategories(slug)`
  - `GET /products/featured` → `getFeaturedProducts(slug)`
  - `GET /products/search?q=` → `searchProducts(slug, q)`
  - `GET /categories/:categoryId/products` → `getPublicProducts(slug, catId, page, limit)` retorna `{ data, meta: { page, limit, total, totalPages } }`
- [x] `AdminProductsController` — `@Controller('admin/products')` + `@UseGuards(JwtAuthGuard)`:
  - `GET /` → `getAdminProducts(tenantId, query)` — `{ data, meta }` paginado
  - `POST /` → `createProduct(tenantId, dto)`
  - `PUT /:id` → `updateProduct(tenantId, id, dto)`
  - `PATCH /:id/status` → `updateProductStatus(tenantId, id, isActive)`
  - `DELETE /:id` → `deleteProduct(tenantId, id)` — 204 No Content

---

## Módulo y registro

### B2.10 — `CatalogModule`

- [x] Crear `api/src/modules/catalog/catalog.module.ts`
- [x] `TypeOrmModule.forFeature([Category, Product, OptionGroup, OptionItem, Tenant, Order])`
- [x] `controllers: [CategoriesController, AdminProductsController, StorefrontCatalogController]`
- [x] `providers: [CatalogService]`
- [x] `exports: [CatalogService]`

### B2.11 — Registrar en `AppModule`

- [x] Importar `CatalogModule` en `api/src/app.module.ts`

---

## Verificación

### B2.12 — Typecheck

- [x] Ejecutar `npm run typecheck` en `api/` → 0 errores

### B2.13 — Migración

- [x] Verificar que no hay cambios de schema (entidades ya estaban en `InitialSchema`)
- [x] `npm run migration:generate` confirma "No changes in database schema were found"
