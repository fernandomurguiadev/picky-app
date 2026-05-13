# Proposal — api-fase-7-metrics

## Resumen

Módulo `DashboardModule` con un único endpoint `GET /admin/dashboard` que
retorna métricas del día para el tenant autenticado. Alimenta el panel
principal del back-office con KPIs en tiempo real sin necesidad de
librerías de analytics externas.

## Motivación

El panel admin requiere métricas del día (pedidos, facturación, ticket
promedio, pendientes) y un gráfico de actividad horaria. Estos datos viven
en la tabla `orders` ya existente y pueden calcularse con queries
TypeORM/SQL sin nuevas entidades ni migraciones.

## Alcance

### Backend (`api/`)

**Nuevos archivos:**
- `modules/dashboard/dto/dashboard-metrics.dto.ts` — tipo de respuesta tipado
- `modules/dashboard/dashboard.service.ts` — queries agregadas
- `modules/dashboard/dashboard.controller.ts` — ruta protegida
- `modules/dashboard/dashboard.module.ts` — módulo NestJS

**Archivos modificados:**
- `app.module.ts` — importar `DashboardModule`

### No incluido

- Métricas de rango personalizado (semana/mes) — mejora futura
- Comparativa período anterior — mejora futura
- Exportación CSV — mejora futura

## Ruta

| Método | Ruta | Guard | Descripción |
|--------|------|-------|-------------|
| GET | `/admin/dashboard` | `JwtAuthGuard` | Métricas del día del tenant autenticado |

## Contrato de respuesta

```json
{
  "data": {
    "ordersToday": 12,
    "revenueToday": 345000,
    "averageTicket": 28750,
    "pendingOrders": 3,
    "hourlyOrders": [0,0,0,0,0,0,0,1,2,3,1,0,2,1,0,0,0,0,1,1,0,0,0,0],
    "topProducts": [
      { "productId": "uuid", "productName": "Medialunas x6", "totalQuantity": 24 },
      { "productId": "uuid", "productName": "Facturas x12", "totalQuantity": 18 }
    ]
  }
}
```

## Reglas de negocio

1. **Scope**: todas las queries filtran por `tenantId` del JWT. RLS garantizado a nivel código.
2. **Período "hoy"**: desde `00:00:00` hasta `23:59:59` del día local del servidor (UTC). El tenant puede estar en otra zona horaria — mejora futura con `timezone` de `StoreSettings`.
3. **`ordersToday`**: count de órdenes con `createdAt >= hoy 00:00`. Incluye todos los estados excepto `CANCELLED`.
4. **`revenueToday`**: suma de `total` de órdenes del día con estado `DELIVERED`.
5. **`averageTicket`**: `revenueToday / deliveredOrdersToday` (0 si no hay pedidos entregados).
6. **`pendingOrders`**: count de órdenes con `status IN (PENDING, CONFIRMED, PREPARING, READY)`.
7. **`hourlyOrders`**: array de 24 enteros, índice = hora del día (0-23). Count de órdenes creadas (excluye `CANCELLED`) por hora.
8. **`topProducts`**: top 5 productos por `SUM(quantity)` en `order_items` de órdenes del día (excluye `CANCELLED`).

## Criterios de aceptación

- `GET /admin/dashboard` sin JWT → 401
- `GET /admin/dashboard` con JWT de tenant A → no incluye datos de tenant B
- `hourlyOrders` siempre tiene exactamente 24 elementos
- `topProducts` tiene a lo sumo 5 elementos (puede ser menor si hay < 5 productos distintos)
- Con 0 pedidos en el día → todos los campos son 0 / arreglos vacíos, sin errores
