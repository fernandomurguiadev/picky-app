# Design — app-fase-8-dashboard

## Estructura de archivos resultante

```
app/
├── src/
│   ├── app/
│   │   └── (admin)/
│   │       └── admin/
│   │           ├── dashboard/
│   │           │   └── page.tsx
│   │           └── onboarding/
│   │               └── page.tsx
│   ├── components/
│   │   └── admin/
│   │       └── metric-card/
│   │           └── index.tsx
│   └── lib/
│       └── hooks/
│           └── use-analytics.ts
```

---

## `use-analytics.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/axios';

export const analyticsKeys = {
  summary: (period: 'today' | 'week' | 'month') => ['analytics', 'summary', period] as const,
  hourly: () => ['analytics', 'hourly'] as const,
};

export function useAnalyticsSummary(period: 'today' | 'week' | 'month' = 'today') {
  return useQuery({
    queryKey: analyticsKeys.summary(period),
    queryFn: () => api.get(`/admin/analytics/summary?period=${period}`).then((r) => r.data.data),
    refetchInterval: 60_000, // Refresca cada minuto
  });
}

export function useHourlyAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.hourly(),
    queryFn: () => api.get('/admin/analytics/hourly').then((r) => r.data.data),
  });
}
```

---

## `MetricCard`

```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: { value: number; isPositive: boolean };
  icon: React.ReactNode;
}

export function MetricCard({ label, value, subtext, trend, icon }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {trend && (
        <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
          {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value)}% vs ayer
        </p>
      )}
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}
```

---

## Dashboard layout

```typescript
// app/(admin)/admin/dashboard/page.tsx
'use client';

export default function DashboardPage() {
  const { data: summary } = useAnalyticsSummary('today');
  const { data: hourly } = useHourlyAnalytics();
  const isOpen = useStoreSettings(); // estado actual
  const updateSettings = useUpdateStoreSettings();

  const metrics = [
    { label: 'Pedidos hoy', value: summary?.totalOrders ?? '-', icon: <ShoppingBag /> },
    { label: 'Ingresos hoy', value: summary ? formatPrice(summary.totalRevenue) : '-', icon: <DollarSign /> },
    { label: 'Ticket promedio', value: summary ? formatPrice(summary.avgTicket) : '-', icon: <TrendingUp /> },
    { label: 'Pendientes', value: summary?.pendingOrders ?? '-', icon: <Clock /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Toggle abierto/cerrado */}
      <div className="flex items-center justify-between p-4 rounded-xl border">
        <span className="font-medium">Estado de la tienda</span>
        <div className="flex items-center gap-3">
          <StoreStatusBadge isOpen={isOpen} />
          <Switch
            checked={isOpen}
            onCheckedChange={(checked) => updateSettings.mutate({ isOpen: checked })}
          />
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Gráfico solo en desktop */}
      <div className="hidden md:block">
        <HourlyChart data={hourly ?? []} />
      </div>
    </div>
  );
}
```

---

## Onboarding wizard — pasos

```
Paso 1: Nombre y logo del negocio
  → PATCH /stores/me { name, logo }

Paso 2: Primera categoría
  → POST /admin/categories { name }

Paso 3: Primer producto
  → POST /admin/products { name, price, categoryId }

Paso 4: Configurar horarios (opcional, puede saltear)
  → PATCH /stores/me { schedule }

Finalizar → redirect a /admin/dashboard
```
