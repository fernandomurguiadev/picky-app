# Autorización

## Visión General
El sistema implementa un modelo de Multi-tenancy con aislamiento estricto por Tenant. Cada comerciante (tenant) solo puede acceder a sus propios datos. En el MVP no hay roles diferenciados; el usuario autenticado es el administrador único de su comercio.

## Roles del Sistema

| Rol | Descripción | Permisos Clave |
| :--- | :--- | :--- |
| **ADMIN** | Administrador del comercio (único rol en MVP) | Acceso completo a catálogo, pedidos, configuración de su tienda |
| **PUBLIC** | Usuario anónimo (cliente final) | Solo lectura de tienda pública, creación de pedidos sin autenticación |

## Control de Acceso

### Estrategia
-   **Guards de NestJS**: `JwtAuthGuard` protege todas las rutas `/admin/*`
-   **TenantContextInterceptor**: Extrae `tenantId` del JWT y lo inyecta en el contexto de cada request
-   **Repository Pattern**: Todas las queries incluyen automáticamente filtro por `tenantId`

### Aislamiento de Datos (Multi-tenancy)
-   Cada entidad de base de datos tiene columna `tenant_id` (UUID)
-   El `tenantId` se extrae del JWT en cada request autenticado
-   Todas las operaciones CRUD filtran automáticamente por `tenant_id`
-   Validación adicional: al actualizar/eliminar, se verifica que el recurso pertenezca al tenant del usuario

**Ejemplo de query automática:**
```typescript
// El usuario con tenantId="abc-123" solo verá sus productos
const products = await productRepository.find({
  where: { tenantId: currentUser.tenantId }
});
```

### Rutas Públicas (Sin Autenticación)
Las siguientes rutas son públicas para permitir que clientes finales naveguen la tienda:
-   `GET /stores/:slug` - Datos del comercio
-   `GET /stores/:slug/status` - Estado abierto/cerrado
-   `GET /:slug/categories` - Categorías activas
-   `GET /:slug/categories/:id/products` - Productos de categoría
-   `GET /:slug/products/featured` - Productos destacados
-   `GET /:slug/products/search` - Búsqueda de productos
-   `POST /orders` - Crear pedido (sin auth)

### Rutas Protegidas (Requieren JWT)
Todas las rutas bajo `/admin/*` requieren autenticación:
-   `/admin/categories/*` - Gestión de catálogo
-   `/admin/products/*` - Gestión de productos
-   `/admin/orders/*` - Gestión de pedidos
-   `/admin/analytics/*` - Estadísticas
-   `/stores/me/*` - Configuración de la tienda propia

## Manejo de Errores de Autorización

-   **401 Unauthorized**: Token ausente, inválido o expirado. Redirect a `/auth/login`
-   **403 Forbidden**: Intento de acceder a recursos de otro tenant (no debería ocurrir si el sistema funciona correctamente)
-   **404 Not Found**: Se retorna 404 en lugar de 403 cuando un recurso no existe o no pertenece al tenant (evita information disclosure)

## Validaciones de Seguridad

1. **Validación de Tenant en Updates/Deletes**:
```typescript
const product = await productRepository.findOne({
  where: { id: productId, tenantId: currentUser.tenantId }
});
if (!product) throw new NotFoundException();
```

2. **WebSocket Authentication**:
-   El cliente envía el JWT al conectarse
-   El gateway valida el token y une al cliente a la sala de su `tenantId`
-   Solo recibe eventos de pedidos de su propio comercio

3. **Rate Limiting por Tenant**:
-   Límites de API aplicados por `tenantId` para evitar abuso
-   Límites más estrictos en endpoints públicos (búsqueda, creación de pedidos)
