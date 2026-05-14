# Tasks: Decoupled Multi-Tenant Identities

## Phase 1: Database & Infrastructure
- [x] 1.1 Create `TenantMembership` entity in `api/src/modules/auth/entities/tenant-membership.entity.ts`.
- [x] 1.2 Register `TenantMembership` in `api/src/modules/auth/auth.module.ts` and `api/src/config/data-source.ts`.
- [x] 1.3 Modify `api/src/modules/auth/entities/user.entity.ts`: Drop `tenantId` column and make `email` global unique index.
- [x] 1.4 Run `npm run migration:generate -- name=DecoupleUserTenant` and manually review the migration to ensure smooth data copying from `users.tenantId` to `tenant_memberships`.

## Phase 2: Core Backend Implementation
- [x] 2.1 Update `AuthService.register()` to create global User first, and then link via `TenantMembership` table.
- [x] 2.2 Update `AuthService.login()` to fetch memberships: issue standard JWT if count is 1; issue short-lived selectionToken if count > 1.
- [x] 2.3 Implement `AuthService.selectTenant()` validating selectionToken and returning final JWT.
- [x] 2.4 Expose `POST /auth/select-tenant` in `AuthController` with required validation DTOs.

## Phase 3: DB Seeding Updates
- [x] 3.1 Update `api/src/scripts/seed.ts` to create unique global admin `User` and attach it to BOTH Picky Burgers and Picky Cerrajería via memberships.
- [x] 3.2 Execute `npm run db:seed` and verify DB integrity.

## Phase 4: Frontend App Integration
- [x] 4.1 Update BFF proxy `app/src/app/api/auth/login/route.ts` to handle and forward multi-tenant selection responses.
- [x] 4.2 Create BFF proxy `app/src/app/api/auth/select-tenant/route.ts` to forward selection payload to backend.
- [x] 4.3 Modify `app/src/app/auth/login/page.tsx`: Add reactive UI state to render beautiful shop selector slide-in when backend demands selection.
