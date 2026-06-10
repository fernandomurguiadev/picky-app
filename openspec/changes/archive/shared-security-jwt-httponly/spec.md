# Spec: JWT en Cookies HttpOnly

## 1. Requisitos Funcionales
* **RF-1.01 (Login Seguro):** Al hacer login exitoso, la API debe responder con la cookie `access_token` configurada como `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, y un tiempo de expiración adecuado.
* **RF-1.02 (Logout y Limpieza):** El endpoint `/auth/logout` debe invalidar/limpiar la cookie seteando su expiración en el pasado.
* **RF-1.03 (Persistencia de Sesión):** Al recargar el frontend, las peticiones deben viajar con la cookie de autenticación de forma transparente.
* **RF-1.04 (Refresh Token seguro):** Si se usa refresh token, se debe almacenar en otra cookie HttpOnly (`refresh_token`) con el path restringido a `/auth/refresh`.

## 2. Modelos de Datos
El payload del token JWT no cambia:
```typescript
interface JwtPayload {
  sub: string; // userId
  email: string;
  tenantId?: string; // opcional para admin
  roles: string[];
}
```

## 3. Criterios de Aceptación (CA)
* **CA-1:** Al inspeccionar `document.cookie` desde la consola del navegador, no debe ser posible leer el `access_token`.
* **CA-2:** La API debe rechazar requests sin la cookie de sesión válida devolviendo un código de error `401 Unauthorized`.
* **CA-3:** Las llamadas locales de desarrollo y producción deben tener soporte CORS con `credentials: true`.
