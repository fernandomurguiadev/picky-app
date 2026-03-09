# Filtrado y Ordenamiento

## Filtrado

### Filtros Simples
Parámetros de query directos para filtrado básico:

**Formato**: `GET /resource?field=value`

**Ejemplos**:
-   `GET /admin/products?categoryId=uuid-123` - Productos de una categoría
-   `GET /admin/products?isActive=true` - Solo productos activos
-   `GET /admin/orders?status=new` - Pedidos con estado 'new'
-   `GET /admin/orders?deliveryMethod=delivery` - Pedidos con delivery

### Búsqueda de Texto
Búsqueda full-text en campos relevantes:

**Formato**: `GET /resource?q=search_term`

**Ejemplos**:
-   `GET /:slug/products/search?q=milanesa` - Busca en nombre y descripción
-   `GET /admin/products?q=napolitana` - Búsqueda en panel admin
-   `GET /admin/orders?q=Juan` - Busca por nombre de cliente

**Comportamiento**:
-   Case-insensitive
-   Búsqueda parcial (LIKE %term%)
-   Busca en múltiples campos: nombre, descripción, tags

### Filtros por Rango de Fechas
Para filtrar por rangos temporales:

**Formato**: `GET /resource?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

**Ejemplos**:
-   `GET /admin/orders?startDate=2026-02-01&endDate=2026-02-28` - Pedidos de febrero
-   `GET /admin/analytics/summary?startDate=2026-02-20` - Desde fecha específica

### Filtros Múltiples
Se pueden combinar múltiples filtros:

**Ejemplo**:
```
GET /admin/orders?status=new&deliveryMethod=delivery&startDate=2026-02-23
```

## Ordenamiento (Sorting)

### Parámetro de Ordenamiento
**Formato**: `sort=campo:direccion`

**Direcciones**:
-   `asc` - Ascendente (A-Z, 0-9, más antiguo primero)
-   `desc` - Descendente (Z-A, 9-0, más reciente primero)

**Ejemplos**:
-   `GET /admin/products?sort=name:asc` - Productos ordenados alfabéticamente
-   `GET /admin/products?sort=price:desc` - Productos de mayor a menor precio
-   `GET /admin/orders?sort=createdAt:desc` - Pedidos más recientes primero
-   `GET /:slug/products?sort=order:asc` - Productos por orden manual

### Ordenamiento por Defecto
Si no se especifica `sort`, se aplican estos defaults:

| Recurso | Ordenamiento Default |
| :--- | :--- |
| Productos | `order:asc` (orden manual del admin) |
| Categorías | `order:asc` (orden manual del admin) |
| Pedidos | `createdAt:desc` (más recientes primero) |

### Ordenamiento Múltiple
Para ordenar por múltiples campos (separados por coma):

**Formato**: `sort=campo1:dir1,campo2:dir2`

**Ejemplo**:
```
GET /admin/products?sort=categoryId:asc,order:asc
```
Ordena primero por categoría, luego por orden dentro de cada categoría.

## Selección de Campos (Opcional)

Para optimizar el payload, se pueden seleccionar campos específicos:

**Formato**: `GET /resource?fields=campo1,campo2,campo3`

**Ejemplos**:
-   `GET /admin/products?fields=id,name,price` - Solo ID, nombre y precio
-   `GET /:slug/categories?fields=id,name,imageUrl` - Datos mínimos de categorías

**Notas**:
-   Los campos `id` y `tenantId` siempre se incluyen
-   Si no se especifica `fields`, se retornan todos los campos
-   Útil para reducir tamaño de respuesta en listas grandes

## Ejemplos Completos

### Productos Activos de una Categoría, Ordenados por Precio
```
GET /:slug/categories/uuid-123/products?isActive=true&sort=price:asc
```

### Pedidos de Delivery del Día, Más Recientes Primero
```
GET /admin/orders?deliveryMethod=delivery&startDate=2026-02-23&sort=createdAt:desc
```

### Búsqueda de Productos con Filtros
```
GET /admin/products?q=pizza&categoryId=uuid-456&isActive=true&sort=name:asc
```

### Productos con Campos Específicos
```
GET /:slug/products/featured?fields=id,name,price,images
```

## Implementación en NestJS

### DTO de Query Params
```typescript
export class ProductQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]+:(asc|desc)$/)
  sort?: string;

  @IsOptional()
  @IsString()
  fields?: string;
}
```

### Aplicar Filtros en el Servicio
```typescript
async findProducts(query: ProductQueryDto, tenantId: string) {
  const where: any = { tenantId };
  
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (query.q) {
    where.name = Like(`%${query.q}%`);
  }

  const [field, direction] = query.sort?.split(':') || ['order', 'asc'];
  
  return this.productRepository.find({
    where,
    order: { [field]: direction.toUpperCase() },
    select: query.fields?.split(',')
  });
}
```
