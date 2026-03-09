# Convenciones de API

Este documento establece las normas para el diseño y consumo de la API REST del proyecto PickyApp.

## Formato de URL
-   **Base URL**: Sin prefijo `/api` para rutas públicas de tienda, `/admin` para panel administrador
-   **Recursos**: Sustantivos en plural, kebab-case
-   **Ejemplos**:
    -   `GET /:slug/categories` (tienda pública)
    -   `GET /admin/products` (panel admin)
    -   `POST /auth/login` (autenticación)

## Estructura de Rutas

### Rutas Públicas (Tienda)
Formato: `/:slug/recurso` donde `slug` es el identificador único del comercio
-   `GET /:slug/categories`
-   `GET /:slug/categories/:id/products`
-   `GET /:slug/products/featured`
-   `GET /:slug/products/search?q=term`

### Rutas Administrativas
Formato: `/admin/recurso` (requieren autenticación JWT)
-   `GET /admin/categories`
-   `POST /admin/products`
-   `PATCH /admin/orders/:id/status`

### Rutas de Autenticación
-   `POST /auth/register`
-   `POST /auth/login`
-   `POST /auth/refresh`
-   `POST /auth/logout`

## Métodos HTTP
| Método | Uso | Idempotente | Ejemplo |
| :--- | :--- | :--- | :--- |
| `GET` | Recuperar recursos | Sí | `GET /admin/products` |
| `POST` | Crear recursos | No | `POST /admin/categories` |
| `PUT` | Reemplazar recurso completo | Sí | `PUT /admin/products/:id` |
| `PATCH` | Actualización parcial | No | `PATCH /admin/products/:id/status` |
| `DELETE` | Eliminar recurso | Sí | `DELETE /admin/categories/:id` |

## Headers Comunes

### Request Headers
-   `Content-Type: application/json` (obligatorio en POST/PUT/PATCH)
-   `Authorization: Bearer <access_token>` (rutas protegidas)
-   `Accept: application/json`

### Response Headers
-   `Content-Type: application/json`
-   `X-Request-Id: <uuid>` (para trazabilidad)
-   `X-RateLimit-Limit: 100` (límite de requests)
-   `X-RateLimit-Remaining: 95` (requests restantes)

## Códigos de Estado HTTP

### Éxito (2xx)
-   **200 OK**: Operación exitosa con respuesta
-   **201 Created**: Recurso creado exitosamente (incluye header `Location`)
-   **204 No Content**: Operación exitosa sin contenido de respuesta (ej. DELETE)

### Errores del Cliente (4xx)
-   **400 Bad Request**: Datos inválidos o malformados
-   **401 Unauthorized**: Token ausente, inválido o expirado
-   **403 Forbidden**: Autenticado pero sin permisos
-   **404 Not Found**: Recurso no encontrado
-   **409 Conflict**: Conflicto de estado (ej. categoría con productos no se puede eliminar)
-   **422 Unprocessable Entity**: Validación de negocio fallida
-   **429 Too Many Requests**: Rate limit excedido

### Errores del Servidor (5xx)
-   **500 Internal Server Error**: Error inesperado del servidor
-   **503 Service Unavailable**: Servicio temporalmente no disponible

## Formato de Fechas
-   **ISO 8601** UTC: `YYYY-MM-DDTHH:mm:ss.sssZ`
-   **Ejemplo**: `2026-02-23T14:35:22.123Z`
-   Todas las fechas se almacenan y transmiten en UTC
-   El cliente es responsable de convertir a zona horaria local

## Formato de Moneda
-   **Tipo**: Number (sin separadores)
-   **Unidad**: Centavos o unidad mínima de la moneda
-   **Ejemplo**: `2500` representa $25.00
-   El cliente formatea según locale y moneda del comercio

## Naming Conventions

### Campos JSON
-   **camelCase** para propiedades: `productName`, `isActive`, `createdAt`
-   **Booleanos** con prefijo `is`, `has`, `can`: `isActive`, `hasFeatured`
-   **Fechas** con sufijo `At`: `createdAt`, `updatedAt`, `deletedAt`

### IDs
-   **Formato**: UUID v4
-   **Nombre del campo**: `id` (no `_id` ni `productId` en el objeto producto)
-   **Relaciones**: usar sufijo `Id`: `categoryId`, `tenantId`

## Versionado
-   **Estrategia**: Sin versionado explícito en MVP
-   **Futuro**: Se implementará versionado en URL (`/api/v2/...`) cuando sea necesario
-   **Cambios no disruptivos**: Se mantienen en la misma versión
-   **Cambios disruptivos**: Requerirán nueva versión mayor
