# Tenant Selection Specification

## Purpose
Defines the requirements for authorizing a globally authenticated identity to act under a specific tenant's scope when that user possesses multiple active tenant memberships.

## Requirements

### Requirement: Selective Scoping
The system MUST prompt the user to select a store if their global identity maps to more than one active tenant membership, and upon selection, issue a JWT containing that tenant's identifier.

#### Scenario: Authenticating User with Multiple Stores
- GIVEN an administrator who possesses memberships in two different stores
- WHEN they log in successfully with their email and password
- THEN the API MUST respond with status `200 OK` and structure `requires_selection: true`
- AND return an array of linked stores: `tenants: [{ id, name, slug }]`
- AND return a short-lived `selectionToken`.

#### Scenario: Completing Selection and Obtaining Access Token
- GIVEN an administrator who received a `selectionToken` and a list of stores
- WHEN they submit a `POST /auth/select-tenant` with the selected `tenantId` and `selectionToken`
- THEN the API MUST verify the selection token
- AND verify the user is a member of the selected tenant
- AND return the final signed `accessToken` containing the chosen `tenantId`.
