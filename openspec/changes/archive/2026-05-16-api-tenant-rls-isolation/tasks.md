# Tasks: Native PostgreSQL RLS Tenant Isolation

## Phase 1: Core Decorators & Context
- [ ] 1.1 Create the `@SkipRls()` decorator in `api/src/common/decorators/skip-rls.decorator.ts` to allow public endpoints to bypass RLS transaction wrapping.
- [ ] 1.2 Create the `@RlsRunner()` decorator in `api/src/common/decorators/rls-runner.decorator.ts` to fetch the transactional query runner inside NestJS controllers.

## Phase 2: Transactional Interceptor
- [ ] 2.1 Create the transactional `RlsInterceptor` in `api/src/common/interceptors/rls.interceptor.ts` to open, set local tenant variable, and commit/rollback transactions on request boundary.
- [ ] 2.2 Wire up `RlsInterceptor` globally inside `api/src/app.module.ts`.

## Phase 3: Database Policies Migration
- [ ] 3.1 Create a new TypeORM migration file under `api/src/migrations/` to execute the database RLS schema alter statements.
- [ ] 3.2 Write SQL commands inside the migration file to ENABLE and FORCE RLS, and add policies for tables: `products`, `categories`, `store_settings`, and `orders`.
- [ ] 3.3 Run the migration command locally to apply policies: `npm run migration:run --prefix api`.

## Phase 4: Verification & Tests
- [ ] 4.1 Create a simple test endpoint or script inside `api/src/scripts/` to confirm that query execution without repository `where: { tenantId }` constraints automatically filters data correctly under the RLS transaction context.
- [ ] 4.2 Run the NestJS backend unit and integration test suites via Jest: `npm run test --prefix api` to ensure 100% compliance and that no regression issues are introduced.
