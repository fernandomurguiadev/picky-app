# MOD-05 — Panel Administrador

> Origen: Frontend Admin · Layout y Dashboard
> Rutas: `/admin/dashboard`, `/admin/analytics`

---

## 3.15 Tabla de funcionalidades

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| A-001 | Layout responsivo del admin | Móvil: bottom navigation bar con 4 tabs. Desktop: sidebar colapsable + topbar. | AdminLayout (app/(admin)/admin/layout.tsx) | 🔴 |
| A-002 | Dashboard principal | Métricas del día. Gráfico de barras de pedidos por hora. Últimos 5 pedidos. Toggle abierto/cerrado. **Versión simplificada en móvil.** | /admin/dashboard — DashboardPage | 🔴 |
| A-003 | Topbar del admin | Logo del comercio, nombre, 'Ver tienda', notificaciones, menú de usuario. | AdminTopbar | 🔴 |
| A-004 | Estadísticas básicas | Ventas del día/semana/mes. Top 5 productos. Comparativa vs período anterior. | /admin/analytics | 🟡 |
| A-005 | Onboarding wizard | Wizard de 5 pasos para nuevos comercios con barra de progreso. Completar luego. | OnboardingWizard | 🟡 |
| A-006 | Notificaciones in-app | Centro de notificaciones para eventos importantes. | NotificationCenter | 🟡 |

---

## 3.16 Dashboard en móvil — Versión simplificada (NUEVO — gap de v1)

El gráfico de barras de pedidos por hora es ilegible en 360px. El dashboard debe tener dos layouts.

```tsx
// components/admin/dashboard/dashboard-layout.tsx
'use client'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

export function DashboardPage() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div>
      {/* Métricas: iguales en móvil y desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Pedidos hoy" value={metrics.ordersToday} delta={metrics.deltaOrders} />
        <MetricCard label="Facturación" value={formatCurrency(metrics.revenueToday)} />
        <MetricCard label="Ticket promedio" value={formatCurrency(metrics.avgTicket)} />
        <MetricCard label="Pendientes" value={metrics.pendingOrders} alert={metrics.pendingOrders > 0} />
      </div>

      {/* Toggle abierto/cerrado */}
      <StoreStatusToggle />

      {/* Gráfico: solo en desktop */}
      {!isMobile && (
        <div className="bg-white rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Pedidos por hora (últimas 12hs)</h3>
          <HourlyOrdersChart data={metrics.hourlyData} />
        </div>
      )}

      {/* En móvil: resumen de texto en lugar del gráfico */}
      {isMobile && (
        <div className="bg-white rounded-xl p-4 mb-6 text-sm text-gray-600">
          <p>Hora pico hoy: <strong>{metrics.peakHour}hs</strong> con {metrics.peakOrders} pedidos</p>
        </div>
      )}

      {/* Pedidos activos */}
      <RecentOrdersList orders={recentOrders} />
    </div>
  )
}
```
