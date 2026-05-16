# Tenant RLS Isolation Specification

## Purpose
This specification defines the behavior and verification criteria for native PostgreSQL Row-Level Security (RLS) and transacted tenant context in `picky-app`. This safety boundary guarantees that data cannot leak between tenants even if developers forget manual application-layer filters.

## Requirements

### Requirement: Database Row-Level Security
The PostgreSQL database MUST enforce Row-Level Security on all multi-tenant tables (`products`, `categories`, `store_settings`, `orders`). The database engine SHALL filter all operations (SELECT, INSERT, UPDATE, DELETE) such that only rows where `tenantId = current_setting('app.current_tenant_id')::uuid` are accessible.

#### Scenario: Automatic SELECT Filtering
- GIVEN RLS is enabled on `products` and `app.current_tenant_id` is set to `'130c51c8-0ee5-4b54-ab76-6649cbcf21de'`
- WHEN a raw query `SELECT * FROM products` is executed
- THEN only products belonging to tenant `'130c51c8-0ee5-4b54-ab76-6649cbcf21de'` MUST be returned.

#### Scenario: Block Cross-Tenant Mutation
- GIVEN RLS is enabled on `products` and `app.current_tenant_id` is set to `'130c51c8-0ee5-4b54-ab76-6649cbcf21de'`
- WHEN an update `UPDATE products SET name = 'Hacker Burger' WHERE id = 'product-id-of-different-tenant'` is executed
- THEN the query MUST NOT modify the row and SHALL return 0 rows affected.

### Requirement: Transactional Tenant Context
The NestJS backend MUST wrap all authenticated stateful requests in a database transaction, execute `SET LOCAL app.current_tenant_id = '<uuid>'` using the tenant UUID from the JWT, and attach the transactional QueryRunner as `request.rlsQueryRunner` to the request object.

#### Scenario: Interceptor Session Provisioning
- GIVEN a user requests an authenticated endpoint with a JWT containing tenantId `'130c51c8-0ee5-4b54-ab76-6649cbcf21de'`
- WHEN the request enters the `RlsInterceptor`
- THEN a database transaction MUST be opened, `SET LOCAL app.current_tenant_id = '130c51c8-0ee5-4b54-ab76-6649cbcf21de'` executed, and the QueryRunner attached.

### Requirement: RLS Bypass for Public Endpoints
The NestJS backend SHALL support a `@SkipRls()` decorator. When an endpoint is annotated with `@SkipRls()`, the backend MUST bypass opening a database transaction and setting the tenant ID context.

#### Scenario: Bypass RLS on Public Endpoint
- GIVEN a controller method decorated with `@SkipRls()`
- WHEN a public request is received
- THEN the request MUST execute without opening a PostgreSQL transaction or setting session variables.
