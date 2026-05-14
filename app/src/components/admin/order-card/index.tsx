"use client";

import { useState, useRef, TouchEvent, MouseEvent } from "react";
import { formatDistanceToNow } from "date-fns"; // Si está disponible, o formato simple
import { es } from "date-fns/locale";
import { 
  ShoppingBag, 
  Clock, 
  ChevronRight, 
  Truck, 
  Store, 
  MapPin,
  CheckCircle2,
  XCircle,
  ChevronsLeftRight,
} from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types/order";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Helper simple de tiempo si date-fns no está disponible (fallback)
function formatRelativeTime(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs} hr${hrs > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const DELIVERY_ICONS = {
  delivery: Truck,
  takeaway: Store,
  in_store: ShoppingBag,
};

const DELIVERY_LABELS = {
  delivery: "Envío",
  takeaway: "Retiro",
  in_store: "En Local",
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" }> = {
  pending: { label: "Pendiente", variant: "warning" },
  confirmed: { label: "Confirmado", variant: "secondary" },
  preparing: { label: "En Cocina", variant: "default" },
  ready: { label: "Listo", variant: "success" },
  delivered: { label: "Entregado", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "delivered",
  delivered: null,
  cancelled: null,
};

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  isPendingMutation?: boolean;
}

export function OrderCard({ order, onClick, onStatusChange, isPendingMutation }: OrderCardProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const nextStatus = STATUS_TRANSITIONS[order.status];
  const canCancel = order.status !== "delivered" && order.status !== "cancelled";

  const DeliveryIcon = DELIVERY_ICONS[order.deliveryMethod] || ShoppingBag;

  // --- Swipe Handlers ---
  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Umbral de tolerancia de 10px para no interferir con el scroll vertical
    if (!isDragging) {
      if (Math.abs(diff) > 10) {
        setIsDragging(true);
      } else {
        return; // Aún no es un arrastre claro
      }
    }
    
    // Ajustamos la diferencia restando el umbral para un inicio suave (desde cero)
    const adjustedDiff = diff > 0 ? diff - 10 : diff + 10;
    
    // Limitamos el swipe
    // Si no puede cancelar o avanzar, bloqueamos esa dirección
    if (adjustedDiff > 0 && !nextStatus) return; 
    if (adjustedDiff < 0 && !canCancel) return;
    
    // Resistencia elástica pasada cierta cantidad
    const cappedDiff = Math.max(-120, Math.min(120, adjustedDiff));
    setDragX(cappedDiff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragX > 80 && nextStatus) {
      // Swipe a la derecha -> Avanzar
      onStatusChange(order.id, nextStatus);
    } else if (dragX < -80 && canCancel) {
      // Swipe a la izquierda -> Cancelar
      if (window.confirm(`¿Seguro querés cancelar el pedido #${order.orderNumber}?`)) {
        onStatusChange(order.id, "cancelled");
      }
    }
    setDragX(0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-background border border-border shadow-sm select-none h-[150px]">
      {/* Background Action Indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-6 z-0 pointer-events-none">
        {/* Indicador Izquierdo (Avanzar estado) */}
        <div 
          className={cn(
            "flex items-center gap-2 text-emerald-600 font-semibold text-sm transition-opacity duration-200",
            dragX > 20 ? "opacity-100" : "opacity-0"
          )}
        >
          <CheckCircle2 className="h-5 w-5 animate-pulse" />
          Avanzar
        </div>

        {/* Indicador Derecho (Cancelar) */}
        <div 
          className={cn(
            "flex items-center gap-2 text-destructive font-semibold text-sm transition-opacity duration-200",
            dragX < -20 ? "opacity-100" : "opacity-0"
          )}
        >
          Cancelar
          <XCircle className="h-5 w-5 animate-pulse" />
        </div>
      </div>

      {/* El Card Content Desplazable */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onClick}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className={cn(
          "absolute inset-0 z-10 bg-card hover:bg-accent/30 border-l-4 p-4 flex flex-col justify-between cursor-pointer touch-pan-y",
          order.status === "pending" && "border-l-amber-500",
          order.status === "confirmed" && "border-l-blue-500",
          order.status === "preparing" && "border-l-indigo-500",
          order.status === "ready" && "border-l-emerald-500",
          (order.status === "delivered" || order.status === "cancelled") && "border-l-muted",
          isPendingMutation && "opacity-50 pointer-events-none"
        )}
      >
        {/* Header: Nro y Hora */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-bold text-sm tracking-tight">
              #{order.orderNumber.slice(-4)} {/* Últimos dígitos o entero */}
            </h4>
            <p className="text-xs font-semibold text-card-foreground line-clamp-1 mt-0.5">
              {order.customerInfo.name}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(order.createdAt)}
            </span>
            
            {/* Indicador visual que tiene swipe en móviles */}
            <span className="md:hidden text-[10px] text-muted-foreground/40 flex items-center">
              <ChevronsLeftRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Info Media */}
        <div className="flex gap-2 flex-wrap mt-2">
          <Badge variant="outline" className="gap-1 text-[10px] font-normal py-0 px-1.5">
            <DeliveryIcon className="h-3 w-3 text-muted-foreground" />
            {DELIVERY_LABELS[order.deliveryMethod]}
          </Badge>

          {order.deliveryMethod === "delivery" && order.customerInfo.address && (
            <Badge variant="outline" className="max-w-[120px] text-[10px] font-normal py-0 px-1.5 truncate block">
              <MapPin className="h-3 w-3 inline mr-1 shrink-0 align-text-bottom text-muted-foreground" />
              {order.customerInfo.address}
            </Badge>
          )}
        </div>

        {/* Footer: Total y Botón Rápido */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
          <span className="text-sm font-bold text-primary">
            {formatCurrency(order.total)}
          </span>

          {/* En desktop mostramos botoncitos rápidos */}
          <div className="hidden md:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {nextStatus && (
              <button
                title={`Avanzar a ${STATUS_CONFIG[nextStatus].label}`}
                onClick={() => onStatusChange(order.id, nextStatus)}
                className="p-1 rounded-md hover:bg-emerald-50 hover:text-emerald-600 text-muted-foreground transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
            
            <button
              title="Ver detalles"
              onClick={onClick}
              className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
