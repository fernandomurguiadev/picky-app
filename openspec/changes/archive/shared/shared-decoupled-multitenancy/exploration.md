## Exploration: Multi-Tenant Identity Decoupling

### Current State
- The `users` table contains a hardcoded `tenantId` column, restricting each user account to exactly one tenant.
- Email has a composite unique index `@Index(['tenantId', 'email'])`, allowing different tenants to register the same email as entirely separate identities.
- The `AuthService.login` queries strictly by `email` only, which causes non-deterministic results when multiple distinct users exist across tenants with the same email.
- Other modules (Products, Orders, etc.) do not reference `User.tenantId` directly; they rely on `req.user.tenantId` injected by the `JwtStrategy` during request processing.

### Affected Areas
- `api/src/modules/auth/entities/user.entity.ts` — Needs removal of `tenantId` and `tenant` relation, and global unique constraint on `email`.
- `api/src/modules/auth/entities/tenant-membership.entity.ts` — NEW entity to map Users ↔ Tenants M2M with `role`.
- `api/src/modules/auth/auth.service.ts` — Needs refactoring of `register` and `login` to support the bridge table.
- `api/src/modules/auth/auth.controller.ts` — Needs updated response/request definitions for tenant selection if needed.
- `app/src/app/auth/login/page.tsx` — Needs to display a list of accessible stores when the backend indicates multiple options.
- `api/src/scripts/seed.ts` — Needs to create a single `User` row and link it to both `Tenant` records via membership.

### Approaches
1. **Direct Bridge Table (TenantMembership)** — Introduce `TenantMembership` to link global users to multiple stores. 
   - Pros: Zero impact on modules outside of Auth; full standard compliance; supports cross-tenant authorization.
   - Cons: Requires a database migration and updates to auth service logic.
   - Effort: Medium

2. **Multi-Account Merging (Aggregated Queries)** — Maintain separate users, but query by email and join across all partitions.
   - Pros: No database schema alteration.
   - Cons: Anti-pattern; violates 3NF; complicates authentication state and password sync.
   - Effort: High

### Recommendation
Approach 1 is the ONLY viable architectural solution. Because `req.user.tenantId` is sourced exclusively from the JWT, and since we sign the `tenantId` dynamically *after* the user selects a tenant, ALL other application code in the entire monorepo remains 100% operational without modification. This isolates the refactor purely to `AuthService` and `User` schema.

### Risks
- **Database Migration**: Existing isolated users with identical emails must be reconciled or migrated cleanly.
- **JWT Expiration**: If users switch tenants, they will need a new JWT token specific to that selected tenant scope.

### Ready for Proposal
Yes. Proceeding inline to generate the Change Proposal.
