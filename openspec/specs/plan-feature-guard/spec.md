# plan-feature-guard Specification

## Purpose
TBD - created by archiving change api-plan-feature-flags. Update Purpose after archive.
## Requirements
### Requirement: Servicio de autorización de features por tenant

El sistema SHALL proveer un `FeatureService` exportable con el método `hasFeature(tenantId: string, featureCode: string): Promise<boolean>` que determine si el tenant tiene acceso a una funcionalidad dado su plan activo.

**Interfaces TypeScript:**

```typescript
enum FeatureCode {
  REMOVE_BRANDING  = 'REMOVE_BRANDING',
  CUSTOM_DOMAIN    = 'CUSTOM_DOMAIN',
  ANALYTICS        = 'ANALYTICS',
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
  MULTI_BRANCH     = 'MULTI_BRANCH',
  API_ACCESS       = 'API_ACCESS',
  AI_ASSISTANT     = 'AI_ASSISTANT',
}

interface FeatureService {
  hasFeature(tenantId: string, featureCode: FeatureCode | string): Promise<boolean>;
}
```

**Criterios de aceptación:**
- CA1: Devuelve `true` si el plan del tenant tiene la feature asignada en `plan_features`.
- CA2: Devuelve `false` si el tenant no existe, no tiene plan asignado, o el plan no tiene la feature.
- CA3: No lanza excepción bajo ninguna condición — siempre devuelve `boolean`.
- CA4: El servicio debe ser exportado por `PlatformModule` e inyectable en cualquier módulo que importe `PlatformModule`.

#### Scenario: Tenant con feature habilitada
- **WHEN** `hasFeature('tenant-uuid', 'ANALYTICS')` es llamado y el plan del tenant tiene `ANALYTICS` asignada
- **THEN** el método devuelve `true`

#### Scenario: Tenant sin la feature en su plan
- **WHEN** `hasFeature('tenant-uuid', 'CUSTOM_DOMAIN')` es llamado y el plan del tenant no tiene `CUSTOM_DOMAIN`
- **THEN** el método devuelve `false`

#### Scenario: Tenant con plan FREE (sin features)
- **WHEN** `hasFeature('tenant-uuid', 'REMOVE_BRANDING')` es llamado y el tenant tiene plan FREE
- **THEN** el método devuelve `false`

#### Scenario: Tenant inexistente
- **WHEN** `hasFeature('id-inexistente', 'ANALYTICS')` es llamado con un tenantId que no existe en la DB
- **THEN** el método devuelve `false` sin lanzar excepción

#### Scenario: Feature code desconocido
- **WHEN** `hasFeature('tenant-uuid', 'FEATURE_INEXISTENTE')` es llamado con un código que no existe en `features`
- **THEN** el método devuelve `false` sin lanzar excepción

---

### Requirement: Seeder de features y asignaciones iniciales

El sistema SHALL proveer un seeder que cargue las 7 features base y las asigne a los planes correctos de forma idempotente (usando upsert).

**Configuración inicial:**

| Plan | Features habilitadas |
|------|---------------------|
| FREE | — |
| STARTER | REMOVE_BRANDING, ANALYTICS |
| PRO | REMOVE_BRANDING, ANALYTICS, CUSTOM_DOMAIN, PRIORITY_SUPPORT |
| BUSINESS | Todas (7 features) |

#### Scenario: Ejecución idempotente del seeder
- **WHEN** el seeder se ejecuta dos veces consecutivas
- **THEN** el resultado en base de datos es idéntico y no genera errores de duplicado

#### Scenario: Seeder sobre planes existentes
- **WHEN** los planes FREE, STARTER, PRO y BUSINESS existen en la tabla `plans`
- **THEN** el seeder asigna las features correspondientes sin modificar los planes

