# Tasks — api-fase-7-metrics

## Fase de implementación: FASE 7 — Dashboard Metrics

---

### B7.1 — `DashboardMetricsDto`

- [ ] Crear `api/src/modules/dashboard/dto/dashboard-metrics.dto.ts`
- [ ] Clase `TopProductDto` con campos `productId: string`, `productName: string`, `totalQuantity: number`
- [ ] Clase `DashboardMetricsDto` con campos: `ordersToday`, `revenueToday`, `averageTicket`, `pendingOrders` (todos `number`), `hourlyOrders: number[]`, `topProducts: TopProductDto[]`

**Criterio de done:** Tipo compilable, sin `any`, importable desde el service y controller.

---

### B7.2 — `DashboardService`

- [ ] Crear `api/src/modules/dashboard/dashboard.service.ts`
- [ ] Inyectar `@InjectRepository(Order)` y `@InjectRepository(OrderItem)`
- [ ] Método público `getMetrics(tenantId: string): Promise<DashboardMetricsDto>`
  - Calcular `startOfDay` y `endOfDay` con `setHours`
  - Ejecutar en paralelo con `Promise.all`: conteo de órdenes del día, suma de revenue, conteo de pendientes, distribución horaria, top productos
  - Calcular `averageTicket = deliveredCount > 0 ? Math.round(revenueToday / deliveredCount) : 0`
- [ ] Método privado `countOrdersToday(tenantId, start, end)`: count con `status != CANCELLED` y `createdAt BETWEEN`
- [ ] Método privado `countDeliveredToday(tenantId, start, end)`: count con `status = DELIVERED`
- [ ] Método privado `sumRevenueToday(tenantId, start, end)`: `SUM(total)` en órdenes `DELIVERED`, retorna `number` (usar `COALESCE(..., 0)`)
- [ ] Método privado `countPendingOrders(tenantId)`: count con `status IN (PENDING, CONFIRMED, PREPARING, READY)`
- [ ] Método privado `getHourlyOrders(tenantId, start, end)`:
  - QueryBuilder con `EXTRACT(HOUR FROM o.createdAt)` agrupado
  - Retorna `number[]` de longitud exacta 24 (inicializar con `Array(24).fill(0)`)
- [ ] Método privado `getTopProducts(tenantId, start, end)`:
  - Join `order_items` → `orders`
  - `SUM(oi.quantity)` agrupado por `oi.productId`
  - `ORDER BY totalQuantity DESC LIMIT 5`
  - Excluir órdenes `CANCELLED`

**Criterio de done:** Con 0 pedidos retorna `{ ordersToday: 0, revenueToday: 0, averageTicket: 0, pendingOrders: 0, hourlyOrders: [0,...,0], topProducts: [] }`. Con pedidos reales, los números son correctos.

---

### B7.3 — `DashboardController`

- [ ] Crear `api/src/modules/dashboard/dashboard.controller.ts`
- [ ] `@Controller('admin/dashboard')` + `@UseGuards(JwtAuthGuard)` a nivel de clase
- [ ] `GET /` → `getMetrics(@TenantId() tenantId: string)` retorna `{ data: DashboardMetricsDto }`

**Criterio de done:** `GET /admin/dashboard` sin JWT → 401. Con JWT válido → 200 con estructura `{ data: { ... } }`.

---

### B7.4 — `DashboardModule`

- [ ] Crear `api/src/modules/dashboard/dashboard.module.ts`
- [ ] `TypeOrmModule.forFeature([Order, OrderItem])`
- [ ] Providers: `[DashboardService]`
- [ ] Controllers: `[DashboardController]`

---

### B7.5 — Registrar en `AppModule`

- [ ] Importar `DashboardModule` en `api/src/app.module.ts`

**Criterio de done:** `npm run typecheck` sin errores. `GET /admin/dashboard` disponible en la app.
