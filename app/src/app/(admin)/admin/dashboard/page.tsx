"use client";

import { useDashboardMetrics } from "@/lib/hooks/admin/use-dashboard";
import { useStoreSettings, useToggleStoreStatus } from "@/lib/hooks/admin/use-store-settings";
import type { StoreSettings, DaySchedule, Shift } from "@/lib/types/store-settings";
import { MetricCard } from "@/components/admin/metric-card";
import { StoreStatusBadge } from "@/components/store/store-status-badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  Store
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProducts } from "@/lib/hooks/admin/use-products";
import { useEffect } from "react";

// --- Helper de Estado Dinámico ---
function isStoreCurrentlyOpen(settings: StoreSettings | undefined | null) {
  if (!settings) return false;
  if (settings.isManualOpen === true) return true;
  if (settings.isManualOpen === false) return false;
  
  // Si es null, calcula por horario
  if (!settings.schedule || settings.schedule.length === 0) return false;

  try {
    const tz = settings.timezone || "America/Argentina/Buenos_Aires";
    const now = new Date();
    
    const day = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: tz,
    }).format(now).toLowerCase();

    const timeStr = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(now);

    const todaySchedule = settings.schedule.find((s: DaySchedule) => s.day === day);
    if (!todaySchedule || !todaySchedule.isOpen || !todaySchedule.shifts) return false;

    return todaySchedule.shifts.some((shift: Shift) => {
      return timeStr >= shift.open && timeStr <= shift.close;
    });
  } catch {
    return false;
  }
}

// --- Componente Nativo de Gráfico SVG ---
function HourlyChart({ data }: { data: number[] }) {
  const maxCount = Math.max(...data, 5); // Mínimo 5 de escala vertical
  
  // Generamos etiquetas legibles
  const labels = ["00", "04", "08", "12", "16", "20", "23"];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg tracking-tight text-foreground">Pedidos por Hora</h3>
          <p className="text-xs text-muted-foreground">Distribución de actividad durante el día de hoy</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-primary/30 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">En vivo</span>
        </div>
      </div>

      {/* Canvas del Gráfico */}
      <div className="relative h-64 w-full">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full border-t border-border/50 border-dashed" />
          ))}
        </div>

        <div className="absolute inset-0 flex items-end justify-between gap-1 pt-4 pb-2 px-2">
          {data.map((count, hour) => {
            const heightPercent = (count / maxCount) * 100;
            
            return (
              <div key={hour} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                {/* Tooltip flotante al hacer hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-20 animate-in fade-in zoom-in duration-150">
                  <div className="bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded-md border border-border shadow-md">
                    {hour}:00 hs — {count} ped.
                  </div>
                  <div className="w-1.5 h-1.5 bg-popover border-b border-r border-border rotate-45 -mt-1" />
                </div>

                {/* Barra animada */}
                <div
                  style={{ height: `${Math.max(heightPercent, 2)}%` }} // Min 2% para hover visible
                  className="w-full max-w-[18px] rounded-t-sm bg-primary/20 group-hover:bg-primary/80 group-hover:scale-x-110 group-hover:shadow-[0_0_15px_rgba(var(--color-primary),0.4)] transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  {count > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-primary opacity-60 group-hover:opacity-100" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Eje X */}
      <div className="flex justify-between items-center px-3 mt-2 border-t pt-2 text-[10px] font-semibold text-muted-foreground/80 tracking-wider">
        {labels.map((l) => (
          <span key={l}>{l}:00</span>
        ))}
      </div>
    </div>
  );
}

// --- Componente Principal ---
export default function DashboardPage() {
  const router = useRouter();
  const { data: metrics, isLoading: isMetricsLoading, isError, refetch } = useDashboardMetrics();
  const { data: settings, isLoading: isSettingsLoading } = useStoreSettings();
  const { data: products, isLoading: isProductsLoading } = useProducts({ limit: 1 });
  const toggleStatusMutation = useToggleStoreStatus();

  const isLoading = isMetricsLoading || isSettingsLoading || isProductsLoading;

  // Redirección al Wizard de Onboarding (Requerimiento FE8.5)
  useEffect(() => {
    if (!isLoading && !isError && settings && products) {
      const hasLogo = !!settings.logoUrl;
      const hasProducts = (products.meta?.total ?? 0) > 0;
      
      if (!hasLogo || !hasProducts) {
        router.replace("/admin/onboarding");
      }
    }
  }, [isLoading, isError, settings, products, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div>
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 mt-2 rounded-md" />
          </div>
          <Skeleton className="h-12 w-64 rounded-xl" />
        </div>

        {/* Status Banner Skeleton */}
        <Skeleton className="h-20 w-full rounded-2xl" />

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>

        {/* Chart Skeleton */}
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 bg-card border rounded-2xl text-center shadow-sm">
        <div className="rounded-full bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Error al cargar datos</h2>
        <p className="text-sm text-muted-foreground max-w-xs">No logramos recuperar las estadísticas de tu negocio en este momento.</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Sincronizamos dinámicamente el switch y badge
  const isCurrentlyOpen = isStoreCurrentlyOpen(settings);
  const isForcedOpen = settings?.isManualOpen === true;
  const isForcedClosed = settings?.isManualOpen === false;

  // 4 métricas clave
  const dashboardMetrics = [
    {
      label: "Pedidos de Hoy",
      value: metrics.ordersToday,
      icon: <ShoppingBag />,
      subtext: "Pedidos no cancelados",
    },
    {
      label: "Ingresos de Hoy",
      value: formatCurrency(metrics.revenueToday),
      icon: <DollarSign />,
      subtext: "Total facturado entregado",
    },
    {
      label: "Ticket Promedio",
      value: formatCurrency(metrics.averageTicket),
      icon: <TrendingUp />,
      subtext: "Valor medio por ticket",
    },
    {
      label: "Pendientes",
      value: metrics.pendingOrders,
      icon: <Clock />,
      subtext: "Pedidos en preparación/espera",
    },
  ];

  const handleToggleStatus = (checked: boolean) => {
    toggleStatusMutation.mutate(checked);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* Header de Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/50">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">
            Información general del rendimiento de tu comercio.
          </p>
        </div>
        
        {/* Accesos rápidos de Mobile */}
        <Link 
          href="/admin/orders"
          className="md:hidden inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:opacity-95"
        >
          Ir al Kanban de Pedidos
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Sección Toggle Abierto/Cerrado (Requerimiento FE8.3) */}
      <div className="flex items-center justify-between p-5 rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex p-3 bg-accent/50 text-muted-foreground rounded-xl">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-foreground">Estado actual de la tienda</span>
              <StoreStatusBadge isOpen={isCurrentlyOpen} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {isForcedOpen && "Forzado MANUALMENTE para recibir pedidos"}
              {isForcedClosed && "Cerrado MANUALMENTE. No recibirás pedidos"}
              {settings?.isManualOpen === null && "Operando automáticamente bajo tus Horarios"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-accent/30 p-2 px-3 rounded-xl border border-border/30">
          <span className="text-xs font-bold text-muted-foreground">Override Manual</span>
          <Switch
            checked={isForcedOpen}
            disabled={toggleStatusMutation.isPending}
            onCheckedChange={handleToggleStatus}
          />
        </div>
      </div>

      {/* Cards de Métricas (Requerimiento FE8.2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardMetrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Layout de Dos Columnas Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        {/* Gráfico de Pedidos por Hora (Requerimiento FE8.1 - solo Desktop) */}
        <div className="hidden md:block lg:col-span-2">
          <HourlyChart data={metrics.hourlyOrders ?? Array(24).fill(0)} />
        </div>

        {/* Top Productos del Día */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <h3 className="font-semibold text-lg tracking-tight text-foreground mb-5">Lo más vendido hoy</h3>
          
          <div className="flex-1 flex flex-col gap-3">
            {metrics.topProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground/60">
                <ShoppingBag className="h-8 w-8 mb-2 stroke-1" />
                <span className="text-xs font-semibold">Sin ventas registradas aún</span>
              </div>
            ) : (
              metrics.topProducts.map((prod, idx) => (
                <div key={prod.productId} className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/30 transition-colors border border-transparent hover:border-border/40">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-extrabold">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-foreground line-clamp-1">{prod.productName}</span>
                  </div>
                  <span className="text-xs font-bold bg-accent px-2.5 py-1 rounded-full text-muted-foreground">
                    {prod.totalQuantity} un.
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
