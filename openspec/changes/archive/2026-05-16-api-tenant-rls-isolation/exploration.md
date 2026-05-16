## Exploration: Native PostgreSQL RLS Tenant Isolation

### Current State
Currently, `picky-app` performs tenant isolation purely at the application layer. The NestJS backend handles this by having the [TenantContextInterceptor](file:///c:/Users/ferna/Documents/Repositorios/picky-app/api/src/common/interceptors/tenant-context.interceptor.ts) map `request.user.tenantId` from the JWT to `request.tenantId`. Developers must manually append `{ where: { tenantId } }` in TypeORM find/update operations, leaving the application vulnerable to leaks in case a developer forgets to apply the filter or writes raw queries.

### Affected Areas
- `api/src/common/interceptors/rls.interceptor.ts` — Create the transactional RLS interceptor that opens a TypeORM QueryRunner transaction and executes `SET LOCAL app.current_tenant_id = '<uuid>'`.
- `api/src/common/decorators/skip-rls.decorator.ts` — Decorator to bypass RLS execution for public endpoints (such as `health` or `login`).
- `api/src/migrations/` — TypeORM migration containing the SQL necessary to execute `ALTER TABLE products ENABLE ROW LEVEL SECURITY;` and define RLS policies for all tenant-specific tables.

### Approaches
1. **PostgreSQL Native RLS via NestJS Transacted Interceptor** — Every authenticated NestJS request runs inside a Postgres transaction, setting `app.current_tenant_id` at the start.
   - Pros: Iron-clad security at the DB level; impossible to leak data; simplifies NestJS repository logic.
   - Cons: All requests require an active transaction which can put pressure on the connection pool.
   - Effort: Medium

2. **Global Application-Level ORM Filters** — Use a TypeORM entity listener/subscriber or custom query builder wrappers to inject the `tenantId` automatically at runtime.
   - Pros: No PG transactional overhead.
   - Cons: Doesn't prevent leaks in raw SQL, complex joins, or third-party query builders.
   - Effort: High (TypeORM lacks robust built-in support for global filter parameters).

### Recommendation
We recommend **Approach 1 (PostgreSQL Native RLS)** because the monorepo guidelines in [.ai/skills/backend/tenant-patterns.md](file:///c:/Users/ferna/Documents/Repositorios/picky-app/.ai/skills/backend/tenant-patterns.md) already outline this pattern, and it provides absolute safety against information leakage.

### Risks
- **Connection Pool Exhaustion**: Wrapping every request in a PG transaction blocks connections longer. We mitigate this by using `@SkipRls()` on all public endpoints and tuning `max` connections in `data-source.ts`.
- **Foreign Key Constraints**: Disabling RLS during migrations is necessary to prevent DB bootstrap failures.

### Ready for Proposal
Yes. Ready to proceed to the Proposal phase.
