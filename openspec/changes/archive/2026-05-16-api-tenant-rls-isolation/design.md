# Design: Native PostgreSQL RLS Tenant Isolation

## Technical Approach
We will enforce tenant isolation at the database engine level using PostgreSQL Row-Level Security (RLS). To support this in NestJS/TypeORM, we will use a transactional interceptor (`RlsInterceptor`) that runs a `SET LOCAL app.current_tenant_id = '<uuid>'` statement within a Postgres transaction before executing the request's handler. This ensures that the session variable is scoped strictly to the current request transaction and does not leak when the connection is returned to the pool.

```
Request Authenticated
  │ (JWT -> request.user.tenantId)
  ▼
RlsInterceptor
  │
  ├── 1. Open QueryRunner from DataSource
  ├── 2. Start Transaction
  ├── 3. Execute: SET LOCAL app.current_tenant_id = '<tenantId>'
  ├── 4. Attach QueryRunner to request.rlsQueryRunner
  ▼
Controller/Service (uses rlsQueryRunner.manager to execute queries)
  │
  ├─► SUCCESS: Commit Transaction & Release Connection
  └─► FAILURE: Rollback Transaction & Release Connection
```

## Architecture Decisions

### Decision: PostgreSQL Native RLS with Force RLS
**Choice**: Enable RLS on multi-tenant tables and add `FORCE ROW LEVEL SECURITY` to all of them.
**Alternatives considered**: standard `ENABLE ROW LEVEL SECURITY` only.
**Rationale**: By default, superusers (like `postgres` owner user) bypass RLS policies. Running `ALTER TABLE <name> FORCE ROW LEVEL SECURITY` guarantees that PostgreSQL applies RLS rules even if the NestJS app connects as the database owner or superuser, establishing a foolproof security net.

### Decision: Transaction-Scoped Context
**Choice**: Use `SET LOCAL` inside a NestJS transacted QueryRunner.
**Alternatives considered**: Set connection-level variables without transactions.
**Rationale**: TypeORM uses a connection pool. Setting variables at the connection level (without `SET LOCAL` + transactions) would cause the tenant context to persist on that connection and leak to subsequent requests from other tenants that reuse that pooled connection. `SET LOCAL` strictly scopes the variable to the transaction block.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `api/src/common/decorators/skip-rls.decorator.ts` | Create | `@SkipRls()` decorator |
| `api/src/common/interceptors/rls.interceptor.ts` | Create | Transactional `RlsInterceptor` implementing NestInterceptor |
| `api/src/common/decorators/rls-runner.decorator.ts` | Create | Helper parameter decorator `@RlsRunner()` to inject query runner |
| `api/src/app.module.ts` | Modify | Register `RlsInterceptor` as a global NestJS interceptor |
| `api/src/migrations/` | Create | TypeORM migration script setting RLS and policies |

## Interfaces / Contracts

```typescript
// api/src/common/decorators/skip-rls.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const SKIP_RLS_KEY = 'skipRls';
export const SkipRls = () => SetMetadata(SKIP_RLS_KEY, true);

// api/src/common/decorators/rls-runner.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const RlsRunner = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.rlsQueryRunner;
  },
);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `RlsInterceptor` transaction cycle | Mock `DataSource` and `QueryRunner` in Jest; verify rollback and commit trigger under success/error. |
| Integration | RLS enforcement in NestJS | Bootstrap NestJS test app; authenticate user, run service query without manual where clause, check that RLS filters out other tenant data. |

## Migration / Rollout
Create a TypeORM migration that applies RLS policies:
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

CREATE POLICY products_tenant_policy ON products
  FOR ALL
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```
Repeat for `categories`, `store_settings`, and `orders`.

## Open Questions
None. The design is mature and aligned with the monorepo design principles.
