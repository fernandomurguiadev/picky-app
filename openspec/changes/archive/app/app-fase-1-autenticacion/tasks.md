# Tasks — app-fase-1-autenticacion

## Fase de implementación: FASE 1 — Módulo de Autenticación

**Prerequisito:** FASE 0 completada (setup base + shared components).

---

### FE1.1 — Página `/auth/login`

- [x] Crear `app/auth/login/page.tsx` como Client Component
- [x] Formulario RHF + Zod: email, password
- [x] `noValidate` en el `<form>`
- [x] Errores inline bajo cada campo
- [x] Submit llama `POST /api/auth/login` (BFF)
- [x] Éxito: guarda token en `useAuthStore`, redirect a `returnUrl` o `/admin/dashboard`
- [x] Error 401: muestra mensaje inline ("Credenciales inválidas")

**Criterio de done:** Login exitoso redirige. Error 401 muestra mensaje inline.

---

### FE1.2 — Página `/auth/register`

- [x] Crear `app/auth/register/page.tsx` como Client Component
- [x] Formulario RHF + Zod: email, password, nombre del negocio, teléfono
- [x] Indicador de fortaleza de contraseña
- [x] Submit llama `POST /api/auth/register` (BFF)
- [x] Éxito: redirect a `/admin/dashboard`

**Criterio de done:** Registro crea tenant + user. Redirige a dashboard.

---

### FE1.3 — Middleware: protección rutas `/admin/*`

- [x] Leer `refreshToken` cookie httpOnly en `middleware.ts`
- [x] Sin cookie → redirect a `/auth/login?returnUrl=<ruta>`
- [x] Con cookie válida → dejar pasar

**Criterio de done:** `/admin/dashboard` sin cookie → redirect a login.

---

### FE1.4 — Middleware: resolver `slug → tenantId`

- [x] Para rutas `/(store)/[slug]/*`, llamar `GET /stores/:slug/tenant-id`
- [x] Slug válido → adjuntar header `x-tenant-id` al request
- [x] Slug inválido → redirect a `/not-found`

**Criterio de done:** Slug inválido → redirect a 404.

---

### FE1.5 — Interceptor Axios 401

- [x] En `apiBff`, interceptar respuesta 401
- [x] Llamar `POST /api/auth/refresh` para obtener nuevo access token
- [x] Actualizar token en `useAuthStore`
- [x] Reintentar el request original con el nuevo token
- [x] Si refresh falla → redirect a login

**Criterio de done:** Request fallida por token expirado se reintenta automáticamente.

---

### FE1.6 — Logout

- [x] En `useAuthStore`, función `clearAuth()` limpia el token de memoria
- [x] Logout llama `POST /api/auth/logout` (limpia cookie httpOnly)
- [x] Redirect a `/auth/login`

**Criterio de done:** Token limpiado de memoria. Cookie limpiada por el backend.

---

### FE1.7 — Páginas forgot-password y reset-password

- [x] Crear `app/auth/forgot-password/page.tsx`
- [x] Crear `app/auth/reset-password/page.tsx`
- [x] Formulario RHF + Zod en cada una
- [x] Flujo completo: enviar email → recibir token → nueva contraseña

**Criterio de done:** Flujo completo de recuperación de contraseña.

---

### FE1.8 — WebSocket: evento `session-expired`

- [x] Crear `lib/hooks/use-websocket.ts`
- [x] Al recibir evento `session-expired`: toast de aviso + redirect a `/auth/login`

**Criterio de done:** Si el servidor emite `session-expired`, se redirige a login.

---

### FE1.9 — Route Handlers BFF (auth)

- [x] Crear `app/api/auth/login/route.ts` → proxy a `POST /api/v1/auth/login`, setea cookie httpOnly
- [x] Crear `app/api/auth/register/route.ts` → proxy a `POST /api/v1/auth/register`
- [x] Crear `app/api/auth/refresh/route.ts` → proxy a `POST /api/v1/auth/refresh`
- [x] Crear `app/api/auth/logout/route.ts` → proxy a `POST /api/v1/auth/logout`, limpia cookie
- [x] Crear `app/api/backend/[...path]/route.ts` → proxy genérico con Bearer token

**Criterio de done:** Browser nunca llama directamente al backend. Todo pasa por BFF.
