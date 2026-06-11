# Specification: Módulo Core de Administración de Plataforma

## Requisitos

- El sistema DEBE restringir el acceso a `admin.picky.ar` únicamente a usuarios `PlatformAdmin` autenticados con JWT y cookies propias del dominio (`platform-access-token`).
- El sistema DEBE mantener la entidad `PlatformAdmin` completamente separada de `User` — sin `TenantMembership`, sin RLS, con key pair JWT propio.
- El sistema DEBE proteger el login del SuperAdmin con 4 capas: rate limiting por IP (5 intentos / 15 min), lockout de cuenta tras 10 intentos fallidos, MFA via TOTP, y notificación por email en cada acceso exitoso.
- El sistema DEBE permitir al SuperAdmin ver, filtrar y paginar todos los tenants registrados en la plataforma con su plan y estado actual.
- El sistema DEBE permitir suspender y reactivar tenants con motivo, aplicando el bloqueo en dos capas: DB (`tenant.status`) para futuros logins y Redis para sesiones activas.
- El sistema DEBE permitir al SuperAdmin impersonar un merchant mediante un código de un solo uso (60 segundos) que se intercambia por una sesión en `picky.ar`, con acceso completo y banner visible durante toda la sesión.
- El sistema DEBE auditar todas las operaciones críticas del SuperAdmin y las acciones destructivas realizadas durante impersonación, en la tabla `PlatformAuditLog` con retención de 180 días.
- El sistema DEBE bloquear la creación de productos, categorías, imágenes y staff cuando el tenant supera los límites de su plan, respetando el período de gracia de 30 días en caso de downgrade.
- El sistema DEBE permitir al SuperAdmin gestionar planes (crear, editar, ocultar) sin poder eliminar planes con tenants asignados.
- El sistema DEBE exponer paginación estándar (`page`, `limit`, `total`, `totalPages`) en todos los listados del panel de plataforma, con filtros específicos por recurso.

## Escenarios

### Escenario 1: Suspensión de Comercio por SuperAdmin
**DADO** un SuperAdmin autenticado en `admin.picky.ar`
**CUANDO** suspende al comercio "Burgers Don Juan" por "Falta de pago"
**ENTONCES** el estado del comercio cambia a `suspended` en DB
**Y** se escribe `suspended:{tenantId}` en Redis
**Y** se registra `TENANT_SUSPENDED` en `PlatformAuditLog` con el motivo
**Y** cualquier request activo de ese tenant retorna `403 Tenant Suspended` en el próximo intento
**Y** cualquier intento de login futuro del merchant es rechazado.

### Escenario 2: Impersonación de Merchant para Soporte
**DADO** un SuperAdmin en la pantalla de gestión de comercios en `admin.picky.ar`
**CUANDO** hace click en "Impersonar" para el comercio "Fierros S.A."
**ENTONCES** el backend genera un código de un solo uso con TTL de 60 segundos
**Y** se abre una nueva pestaña en `picky.ar/{slug}/auth/impersonate?code=XYZ`
**Y** esa página intercambia el código por cookies de sesión en `picky.ar`
**Y** el merchant dashboard carga con un banner visible "Modo soporte activo — Viendo como: Fierros S.A."
**Y** se registra `IMPERSONATION_STARTED` en `PlatformAuditLog`.

### Escenario 3: Acciones durante impersonación quedan auditadas
**DADO** un SuperAdmin en sesión de impersonación del comercio "Fierros S.A."
**CUANDO** elimina un producto desde el panel del merchant
**ENTONCES** el producto se elimina normalmente
**Y** se registra `IMPERSONATION_PRODUCT_DELETED` en `PlatformAuditLog` con `onBehalfOfTenantId` y detalles del producto.

### Escenario 4: Bloqueo por límites de Plan
**DADO** un comerciante en el Plan Free (límite: 10 productos) que ya tiene 10 productos
**CUANDO** intenta crear un nuevo producto
**ENTONCES** el endpoint retorna `403 Plan Limit Exceeded`
**Y** el producto no se guarda en la base de datos
**Y** el frontend muestra el bottom sheet de upgrade de plan.

### Escenario 5: Período de gracia por downgrade de plan
**DADO** un tenant en Plan Pro con 35 productos
**CUANDO** el SuperAdmin cambia su plan a Starter (límite: 20 productos)
**ENTONCES** `tenant.planGraceUntil` se setea a `now() + 30 días`
**Y** el tenant puede seguir operando normalmente durante ese período
**Y** al vencer la gracia, el `PlanLimitsGuard` comienza a bloquear la creación de nuevos productos.

### Escenario 6: Ocultamiento de Plan
**DADO** un SuperAdmin en la pantalla de gestión de planes
**CUANDO** oculta el plan "Starter"
**ENTONCES** el plan no aparece en el selector de planes para asignar a nuevos tenants
**Y** los tenants que ya tienen ese plan siguen funcionando sin cambios.

### Escenario 7: Expiración de código de impersonación
**DADO** un SuperAdmin que generó un código de impersonación hace más de 60 segundos
**CUANDO** el exchange endpoint recibe ese código
**ENTONCES** retorna `401 Code Expired`
**Y** el SuperAdmin debe generar uno nuevo.

## Tabla de Funcionalidades y Prioridad

| ID | Funcionalidad | Prioridad | Scope |
|---|---|---|---|
| F-001 | Autenticación SuperAdmin con JWT propio, rate limiting, lockout, MFA y notificación email | Alta | API & App |
| F-002 | CRUD de Tenants, Suspensión y Reactivación (DB + Redis) | Alta | API & App |
| F-003 | Impersonación via One-Time Code + banner + audit completo | Alta | API & App |
| F-004 | Validación de límites de Plan con período de gracia de 30 días | Media | API |
| F-005 | Logs de Auditoría Globales con 180 días de retención y filtros | Media | API & App |
| F-006 | CRUD de Planes con ocultamiento | Media | API & App |
| F-007 | Seed de 4 planes iniciales (Free, Starter, Pro, Business) | Alta | DB |
| F-008 | Landing page — sección de pricing con tabla de planes y features | Media | App |

## Criterios de Aceptación

- **CA-001**: Las cookies del SuperAdmin tienen `Domain: admin.picky.ar` y nunca se envían a `picky.ar`.
- **CA-002**: Un tenant suspendido no puede hacer login ni operar. El bloqueo activo via Redis afecta sesiones ya abiertas en el próximo request.
- **CA-003**: Toda acción durante impersonación registra en `PlatformAuditLog` con `onBehalfOfTenantId` y `actorId`.
- **CA-004**: El código de impersonación es de un solo uso y expira en 60 segundos. Un segundo intento de exchange retorna error.
- **CA-005**: El `PlanLimitsGuard` respeta `planGraceUntil` — no bloquea si la fecha de gracia no venció.
- **CA-006**: No se puede ocultar ni eliminar un plan que tiene tenants activos asignados.
- **CA-007**: El job de limpieza de audit logs corre diariamente y elimina registros con más de 180 días.
- **CA-008**: En desarrollo, `admin.picky.localhost` resuelve correctamente al panel de plataforma via middleware de Next.js.
- **CA-009**: Tras 5 intentos fallidos desde la misma IP en 15 minutos, el endpoint retorna `429` hasta que expire la ventana.
- **CA-010**: Tras 10 intentos fallidos totales, `PlatformAdmin.isActive` pasa a `false` y no se puede loguear hasta reactivación manual.
- **CA-011**: Con MFA habilitado, el login no emite cookies hasta que el código TOTP sea validado en el segundo paso.
- **CA-012**: Cada login exitoso dispara un email de notificación a `PLATFORM_ADMIN_EMAIL` con IP, fecha y user agent.
- **CA-013**: El listado de tenants acepta filtros `search`, `status`, `planId` y paginación con `limit` máximo de 100.
- **CA-014**: El listado de audit logs acepta filtros `action`, `tenantId`, `actorId`, `dateFrom`, `dateTo` y paginación con `limit` máximo de 200. Siempre ordenado por `createdAt desc`.

## Configuración local (dev)

El panel de plataforma corre en el subdominio `admin.picky.localhost`. El middleware de Next.js detecta el hostname y hace rewrite interno a `/platform/*` — no hay ningún servidor separado.

### 1. Variables de entorno

**`api/.env`** — agregar o verificar:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<password>

PLATFORM_JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
PLATFORM_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
PLATFORM_JWT_ACCESS_EXPIRATION=15m
PLATFORM_JWT_REFRESH_EXPIRATION=7d
PLATFORM_MFA_ENCRYPTION_KEY=<hex-64-chars>   # openssl rand -hex 32

PLATFORM_ADMIN_EMAIL=admin@picky.ar
PLATFORM_ADMIN_PASSWORD=<contraseña-segura>
```

Generar un par RS256 nuevo:
```bash
openssl genrsa -out platform_priv.pem 2048
openssl rsa -in platform_priv.pem -pubout -out platform_pub.pem
# Reemplazar saltos de línea por \n al pegar en .env
```

**`app/.env.local`** — agregar:
```env
NEXT_PUBLIC_MERCHANT_ORIGIN=http://picky.localhost:2000
```

### 2. Base de datos

```bash
# Generar y correr la migración (ya incluida en PlatformAdminCore)
npm run migration:run              # desde api/

# Seeds (solo primera vez)
npm run db:seed:plans              # crea los 4 planes: Free, Starter, Pro, Business
npm run db:seed:platform-admin     # crea el primer superadmin con las credenciales del .env
```

### 3. /etc/hosts (Windows)

Abrir Notepad **como Administrador** y agregar al final de `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1 admin.picky.localhost
```

O desde PowerShell como admin:
```powershell
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 admin.picky.localhost"
```

En macOS/Linux: editar `/etc/hosts` con `sudo`.

### 4. Levantar el stack

```bash
node start.js   # desde la raíz del monorepo
```

Acceder a: `http://admin.picky.localhost:2000`

### Producción

No se requiere `/etc/hosts`. Solo hace falta:
- Registro DNS `admin.picky.ar → IP del servidor` (A o CNAME)
- Certificado SSL que cubra `*.picky.ar` (wildcard) o `admin.picky.ar` explícito
- Las mismas variables de entorno del punto 1
