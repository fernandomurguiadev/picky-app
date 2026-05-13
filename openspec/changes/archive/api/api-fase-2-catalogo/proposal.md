# Proposal — api-fase-2-catalogo

## Resumen

CRUD completo del módulo Catálogo: categorías y productos con opciones anidadas.
Incluye rutas públicas (por slug del tenant) y rutas admin (con JWT).

## Motivación

El módulo de catálogo es la entidad central de la plataforma. Sin él no pueden
existir tiendas públicas ni pedidos. Las entidades TypeORM ya están creadas en
FASE 1; esta fase implementa la capa de servicios, controladores, DTOs y módulo.

## Alcance

### Backend (`api/`)

**Infraestructura common:**
- `common/errors/error-definition.ts` — interfaz `ErrorDefinition`
- `common/errors/business.exception.ts` — `BusinessException` extends `HttpException`
- `common/errors/common.errors.ts` — `CommonErrors` reutilizables (notFound, forbidden)

**Módulo Catálogo:**
- `modules/catalog/errors/` — códigos y fábrica de errores
- `modules/catalog/dto/` — DTOs para categorías y productos
- `modules/catalog/catalog.service.ts` — lógica de negocio
- `modules/catalog/categories.controller.ts` — admin routes
- `modules/catalog/products.controller.ts` — public + admin routes
- `modules/catalog/catalog.module.ts` — módulo NestJS

## Rutas

### Públicas (no requieren auth)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/stores/:slug/categories` | Categorías activas del tenant |
| GET | `/stores/:slug/products/featured` | Productos destacados (max 10) |
| GET | `/stores/:slug/products/search?q=` | Búsqueda ILIKE en nombre/descripción |
| GET | `/stores/:slug/categories/:categoryId/products` | Productos activos de categoría (paginado) |

### Admin (requieren JWT)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/categories` | Listado (activas + inactivas) |
| POST | `/admin/categories` | Crear categoría |
| PUT | `/admin/categories/:id` | Editar categoría |
| DELETE | `/admin/categories/:id` | Eliminar (bloquea si tiene productos activos) |
| PATCH | `/admin/categories/reorder` | Reordenar en batch |
| GET | `/admin/products` | Listado con filtros y paginación |
| POST | `/admin/products` | Crear producto con opciones |
| PUT | `/admin/products/:id` | Editar producto completo |
| PATCH | `/admin/products/:id/status` | Toggle activo/inactivo |
| DELETE | `/admin/products/:id` | Eliminar (bloquea si tiene orders activas) |

## Criterios de aceptación

- Toda operación admin verifica que la entidad pertenece al tenant del JWT
- Todos los precios/modificadores se reciben y retornan en centavos (integer)
- Reordenar categorías opera en una sola transacción
- Crear/editar producto con options opera en transacción (delete + insert groups)
- `npm run typecheck` → 0 errores
