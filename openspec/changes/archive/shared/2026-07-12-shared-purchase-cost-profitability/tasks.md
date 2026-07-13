# Tasks: Precio de Compra y Panel de Rentabilidad

## Fase 1 — Carga de Costo

- [x] 1. DB/API: Agregar `costPrice` (integer, nullable) a `product.entity.ts`
- [x] 2. DB/API: Agregar `unitCost` (integer, nullable) a `order-item.entity.ts`
- [x] 3. API: `costPrice` opcional en `CreateProductDto` / `UpdateProductDto`
- [x] 4. API: Excluir `costPrice` del storefront público — **reconciliado**: superado por el class-serializer global por rol (`@Expose({groups:[UserRole.ADMIN]})` + `TransformInterceptor`) agregado en paralelo por el usuario; se sacó el whitelist manual (`toPublicProduct`) por redundante.
- [x] 5. API: Snapshotear `unitCost` desde `product.costPrice` en `orders.service.ts` (mismo `.map` donde se arma `unitPrice`)
- [x] 6. API: Excluir `unitCost` de `GET /admin/orders`/`:id` — **reconciliado**: mismo class-serializer global; se sacó `stripItemCosts` de estas rutas. Se mantiene solo para el payload del WS `emitOrderNew` (socket.io no pasa por interceptors de Nest).
- [x] 6b. **Bug corregido** en el serializer del usuario: `@Expose({groups:['ADMIN']})` (mayúsculas) nunca matcheaba el rol real del JWT (`UserRole.ADMIN = 'admin'`, minúsculas) — ningún admin veía `costPrice`/`unitCost`. Corregido a `@Expose({groups:[UserRole.ADMIN]})` en `product.entity.ts` y `order-item.entity.ts`.
- [x] 7. App: Campo "Precio de compra (en pesos)" en `product-form/index.tsx`, reutilizando `PriceInput`, sin heredar `disabled` de `isGroupPriced`
- [x] 8. App: Zod schema del form de producto — `costPrice` opcional
- [x] 9. Backend: Unit test de snapshot de `unitCost` (con costo y sin costo) — `orders.cost-snapshot.spec.ts` (4 tests: con costo, sin costo, cliente no puede inyectar unitCost, WS nunca lo incluye)
- [x] 10. Backend: Test de serialización por rol — `transform.interceptor.spec.ts` (5 tests, con entidades reales `Product`/`OrderItem`: público sin costPrice, STAFF sin costPrice/unitCost, ADMIN con ambos, incluye el array anidado `order.items` sin `@Type()`)
- [x] 11. Migración — **ya generada por el usuario**: `api/src/migrations/1783905259807-Migration.ts` (agrega `unitCost`/`costPrice`). Falta `npm run migration:run`.

## Fase 2 — Panel de Rentabilidad

- [x] 12. API: Crear `FeatureGuard` + `@RequireFeature(...)` decorator (`api/src/common/`) — leer `tenantId` de `request.user.tenantId`, NUNCA de `request.tenantId` (los Guards corren antes que `TenantContextInterceptor`, ver design.md)
- [x] 13. API: Aplicar `RolesGuard` + `@Roles('admin')` al nuevo endpoint (primer uso real de `RolesGuard` en el proyecto)
- [x] 14. API: Crear módulo `reports` (`reports.module.ts`, `reports.controller.ts`, `reports.service.ts`, `dto/profitability-query.dto.ts`)
- [x] 15. API: Query de agregación — filtrar `Order.status IN (confirmed, preparing, ready, delivered)`, excluir `pending`/`cancelled`
- [x] 16. API: Cálculo de `unitsMissingCost` para ítems con `unitCost = null`
- [x] 17. API: Cálculo de `comparison` (período anterior, mismo rango de días) con `null` cuando no hay datos previos
- [x] 18. API: Registrar `ReportsModule` en `AppModule`
- [x] 19. App: Hook `useProfitability` (TanStack Query) en `lib/hooks/admin/use-reports.ts`
- [x] 20. App: Página `admin/reports` — `MetricCard` de totales + comparativo + tabla de top productos
- [x] 21. App: Upsell cuando el tenant no tiene el feature `ANALYTICS`
- [x] 22. Backend: Unit test de `ReportsService` — `reports.service.spec.ts` (7 tests: filtro de estados, fin de día en `to`, join condicional a `Product`, `unitsMissingCost`, `comparison` con y sin datos previos)
- [x] 23. Backend: Test de `RolesGuard`+`FeatureGuard` de `ReportsController` — `reports-access-control.spec.ts` + `feature.guard.spec.ts` (8 tests: 403 STAFF, 403 sin feature, 200 ADMIN con feature, fail-closed sin tenantId, lee `request.user.tenantId` no `request.tenantId`)

## Gaps encontrados y corregidos en la segunda revisión

- **`reports.service.ts` — join incondicional a `Product` descartaba historial**: `innerJoin(Product, 'p', ...)` se hacía siempre, para poder filtrar por categoría. Pero `deleteProduct` permite borrar productos con solo pedidos `DELIVERED`/`CANCELLED` históricos — que siguen contando en rentabilidad. El join incondicional los excluía de TODO reporte, no solo de los filtrados por categoría. Corregido: el join a `Product` ahora solo se agrega cuando `categoryId` viene en el query.
- **`reports.service.ts` — `to` truncaba el último día del rango**: `new Date(query.to)` parsea a medianoche UTC, así que `BETWEEN :from AND :to` excluía por completo el día final solicitado. Corregido con `to.setUTCHours(23,59,59,999)`.
- **`metric-card/index.tsx` — flecha de tendencia invertida para "Costo"**: el componente decidía la flecha (▲/▼) con el mismo booleano `isPositive` usado para el color (verde/rojo). Para "Costo" seteo `isPositive: costChangePercent <= 0` (bajar el costo es bueno = verde), pero eso hacía que la flecha mostrara ▲ cuando el costo BAJABA. Corregido: la flecha ahora se decide por el signo real de `trend.value`, el color sigue viniendo de `isPositive`. Sin impacto en otros usos de `MetricCard` (no había ningún otro consumidor de `trend` en el código).
- **Reconciliación con serializer global** (ver design.md): eliminado el whitelist manual (`toPublicProduct`, y `stripItemCosts` salvo para el WS), corregido el bug de mayúsculas en `@Expose`.
- **Mutator de Orval roto** (no introducido por este change, pero bloqueaba `npm run typecheck` de `app/` entero): `customMutator` esperaba un único `AxiosRequestConfig`, pero el cliente `react-query` generado llama `customMutator(url, init: RequestInit)` — dos argumentos, estilo fetch. Corregido adaptando la firma del mutator para aceptar `(url, init)` y traducirlo a la config de Axios (incluyendo `JSON.parse` del `body` ya serializado).

## Decisión tomada durante la implementación

- El link "Rentabilidad" en `AdminSidebar` **no** se ocultó por rol (`ADMIN`/`STAFF`) — el resto del sidebar tampoco filtra por rol hoy, y la seguridad real vive en el guard del endpoint (`RolesGuard` + `@Roles('admin')`), no en ocultar el link. Corrección del usuario durante la sesión.

## Documentado como Out of Scope (no implementar en este change)

- Indicador de margen en el listado de catálogo (chip "Margen: X%")
- Alerta de venta a pérdida en `product-form`
- Costo a nivel de opción/variante (`OptionItem`)
- Exportación de reportes (CSV/PDF)

## QA / Cierre

- [x] 24. `npm run typecheck` en `api/` y `app/` sin errores (verificado, incluye el fix del mutator de Orval)
- [x] 25. `npm run test` en `api/` — 84 tests (81 pasan, 24 nuevos de este change). 3 fallas preexistentes en `orders.inventory.spec.ts` (`seqResult[0].last_order_number`), confirmadas como **no relacionadas** a este change (mismas fallas en HEAD antes de tocar nada, vía `git stash`).
- [ ] 26. Confirmar manualmente en el navegador — **pendiente, requiere que el usuario lo haga**: no hay entorno corriendo (DB + API + front) en esta sesión para levantarlo. Falta además correr `npm run migration:run` antes de poder probar en vivo.
