# Design — api-fase-2-catalogo

## Estructura de archivos resultante

```
api/
└── src/
    ├── common/
    │   ├── errors/
    │   │   ├── error-definition.ts          ← NUEVO
    │   │   ├── business.exception.ts        ← NUEVO
    │   │   └── common.errors.ts             ← NUEVO
    │   └── index.ts                         ← MODIFICADO (agrega exports de errors/)
    └── modules/
        └── catalog/
            ├── errors/
            │   ├── catalog.error-codes.ts   ← NUEVO
            │   └── catalog.errors.ts        ← NUEVO
            ├── dto/
            │   ├── create-category.dto.ts   ← NUEVO
            │   ├── update-category.dto.ts   ← NUEVO
            │   ├── reorder-categories.dto.ts ← NUEVO
            │   ├── create-product.dto.ts    ← NUEVO
            │   ├── update-product.dto.ts    ← NUEVO
            │   └── pagination-query.dto.ts  ← NUEVO
            ├── catalog.service.ts           ← NUEVO
            ├── categories.controller.ts     ← NUEVO
            ├── products.controller.ts       ← NUEVO
            └── catalog.module.ts            ← NUEVO
```

---

## Infraestructura de errores (common/)

### `error-definition.ts`

```typescript
import { HttpStatus } from '@nestjs/common';

export interface ErrorDefinition {
  statusCode: HttpStatus;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

### `business.exception.ts`

```typescript
import { HttpException } from '@nestjs/common';
import type { ErrorDefinition } from './error-definition.js';

export class BusinessException extends HttpException {
  constructor(private readonly definition: ErrorDefinition) {
    super(
      { code: definition.code, message: definition.message, details: definition.details },
      definition.statusCode,
    );
  }
  getDefinition(): ErrorDefinition { return this.definition; }
}

export function toBusinessException(def: ErrorDefinition): BusinessException {
  return new BusinessException(def);
}
```

### `common.errors.ts`

```typescript
import { HttpStatus } from '@nestjs/common';
import type { ErrorDefinition } from './error-definition.js';

export const CommonErrors = {
  notFound: (entity: string, context?: string): ErrorDefinition => ({
    statusCode: HttpStatus.NOT_FOUND,
    code: `${entity.toUpperCase()}_NOT_FOUND`,
    message: context ? `${entity} not found: ${context}` : `${entity} not found`,
  }),
  forbidden: (reason?: string): ErrorDefinition => ({
    statusCode: HttpStatus.FORBIDDEN,
    code: 'FORBIDDEN',
    message: reason ?? 'You do not have permission to perform this action',
  }),
  conflict: (entity: string, field: string, value: string): ErrorDefinition => ({
    statusCode: HttpStatus.CONFLICT,
    code: `${entity.toUpperCase()}_CONFLICT`,
    message: `${entity} with ${field} '${value}' already exists`,
  }),
};
```

---

## Errores del dominio Catálogo

### `catalog.error-codes.ts`

Constantes de código string para todos los errores del módulo:
`CATEGORY_NOT_FOUND`, `CATEGORY_HAS_ACTIVE_PRODUCTS`, `CATEGORY_FORBIDDEN`,
`PRODUCT_NOT_FOUND`, `PRODUCT_FORBIDDEN`, `PRODUCT_HAS_ACTIVE_ORDERS`,
`TENANT_NOT_FOUND`, `REORDER_FORBIDDEN`.

### `catalog.errors.ts`

Fábrica de `ErrorDefinition` por caso de negocio:

```typescript
export const CatalogErrors = {
  categoryNotFound: (id: string): ErrorDefinition => ({ statusCode: 404, code: CODES.CATEGORY_NOT_FOUND, message: `Category ${id} not found` }),
  categoryForbidden: (id: string): ErrorDefinition => ({ statusCode: 403, code: CODES.CATEGORY_FORBIDDEN, message: `Category ${id} does not belong to this tenant` }),
  categoryHasActiveProducts: (id: string, count: number): ErrorDefinition => ({ statusCode: 409, code: CODES.CATEGORY_HAS_ACTIVE_PRODUCTS, message: `Category ${id} has ${count} active product(s)` }),
  productNotFound: (id: string): ErrorDefinition => ({ statusCode: 404, code: CODES.PRODUCT_NOT_FOUND, message: `Product ${id} not found` }),
  productForbidden: (id: string): ErrorDefinition => ({ statusCode: 403, code: CODES.PRODUCT_FORBIDDEN, message: `Product ${id} does not belong to this tenant` }),
  productHasActiveOrders: (id: string): ErrorDefinition => ({ statusCode: 409, code: CODES.PRODUCT_HAS_ACTIVE_ORDERS, message: `Product ${id} has active orders` }),
  tenantNotFound: (slug: string): ErrorDefinition => ({ statusCode: 404, code: CODES.TENANT_NOT_FOUND, message: `Store '${slug}' not found` }),
  reorderForbidden: (): ErrorDefinition => ({ statusCode: 403, code: CODES.REORDER_FORBIDDEN, message: 'One or more categories do not belong to this tenant' }),
};
```

---

## DTOs

### `create-category.dto.ts`
```typescript
class CreateCategoryDto {
  @IsString() @MaxLength(255) name: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
```

### `update-category.dto.ts`
```typescript
class UpdateCategoryDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() @IsUrl() @Allow(null) imageUrl?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) order?: number;
}
```

### `reorder-categories.dto.ts`
```typescript
class ReorderCategoriesDto {
  @IsArray() @ArrayMinSize(1) @IsUUID('4', { each: true }) ids: string[];
}
```

### `create-product.dto.ts` / `update-product.dto.ts`

Incluyen `CreateOptionGroupDto` y `CreateOptionItemDto` anidados:
- `OptionGroupType` enum (RADIO / CHECKBOX) del entity
- `priceModifier`: integer, min 0
- Todo en `update-product.dto.ts` es opcional
- Todos los `@ValidateNested` con `{ each: true }` y `@Type` correspondiente

### `pagination-query.dto.ts`
```typescript
class PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}

class ProductsQueryDto extends PaginationQueryDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() isActive?: string;
  @IsOptional() @IsString() q?: string;
}
```

---

## CatalogService — métodos

| Método | Visibilidad | Descripción |
|--------|------------|-------------|
| `resolveTenantBySlug(slug)` | private | Helper: find tenant or throw `tenantNotFound` |
| `getPublicCategories(slug)` | public | Solo activas, ordenadas por `order` |
| `getAdminCategories(tenantId)` | public | Todas (activas + inactivas) del tenant |
| `createCategory(tenantId, dto)` | public | Save category |
| `updateCategory(tenantId, id, dto)` | public | Ownership check → update fields |
| `deleteCategory(tenantId, id)` | public | Ownership check → count active products → delete |
| `reorderCategories(tenantId, dto)` | public | Transaction: batch UPDATE order by position |
| `getPublicProducts(slug, catId, page, limit)` | public | Active, with optionGroups + items relations |
| `getFeaturedProducts(slug)` | public | `isFeatured: true`, max 10, with relations |
| `searchProducts(slug, q)` | public | ILIKE on name + description, max 50 |
| `getAdminProducts(tenantId, query)` | public | QueryBuilder, filters, pagination |
| `createProduct(tenantId, dto)` | public | Transaction: product + saveOptionGroups |
| `updateProduct(tenantId, id, dto)` | public | Transaction: update + delete old groups + insert new |
| `updateProductStatus(tenantId, id, isActive)` | public | Ownership check → save isActive |
| `deleteProduct(tenantId, id)` | public | Ownership check → active orders check → delete |
| `saveOptionGroups(manager, productId, groups)` | private | Save OptionGroup[] + OptionItem[] via EntityManager |

---

## Controladores

### `CategoriesController` — `@Controller('admin/categories')` + `@UseGuards(JwtAuthGuard)`

| Decorador | Método | Body/Param |
|-----------|--------|------------|
| `@Get()` | `getAll` | `@TenantId()` |
| `@Post()` | `create` | `@Body() CreateCategoryDto` |
| `@Put(':id')` | `update` | `ParseUUIDPipe` + `UpdateCategoryDto` |
| `@Delete(':id')` | `remove` | `ParseUUIDPipe` — 204 No Content |
| `@Patch('reorder')` | `reorder` | `ReorderCategoriesDto` — 204 No Content |

### `StorefrontCatalogController` — `@Controller('stores/:slug')` (sin auth)

| Decorador | Método | Retorna |
|-----------|--------|---------|
| `@Get('categories')` | `getCategories` | Array plano |
| `@Get('products/featured')` | `getFeatured` | Array plano |
| `@Get('products/search')` | `search` | Array plano |
| `@Get('categories/:categoryId/products')` | `getCategoryProducts` | `{ data, meta }` paginado |

### `AdminProductsController` — `@Controller('admin/products')` + `@UseGuards(JwtAuthGuard)`

| Decorador | Método | Notas |
|-----------|--------|-------|
| `@Get()` | `getAll` | `{ data, meta }` paginado |
| `@Post()` | `create` | `CreateProductDto` |
| `@Put(':id')` | `update` | `UpdateProductDto` |
| `@Patch(':id/status')` | `updateStatus` | `@Body('isActive') boolean` |
| `@Delete(':id')` | `remove` | 204 No Content |

---

## CatalogModule

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, OptionGroup, OptionItem, Tenant, Order])],
  controllers: [CategoriesController, AdminProductsController, StorefrontCatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
```

`AppModule` importa `CatalogModule` junto a `TenantsModule` y `AuthModule`.
