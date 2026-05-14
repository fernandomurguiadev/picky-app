"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ShoppingBag, 
  Clock, 
  AlertCircle, 
  Loader2,
  Wifi,
  WifiOff,
  RefreshCcw
} from "lucide-react";
import { 
  useAdminOrders, 
  useChangeOrderStatus,
  ordersKeys 
} from "@/lib/hooks/admin/use-orders";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { useOrderNotification } from "@/lib/hooks/use-order-notification";
import { useAuthStore } from "@/lib/stores/auth.store";
import { OrderCard } from "@/components/admin/order-card";
import { OrderDetailDialog } from "@/components/admin/order-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types/order";

interface ColumnConfig {
  status: OrderStatus;
  label: string;
  color: string;
  borderColor: string;
}

const COLUMNS: ColumnConfig[] = [
  { status: "pending", label: "Pendientes", color: "bg-amber-500/5 dark:bg-amber-950/10", borderColor: "border-t-amber-500" },
  { status: "confirmed", label: "Confirmados", color: "bg-blue-500/5 dark:bg-blue-950/10", borderColor: "border-t-blue-500" },
  { status: "preparing", label: "En Cocina", color: "bg-indigo-500/5 dark:bg-indigo-950/10", borderColor: "border-t-indigo-500" },
  { status: "ready", label: "Listos", color: "bg-emerald-500/5 dark:bg-emerald-950/10", borderColor: "border-t-emerald-500" },
  { status: "delivered", label: "Entregados", color: "bg-muted/50", borderColor: "border-t-muted-foreground/30" },
];

export function OrdersKanbanClient() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();
  const { notifyNewOrder } = useOrderNotification();

  // Query de listado
  const { data: orders = [], isLoading, isError, refetch, isFetching } = useAdminOrders({
    limit: 100, // Cargar bastantes para el tablero operacional
  });

  // Mutation para el swipe
  const changeStatusMutation = useChangeOrderStatus();

  // Estado del modal de detalle
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ─── Integración WebSocket en Tiempo Real ───────────────────────────────────
  const { isConnected } = useWebSocket({
    tenantId: tenantId || undefined,
    enabled: !!tenantId,
    on: {
      "order:new": (data: unknown) => {
        const newOrder = data as Order;
        // Invalidar listados para revalidar automáticamente
        queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
        // Notificación sonora y visual
        if (newOrder?.orderNumber) {
          notifyNewOrder(newOrder.orderNumber);
        }
      },
      "order:status-changed": () => {
        queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      },
    }
  });

  // ─── Agrupación de pedidos por columna ─────────────────────────────────────
  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {
      pending: [],
      confirmed: [],
      preparing: [],
      ready: [],
      delivered: [],
    };

    orders.forEach((order) => {
      if (groups[order.status]) {
        groups[order.status].push(order);
      }
    });

    return groups;
  }, [orders]);

  // Acciones
  const handleCardClick = (id: string) => {
    setSelectedOrderId(id);
    setIsDialogOpen(true);
  };

  const handleStatusChange = (id: string, status: OrderStatus) => {
    changeStatusMutation.mutate({ id, status });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] relative">
      
      {/* Header de la sección Kanban */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Pedidos en Tiempo Real
            {isFetching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualizá y gestioná el flujo operativo de la cocina y envíos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Estado de Conexión WebSocket */}
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1.5 font-normal py-1 px-3 transition-colors",
              isConnected 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                : "bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse"
            )}
          >
            {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {isConnected ? "Conectado (En vivo)" : "Reconectando..."}
          </Badge>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="gap-2 h-9 px-3"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            <span className="hidden sm:inline">Refrescar</span>
          </Button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-destructive/30 bg-destructive/5 rounded-2xl p-8">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <h3 className="text-lg font-bold">No se pudieron cargar los pedidos</h3>
            <p className="text-muted-foreground text-sm">Verificá tu conexión a internet e intentalo nuevamente.</p>
          </div>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      )}

      {/* Tablero Kanban */}
      {!isError && (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted">
          {COLUMNS.map((column) => {
            const columnOrders = groupedOrders[column.status] || [];
            
            return (
              <div 
                key={column.status} 
                className={cn(
                  "flex-shrink-0 w-[290px] flex flex-col rounded-2xl border bg-card/60 overflow-hidden h-full border-t-4 shadow-sm",
                  column.color,
                  column.borderColor
                )}
              >
                {/* Cabecera de columna */}
                <div className="px-4 py-3 flex items-center justify-between bg-background/60 backdrop-blur-sm border-b border-border/60 shrink-0 sticky top-0 z-10">
                  <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 text-card-foreground">
                    {column.label}
                  </h3>
                  
                  <Badge variant="secondary" className="text-xs font-bold px-2 py-0">
                    {isLoading ? "..." : columnOrders.length}
                  </Badge>
                </div>

                {/* Lista de Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-0 flex flex-col">
                  
                  {/* Skeletons al cargar */}
                  {isLoading && (
                    <>
                      <Skeleton className="h-[150px] w-full rounded-xl" />
                      <Skeleton className="h-[150px] w-full rounded-xl" />
                    </>
                  )}

                  {/* Empty State de la columna */}
                  {!isLoading && columnOrders.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12 px-4 gap-2 border-2 border-dashed border-border/40 rounded-xl mt-2">
                      <ShoppingBag className="h-8 w-8 opacity-20" />
                      <span className="text-[11px] font-medium text-center uppercase tracking-wider opacity-50">Sin pedidos</span>
                    </div>
                  )}

                  {/* Cards de Pedidos */}
                  {!isLoading && columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onClick={() => handleCardClick(order.id)}
                      onStatusChange={handleStatusChange}
                      isPendingMutation={changeStatusMutation.isPending && changeStatusMutation.variables?.id === order.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detalle Dialog */}
      <OrderDetailDialog
        orderId={selectedOrderId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
