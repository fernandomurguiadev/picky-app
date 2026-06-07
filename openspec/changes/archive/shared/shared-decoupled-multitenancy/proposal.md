# Proposal: Decoupled Multi-Tenant Identities

## Intent
Break the tight physical coupling between the `User` and `Tenant` entities to support the "One User, Many Stores" SaaS model. This resolves login non-determinism when identical emails are shared across different stores and enables unified cross-tenant login and tenant-switching dashboards for administrators.

## Scope

### In Scope
- Removing `tenantId` from the `User` table and adding a global unique index on `email`.
- Creating a `TenantMembership` (join table) mapping Users to Tenants with their assigned `role` and status.
- Updating `AuthService.login` to authenticate global identity first.
- Updating `AuthService.register` to create the bridge link.
- Displaying a beautiful tenant selector list in the Frontend Login page if multiple stores are linked.
- Generating a safe PostgreSQL TypeORM migration.
- Adapting the database initializer script (`seed.ts`) to the new structure.

### Out of Scope
- Fine-grained RBAC (Role-Based Access Control) configuration pages.
- Creating a global super-admin workspace.

## Capabilities

### New Capabilities
- `tenant-selection`: Enables administrators to choose which tenant context to act under immediately after unified authentication.

### Modified Capabilities
- `api/authentication.md`: Authentication logic moves from tenant-bound to global identity verification.

## Approach
We will implement a canonical M2M bridge model using TypeORM. 
1. **Schema Change**: Introduce `TenantMembership` entity. Migrate existing `User` table rows. Drop `users.tenantId`.
2. **Auth API**: When a user logs in, fetch all active memberships. 
   - If `count === 1`: Complete login automatically (returns JWT containing that `tenantId`).
   - If `count > 1`: Return `200` with status `requires_selection` and a simple object `{ tempToken, tenants: [{id, slug, name}] }`.
3. **Frontend BFF & UI**: Adapt Next.js route handlers to proxy selection, and enhance `LoginPage` to render an inline list of shops to select from.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/src/modules/auth/entities/user.entity.ts` | Modified | Remove `tenantId`, index `email` unique. |
| `api/src/modules/auth/entities/tenant-membership.entity.ts` | New | Maps User to Tenant M2M. |
| `api/src/modules/auth/auth.service.ts` | Modified | Refactor logic for `login()` and `register()`. |
| `app/src/app/auth/login/page.tsx` | Modified | Add UI for multi-tenant store selection. |
| `api/src/scripts/seed.ts` | Modified | Update database seeding schema logic. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Schema Migration Crash | Medium | Create a manual TypeORM migration scripts and test with fresh dev data. |
| JWT Token Desync | Low | Re-issue fresh access tokens containing the `tenantId` on tenant selection. |

## Rollback Plan
1. `git checkout .` to discard code changes.
2. Run `npm run migration:revert` to restore the previous table structure and indices in the DB.

## Success Criteria
- [ ] `AuthService` authenticates global user by email.
- [ ] Multiple `Tenant` records can be linked to a single global `User`.
- [ ] Frontend prompts for store selection when multiple stores exist for an email.
- [ ] JWT contains the selected `tenantId`, keeping other modules functioning perfectly.
