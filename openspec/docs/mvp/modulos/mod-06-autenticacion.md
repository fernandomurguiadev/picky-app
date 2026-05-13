# MOD-06 — Autenticación y Seguridad

> Origen: Frontend Auth + Backend Auth Module
> Rutas: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`

---

## 3.17 Tabla de funcionalidades

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| AU-001 | Registro de comerciante | Formulario RHF+Zod: email, contraseña (min 8, indicador de fortaleza), nombre del negocio, teléfono. | /auth/register | 🔴 |
| AU-002 | Login | Email + contraseña. Remember me. Errores inline. Redirect a /admin/dashboard. | /auth/login | 🔴 |
| AU-003 | Middleware de protección | Next.js middleware protege todas las rutas /admin. Redirect a /auth/login si no autenticado. Guarda URL de retorno. | middleware.ts | 🔴 |
| AU-004 | JWT + Refresh Token | Access token 15min en memory (Zustand), refresh token 7d en httpOnly cookie. Interceptor Axios para renovar. | axios.ts interceptor | 🔴 |
| AU-005 | Logout | Limpiar tokens, estado Zustand y redirigir. Invalidar refresh en el servidor. | auth.store.ts | 🔴 |
| AU-006 | Recuperar contraseña | Form de email para solicitar reset. Página de nueva contraseña desde link de email. | /auth/forgot-password, /auth/reset-password | 🟡 |

---

## Middleware de protección de rutas admin (Next.js)

```typescript
// middleware.ts (agregar a la lógica del tenant resolver)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Proteger rutas admin
  if (pathname.startsWith('/admin')) {
    const accessToken = request.cookies.get('access-token')?.value
      || request.headers.get('authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verificación ligera del JWT (sin llamar al backend)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      if (payload.exp * 1000 < Date.now()) {
        // Token expirado — intentar refresh lo maneja el cliente via Axios interceptor
        // En middleware solo redirigimos si no hay token en absoluto
      }
    } catch {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ... lógica de tenant resolver (ver 01-arquitectura-frontend.md § 2.5)
}
```

> **Nota de seguridad:** Los tokens JWT nunca se almacenan en `localStorage` ni `sessionStorage`. El access token vive solo en memoria (Zustand). El refresh token viaja en una `httpOnly` cookie que el browser envía automáticamente. Ver también `lib/api/axios.ts` (interceptor de renovación) en [mod-04-configuracion.md](./mod-04-configuracion.md#314-manejo-de-sesión-expirada-durante-operación-nuevo--gap-de-v1).
