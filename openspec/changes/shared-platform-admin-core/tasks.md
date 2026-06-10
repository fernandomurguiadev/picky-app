# Tasks: Core de Administración de Plataforma (SuperAdmin)

## Fase 1: Base de Datos y Entidades ✅

- [x] 1.1 DB: Crear entidad `PlatformAdmin` (tabla separada, sin relación con `User` ni `TenantMembership`).
- [x] 1.2 DB: Crear entidad `Plan` con campos `maxProducts`, `maxCategories`, `maxStaffUsers`, `maxImages`, `isHidden`.
- [x] 1.3 DB: Crear entidad `PlatformAuditLog` con `action` como ENUM (`AuditAction`), `onBehalfOfTenantId`, `ipAddress`, `details`.
- [x] 1.4 DB: Crear entidad `ImpersonationCode` con `code` (UUID único), `platformAdminId`, `tenantId`, `used`, `expiresAt`.
- [x] 1.5 DB: Actualizar entidad `Tenant` agregando `status` (ENUM), `suspensionReason`, `suspendedAt`, `planId` (FK a `Plan`), `planGraceUntil`.
- [x] 1.6 DB: Migración `1781114172671-PlatformAdminCore.ts` generada y ejecutada.
- [x] 1.7 Seed: `seed-plans.ts` — 4 planes (Free, Starter, Pro, Business) + asignación a tenants existentes.
- [x] 1.8 Seed: `seed-platform-admin.ts` — primer `PlatformAdmin` usando credenciales del `.env`.

## Fase 2: Backend Autenticación del SuperAdmin ✅

- [x] 2.1 Auth: `PlatformJwtStrategy` con key pair RS256 separado del JWT de merchants.
- [x] 2.2 Auth: `POST /api/v1/platform/auth/login` — rate limit 5 req/15 min (`@Throttle`), lockout tras 10 fallos, MFA flow cookie-based (`platform-mfa-pending` httpOnly, 5 min TTL).
- [x] 2.3 Auth: `POST /api/v1/platform/auth/login/mfa` — valida TOTP con otplib v13 (`verifySync`), rate limit 10 req/5 min, borra cookie MFA pending, emite sesión.
- [x] 2.4 Auth: `POST /api/v1/platform/auth/mfa/setup` (retorna QR via `QRCode.toDataURL`, NO retorna secret) y `POST /api/v1/platform/auth/mfa/verify`. Secret encriptado AES-256-CBC con `PLATFORM_MFA_ENCRYPTION_KEY`.
- [x] 2.5 Auth: `POST /api/v1/platform/auth/refresh` (rotación de token con hash SHA256) y `POST /api/v1/platform/auth/logout`.
- [x] 2.6 Auth: `notifyLogin()` usa `Logger` con IP redactada. TODO: nodemailer.
- [x] 2.7 Guard: `PlatformAdminGuard` + `@CurrentPlatformAdmin()` decorator.
- [x] 2.8 Cookie helpers centralizados con `cookieBase` getter — `clearCookies()` pasa opciones idénticas al set (fix logout).

## Fase 3: Suspensión y Redis ✅

- [x] 3.1 Redis: `RedisModule` integrado con `ioredis`.
- [x] 3.2 Guard: `SuspensionInterceptor` global — lee `suspended:{tenantId}` de Redis, retorna `403`.
- [x] 3.3 Service: `PlatformSuspensionService` — `suspend()` escribe en DB + Redis, `reactivate()` borra de ambos. Loguea `TENANT_SUSPENDED` / `TENANT_REACTIVATED` en `PlatformAuditLog`.

## Fase 4: Impersonación ✅

- [x] 4.1 API: `POST /api/v1/platform/impersonate/:tenantId` (`ParseUUIDPipe`) — genera `ImpersonationCode` con TTL 60s, retorna `{ code }`. Loguea `IMPERSONATION_STARTED`.
- [x] 4.2 API: `POST /api/v1/auth/impersonate/exchange` — transacción con `pessimistic_write` lock (fix race condition), marca `used=true` atómicamente, emite cookies merchant con `{ isImpersonated: true, actorId }`. Retorna `{ tenantId, role, message }` para el store del frontend.
- [x] 4.3 API: `POST /api/v1/auth/impersonate/end` — borra cookies merchant con opciones correctas (fix), loguea `IMPERSONATION_ENDED`.
- [x] 4.4 Interceptor: `ImpersonationAuditInterceptor` — loguea acciones destructivas durante impersonación (`IMPERSONATION_PRODUCT_CREATED`, etc.).

## Fase 5: API de Gestión de Plataforma ✅

- [x] 5.1 API: `/api/v1/platform/tenants` — GET paginado (search, status, planId, orderBy), POST (transacción completa: tenant + RLS + user + membership + storeSettings, plan Free obligatorio o error explícito), PATCH suspend/reactivate/plan. `changePlan()` valida `isHidden` (no permite asignar plan oculto). `planGraceUntil` +30 días en downgrade.
- [x] 5.2 API: `/api/v1/platform/plans` — GET, POST, PATCH, toggle visibility. `toggleVisibility()` chequea tenants `ACTIVE` + `SUSPENDED` (fix). Nombre único con `ConflictException`.
- [x] 5.3 API: `/api/v1/platform/audit-logs` — GET paginado, filtros completos, orden fijo DESC, validación rango máximo 90 días.
- [x] 5.4 Cron: `PlatformCleanupCron` — limpieza diaria audit logs > 180 días (3am) + códigos impersonación expirados (2am).

## Fase 6: Plan Limits Guard ✅

- [x] 6.1 Guard: `PlanLimitsGuard` global con raw SQL, respeta `planGraceUntil`, -1 = ilimitado (Business).
- [x] 6.2 Guard: Aplicado en `POST /products`, `POST /categories`, `POST /upload/image` con `@PlanLimit()` decorator.
- [x] 6.3 API: Retorna `403 PLAN_LIMIT_EXCEEDED:{resource}`.

## Fase 7: Frontend Panel de Plataforma ✅

- [x] 7.1 Routing: `middleware.ts` — detecta `admin.*` hostname, rewrite a `/platform/*`. BFF proxy `[...path]/route.ts` reenvía cookies `platform-*` al backend y valida Content-Type JSON (fix).
- [x] 7.2 UI: Login con flujo MFA de dos pasos. MFA pending token en cookie httpOnly (fix — ya no en response body).
- [x] 7.3 UI: Página de tenants — tabla paginada, filtros, suspend/reactivate, cambio de plan, impersonar (URL corregida a `/impersonate/:tenantId`).
- [x] 7.4 UI: Página de planes — toggle visibility con error handling.
- [x] 7.5 UI: Página de audit logs — tabla monospace, filtros, paginación.
- [x] 7.6 UI: `exchange-flow.tsx` — lee `?code=`, POST exchange, `setAuth({ tenantId, role })` (fix — el backend ahora retorna ambos).
- [x] 7.7 UI: `ImpersonationBanner` — amber banner fijo, llama `/api/auth/impersonate/end`. Incluido en `admin/layout.tsx`.
- [x] 7.8 UI: `PlatformAuthInitializer` — spinner de loading (fix — ya no renderiza null).

## Fase 8: Landing Page — Pricing ✅

- [x] 8.1 UI: `PricingSection` — 4 planes hardcoded, i18n via `next-intl`, Pro destacado, CTAs.

## Fase 9: QA y Validación ✅

- [x] 9.1 Tests: `plan-limits.guard.spec.ts` — 14 tests (todos los early-returns, límites, recursos específicos).
- [x] 9.2 Tests: `platform-suspension.service.spec.ts` — 7 tests.
- [x] 9.3 Tests: `platform-plans.service.spec.ts` — 8 tests (incluyendo array condition en toggleVisibility).
- [x] 9.4 Tests: `platform-tenants.service.spec.ts` — 8 tests (changePlan, suspend/reactivate, NotFoundException).
- [x] Total: **37/37 pasando**.

## Code Review — Fixes aplicados ✅

- [x] MFA token via cookie httpOnly en lugar de response body.
- [x] `validateTotp()` implementado con otplib v13 `verifySync`.
- [x] `setupMfa()` usa `generateSecret()` + `generateURI()` + `QRCode.toDataURL()`. Sin secret en response.
- [x] `clearCookies()` pasa opciones idénticas al set (fix logout).
- [x] `notifyLogin()` usa `Logger` con IP redactada (ya no `console.log`).
- [x] Race condition en OTC: transacción con `pessimistic_write` lock.
- [x] Cookie clearing en `impersonate.end()` con opciones correctas.
- [x] `as any` → `TenantStatus.ACTIVE` en `platform-plans.service.ts`.
- [x] Cron de limpieza de `impersonation_codes` expiradas.
- [x] Validación de rango de fechas máximo 90 días en audit logs.
- [x] Content-Type validation en BFF proxy.
- [x] Loading spinner en `PlatformAuthInitializer`.
- [x] MFA flow frontend sin `mfaPendingToken` en body.

## Gaps de Lógica — Fixes aplicados ✅

- [x] `exchange()` retorna `{ tenantId, role }` — el frontend los necesita para `setAuth()`.
- [x] URL de impersonación en frontend: `/impersonate/${tenantId}` (era `/tenants/${tenantId}/impersonate` → 404).
- [x] `changePlan()` rechaza planes ocultos (`isHidden: true`).
- [x] `toggleVisibility()` considera tenants `SUSPENDED` además de `ACTIVE`.
- [x] `createTenant()` falla con error explícito si el plan Free no existe en DB.

## Seguridad — Fixes aplicados ✅

- [x] Helmet.js configurado: CSP en prod, HSTS 1 año, X-Frame-Options, X-Content-Type-Options.
- [x] CORS restrictivo en producción: lista blanca `picky.ar` + `admin.picky.ar`.
- [x] `ParseUUIDPipe` en `POST /platform/impersonate/:tenantId`.
- [x] `ThrottlerModule` global (100 req/60s) + `ThrottlerGuard` como `APP_GUARD`.
- [x] Rate limiting estricto en platform login: 5 req/15 min. MFA: 10 req/5 min.
- [x] Security headers frontend: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- [x] `typescript.ignoreBuildErrors: false` en next.config.ts.

## Deploy ✅

- [x] Variables de entorno configuradas: Redis, Platform JWT RS256, MFA key, credenciales admin.
- [x] `NEXT_PUBLIC_MERCHANT_ORIGIN` en `app/.env.local`.
- [x] Migración corrida (`1781114172671-PlatformAdminCore`).
- [x] Seeds ejecutados: 4 planes + admin@picky.ar.
- [x] `/etc/hosts`: `127.0.0.1 admin.picky.localhost` (hecho por el usuario).

## Deuda técnica documentada

| Gap | Severidad | Acción pendiente |
|-----|-----------|------------------|
| `notifyLogin()` es placeholder | Media | Integrar nodemailer / mailer service |
| Refresh token sin `path` scoping | Media | Agregar `path: '/auth/refresh'` antes de producción |
| Rate limiting en `/auth/login` merchant | Media | Agregar `@Throttle` en `auth.controller.ts` |
| MFA: sin counter Redis por admin en TOTP | Media | Complementar throttle con contador por `adminId` |
| `dangerouslySetInnerHTML` en `[slug]/layout.tsx` | Baja | Solo CSS generado internamente — validar que no incluya input de usuario |
