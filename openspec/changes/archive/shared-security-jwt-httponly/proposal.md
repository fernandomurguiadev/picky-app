# Proposal: Migración de Auth a JWT en Cookies HttpOnly

## 1. Contexto y Problema
Actualmente, el token JWT de sesión se expone en el lado del cliente (frontend) y potencialmente se almacena en el almacenamiento de sesión o memoria reactiva que podría quedar expuesta a ataques de XSS (Cross-Site Scripting). Si un atacante inyecta un script malicioso en la aplicación, podría extraer el JWT y suplantar la identidad del comerciante o del cliente.

## 2. Solución Propuesta
Migrar el flujo de autenticación para que el backend (`api`) emita y valide el token JWT a través de cookies HTTP-Only, Secure y SameSite=Strict.
* El frontend (`app`) no podrá acceder al token vía JavaScript.
* El navegador adjuntará la cookie automáticamente en cada petición a la API.

## 3. Impacto en Multi-tenancy
El token JWT contiene el `tenant_id` del usuario (en el caso de administradores). Al enviar la cookie HTTP-Only, los interceptores RLS de NestJS seguirán extrayendo el `tenant_id` del payload decodificado del JWT en la cookie de la misma forma que lo hacían con el header `Authorization`.

## 4. Alternativas y Tradeoffs
* **Alternativa A (Header Authorization):** Más simple de testear en Postman, pero inseguro frente a XSS en navegadores.
* **Alternativa B (Cookies HttpOnly - Elegida):** Mayor seguridad. El único tradeoff es que requiere configurar correctamente CORS con `credentials: true` tanto en NestJS como en Next.js.
