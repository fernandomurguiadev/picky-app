# Tasks: Migración de Auth a JWT en Cookies HttpOnly

## Phase 1: Backend Setup
- [ ] 1.1 Instalar y registrar `cookie-parser` en `api/src/main.ts`.
- [ ] 1.2 Actualizar `JwtStrategy` en `api/src/modules/auth/strategies/jwt.strategy.ts` para extraer el token desde las cookies (`req.cookies['access_token']`).
- [ ] 1.3 Modificar `AuthController` en `api/src/modules/auth/auth.controller.ts` para inyectar la cookie en el login y limpiarla en el logout.
- [ ] 1.4 Habilitar CORS con `credentials: true` y el origen correcto en NestJS (`main.ts`).

## Phase 2: Frontend Integration
- [ ] 2.1 Configurar Axios o el cliente de Fetch en el frontend (`app`) para usar `withCredentials: true`.
- [ ] 2.2 Actualizar el middleware de Next.js (`app/src/middleware.ts`) para usar la cookie en la protección de rutas.
- [ ] 2.3 Remover cualquier lógica de guardado/lectura del token de `localStorage` o `sessionStorage`.

## Phase 3: Verificación
- [ ] 3.1 Realizar login exitoso y comprobar la presencia de la cookie con flag `HttpOnly`.
- [ ] 3.2 Verificar que una petición posterior sin pasar el Bearer Header sea autenticada correctamente por la cookie.
- [ ] 3.3 Validar que el logout limpie la cookie de forma efectiva.
