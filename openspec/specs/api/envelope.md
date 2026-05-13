# Formato de Respuesta (Envelope)

Todas las respuestas de la API seguirán una estructura estandarizada para facilitar el manejo consistente en el cliente.

## Estructura General

```json
{
  "success": true,       // Indicador booleano de éxito
  "message": "string",   // Mensaje legible (opcional en éxito, obligatorio en error)
  "data": { ... },       // Payload de respuesta (presente en éxito)
  "error": { ... },      // Detalles de error (solo si success: false)
  "meta": { ... }        // Metadatos adicionales (paginación, timestamps, etc.)
}
```

## Ejemplos de Respuestas Exitosas

### Recurso Individual
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Milanesa Napolitana",
    "price": 2500,
    "isActive": true,
    "createdAt": "2026-02-23T14:35:22.123Z"
  }
}
```

### Lista de Recursos (sin paginación)
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "Categoría 1"
    },
    {
      "id": "uuid-2",
      "name": "Categoría 2"
    }
  ]
}
```

### Lista Paginada
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
    "itemsPerPage": 20
  }
}
```

### Creación Exitosa (201 Created)
```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Nuevo Producto",
    "createdAt": "2026-02-23T14:35:22.123Z"
  }
}
```

### Operación sin Contenido (204 No Content)
No se envía body. Solo código HTTP 204.

## Ejemplos de Respuestas de Error

### Error de Validación (400 Bad Request)
```json
{
  "success": false,
  "message": "Error de validación",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "name",
        "message": "El nombre es requerido"
      },
      {
        "field": "price",
        "message": "El precio debe ser mayor a 0"
      }
    ]
  }
}
```

### Error de Autenticación (401 Unauthorized)
```json
{
  "success": false,
  "message": "Token inválido o expirado",
  "error": {
    "code": "UNAUTHORIZED",
    "details": "El token de acceso ha expirado. Por favor, renueve su sesión."
  }
}
```

### Error de Autorización (403 Forbidden)
```json
{
  "success": false,
  "message": "No tiene permisos para realizar esta acción",
  "error": {
    "code": "FORBIDDEN",
    "details": "Acceso denegado al recurso solicitado"
  }
}
```

### Recurso No Encontrado (404 Not Found)
```json
{
  "success": false,
  "message": "Producto no encontrado",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "details": "No existe un producto con el ID especificado"
  }
}
```

### Error de Conflicto (409 Conflict)
```json
{
  "success": false,
  "message": "No se puede eliminar la categoría",
  "error": {
    "code": "CATEGORY_HAS_PRODUCTS",
    "details": "La categoría tiene 5 productos asociados. Elimínelos primero."
  }
}
```

### Error de Negocio (422 Unprocessable Entity)
```json
{
  "success": false,
  "message": "El pedido no cumple con el monto mínimo",
  "error": {
    "code": "MINIMUM_ORDER_NOT_MET",
    "details": "El monto mínimo de pedido es $1000. Total actual: $750"
  }
}
```

### Error del Servidor (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": {
    "code": "INTERNAL_ERROR",
    "details": "Ha ocurrido un error inesperado. Por favor, intente nuevamente."
  }
}
```

## Campos del Envelope

### Campo `success`
-   **Tipo**: Boolean
-   **Obligatorio**: Sí
-   **Descripción**: Indica si la operación fue exitosa

### Campo `message`
-   **Tipo**: String
-   **Obligatorio**: En errores sí, en éxito opcional
-   **Descripción**: Mensaje legible para el usuario

### Campo `data`
-   **Tipo**: Object | Array | null
-   **Obligatorio**: En respuestas exitosas (excepto 204)
-   **Descripción**: Payload de la respuesta

### Campo `error`
-   **Tipo**: Object
-   **Obligatorio**: Solo en errores
-   **Estructura**:
    -   `code`: String - Código de error interno (UPPER_SNAKE_CASE)
    -   `details`: String | Array - Información adicional del error

### Campo `meta`
-   **Tipo**: Object
-   **Obligatorio**: No
-   **Uso**: Metadatos como paginación, timestamps, información de rate limiting
-   **Campos comunes**:
    -   `itemCount`: Cantidad de items en la página actual
    -   `totalItems`: Total de items disponibles
    -   `totalPages`: Total de páginas
    -   `currentPage`: Página actual
    -   `itemsPerPage`: Items por página

## Manejo en el Cliente (Next.js / React 19)

### Tipado del Envelope en TypeScript
```typescript
// lib/api/types.ts
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    itemCount: number;
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details: string | any[];
  };
}
```

### Configuración de Instancia Axios
```typescript
// lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Enviar cookies HttpOnly automáticamente
});

// Interceptor de Respuesta para desempaquetar automáticamente el "data" del envelope
apiClient.interceptors.response.use(
  (response) => {
    // Si la respuesta tiene la estructura de envelope, devolver directamente data
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    // Formatear el error para propagar el mensaje y código de negocio
    const apiError = error.response?.data as ApiErrorResponse | undefined;
    return Promise.reject({
      message: apiError?.message || 'Ocurrió un error inesperado',
      code: apiError?.error?.code || 'NETWORK_ERROR',
      status: error.response?.status || 500,
      details: apiError?.error?.details,
    });
  }
);
```

