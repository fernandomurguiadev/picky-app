# Technical Design: Módulo Core de Administración de Plataforma

## Modelo de Base de Datos

### 1. Entidad `PlatformAdmin` (Tabla separada — NO usa `User`)

```typescript
@Entity('platform_admins')
export class PlatformAdmin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  passwordHash!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'integer', default: 0 })
  failedLoginAttempts!: number; // Lockout tras 10 intentos fallidos

  @Column({ type: 'timestamptz', nullable: true })
  lockedAt?: Date; // Fecha de lockout de cuenta

  @Column({ type: 'varchar', nullable: true })
  totpSecret?: string; // Secreto TOTP para MFA (Google Authenticator / Authy)

  @Column({ type: 'boolean', default: false })
  isMfaEnabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

> Entidad completamente separada de `User`. No tiene `TenantMembership` ni interacción con RLS.
> Creada via seed script con credenciales desde variables de entorno.

---

### 2. Entidad `Plan` (Global)

```typescript
@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string; // Free, Starter, Pro, Business

  @Column({ type: 'integer' })
  maxProducts!: number; // -1 = sin límite

  @Column({ type: 'integer' })
  maxCategories!: number; // -1 = sin límite

  @Column({ type: 'integer' })
  maxStaffUsers!: number; // -1 = sin límite

  @Column({ type: 'integer' })
  maxImages!: number; // -1 = sin límite

  @Column({ type: 'boolean', default: false })
  isHidden!: boolean; // Oculto = no asignable a nuevos tenants, no eliminable

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

#### Seed inicial de planes

| Plan | maxProducts | maxCategories | maxStaffUsers | maxImages |
|---|---|---|---|---|
| Free | 10 | 3 | 1 | 10 |
| Starter | 20 | 8 | 2 | 20 |
| Pro | 40 | 15 | 3 | 80 |
| Business | -1 | -1 | -1 | -1 |

Todos los tenants existentes al momento del deploy reciben el plan **Free** por defecto.

---

### 3. Entidad `PlatformAuditLog` (Global, omite RLS)

```typescript
export enum AuditAction {
  // Tenant
  TENANT_CREATED = 'TENANT_CREATED',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  TENANT_REACTIVATED = 'TENANT_REACTIVATED',
  TENANT_PLAN_CHANGED = 'TENANT_PLAN_CHANGED',
  // Impersonación
  IMPERSONATION_STARTED = 'IMPERSONATION_STARTED',
  IMPERSONATION_ENDED = 'IMPERSONATION_ENDED',
  IMPERSONATION_PRODUCT_CREATED = 'IMPERSONATION_PRODUCT_CREATED',
  IMPERSONATION_PRODUCT_UPDATED = 'IMPERSONATION_PRODUCT_UPDATED',
  IMPERSONATION_PRODUCT_DELETED = 'IMPERSONATION_PRODUCT_DELETED',
  IMPERSONATION_CATEGORY_CREATED = 'IMPERSONATION_CATEGORY_CREATED',
  IMPERSONATION_CATEGORY_UPDATED = 'IMPERSONATION_CATEGORY_UPDATED',
  IMPERSONATION_CATEGORY_DELETED = 'IMPERSONATION_CATEGORY_DELETED',
  // Sesión superadmin
  PLATFORM_LOGIN = 'PLATFORM_LOGIN',
  PLATFORM_LOGIN_FAILED = 'PLATFORM_LOGIN_FAILED',
  PLATFORM_LOGOUT = 'PLATFORM_LOGOUT',
}

@Entity('platform_audit_logs')
export class PlatformAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  actorId!: string; // PlatformAdmin.id

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Column({ nullable: true })
  onBehalfOfTenantId?: string; // Presente en acciones de impersonación

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any>;

  @Column({ nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
```

> Retención: 180 días. Job de limpieza automática (cron) borra registros con `createdAt < now() - 180 days`.

---

### 4. Entidad `ImpersonationCode` (Ticket desechable)

```typescript
@Entity('impersonation_codes')
export class ImpersonationCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  code!: string; // UUID aleatorio de un solo uso

  @Column()
  platformAdminId!: string;

  @Column()
  tenantId!: string;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date; // now() + 60 segundos

  @CreateDateColumn()
  createdAt!: Date;
}
```

---

### 5. Cambios en `Tenant`

```typescript
export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

// Campos a agregar a la entidad Tenant existente:
@Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
status!: TenantStatus;

@Column({ nullable: true })
suspensionReason?: string;

@Column({ type: 'timestamptz', nullable: true })
suspendedAt?: Date;

@ManyToOne(() => Plan)
@JoinColumn({ name: 'plan_id' })
plan!: Plan;

@Column({ nullable: true })
planId?: string;

@Column({ type: 'timestamptz', nullable: true })
planGraceUntil?: Date; // Período de gracia de 30 días si se bajan límites del plan
```

---

## Autenticación del SuperAdmin

### JWT separado

Variables de entorno exclusivas para el panel de plataforma:

```
PLATFORM_JWT_PRIVATE_KEY=...  # RS256 key pair independiente
PLATFORM_JWT_PUBLIC_KEY=...
PLATFORM_JWT_ACCESS_EXPIRATION=15m
PLATFORM_JWT_REFRESH_EXPIRATION=7d
PLATFORM_ADMIN_EMAIL=...      # Credenciales del seed inicial
PLATFORM_ADMIN_PASSWORD=...
```

### Seguridad del login — 4 capas

#### Capa 1 — Rate limiting por IP (Redis)
`@nestjs/throttler` con configuración estricta exclusiva para el endpoint de login:
- Ventana: 15 minutos
- Máximo: 5 intentos fallidos por IP
- Al superar: `429 Too Many Requests` hasta que expire la ventana

#### Capa 2 — Lockout de cuenta (DB)
Independiente de la IP — protege contra ataques distribuidos:
- Cada login fallido incrementa `PlatformAdmin.failedLoginAttempts`
- Al llegar a 10 → `isActive = false`, `lockedAt = now()`
- Reactivación solo manual via script o directamente en DB
- Cada intento fallido loguea `PLATFORM_LOGIN_FAILED` en `PlatformAuditLog`
- Login exitoso resetea `failedLoginAttempts = 0`

#### Capa 3 — MFA / TOTP
Flujo de login en dos pasos:
1. `POST /api/platform/auth/login` con email + password → si credenciales válidas y MFA habilitado, retorna `{ mfaRequired: true }` sin emitir cookies
2. `POST /api/platform/auth/login/mfa` con `{ totpCode }` → valida código TOTP, emite cookies si es correcto

Setup inicial de MFA:
- `POST /api/platform/auth/mfa/setup` → genera `totpSecret`, retorna QR code para escanear con Google Authenticator / Authy
- `POST /api/platform/auth/mfa/verify` → confirma el primer código válido, activa `isMfaEnabled = true`

El `totpSecret` se almacena encriptado en DB (AES-256 con `PLATFORM_MFA_ENCRYPTION_KEY` del `.env`).

Variable de entorno adicional:
```
PLATFORM_MFA_ENCRYPTION_KEY=...  # Clave AES-256 para encriptar totpSecret
```

#### Capa 4 — Notificación de login exitoso por email
Cada login exitoso del superadmin dispara un email a `PLATFORM_ADMIN_EMAIL` con:
- Fecha y hora del acceso
- IP de origen
- User agent

Sin bloqueos adicionales — solo visibilidad para detección de accesos no autorizados.

### Cookies separadas

| Cookie | Nombre | Domain | httpOnly |
|---|---|---|---|
| Access token | `platform-access-token` | `admin.picky.ar` | ✓ |
| Refresh token | `platform-refresh-token` | `admin.picky.ar` | ✓ |

> Las cookies del superadmin **nunca** viajan a `picky.ar` ni a rutas de merchant.
> El `RlsInterceptor` existente **no se modifica** — las rutas `/api/platform/*` usan su propia estrategia JWT y no pasan por RLS.

---

## Suspensión — Dos capas de bloqueo

### Capa 1 — DB (`tenant.status`)
Bloquea futuros intentos de login. El `auth.service` verifica `status` antes de emitir cualquier token.

### Capa 2 — Redis (lista negra activa)
Bloquea sesiones ya activas. Al suspender un tenant se escribe en Redis:

```
KEY: suspended:{tenantId}
VALUE: 1
TTL: sin expiración (se elimina al reactivar)
```

Un `SuspensionGuard` global corre **después** de `JwtAuthGuard` y **antes** de `RlsInterceptor`:

```
Request → JwtAuthGuard → SuspensionGuard → RlsInterceptor → Controller
```

Si `suspended:{tenantId}` existe en Redis → `403 Tenant Suspended`.
Al reactivar: DB `status = ACTIVE` + `DEL suspended:{tenantId}` en Redis.

---

## Flujo de Impersonación (One-Time Code)

```
1. SuperAdmin hace click en "Impersonar Tienda X" en admin.picky.ar
2. POST /api/platform/impersonate/:tenantId
   → Backend genera UUID (code), guarda en DB con TTL 60s, retorna { code }
3. Frontend abre nueva pestaña: picky.ar/{slug}/auth/impersonate?code=ABC123
4. Esa página llama POST /api/auth/impersonate/exchange { code }
   → Backend valida: code existe, no usado, no expirado
   → Marca code como used=true
   → Emite access-token + refresh-token para ese tenantId con claim { isImpersonated: true, actorId: adminId }
   → Setea cookies en dominio picky.ar
5. Merchant dashboard carga con banner visible:
   "Modo soporte activo — estás viendo como [Nombre Tienda]  [Salir]"
6. Todas las acciones destructivas (crear/editar/borrar productos y categorías) generan
   entrada adicional en PlatformAuditLog con onBehalfOfTenantId
7. Al hacer click en "Salir" o cerrar la pestaña:
   → POST /api/auth/impersonate/end → loguea IMPERSONATION_ENDED en audit log
   → Invalida las cookies de impersonación
```

---

## API Endpoints

### Módulo Platform Auth (`/api/platform/auth`)

- `POST /api/platform/auth/login` — Login del superadmin. Setea `platform-access-token` y `platform-refresh-token` en `admin.picky.ar`.
- `POST /api/platform/auth/refresh` — Renovación de token.
- `POST /api/platform/auth/logout` — Logout + log de `PLATFORM_LOGOUT`.

### Módulo Impersonación

- `POST /api/platform/impersonate/:tenantId` — Genera OTC (60s, single-use). Requiere `PlatformAdminGuard`.
- `POST /api/auth/impersonate/exchange` — Exchange del code por cookies de sesión en `picky.ar`.
- `POST /api/auth/impersonate/end` — Cierra sesión de impersonación + loguea `IMPERSONATION_ENDED`.

### Módulo Tenants (`/api/platform/tenants`)

- `GET /api/platform/tenants` — Lista todos los tenants con plan y status.
  - Filtros: `search` (nombre/slug), `status` (active/suspended/inactive), `planId`
  - Paginación: `page` (default 1), `limit` (default 20, max 100)
  - Orden: `orderBy` (default `createdAt`), `order` (default `desc`)
- `POST /api/platform/tenants` — Crea nuevo tenant + seeding inicial.
- `POST /api/platform/tenants/:id/suspend` — Suspende tenant: DB status + Redis blocklist + audit log.
- `POST /api/platform/tenants/:id/reactivate` — Reactiva tenant: DB status + elimina de Redis + audit log.
- `PATCH /api/platform/tenants/:id/plan` — Cambia plan. Si se bajan límites, setea `planGraceUntil = now() + 30 days`.

### Módulo Planes (`/api/platform/plans`)

- `GET /api/platform/plans` — Lista todos los planes (incluyendo ocultos para el superadmin).
- `POST /api/platform/plans` — Crea nuevo plan.
- `PATCH /api/platform/plans/:id` — Edita límites o nombre.
- `PATCH /api/platform/plans/:id/visibility` — Toggle `isHidden`. No se puede ocultar si tiene tenants activos.
- `GET /api/platform/plans/:id/tenants` — Lista los tenants asignados a ese plan.

### Módulo Audit Logs (`/api/platform/audit-logs`)

- `GET /api/platform/audit-logs` — Lista logs de auditoría.
  - Filtros: `action` (AuditAction), `tenantId`, `actorId`, `dateFrom`, `dateTo` (ISO date)
  - Paginación: `page` (default 1), `limit` (default 50, max 200)
  - Orden: siempre por `createdAt desc`

---

## Frontend Layout y Routing (Next.js 15)

### Middleware (`app/src/middleware.ts`)

```typescript
const hostname = request.headers.get('host') || '';
if (hostname === 'admin.picky.ar' || hostname === 'admin.picky.localhost') {
  return NextResponse.rewrite(
    new URL(`/platform-admin${request.nextUrl.pathname}`, request.url)
  );
}
```

#### Setup de desarrollo (una vez por máquina)

Agregar la siguiente entrada en `/etc/hosts` (requiere permisos de administrador):

```
# Windows: C:\Windows\System32\drivers\etc\hosts
# Mac/Linux: /etc/hosts
127.0.0.1  admin.picky.localhost
```

Luego acceder a `http://admin.picky.localhost:3000` con el servidor de Next.js corriendo normalmente.

> Documentar este paso en el `README.md` del monorepo como requisito de setup.

### Páginas del SuperAdmin

- `app/src/app/platform-admin/page.tsx` — Dashboard global (métricas consolidadas).
- `app/src/app/platform-admin/login/page.tsx` — Login del superadmin.
- `app/src/app/platform-admin/tenants/page.tsx` — Listado de tenants con suspensión, impersonación y cambio de plan. Paginado.
- `app/src/app/platform-admin/plans/page.tsx` — CRUD de planes con toggle de visibilidad.
- `app/src/app/platform-admin/audit-logs/page.tsx` — Tabla de logs con filtros por acción, tenant, fecha. Paginado.

### Página de exchange de impersonación (en dominio merchant)

- `app/src/app/(store)/auth/impersonate/page.tsx` — Recibe `?code=`, llama al exchange, redirige al dashboard del merchant con banner activo.

### Banner de impersonación

Componente global visible en todo el merchant dashboard durante sesión impersonada:

```
┌─────────────────────────────────────────────────────────┐
│  Modo soporte activo — Viendo como: [Nombre Tienda]     [Salir] │
└─────────────────────────────────────────────────────────┘
```

### Respuesta paginada estándar

Ambos endpoints de listado retornan la misma estructura:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 143,
    "totalPages": 8
  }
}
```

---

### Landing page — Tabla de planes

Nueva sección en la landing pública de `picky.ar` con la tabla de planes:

| Feature | Free | Starter | Pro | Business |
|---|---|---|---|---|
| Productos | 10 | 20 | 40 | Sin límite |
| Categorías | 3 | 8 | 15 | Sin límite |
| Usuarios staff | 1 | 2 | 3 | Sin límite |
| Imágenes | 10 | 20 | 80 | Sin límite |
| Menú digital público | ✓ | ✓ | ✓ | ✓ |
| Pedidos en tiempo real | ✓ | ✓ | ✓ | ✓ |
| Gestión de inventario | ✓ | ✓ | ✓ | ✓ |
| Personalización de tema | ✓ | ✓ | ✓ | ✓ |
| Horarios y delivery | ✓ | ✓ | ✓ | ✓ |
| Flyer QR | ✓ | ✓ | ✓ | ✓ |
| PWA (funciona offline) | ✓ | ✓ | ✓ | ✓ |
| Dashboard analytics | Básico | Completo | Completo | Completo |
| Soporte Email | ✓ | ✓ | ✓ | ✓ (prioritario) |
| Soporte WhatsApp | — | ✓ | ✓ | ✓ (prioritario) |
