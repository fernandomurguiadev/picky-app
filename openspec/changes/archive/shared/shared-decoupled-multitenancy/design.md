# Design: Decoupled Multi-Tenant Identities

## Technical Approach
We will decouple global identities (the `User` table) from logical tenancy partitions (`Tenant` table) by removing `User.tenantId` and replacing it with a `TenantMembership` bridge table. All application logic is preserved because the final session JWT token will still carry the isolated `tenantId`.

## Architecture Decisions

### Decision: Selection Stateless Flow
| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Selection Token (Short JWT)** | Requires temporary token signature, but keeps DB entirely stateless and avoids session caching. | **SELECTED**: High security, stateless. |
| **DB Session Pinning** | Stores the "pending tenant selection" status in the DB or Redis. | Rejected: Increases DB write latency for logins. |

### Decision: User Email Constraints
| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Global Unique Email** | Allows 1 set of credentials to access N stores. Perfect SaaS model. | **SELECTED**: Standard enterprise pattern. |
| **Composite Unique (Unchanged)** | Requires duplicate email entries for each store. | Rejected: Doesn't allow unified login selector. |

## Data Flow

```text
[Client] ──1. POST /auth/login ──────────────────────→ [AuthService]
                                                            │ (Verify Pass, count memberships)
[Client] ←─2. Response: requires_selection + token ──── [AuthService]
    │
    ├─(Renders Shop List)
    │
[Client] ──3. POST /auth/select-tenant {tenantId, token} → [AuthService]
                                                            │ (Verify token, sign final JWT)
[Client] ←─4. Access Token Issued ────────────────────── [AuthService]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `api/src/modules/auth/entities/tenant-membership.entity.ts` | Create | Bridges Users to Tenants. |
| `api/src/modules/auth/entities/user.entity.ts` | Modify | Drop `tenantId`, index `email` unique. |
| `api/src/modules/auth/auth.service.ts` | Modify | Refactor `login`/`register`, add `selectTenant`. |
| `api/src/modules/auth/auth.controller.ts` | Modify | Expose `POST /auth/select-tenant`. |
| `api/src/modules/auth/auth.module.ts` | Modify | Register `TenantMembership` entity. |
| `api/src/scripts/seed.ts` | Modify | Map seeded users to memberships instead of direct columns. |
| `app/src/app/api/auth/login/route.ts` | Modify | BFF proxy to support `requires_selection` relay. |
| `app/src/app/api/auth/select-tenant/route.ts` | Create | New BFF proxy for selection. |
| `app/src/app/auth/login/page.tsx` | Modify | UI Slide-in for Shop Selection. |

## Interfaces / Contracts

### Auth Login (N Memberships Response)
```typescript
interface MultiTenantLoginResponse {
  requiresSelection: true;
  selectionToken: string;
  tenants: {
    id: string;
    name: string;
    slug: string;
  }[];
}
```

### Select Tenant Endpoint
`POST /api/v1/auth/select-tenant`
```typescript
interface SelectTenantDto {
  selectionToken: string;
  tenantId: string;
}
```

## Testing Strategy
- **Unit**: `AuthService.login` mock tests for single vs multiple memberships.
- **Integration**: `POST /auth/login` and `POST /auth/select-tenant` verified with Jest Supertest.

## Migration / Rollout
A custom TypeORM migration will:
1. Create the `tenant_memberships` table.
2. Copy ALL distinct users into it, migrating their current `tenantId` as their initial active membership.
3. Delete duplicates on `users` (collapsing identical emails into a single global row).
4. Drop `users.tenantId`.
5. Add UNIQUE index to `users.email`.
