# Delta para Reportes (Reports) — Nueva Capability

## Funcionalidades Modificadas / Añadidas

| ID | Funcionalidad | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **R-001** | **Endpoint de Rentabilidad** | Agregación de ingresos, costo y margen por rango de fechas, categoría y producto. | Alta |
| **R-002** | **Sección "Rentabilidad" en Admin** | Panel visual (gráfico + tabla de top productos) sobre los datos del endpoint de rentabilidad. | Alta |
| **R-003** | **Gate por Rol y por Plan** | Solo `UserRole.ADMIN` accede; requiere el feature de plan `FeatureCode.ANALYTICS`. | Alta |
| **R-004** | **Comparativo vs. Período Anterior** | El resumen incluye la variación % contra el rango de igual duración inmediatamente anterior. | Media |

## ADDED Requirements

### Requirement: Endpoint de Agregación de Rentabilidad

El sistema MUST exponer `GET /api/v1/admin/reports/profitability` (o ruta equivalente dentro del módulo admin), que agrega sobre `order_items` del tenant autenticado, filtrando por `Order.status`.

El `OrderStatus` real (`api/src/modules/orders/enums/order.enums.ts`) es `pending | confirmed | preparing | ready | delivered | cancelled` — no existen los estados `paid`/`pending_payment` que se mencionaban en un borrador anterior de este proposal (esos pertenecen a otro change de pago online con MercadoPago, aún no implementado). Este endpoint MUST considerar "venta realizada" a los pedidos en `confirmed`, `preparing`, `ready` o `delivered` — excluyendo `pending` (todavía puede rechazarse) y `cancelled`.

```typescript
export interface ProfitabilityQuery {
  from: string; // ISO date
  to: string; // ISO date
  categoryId?: string;
  productId?: string;
}

export interface ProfitabilityByProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number; // centavos
  cost: number; // centavos, solo ítems con unitCost != null
  grossMargin: number; // revenue - cost, centavos
  marginPercent: number; // grossMargin / revenue * 100
  unitsMissingCost: number; // ítems excluidos del cálculo por no tener costo cargado
}

export interface PeriodComparison {
  // null cuando el período anterior no tiene datos (ej. tenant nuevo) — nunca dividir por cero
  revenueChangePercent: number | null;
  costChangePercent: number | null;
  grossMarginChangePercent: number | null;
}

export interface ProfitabilitySummary {
  revenue: number;
  cost: number;
  grossMargin: number;
  marginPercent: number;
  byProduct: ProfitabilityByProduct[];
  comparison: PeriodComparison; // NUEVO — comparativo vs. período anterior
}
```

- El cálculo MUST filtrar siempre por `tenantId` del usuario autenticado.
- Ítems con `unitCost = null` se excluyen del costo y margen, pero se cuentan en `unitsMissingCost` para que el comerciante sepa que el dato está incompleto.
- El período anterior se calcula automáticamente como el rango de igual duración inmediatamente anterior al solicitado (ej. `from=2026-07-01&to=2026-07-31` → compara contra el 01/06 al 30/06). No es un parámetro que el usuario configure.

#### Scenario: Comerciante consulta rentabilidad de un período

- GIVEN un `ADMIN` con el feature `ANALYTICS` habilitado en su plan
- WHEN solicita `GET /api/v1/admin/reports/profitability?from=2026-07-01&to=2026-07-31`
- THEN el sistema MUST devolver `ProfitabilitySummary` agregado solo con pedidos del tenant del usuario, dentro del rango de fechas, cuyo `status` sea `confirmed`, `preparing`, `ready` o `delivered`.

#### Scenario: Pedidos pending o cancelled no cuentan como venta

- GIVEN un tenant con pedidos en estado `pending` y otros en `cancelled` dentro del rango consultado
- WHEN se agrega la rentabilidad del período
- THEN esos pedidos MUST excluirse por completo del cálculo — ni ingresos, ni costo, ni unidades vendidas.

#### Scenario: Ítems sin costo cargado no distorsionan el margen

- GIVEN un tenant con productos donde algunos tienen `costPrice` y otros no
- WHEN se agrega la rentabilidad de un período
- THEN los ítems con `unitCost = null` MUST excluirse de `revenue`/`cost`/`grossMargin` por producto
- AND MUST reflejarse en `unitsMissingCost` para visibilizar el dato incompleto, en lugar de mostrar un margen del 100% engañoso.

#### Scenario: Comparativo vs. período anterior

- GIVEN un `ADMIN` que consulta rentabilidad de julio (`from=2026-07-01&to=2026-07-31`)
- WHEN el sistema arma el `ProfitabilitySummary`
- THEN MUST calcular también los totales de junio (mismo rango de días, período inmediatamente anterior)
- AND MUST devolver `comparison` con la variación porcentual de `revenue`, `cost` y `grossMargin` entre ambos períodos.

#### Scenario: No hay datos en el período anterior

- GIVEN un tenant que recién empezó a operar y no tiene pedidos en el período anterior al consultado
- WHEN se calcula `comparison`
- THEN el sistema MUST devolver un valor que indique "sin datos previos" (ej. `null` o `0` documentado explícitamente) en vez de una división por cero o un porcentaje engañoso (ej. "+∞%").

### Requirement: Restricción de Acceso por Rol y por Plan

El acceso a rentabilidad MUST restringirse a información sensible del negocio — no todos los usuarios del tenant deben verla.

`RolesGuard` + `@Roles(...)` (`api/src/common/guards/roles.guard.ts`, `roles.decorator.ts`) ya existen en el código, pero **hoy no están aplicados a ningún controller** — este endpoint sería su primer uso real. `FeatureService.hasFeature(tenantId, code)` (`api/src/modules/platform/feature.service.ts:89`) también existe, pero **no tiene ningún consumidor fuera del módulo `platform`** — no hay un `FeatureGuard` reusable todavía. Este change MUST crear ese guard (o invocar `hasFeature` explícitamente en el controller/service) — no es una integración con un patrón ya probado en producción, es la primera vez que ambos mecanismos se aplican a un endpoint de negocio.

#### Scenario: Un STAFF intenta acceder al reporte de rentabilidad

- GIVEN un usuario con `TenantMembership.role = STAFF`
- WHEN intenta acceder a `GET /api/v1/admin/reports/profitability`
- THEN el sistema MUST responder `403 Forbidden` — el endpoint MUST estar guardado con `RolesGuard` + `@Roles('admin')` para `UserRole.ADMIN` únicamente.

#### Scenario: Tenant sin el feature ANALYTICS en su plan

- GIVEN un tenant cuyo plan actual no incluye `FeatureCode.ANALYTICS`
- WHEN un `ADMIN` de ese tenant intenta acceder a la sección "Rentabilidad" o al endpoint
- THEN el backend MUST responder `403 Forbidden` (vía el guard/check de `hasFeature` a crear en este change)
- AND el frontend MUST mostrar un upsell hacia el plan que incluye el feature, en vez de ocultar la sección sin explicación.

## Criterios de Aceptación Modificados / Añadidos

- CA-001: El endpoint MUST aislar resultados por `tenantId` — cero fuga de datos entre tenants.
- CA-002: El guard de rol (`ADMIN` vs `STAFF`) se aplica a nivel de endpoint con `RolesGuard`/`@Roles(...)`, no solo ocultando el link en el frontend.
- CA-003: El gate de plan reutiliza `FeatureService.hasFeature(tenantId, FeatureCode.ANALYTICS)` — no se crea un sistema paralelo de plan/feature, pero SÍ se crea el guard/decorator que hoy falta para aplicarlo a un endpoint (`hasFeature` no tiene consumidores fuera de `platform` hoy).
- CA-004: La UI de "Rentabilidad" MVP reutiliza `MetricCard` (ya usado en `admin/dashboard`) para los totales del período + una tabla para el desglose por producto. `admin/dashboard` hoy no tiene ninguna librería de gráficos instalada — si `design.md` decide sumar un gráfico de tendencia, es una dependencia nueva a evaluar explícitamente, no algo que ya exista para reutilizar.
- CA-005: El período de comparación se deriva automáticamente del rango solicitado (mismo N° de días, inmediatamente anterior) — no es un input del usuario.
- CA-006: Si el período anterior no tiene pedidos, `comparison.*ChangePercent` MUST ser `null` — nunca `Infinity`, `NaN` o un error 500 por división por cero.
- CA-007: Filtrar siempre por `Order.status IN (confirmed, preparing, ready, delivered)` — nunca por estados inexistentes como `paid`/`pending_payment`.
