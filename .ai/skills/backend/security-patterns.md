---
name: security-patterns
description: Patrones de seguridad reales del backend PickyApp-API (NestJS). JWT RS256, guards de auth/RLS/roles, blacklist Redis, rate limiting, crypto AES-256-GCM. Usar antes de implementar cualquier endpoint protegido.
version: "1.0"
used_by: security-agent, backend-agent
---

# Security Patterns — Backend (NestJS)

Basado en el código real de `api/`. Todos los paths son verificados.

---

## 1. Autenticación JWT

### Algoritmo y claves
- **RS256** (nunca HS256).
- Clave primaria: **HashiCorp Vault** KV-v2 en `secret/jwt/keys`.
- Fallback: `./secrets/jwt-private.pem` / `./secrets/jwt-public.pem`.
- Config: `src/modules/auth/config/jwt.config.ts`.

### TTL
| Token | Duración |
|-------|----------|
| Access token | 60 min (3600s) |
| Refresh token | 7 días (604800s) |

### JwtPayload — campos clave
```typescript
// src/modules/auth/interfaces/jwt-payload.interface.ts
interface JwtPayload {
  sub: string;             // User UUID
  role: string;            // UserRole
  platform_role?: string;  // PlatformRole canonicalizado
  tenant_id: string | null; // null = super admin
  org_id: string | null;
  external_user_ref?: string; // ID jugador en tenant externo
  fp?: string;             // Device fingerprint hash
  jti: string;             // UUID v4 — soporte revocación granular
  iat: number;
  exp: number;
}
```

### Refresh token cookie
```typescript
{
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'strict',
  path: '/auth/refresh',   // scoped — no expuesto en toda la app
  maxAge: 604800000,       // 7 días en ms
}
```

---

## 2. Guards — cuándo usar cada uno

| Guard | Path | Cuándo aplicar |
|-------|------|----------------|
| `JwtAuthGuard` | `src/modules/auth/guards/jwt-auth.guard.ts` | Todo endpoint autenticado |
| `RolesGuard` | `src/modules/auth/guards/roles.guard.ts` | Restricción por rol + `@Roles(...)` |
| `TenantContextGuard` | `src/modules/auth/guards/tenant-context.guard.ts` | Endpoints tenant — valida `tenant_id` de JWT contra header `X-Tenant-Key` |
| `RequireTenantContextGuard` | `src/modules/auth/guards/require-tenant-context.guard.ts` | Endpoints solo para usuarios regulares — rechaza super admins explícitamente |
| `ManagerTenantsGuard` | `src/modules/integrations/guards/manager-tenants.guard.ts` | ADMIN_TENANT solo accede a su tenant |
| `SuperAdminGuard` | `src/modules/integrations/guards/super-admin.guard.ts` | Requiere `platform_role === SUPER_ADMIN` |
| `DevOnlyGuard` | `src/common/guards/dev-only.guard.ts` | Bloquea si `NODE_ENV === 'production'` |

### Decoradores de auth
```typescript
// src/common/decorators/current-user.decorator.ts
@CurrentUser()  // → JwtPayload completo

// src/common/decorators/current-tenant.decorator.ts
@CurrentTenant()  // → tenant_id del JWT (null para super admin)

// src/common/decorators/skip-rls.decorator.ts
@SkipRls()  // → excluye del RLS interceptor (login, refresh, health)

// src/modules/auth/decorators/roles.decorator.ts
@Roles(PlatformRole.SUPER_ADMIN, UserRole.ADMIN_TENANT)
```

### Enums de roles
```typescript
// src/common/enums.ts
enum PlatformRole { SUPER_ADMIN, SUPPORT_GLOBAL, ADMIN_TENANT }
enum UserRole { ADMIN_TENANT, ADMIN_AGENTE, ADMIN_SUB_AGENTE, JUGADOR, SOPORTE_DISPUTAS }
```

### Patrón típico de controller
```typescript
@UseGuards(JwtAuthGuard, RolesGuard, TenantContextGuard)
@Roles(UserRole.ADMIN_TENANT)
@Post('/')
async create(@CurrentUser() user: JwtPayload) { ... }
```

---

## 3. RLS (Row-Level Security) multi-tenant

### Mecanismo
- `src/common/interceptors/rls.interceptor.ts`
- Ejecuta `SET LOCAL app.current_tenant_id = '${tenantId}'` en transacción PostgreSQL por request.
- Políticas DB filtran datos por `tenant_id` automáticamente (BYPASSRLS para `super_admin` en DB).

### Flujo del interceptor
1. Si `@SkipRls()` → skip.
2. Si `role === 'super_admin'` → skip.
3. Validar UUID format del `tenant_id` (previene SQL injection).
4. `StartTransaction` → `SET LOCAL` → handler → `COMMIT / ROLLBACK`.
5. Exponer `request.rlsQueryRunner` para servicios que necesitan la misma conexión.
6. Si no hay `tenant_id` y no es super admin → `ForbiddenException`.

### Reglas innegociables
- Toda entidad multi-tenant: `tenant_id` como **primer campo del índice compuesto**.
- Nunca usar `dataSource.createQueryBuilder()` sin el `rlsQueryRunner` en contexto multi-tenant.
- Usar `@SkipRls()` solo en: login, refresh, health, endpoints explícitamente públicos.

---

## 4. Blacklist y gestión de sesiones

### Token blacklist
```typescript
// src/modules/auth/services/session-blacklist.service.ts
// Redis key: blacklist:${sha256(token)}
// TTL = segundos hasta expiración del token
// Fail-unsafe: lanza ServiceUnavailableException si Redis está down
```

### Session concurrency limits
```typescript
// src/modules/auth/services/sessions.service.ts
// Límites por rol:
SUPER_ADMIN: 1 sesión activa
ADMIN_TENANT: 1 sesión activa
SUPPORT: 1 sesión activa
JUGADOR: Infinity
// enforceConcurrencyLimit() revoca sesiones antiguas al superar el límite
```

### Session entity tracking
- Tabla: `session` en PostgreSQL.
- Campos: `token_hash` (SHA256), `ip_address`, `user_agent`, `expires_at`, `last_activity_at`, `revoked`.
- Device fingerprinting habilitado: `src/modules/auth/services/fingerprint.service.ts`.

---

## 5. Rate limiting

### Re-entry rate limit
```typescript
// src/common/redis/rate-limit.helper.ts
// Límite: 5 intentos por userId+tenantId en 300s (sliding window)
// Lua script atómico: INCR + EXPIRE
// Key: reentry:${userId}:${tenantId}
// Error code: AUTH.REENTRY_RATE_LIMIT (429)
// Fail-closed: si Redis unavailable → trata como límite alcanzado
```

### Gaps conocidos
- ⚠️ No hay throttling global en endpoints públicos de auth (login, register).
- Recomendación: agregar `@nestjs/throttler` en `AuthModule` para login/register.

---

## 6. Crypto

### CryptoService
```typescript
// src/common/crypto/crypto.service.ts
// Algoritmo: AES-256-GCM (authenticated encryption)
// Key derivation: scryptSync(secret, 'pickyapp-salt', 32) — determinístico
// IV: 12 bytes random por encriptación
// Formato: ${iv.hex}:${authTag.hex}:${encrypted.hex}
```

### Token hashing
- SHA256 del token raw para blacklist y session tracking.
- No salted (el token incluye suficiente entropía por ser JWT).
- Ubicaciones: `JwtStrategy`, `SessionsService`, `SessionBlacklistService`.

---

## 7. Validación de input

```typescript
// main.ts — ValidationPipe global
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
// whitelist: true → rechaza propiedades no declaradas en DTO
// transform: true → convierte tipos automáticamente
```

### DTOs de auth
```typescript
// login.dto.ts: @IsEmail(), @IsString() @MinLength(8) @MaxLength(128)
// register.dto.ts: @IsEmail() @IsNotEmpty(), @IsString() @MinLength(6)
```

### Env validation
- `src/config/env.validation.ts` — `EnvironmentVariables` con class-validator.
- `validateSync()` al bootstrap — lanza error si config inválida.

---

## 8. CORS y headers de seguridad

### Estado actual
```typescript
// main.ts — CORS permisivo (⚠️ deuda técnica)
app.enableCors({ origin: true, credentials: true, exposedHeaders: '*' });
```

### Corrección recomendada para producción
```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Key', 'X-Request-ID'],
});
```

### ❌ Sin Helmet.js
- No hay implementación de Helmet (CSP, X-Frame-Options, HSTS).
- Agregar para producción: `app.use(helmet({ hsts: { maxAge: 31536000 } }))`.

---

## 9. Error codes de auth

```typescript
// src/modules/auth/errors/auth.error-codes.ts
AUTH.INVALID_CREDENTIALS   (401)
AUTH.USER_INACTIVE          (403)
AUTH.USER_NOT_FOUND         (404)
AUTH.TOKEN_EXPIRED          (401)
AUTH.TOKEN_INVALID          (401)
AUTH.TOKEN_REVOKED          (401)
AUTH.INSUFFICIENT_PERMISSIONS (403)
AUTH.FORBIDDEN_TENANT       (403)
AUTH.FINGERPRINT_MISMATCH   (401)
AUTH.TENANT_MISMATCH        (403)
AUTH.TENANT_KEY_REQUIRED    (400)
AUTH.USER_BLOCKED           (403)
AUTH.REENTRY_RATE_LIMIT     (429)
AUTH.REFRESH_TOKEN_INVALID  (401)
AUTH.REFRESH_TOKEN_EXPIRED  (401)
```

**Regla**: usar siempre estos códigos. Nunca lanzar `new Error()` ni `HttpException` cruda en módulos de auth.

---

## 10. Checklist de seguridad — endpoint nuevo

Antes de implementar un endpoint protegido:

- [ ] ¿Necesita `JwtAuthGuard`? (casi siempre sí)
- [ ] ¿Qué roles permites? → `@Roles(...)` + `RolesGuard`
- [ ] ¿Es multi-tenant? → `TenantContextGuard` + `TenantInterceptor` activo (no poner `@SkipRls()`)
- [ ] ¿Solo usuarios regulares? → `RequireTenantContextGuard` (rechaza super admins)
- [ ] ¿Necesita `rlsQueryRunner`? → inyectar via `@Req() req` → `req.rlsQueryRunner`
- [ ] ¿Expone datos de sesión/token? → nunca en response body, solo en cookie httpOnly
- [ ] ¿Acepta inputs del usuario? → DTO con class-validator + `whitelist: true`
- [ ] ¿Error de auth? → usar códigos de `auth.error-codes.ts` vía `BusinessException`
- [ ] ¿Es un endpoint de admin? → `SuperAdminGuard` o `ManagerTenantsGuard`
- [ ] ¿Es solo para desarrollo? → `DevOnlyGuard`
