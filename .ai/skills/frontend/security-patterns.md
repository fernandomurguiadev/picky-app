---
name: security-patterns
description: Patrones de seguridad reales del frontend PickyApp-App (Next.js 15). BFF pattern, sesión AES-256-GCM en cookie httpOnly, guards de middleware, validación Zod. Usar antes de tocar auth, sesiones, API routes o manejo de tokens.
version: "1.0"
used_by: security-agent, frontend-agent
---

# Security Patterns — Frontend (Next.js 15)

Basado en el código real de `app/`. Todos los paths son verificados.

---

## 1. BFF Pattern — cómo funciona la auth

El frontend **nunca** llama directamente al backend. Toda la auth pasa por Route Handlers de Next.js que actúan como BFF (Backend For Frontend).

```
Browser
  ↓  POST /api/auth/login
Next.js BFF (Route Handler)
  ↓  Llama beLoginSlug() con Bearer + X-Tenant-Key
PickyApp API (localhost:4000)
  ↓  Retorna accessToken + refreshToken
BFF encripta accessToken → cookie httpOnly
  ↓  Retorna datos públicos al browser (sin token)
```

### Route Handlers BFF
| Endpoint BFF | Archivo |
|---|---|
| `POST /api/auth/login` | `src/app/api/auth/login/route.ts` |
| `POST /api/auth/logout` | `src/app/api/auth/logout/route.ts` |
| `GET /api/auth/session` | `src/app/api/auth/session/route.ts` |
| `POST /api/backoffice/auth/login` | `src/app/api/backoffice/auth/login/route.ts` |
| `POST /api/backoffice/auth/logout` | `src/app/api/backoffice/auth/logout/route.ts` |
| `GET /api/backend/[...path]` | `src/app/api/backend/[...path]/route.ts` (proxy con refresh) |

---

## 2. Session Manager — encriptación de sesión

```typescript
// src/lib/session-manager.ts
// Algoritmo: AES-256-GCM
// Env requerida: SESSION_ENCRYPTION_KEY (32 bytes hex)
// Formato cookie: ${iv.hex}:${authTag.hex}:${encrypted.hex}
```

### Cookie de sesión
```typescript
{
  httpOnly: true,
  secure: true,            // NODE_ENV === 'production'
  sameSite: 'strict',
  path: '/',
  maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60  // 1 mes vs 1 hora
}
```

### Payload encriptado en cookie (nunca expuesto al browser)
```typescript
{
  accessToken: string,
  userId: string,
  email: string,
  role: string,
  scope: 'backoffice' | 'tenant',
  expiresAt: number
}
```

### Funciones clave
```typescript
getServerSession(scope: 'backoffice' | 'tenant')   // Server Components / Route Handlers
getSessionFromRequest(request: NextRequest)          // Middleware
getValidBackofficeSession(request)                   // Con verificación de rol
```

---

## 3. Middleware y guards de rutas

### Proxy principal
```typescript
// src/proxy.ts — se ejecuta en middleware de Next.js
// Matcher: /((?!_next/static|_next/image|favicon.ico|api/).*)
```

### Backoffice guard (`/backoffice/*`)
```typescript
// src/middlewares/backoffice-guard.ts
// Rutas públicas (no requieren sesión):
const BACKOFFICE_PUBLIC_PATHS = new Set([
  '/backoffice/login',
  '/backoffice/forgot-password',
  '/backoffice/activate',
]);
// Si sin sesión → redirect /backoffice/login
```

### Tenant/Slug guard (`/{slug}/*`)
```typescript
// src/middlewares/slug-guard.ts
// Validación formato slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// Rutas públicas: /{slug}/login, /{slug}/register
// Con sesión en ruta pública → redirect /{slug}/dashboard
// Sin sesión en ruta protegida → redirect /{slug}/login
```

---

## 4. Autorización en API Routes

### Patrón estándar (verificado en código real)
```typescript
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = getValidBackofficeSession(request);

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const GET_ALLOWED_ROLES = [PlatformRole.SUPER_ADMIN, PlatformRole.ADMIN_TENANT];
  if (!GET_ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  // Usar session.accessToken para llamada al backend
  const data = await beGet(`/resource`, session.accessToken);
  return NextResponse.json(data);
}
```

### Reglas
- Siempre validar sesión antes de cualquier lógica.
- 401 para sin sesión, 403 para rol insuficiente.
- Limpiar cookie si el backend retorna 401 (token expirado).
- Validar body con Zod antes de procesar: `Schema.safeParse(body)`.

---

## 5. Almacenamiento de tokens — reglas absolutas

| Almacenamiento | Tokens JWT | Razón |
|---|---|---|
| `localStorage` | ❌ NUNCA | Vulnerable a XSS |
| `sessionStorage` | ❌ NUNCA | Vulnerable a XSS |
| Cookie httpOnly | ✅ SIEMPRE | Inaccesible desde JS |
| Zustand sin persist | ✅ OK para metadatos públicos | No sobrevive recarga |
| Zustand con persist | ⚠️ Solo datos no sensibles | Ver advertencia abajo |

### ⚠️ Deuda técnica detectada
```typescript
// src/store/auth.store.ts — USA persist con localStorage
// Almacena: user data (id, email, name, role, isAuthenticated)
// Riesgo: metadatos de usuario en localStorage
// Acción correctiva: remover persist o pasar a sessionStorage
```

### Store seguro de referencia
```typescript
// src/store/tenant-session.store.ts
// Intencionalmente SIN persist para evitar datos sensibles en localStorage
// Contiene: tenantId, tenantName, userId, isAuthenticated
// NO contiene: accessToken, refreshToken
```

---

## 6. Token refresh automático

```typescript
// src/app/api/backend/[...path]/route.ts
// Detecta tokens próximos a expirar (< 5 minutos antes de exp)
// Llama beRefreshToken() / beRefreshTokenSlug()
// Actualiza cookie sin exponer el nuevo token al browser
// Si refresh falla → limpia sesión y retorna 401
```

---

## 7. Validación de formularios

### Stack obligatorio
- React Hook Form + Zod + `@hookform/resolvers/zod`.
- Siempre `noValidate` en el `<form>` (previene validación HTML5 inconsistente).
- Aria attributes en campos con error: `aria-invalid`, `aria-describedby`.

### Schemas de auth (verificados)
```typescript
// src/schemas/auth.ts
LoginSchema: email + password (>= 8 chars)
RegisterSchema:
  fullName: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/ (2-120 chars)
  email: validación nativa Zod
  phone: /^\+?[0-9\s\-().]+$/
  birthDate: YYYY-MM-DD + edad >= 18 (RN-REG-14)
  dni: /^[A-Za-z0-9\-]+$/ (6-20 chars)
  password: >= 8 chars
  confirmPassword: .refine() que coincida con password
  acceptTerms: z.literal(true) requerido

// src/schemas/backoffice-auth.ts
BackofficeLoginSchema: email + password
```

### Mensajes de error — anti-enumeración
- Login: respuesta genérica "Credenciales incorrectas" tanto para usuario no encontrado como para contraseña incorrecta.
- No revelar si el email existe o no.

---

## 8. XSS — reglas de prevención

- **`dangerouslySetInnerHTML`**: ❌ prohibido. No existe en el codebase actual — mantenerlo así.
- Todo contenido dinámico renderizado por React está escapado por defecto.
- Inputs de usuario → siempre validar con Zod antes de enviar al servidor.
- No usar `eval()`, `Function()`, `innerHTML`, `document.write()`.

---

## 9. Variables de entorno

| Variable | Visibilidad | Contenido |
|---|---|---|
| `SESSION_ENCRYPTION_KEY` | Server-only | Clave AES-256-GCM (32 bytes hex) |
| `PICKYAPP_API_URL` | Server-only | URL backend (nunca exponer al cliente) |
| `NEXT_PUBLIC_API_URL` | Pública | Solo URL del BFF propio |

### Reglas
- Nunca agregar `NEXT_PUBLIC_` a variables que contengan secrets, URLs internas o claves.
- `getBackendUrl()` en `src/lib/api-config.ts` valida que `PICKYAPP_API_URL` esté configurada antes de cada llamada.

---

## 10. CSRF y headers de seguridad

### Estado actual
- Protección CSRF: mitigada por `sameSite: 'strict'` en cookies. Sin tokens CSRF explícitos.
- CSP: ❌ no configurado en `next.config.ts`.

### Implementación recomendada para `next.config.ts`
```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }];
}
```

---

## 11. API Client — reglas de uso

```typescript
// src/services/http-service/api-client.ts
// credentials: 'include' — envía cookies automáticamente
// NUNCA pasar el token como query param o body field
// NUNCA llamar directamente a PICKYAPP_API_URL desde el browser
// Siempre usar /api/backend/[path] (proxy BFF)
```

---

## 12. Checklist de seguridad — feature nueva

Antes de implementar cualquier feature que toque auth o datos de usuario:

- [ ] ¿La ruta necesita protección? → agregar al guard correspondiente (`backoffice-guard.ts` o `slug-guard.ts`)
- [ ] ¿Es un Route Handler? → llamar `getValidBackofficeSession()` o `getServerSession()` primero
- [ ] ¿Acepta un rol específico? → validar `session.role` contra lista permitida
- [ ] ¿Llama al backend? → usar `beGet/bePost/bePatch/beDelete` con `session.accessToken`
- [ ] ¿Almacena algo en el cliente? → nunca tokens, nunca PII sensible en Zustand con persist
- [ ] ¿Renderiza input del usuario? → sin `dangerouslySetInnerHTML`
- [ ] ¿Formulario? → React Hook Form + Zod + `noValidate`
- [ ] ¿Agrega env var? → si contiene secret → sin `NEXT_PUBLIC_`
- [ ] ¿Server Action nueva? → validar sesión al inicio de la función
