---
name: auth-patterns
description: >
  Patrones de autenticación y autorización JWT RS256 en PickyApp API.
  Guards, decoradores, JwtPayload, PlatformRole, Vault y fingerprint.
version: "1.0"
used_by:
  - backend-agent   # implementación de endpoints protegidos
  - security-agent  # (futuro) auditoría y hardening de auth
last_reviewed: 2026-05-05
---

# Auth Patterns — PickyApp API

## JWT con RS256 + Vault

- **Algoritmo**: RS256 (asymmetric — clave privada firma, clave pública verifica)
- **Clave privada**: Vault KV-v2 (`/secret/data/jwt/keys`) o filesystem (`./secrets/jwt-private.pem`)
- **Fallback**: Si `VAULT_ENABLED=false`, carga desde filesystem
- **Caching**: Claves cacheadas en memoria tras primer carga

### JwtPayload — campos disponibles en request.user

```typescript
interface JwtPayload {
  sub: string;                   // User ID (UUID)
  platform_role: string;         // 'super_admin' | 'admin_tenant' | 'agente' | 'jugador'
  tenant_id: string | null;      // null para super_admin
  org_id: string | null;
  external_user_ref?: string;    // ID del jugador en sistema externo del tenant
  fp?: string;                   // Fingerprint hash del dispositivo
  jti: string;                   // JWT ID único (para revocación)
  iat: number;
  exp: number;
}
```

---

## Guards disponibles

```typescript
// Solo autenticación (verifica firma JWT + blacklist + fingerprint)
@UseGuards(JwtAuthGuard)

// Autenticación + verificación de rol
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.SUPER_ADMIN)

// Autenticación + tenant_id requerido en JWT (lanza 403 si es null)
@UseGuards(JwtAuthGuard, RequireTenantContextGuard)

// Endpoint público — sin auth, sin RLS
@SkipRls()
// No agregar @UseGuards en endpoints públicos
```

### Lo que hace JwtAuthGuard internamente

1. Extrae token del header `Authorization: Bearer <token>`
2. Verifica firma RS256 con clave pública
3. Computa `SHA-256(rawToken)` y verifica contra `session_blacklist` en Redis
4. Valida fingerprint del dispositivo (si `FINGERPRINT_ENABLED=true`)
5. Actualiza `last_activity` de la sesión
6. Normaliza `payload.platform_role` a lowercase
7. Inyecta el payload en `request.user`

---

## Decoradores de parámetros

```typescript
// Extrae JwtPayload completo
@CurrentUser() user: JwtPayload

// Extrae tenant_id del JWT
@CurrentTenant() tenantId: string

// Marca ruta como pública (bypass de TenantInterceptor)
@SkipRls()
```

**Ubicaciones**:
- `src/common/decorators/current-user.decorator.ts`
- `src/common/decorators/current-tenant.decorator.ts`
- `src/common/decorators/skip-rls.decorator.ts`

---

## PlatformRole — enum canónico

```typescript
// src/modules/users/enums/user-role.enum.ts
enum PlatformRole {
  SUPER_ADMIN    = 'super_admin',
  ADMIN_TENANT   = 'admin_tenant',
  SUPPORT_GLOBAL = 'support_global',
  AGENTE         = 'agente',
  JUGADOR        = 'jugador',
}
```

### Reglas de acceso por rol

| Rol | tenant_id en JWT | RLS | Notas |
|-----|-----------------|-----|-------|
| `super_admin` | `null` | Bypass (BYPASSRLS PostgreSQL) | Acceso total |
| `admin_tenant` | UUID del tenant | Activo | Solo su tenant |
| `agente` | UUID del tenant | Activo | Solo su tenant |
| `jugador` | UUID del tenant | Activo | Solo sus propios datos |

---

## Ejemplo de controller protegido

```typescript
@Controller('manager/deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminDepositIntentsController {

  // Accesible para admin_tenant y super_admin
  @Get()
  @Roles(PlatformRole.ADMIN_TENANT, PlatformRole.SUPER_ADMIN)
  async list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.tenant_id);
  }

  // Solo super_admin
  @Delete(':id')
  @Roles(PlatformRole.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

// Endpoint público — no requiere auth
@Controller('player/auth')
export class PlayerAuthController {

  @Post('login')
  @SkipRls()
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

---

## Cuándo usar @SkipRls()

Solo en endpoints que no requieren autenticación:
- `POST /api/v1/*/auth/login`
- `POST /api/v1/*/auth/refresh`
- `GET /api/v1/health`
- Webhooks externos (con validación HMAC independiente)

`super_admin` **no necesita** `@SkipRls()` — tiene BYPASSRLS en PostgreSQL automáticamente.

---

## Variables de entorno relevantes

```env
JWT_PRIVATE_KEY_PATH=./secrets/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./secrets/jwt-public.pem
JWT_ACCESS_TOKEN_TTL=3600
JWT_REFRESH_TOKEN_TTL=604800

VAULT_ENABLED=false
VAULT_BASE_URL=http://localhost:8201
VAULT_TOKEN=dev-root-token

FINGERPRINT_ENABLED=true
FINGERPRINT_MODE=flexible        # strict | flexible | disabled
BLACKLIST_ENABLED=true
SESSION_MANAGEMENT_ENABLED=true
SESSION_INACTIVITY_TIMEOUT_MINUTES=30
```

---

## Archivos de referencia

| Archivo | Propósito |
|---------|-----------|
| `src/modules/auth/guards/jwt-auth.guard.ts` | Guard principal JWT |
| `src/modules/auth/guards/roles.guard.ts` | Guard RBAC |
| `src/modules/auth/strategies/jwt.strategy.ts` | Validación + blacklist + fingerprint |
| `src/modules/auth/services/token.service.ts` | Firma/verificación RS256 + Vault |
| `src/modules/auth/interfaces/jwt-payload.interface.ts` | Tipo del payload |
| `src/common/decorators/current-user.decorator.ts` | Extractor de user |
| `src/modules/auth/decorators/roles.decorator.ts` | Decorador @Roles |
