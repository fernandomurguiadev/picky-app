# Paginación

## Estrategia
Se utiliza paginación basada en Offset/Limit (page-based pagination) para listas de recursos en el panel administrador.

## Parámetros

### Query Parameters
-   `page`: Número de página (Default: 1, mínimo: 1)
-   `limit`: Elementos por página (Default: 20, máximo: 100)

**Formato**: `GET /resource?page=2&limit=20`

**Ejemplos**:
-   `GET /admin/products?page=1&limit=20` - Primera página, 20 items
-   `GET /admin/orders?page=3&limit=50` - Tercera página, 50 items
-   `GET /admin/products` - Sin parámetros usa defaults (page=1, limit=20)

## Respuesta de Metadatos

La respuesta incluye el campo `meta` con información de paginación:

```json
{
  "success": true,
  "data": [
    { "id": "uuid-1", "name": "Producto 1" },
    { "id": "uuid-2", "name": "Producto 2" }
  ],
  "meta": {
    "itemCount": 20,
    "totalItems": 156,
    "totalPages": 8,
    "currentPage": 2,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

### Campos del Meta

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `itemCount` | number | Cantidad de items en la página actual |
| `totalItems` | number | Total de items disponibles (sin filtrar por página) |
| `totalPages` | number | Total de páginas disponibles |
| `currentPage` | number | Número de página actual |
| `itemsPerPage` | number | Items por página solicitados |
| `hasNextPage` | boolean | Indica si existe una página siguiente |
| `hasPreviousPage` | boolean | Indica si existe una página anterior |

## Límites y Validaciones

-   **Página mínima**: 1 (si se envía 0 o negativo, se usa 1)
-   **Límite mínimo**: 1
-   **Límite máximo**: 100 (si se solicita más, se usa 100)
-   **Límite default**: 20
-   Si se solicita una página mayor a `totalPages`, se retorna array vacío con meta válido

## Ejemplos de Uso

### Primera Página (Default)
```
GET /admin/products
```
Respuesta:
```json
{
  "success": true,
  "data": [ /* 20 productos */ ],
  "meta": {
    "itemCount": 20,
    "totalItems": 156,
    "totalPages": 8,
    "currentPage": 1,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Página Específica con Límite Personalizado
```
GET /admin/orders?page=2&limit=50
```
Respuesta:
```json
{
  "success": true,
  "data": [ /* 50 pedidos */ ],
  "meta": {
    "itemCount": 50,
    "totalItems": 234,
    "totalPages": 5,
    "currentPage": 2,
    "itemsPerPage": 50,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

### Última Página (Parcial)
```
GET /admin/products?page=8&limit=20
```
Respuesta:
```json
{
  "success": true,
  "data": [ /* 16 productos */ ],
  "meta": {
    "itemCount": 16,
    "totalItems": 156,
    "totalPages": 8,
    "currentPage": 8,
    "itemsPerPage": 20,
    "hasNextPage": false,
    "hasPreviousPage": true
  }
}
```

### Página Fuera de Rango
```
GET /admin/products?page=99&limit=20
```
Respuesta:
```json
{
  "success": true,
  "data": [],
  "meta": {
    "itemCount": 0,
    "totalItems": 156,
    "totalPages": 8,
    "currentPage": 99,
    "itemsPerPage": 20,
    "hasNextPage": false,
    "hasPreviousPage": true
  }
}
```

## Combinación con Filtros y Ordenamiento

La paginación se puede combinar con filtros y ordenamiento:

```
GET /admin/products?categoryId=uuid-123&isActive=true&sort=name:asc&page=2&limit=30
```

**Orden de aplicación**:
1. Filtros (`categoryId`, `isActive`, `q`)
2. Ordenamiento (`sort`)
3. Paginación (`page`, `limit`)

## Implementación en NestJS

### DTO de Paginación
```typescript
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

### Servicio con Paginación
```typescript
async findPaginated(paginationDto: PaginationDto, filters: any) {
  const { page, limit } = paginationDto;
  const skip = (page - 1) * limit;

  const [data, totalItems] = await this.repository.findAndCount({
    where: filters,
    take: limit,
    skip: skip,
    order: { createdAt: 'DESC' }
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    meta: {
      itemCount: data.length,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
}
```

## Manejo en el Cliente (Next.js / TanStack Query)

### Query Hook con Paginación Stateful
En React, la paginación se gestiona sincronizando el estado local o los URL searchParams con las Query Keys de TanStack Query.

```typescript
// hooks/use-products.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useProducts(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['products', { page, limit }],
    queryFn: async () => {
      // El cliente Axios intercepta y devuelve directamente la data paginada
      const response = await apiClient.get('/admin/products', {
        params: { page, limit },
      });
      return response; // Devuelve { data: Product[], meta: Meta }
    },
    placeholderData: (previousData) => previousData, // Mantiene datos anteriores para evitar saltos visuales (UI Flicker)
  });
}
```

### Componente de UI con Controles
```tsx
// components/admin/product-list.tsx
'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';

export function ProductList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isPlaceholderData } = useProducts(page);

  if (isLoading) return <div>Cargando...</div>;

  const { totalPages, currentPage } = data.meta;

  return (
    <div>
      {/* Renderizar lista data.data */}
      
      <div className="flex justify-between mt-4">
        <Button 
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        
        <span>Página {currentPage} de {totalPages}</span>
        
        <Button 
          onClick={() => {
            if (!isPlaceholderData && currentPage < totalPages) {
              setPage(p => p + 1);
            }
          }}
          disabled={currentPage === totalPages || isPlaceholderData}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
```


## Recursos sin Paginación

Algunos endpoints NO usan paginación porque retornan conjuntos pequeños:
-   `GET /:slug/categories` - Categorías de la tienda (típicamente < 20)
-   `GET /admin/categories` - Categorías del admin (típicamente < 50)
-   `GET /:slug/products/featured` - Productos destacados (máximo 10)

Estos endpoints retornan array directo sin campo `meta`.
