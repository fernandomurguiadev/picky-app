# Delta for Autenticación

## MODIFIED Requirements

### Requirement: Global Identity Login
The login process MUST verify user credentials globally against the `users` table instead of doing a combined lookup of tenant and email, to support centralized identity verification.
(Previously: Autenticación 1-a-1 acoplada a nivel de tenant).

#### Scenario: Unambiguous Login
- GIVEN an administrator registered with email `example@mail.com` linked to exactly one store
- WHEN they submit their credentials to `POST /auth/login`
- THEN the API MUST authenticate them
- AND immediately return the standard `accessToken` containing their single `tenantId`.

#### Scenario: Ambiguous Multi-Tenant Login
- GIVEN an administrator registered with email `example@mail.com` linked to multiple stores
- WHEN they submit their credentials to `POST /auth/login`
- THEN the API MUST authenticate their core password
- AND return a selection requirement payload as specified in the `tenant-selection` capability spec
- AND MUST NOT issue the final `accessToken` until selection is completed.

### Requirement: Global Identity Registration
The registration process MUST ensure the user's global identity is established uniquely while attaching them to the newly created store as an ADMIN member.
(Previously: Creaba usuario con tenantId fijo directo en la fila).

#### Scenario: Register New Global Account and Store
- GIVEN a new user without an existing global account
- WHEN they submit the `POST /auth/register` payload with `email`, `password`, and `storeName`
- THEN the API MUST create a global `User` record
- AND create a new `Tenant` record
- AND create a `TenantMembership` linking them together as an ADMIN
- AND automatically return the signed `accessToken` for the new tenant.
