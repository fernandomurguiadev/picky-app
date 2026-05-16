# Proposal: Native PostgreSQL RLS Tenant Isolation

## Intent
This proposal aims to implement database-level multi-tenant isolation using native PostgreSQL Row-Level Security (RLS) combined with a transacted NestJS interceptor. This ensures zero data leakage between tenants by enforcing filters at the database engine level, removing the risk of developer oversight in manual ORM filters.

## Scope

### In Scope
- **RLS Enablement Migration**: Create a TypeORM migration to enable RLS and define policies on `products`, `categories`, `store_settings`, and `orders` tables.
- **RlsInterceptor**: Create a transactional interceptor that wraps authenticated requests in a Postgres transaction, executes `SET LOCAL app.current_tenant_id = '<uuid>'`, and stores the transactional QueryRunner in the request object.
- **@SkipRls Decorator**: Implement a decorator to exclude public routes from RLS transaction overhead.
- **Query Adapter**: Update core backend service queries to run via the transactional QueryRunner.

### Out of Scope
- **Physical Partitioning**: Schema-per-tenant or database-per-tenant isolation.
- **Redis RLS**: Key-level prefix isolation in Redis (handled separately).

## Capabilities

### New Capabilities
- `api-tenant-rls-isolation`: Native PG-level and NestJS-level transacted RLS multi-tenant security envelope.

### Modified Capabilities
- None

## Approach
Implement standard PostgreSQL RLS policies checking `current_setting('app.current_tenant_id')`. Introduce a NestJS [RlsInterceptor](file:///c:/Users/ferna/Documents/Repositorios/picky-app/api/src/common/interceptors/rls.interceptor.ts) that opens a transaction, sets the session tenant UUID, and exposes `rlsQueryRunner` to controllers.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/src/common/interceptors/rls.interceptor.ts` | New | High-level NestJS transactional RLS interceptor |
| `api/src/common/decorators/skip-rls.decorator.ts` | New | `@SkipRls()` decorator definition |
| `api/src/app.module.ts` | Modify | Register RlsInterceptor globally |
| `api/src/migrations/` | New | Migration to enable RLS and add PG policies |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Connection Pool Exhaustion | Medium | Apply `@SkipRls()` to all public, high-volume endpoints; tune DB pool size in `data-source.ts`. |
| Transactional Overhead | Low | Only apply transactions to authenticated stateful routes. |

## Rollback Plan
- Revert the TypeORM migration: `npm run migration:revert --prefix api`.
- Remove global `RlsInterceptor` registration in `app.module.ts`.

## Dependencies
- PostgreSQL 12+ (which supports RLS).

## Success Criteria
- [ ] Active NestJS queries are automatically filtered by tenant ID.
- [ ] Attempting to fetch data without specifying `tenantId` in the ORM query still returns ONLY the active tenant's rows.
- [ ] Running the test suite (`npm run test --prefix api`) passes successfully.
