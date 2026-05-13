# Manejo de Errores

## Estrategia General
Los errores deben ser interceptados y transformados a una respuesta estándar segura y útil para el cliente. Se utiliza un `HttpExceptionFilter` global en NestJS que captura todas las excepciones y las formatea según el envelope estándar.

## Tipos de Errores

1.  **Validación (400/422)**: Datos de entrada incorrectos o que no cumplen reglas de negocio
2.  **Autenticación (401)**: Token ausente, inválido o expirado
3.  **Autorización (403)**: Usuario autenticado pero sin permisos para el recurso
4.  **No Encontrado (404)**: Recurso solicitado no existe o no pertenece al tenant
5.  **Conflicto (409)**: Operación no permitida por estado del recurso
6.  **Servidor (500)**: Fallos inesperados del sistema

## Payload de Error Estándar

```json
{
  "success": false,
  "message": "Mensaje legible para el usuario",
  "error": {
    "code": "CODIGO_INTERNO",
    "details": "Información adicional o array de errores de validación"
  }
}
```

## Catálogo de Códigos de Error

### Validación y Datos (4xx)

| Código | Descripción | HTTP Status | Ejemplo |
| :--- | :--- | :--- | :--- |
| `VALIDATION_ERROR` | Fallo de validación de campos | 400 | Campo requerido faltante, formato inválido |
| `INVALID_CREDENTIALS` | Email o contraseña incorrectos | 401 | Login fallido |
| `RESOURCE_NOT_FOUND` | Recurso no encontrado | 404 | Producto con ID inexistente |
| `CATEGORY_NOT_FOUND` | Categoría no encontrada | 404 | Categoría con ID inexistente |
| `PRODUCT_NOT_FOUND` | Producto no encontrado | 404 | Producto con ID inexistente |
| `ORDER_NOT_FOUND` | Pedido no encontrado | 404 | Pedido con ID inexistente |
| `STORE_NOT_FOUND` | Tienda no encontrada | 404 | Slug de tienda inexistente |
| `DUPLICATE_EMAIL` | Email ya registrado | 409 | Intento de registro con email existente |
| `CATEGORY_HAS_PRODUCTS` | Categoría tiene productos asociados | 409 | Intento de eliminar categoría con productos |
| `MINIMUM_ORDER_NOT_MET` | Pedido no alcanza monto mínimo | 422 | Total del pedido menor al mínimo configurado |
| `STORE_CLOSED` | Tienda cerrada | 422 | Intento de pedido fuera de horario |
| `PRODUCT_INACTIVE` | Producto inactivo | 422 | Intento de agregar producto desactivado |
| `INVALID_OPTION_SELECTION` | Selección de variantes inválida | 422 | Grupo requerido sin selección |

### Autenticación y Autorización (401/403)

| Código | Descripción | HTTP Status | Ejemplo |
| :--- | :--- | :--- | :--- |
| `UNAUTHORIZED` | Token ausente o inválido | 401 | Request sin header Authorization |
| `TOKEN_EXPIRED` | Token expirado | 401 | Access token vencido |
| `INVALID_TOKEN` | Token malformado | 401 | JWT con firma inválida |
| `FORBIDDEN` | Sin permisos para el recurso | 403 | Intento de acceder a recurso de otro tenant |
| `REFRESH_TOKEN_INVALID` | Refresh token inválido | 401 | Token de refresco no válido |

### Servidor (5xx)

| Código | Descripción | HTTP Status | Ejemplo |
| :--- | :--- | :--- | :--- |
| `INTERNAL_ERROR` | Error interno del servidor | 500 | Excepción no controlada |
| `DATABASE_ERROR` | Error de base de datos | 500 | Fallo de conexión a PostgreSQL |
| `UPLOAD_ERROR` | Error al subir archivo | 500 | Fallo de Cloudinary/S3 |
| `WEBSOCKET_ERROR` | Error de WebSocket | 500 | Fallo al emitir evento |

## Ejemplos de Respuestas de Error

### Error de Validación con Múltiples Campos
```json
{
  "success": false,
  "message": "Error de validación",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "name",
        "message": "El nombre es requerido",
        "value": ""
      },
      {
        "field": "price",
        "message": "El precio debe ser mayor a 0",
        "value": -100
      },
      {
        "field": "categoryId",
        "message": "Debe seleccionar una categoría válida",
        "value": null
      }
    ]
  }
}
```

### Error de Negocio
```json
{
  "success": false,
  "message": "No se puede eliminar la categoría",
  "error": {
    "code": "CATEGORY_HAS_PRODUCTS",
    "details": "La categoría 'Bebidas' tiene 12 productos asociados. Elimínelos o muévalos a otra categoría primero."
  }
}
```

### Error de Autenticación
```json
{
  "success": false,
  "message": "Token de acceso expirado",
  "error": {
    "code": "TOKEN_EXPIRED",
    "details": "Su sesión ha expirado. Por favor, inicie sesión nuevamente."
  }
}
```

### Error de Recurso No Encontrado
```json
{
  "success": false,
  "message": "Producto no encontrado",
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "details": "No existe un producto con el ID especificado o no pertenece a su tienda."
  }
}
```

## Implementación en NestJS

### Exception Filter Global
```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = 500;
    let message = 'Error interno del servidor';
    let code = 'INTERNAL_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse['message'] || message;
        code = exceptionResponse['code'] || code;
        details = exceptionResponse['details'] || null;
      }
    }

    response.status(status).json({
      success: false,
      message,
      error: {
        code,
        details
      }
    });
  }
}
```

### Lanzar Excepciones Personalizadas
```typescript
// En un servicio
if (!product) {
  throw new NotFoundException({
    message: 'Producto no encontrado',
    code: 'PRODUCT_NOT_FOUND',
    details: `No existe un producto con ID ${productId}`
  });
}

// Validación de negocio
if (category.productCount > 0) {
  throw new ConflictException({
    message: 'No se puede eliminar la categoría',
    code: 'CATEGORY_HAS_PRODUCTS',
    details: `La categoría tiene ${category.productCount} productos asociados`
  });
}
```

## Manejo en el Cliente (Next.js / React 19)

### Interceptores Globales y Redirección
El manejo de errores global se orquesta integrando la instancia de `apiClient` con un manejador visual de notificaciones (por ejemplo, `sonner`).

```typescript
// lib/api/error-handler.ts
import { toast } from 'sonner';

export function handleApiError(error: any, router: any) {
  const message = error.message || 'Ocurrió un error inesperado';
  const code = error.code;

  // Manejar códigos de error específicos de negocio
  switch (code) {
    case 'TOKEN_EXPIRED':
    case 'UNAUTHORIZED':
      toast.error('Sesión expirada', {
        description: 'Por favor, vuelva a iniciar sesión.',
      });
      router.push('/auth/login');
      break;

    case 'FORBIDDEN':
      toast.error('Acceso Denegado', {
        description: 'No tiene permisos para ver esta sección.',
      });
      break;

    case 'VALIDATION_ERROR':
      // Generalmente manejado por React Hook Form (setError)
      break;

    default:
      toast.error('Error del Sistema', {
        description: message,
      });
      console.error('[API_ERROR]:', error);
  }
}
```


## Logging de Errores

-   Todos los errores 5xx se loguean con stack trace completo
-   Errores 4xx se loguean solo con información básica (sin stack trace)
-   Se incluye `requestId` en cada log para trazabilidad
-   En producción, los detalles técnicos sensibles no se exponen al cliente
