# Autenticación

## Visión General
El sistema utiliza JWT (JSON Web Token) con estrategia de Access Token + Refresh Token para autenticación de comerciantes en el panel administrador. La tienda pública no requiere autenticación.

## Estrategia de Tokens

### Access Token
-   **Formato**: JWT firmado con HS256
-   **Vida útil**: 15 minutos
-   **Almacenamiento**: Memoria del cliente (variable en AuthService)
-   **Contenido**: `{ userId, tenantId, email, iat, exp }`

### Refresh Token
-   **Formato**: Token opaco (UUID v4)
-   **Vida útil**: 7 días
-   **Almacenamiento**: Cookie HttpOnly, Secure, SameSite=Strict
-   **Persistencia**: Almacenado en base de datos con hash

## Flujos de Autenticación

### 1. Registro (Sign Up)
-   **Endpoint**: `POST /auth/register`
-   **Payload**:
```json
{
  "email": "comercio@example.com",
  "password": "SecurePass123!",
  "storeName": "Mi Comercio",
  "phone": "+54 9 11 1234-5678"
}
```
-   **Respuesta**: `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "comercio@example.com",
      "tenantId": "uuid"
    },
    "accessToken": "eyJhbGc..."
  }
}
```
-   **Nota**: El refresh token se envía automáticamente como cookie HttpOnly

### 2. Inicio de Sesión (Login)
-   **Endpoint**: `POST /auth/login`
-   **Payload**:
```json
{
  "email": "comercio@example.com",
  "password": "SecurePass123!"
}
```
-   **Respuesta**: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "comercio@example.com",
      "tenantId": "uuid",
      "storeName": "Mi Comercio"
    },
    "accessToken": "eyJhbGc..."
  }
}
```

### 3. Renovación de Token (Refresh)
-   **Endpoint**: `POST /auth/refresh`
-   **Headers**: Cookie con refresh_token (automático)
-   **Mecanismo**: El interceptor detecta 401 y llama automáticamente a este endpoint
-   **Respuesta**: `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

### 4. Cierre de Sesión (Logout)
-   **Endpoint**: `POST /auth/logout`
-   **Headers**: `Authorization: Bearer <access_token>`
-   **Acción**: Invalida el refresh token en base de datos y limpia la cookie
-   **Respuesta**: `200 OK`
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

## Manejo de Errores

-   **401 Unauthorized**: Credenciales inválidas o token expirado
-   **403 Forbidden**: Token válido pero sin permisos
-   **422 Unprocessable Entity**: Validación de datos fallida

## Seguridad

-   Contraseñas hasheadas con bcrypt (salt rounds: 10)
-   Refresh tokens hasheados en base de datos
-   Rate limiting: 5 intentos de login por IP cada 15 minutos
-   CORS configurado para dominios permitidos únicamente
