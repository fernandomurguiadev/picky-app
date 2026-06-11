# Runbook — Panel de Administración de Plataforma (SuperAdmin)

> Última actualización: 2026-06-10  
> Módulo: `shared-platform-admin-core`

---

## Cuenta del SuperAdmin

| Campo    | Valor                      |
|----------|----------------------------|
| Email    | `admin@picky.ar`           |
| Password | `KDVdWvSkKpABi9EktLf9XA`  |
| MFA      | Desactivado (activar desde el panel tras primer login) |

> Las credenciales viven en `.env` como `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD`.  
> Si el admin hace ≥ 10 intentos fallidos la cuenta se bloquea. Para desbloquear:
> ```sql
> UPDATE platform_admins SET is_active = true, failed_login_attempts = 0 WHERE email = 'admin@picky.ar';
> ```

---

## URLs activas

| Entorno     | Panel                              | App merchants                        | API                                  |
|-------------|------------------------------------|--------------------------------------|--------------------------------------|
| Producción  | https://admin.picky.orbitech.cloud | https://picky.orbitech.cloud         | https://api.picky.orbitech.cloud     |
| Dev local   | http://admin.picky.localhost:2000  | http://picky.localhost:3000          | http://localhost:1000                |

---

## Variables de entorno — Producción (`.env` en raíz del servidor)

```env
# ── General ─────────────────────────────────────────────────────────
NODE_ENV=production
PORT=1000

# ── Base de datos ────────────────────────────────────────────────────
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=picky_user
DATABASE_PASSWORD=<password>
DATABASE_NAME=picky_db
DATABASE_SSL=false

# ── JWT Merchants RS256 ──────────────────────────────────────────────
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# ── JWT Platform RS256 (par SEPARADO del de merchants) ───────────────
PLATFORM_JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
PLATFORM_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
PLATFORM_JWT_ACCESS_EXPIRATION=15m
PLATFORM_JWT_REFRESH_EXPIRATION=7d

# ── MFA (AES-256-CBC para secretos TOTP en DB) ───────────────────────
PLATFORM_MFA_ENCRYPTION_KEY=<openssl rand -hex 32>

# ── SuperAdmin — solo usado en seed inicial ──────────────────────────
PLATFORM_ADMIN_EMAIL=admin@picky.ar
PLATFORM_ADMIN_PASSWORD=<password>

# ── Redis ────────────────────────────────────────────────────────────
REDIS_HOST=<nombre contenedor redis>
REDIS_PORT=6379
REDIS_PASSWORD=<password>

# ── CORS (comma-separated) ───────────────────────────────────────────
CORS_ORIGINS=https://picky.orbitech.cloud,https://admin.picky.orbitech.cloud

# ── Dominio de cookies ───────────────────────────────────────────────
PLATFORM_COOKIE_DOMAIN=admin.picky.orbitech.cloud
MERCHANT_COOKIE_DOMAIN=picky.orbitech.cloud

# ── Cloudinary ───────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=ddkng94p5
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>

# ── Webhooks ─────────────────────────────────────────────────────────
N8N_WEBHOOK_URL=https://n8n.orbitech.cloud/webhook-test/confirmar-pedido
WHATSAPP_BUSINESS_NUMBER=<número>
```

---

## docker-compose.prod.yml — build args del app

`NEXT_PUBLIC_*` se hornean en el bundle de Next.js al momento del build — **no alcanzan con ponerlas en `.env` en runtime**.  
Deben estar declaradas en el `Dockerfile` (ARG + ENV) **y** pasadas desde el compose:

```yaml
app:
  build:
    context: ./app
    dockerfile: Dockerfile
    args:
      NEXT_PUBLIC_API_URL: https://api.picky.orbitech.cloud
      NEXT_PUBLIC_WS_URL: https://api.picky.orbitech.cloud
      NEXT_PUBLIC_MERCHANT_ORIGIN: https://picky.orbitech.cloud   # URL de la app merchant
```

Si falta el ARG en el `Dockerfile`, el valor no llega al build aunque esté en el compose.  
El `Dockerfile` debe tener:
```dockerfile
ARG NEXT_PUBLIC_MERCHANT_ORIGIN
ENV NEXT_PUBLIC_MERCHANT_ORIGIN=$NEXT_PUBLIC_MERCHANT_ORIGIN
```

---

## Deploy — pasos en orden (primera vez)

```bash
# 1. Levantar infra externa (postgres + redis deben existir en la red 'internal')
#    Si ya están levantados, saltear.

# 2. Build y levantar servicios
docker compose -f docker-compose.prod.yml up -d --build

# 3. Ejecutar migración
#    ⚠️  Los seeds usan TypeScript directo, en prod usar el JS compilado:
docker exec picky_api npx typeorm migration:run -d dist/config/data-source.js

# 4. Seed de planes (Free / Starter / Pro / Business)
docker exec picky_api node dist/scripts/seed-plans.js

# 5. Seed del primer SuperAdmin
#    Lee PLATFORM_ADMIN_EMAIL y PLATFORM_ADMIN_PASSWORD del .env
docker exec picky_api node dist/scripts/seed-platform-admin.js
```

> Los seeds son idempotentes — si los registros ya existen no hacen nada.

### Si los scripts JS fallan con "Cannot find module"

El `data-source.ts` usa paths de `src/*.ts` que no existen en prod. Parchear el compilado:
```bash
docker exec picky_api sed -i \
  's|src/\*\*/\*\.entity\.ts|dist/**/*.entity.js|g; s|src/migrations/\*\.ts|dist/migrations/*.js|g' \
  dist/config/data-source.js
```
(ya corregido en el código fuente — no debería ser necesario en próximos deploys)

### Si falta `tsx` en el contenedor

```bash
docker exec picky_api npm install -g tsx
```

### Seeds por SQL directo (alternativa)

Si los scripts no funcionan, correr SQL directo:

```bash
# Conectar a la DB
docker exec -it <contenedor_postgres> psql -U picky_user -d picky_db

# Generar hash de la password primero:
docker exec picky_api node -e "const bcrypt = require('bcrypt'); bcrypt.hash('TU_PASSWORD', 12).then(h => console.log(h));"
```

```sql
-- Planes
INSERT INTO plans (id, name, "maxProducts", "maxCategories", "maxStaffUsers", "maxImages", "isHidden", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Free',     10, 3,  1, 10, false, NOW(), NOW()),
  (gen_random_uuid(), 'Starter',  20, 8,  2, 20, false, NOW(), NOW()),
  (gen_random_uuid(), 'Pro',      40, 15, 3, 80, false, NOW(), NOW()),
  (gen_random_uuid(), 'Business', -1, -1, -1, -1, false, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- SuperAdmin (reemplazar HASH_AQUI con el output del comando node de arriba)
INSERT INTO platform_admins (id, email, "passwordHash", "isActive", "failedLoginAttempts", "lockedAt", "totpSecret", "isMfaEnabled", "refreshTokenHash", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'admin@picky.ar', 'HASH_AQUI', true, 0, NULL, NULL, false, NULL, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
```

---

## DNS y Nginx Proxy Manager

### Registros DNS necesarios

| Tipo | Nombre        | Valor (IP del servidor) | TTL |
|------|---------------|-------------------------|-----|
| A    | admin.picky   | 72.60.251.126           | 60  |
| A    | picky         | 72.60.251.126           | 60  |
| A    | api.picky     | 72.60.251.126           | 60  |

> Estos van en la zona DNS de `orbitech.cloud` (o donde se administre el dominio).

### Nginx Proxy Manager

Un solo Proxy Host con todos los dominios apuntando a `http://picky_app:2000`:

```
admin.picky.orbitech.cloud
picky.orbitech.cloud
www.picky.ar        ← cuando esté activo
picky.ar            ← cuando esté activo
```

Destination: `http://picky_app:2000`  
SSL: Let's Encrypt  

---

## Cómo funciona el routing

### Panel de plataforma (`admin.*`)

```
admin.picky.orbitech.cloud/tenants
  → proxy.ts detecta hostname.startsWith("admin.")
  → rewrite server-side → /platform/tenants
  → renderiza app/platform/(authenticated)/tenants/page.tsx
```

### Impersonación (flujo completo)

```
1. SuperAdmin hace clic en "Impersonar" en /platform/tenants
   → POST /api/platform/impersonate/:tenantId (via BFF)
   → Backend genera ImpersonationCode (UUID, TTL 60s)
   → Frontend abre nueva tab: https://picky.orbitech.cloud/impersonate/exchange?code=<uuid>

2. Nueva tab en picky.orbitech.cloud/impersonate/exchange
   → proxy.ts: "impersonate" está en excluded set → no trata como slug de tienda
   → ExchangeFlow component hace POST /api/auth/impersonate/exchange { code }
   → BFF en /api/auth/impersonate/exchange/route.ts → backend /auth/impersonate/exchange
   → Backend: transacción con pessimistic_write lock → marca code used=true
   → Backend emite cookies merchant (access-token, refresh-token)
   → BFF reenvía Set-Cookie al browser
   → Frontend: setAuth({ tenantId, role }) → redirect /admin/dashboard

3. ImpersonationBanner aparece (banner ámbar fijo)
   → "Terminar impersonación" → POST /api/auth/impersonate/end
   → BFF /api/auth/impersonate/end/route.ts → backend /auth/impersonate/end
   → Backend borra cookies merchant
   → Redirige al panel
```

### Store pública (`picky.orbitech.cloud/[slug]`)

```
picky.orbitech.cloud/mi-tienda
  → proxy.ts: no es admin.*, no es ruta excluida
  → fetch backend: GET /api/v1/stores/mi-tienda/tenant-id
  → si existe → agrega header x-tenant-id al request
  → si no existe → rewrite a /not-found
```

**Paths excluidos** (no se tratan como slugs de tienda):
`admin`, `auth`, `api`, `_next`, `favicon.ico`, `platform`, `impersonate`

---

## Archivos clave del frontend

| Archivo | Rol |
|---------|-----|
| `app/src/proxy.ts` | Proxy/middleware de Next.js 16. Reemplazó a `middleware.ts` — **no pueden coexistir** |
| `app/src/app/api/platform/[...path]/route.ts` | BFF catch-all para `/api/platform/*` → backend |
| `app/src/app/api/auth/impersonate/exchange/route.ts` | BFF para exchange de código OTC |
| `app/src/app/api/auth/impersonate/end/route.ts` | BFF para terminar impersonación |
| `app/src/app/platform/login/page.tsx` | Login + flujo MFA de dos pasos |
| `app/src/app/impersonate/exchange/exchange-flow.tsx` | Consume OTC y setea auth merchant |
| `app/src/components/admin/impersonation-banner.tsx` | Banner ámbar durante impersonación |
| `app/Dockerfile` | Debe declarar ARG + ENV para cada `NEXT_PUBLIC_*` |

---

## Gotchas conocidos / errores frecuentes

### `middleware.ts` y `proxy.ts` no pueden coexistir (Next.js 16)
Next.js 16 renombró `middleware.ts` → `proxy.ts`. Si ambos existen el build falla con:
```
Both middleware file and proxy file are detected. Please use proxy.ts only.
```
Solución: eliminar `middleware.ts`.

### `NEXT_PUBLIC_*` no toman efecto en runtime
Se hornean en el bundle al momento del `docker build`. Si no están en el `Dockerfile` como `ARG`+`ENV` y en el compose como `args`, el valor es `undefined` y usa el fallback del código.

### Seeds fallan con "Cannot find module" en producción
El contenedor solo tiene `dist/` — los scripts que usan `tsx src/...` fallan. Usar `node dist/scripts/seed-*.js`.

### `EntityMetadataNotFoundError` en seeds
El `data-source.ts` tenía paths `src/**/*.entity.ts` que no existen en prod. Corregido para usar `dist/**/*.entity.js` cuando `NODE_ENV=production`.

### Página `/platform/plans` crashea con "This page couldn't load"
El `.map()` sobre el array de planes devolvía `<>` (Fragment sin key) en un map — React lo lanza como error. Corregido usando `<React.Fragment key={plan.id}>`.

### API responses envueltas en `{ data: [...], meta: {...} }`
El backend envuelve todas las responses. En el frontend siempre usar `r.data.data` (no `r.data`) para obtener el payload real. Ejemplo:
```typescript
// ❌ incorrecto
queryFn: () => api.get("/plans").then(r => r.data)

// ✅ correcto  
queryFn: () => api.get("/plans").then(r => r.data.data)
```

### Cookie domain en producción
`platform-access-token` se setea con `Domain=admin.picky.orbitech.cloud`. Si el panel corre en otro dominio las cookies no llegarán. Cambiar `PLATFORM_COOKIE_DOMAIN` en el `.env`.

---

## Generación de llaves RS256

```bash
# Platform JWT (par separado del de merchants)
openssl genrsa -out platform-private.pem 2048
openssl rsa -in platform-private.pem -pubout -out platform-public.pem

# Formato para .env (con \n escapados)
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' platform-private.pem
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' platform-public.pem

# MFA encryption key
openssl rand -hex 32
```

---

## Migración a picky.ar (cuando esté activo)

Solo cambiar variables de entorno — sin tocar código ni hacer rebuild:

```env
CORS_ORIGINS=https://picky.ar,https://admin.picky.ar
PLATFORM_COOKIE_DOMAIN=admin.picky.ar
MERCHANT_COOKIE_DOMAIN=picky.ar
```

Y en el `docker-compose.prod.yml`:
```yaml
args:
  NEXT_PUBLIC_MERCHANT_ORIGIN: https://picky.ar   # ← cambiar
```
(requiere rebuild del app)

---

## Arquitectura del módulo — Backend

```
api/src/modules/platform/
├── entities/
│   ├── platform-admin.entity.ts       # Tabla platform_admins (aislada de User/Tenant)
│   ├── platform-audit-log.entity.ts   # Auditoría con AuditAction enum
│   ├── plan.entity.ts                 # Tabla plans con límites por recurso
│   └── impersonation-code.entity.ts   # OTC UUID con TTL 60s
├── platform-auth.service.ts           # Login, MFA TOTP, refresh, logout
├── platform-auth.controller.ts        # /platform/auth/* con rate limits estrictos
├── platform-tenants.service.ts        # CRUD + suspend + changePlan
├── platform-plans.service.ts          # CRUD + toggleVisibility
├── platform-suspension.service.ts     # suspend/reactivate con Redis
├── platform-impersonation.controller.ts  # POST /platform/impersonate/:tenantId
├── platform-audit-logs.controller.ts  # GET con filtros + validación 90 días
└── platform-cleanup.cron.ts           # Limpieza: audit logs >180d (3am) + OTC expirados (2am)

api/src/modules/auth/
└── impersonate.service.ts             # exchange() con pessimistic_write + end()
```

## Seguridad implementada

| Mecanismo | Detalle |
|-----------|---------|
| JWT RS256 separado | `PLATFORM_JWT_*` ≠ `JWT_*` — compromiso de uno no afecta al otro |
| Cookies httpOnly | `platform-access-token`, `platform-refresh-token`, `platform-mfa-pending` |
| Rate limiting | Login: 5/15min · MFA: 10/5min · Global: 100/60s |
| Lockout | 10 intentos fallidos → cuenta bloqueada |
| MFA TOTP | otplib v13 `verifySync`. Secret AES-256-CBC en DB |
| OTC impersonación | `pessimistic_write` lock — previene race condition en consumo |
| CORS dinámico | Lista blanca desde `CORS_ORIGINS` env var |
| Helmet | CSP + HSTS 1 año en prod |
| ParseUUIDPipe | Todos los params UUID en controllers de plataforma |
| SuspensionInterceptor | Redis `suspended:{tenantId}` → 403 global |

## Deuda técnica

| Gap | Severidad | Acción |
|-----|-----------|--------|
| `notifyLogin()` es `Logger.log` | Media | Integrar nodemailer |
| Refresh token sin `path` scoping | Media | Agregar `path: '/auth/refresh'` |
| Rate limiting en `/auth/login` merchant | Media | `@Throttle` en `auth.controller.ts` |
| Counter Redis MFA por `adminId` | Media | Complementar throttle IP con contador por admin |
| `dangerouslySetInnerHTML` en `[slug]/layout.tsx` | Baja | Validar que el CSS no incluya input de usuario |
