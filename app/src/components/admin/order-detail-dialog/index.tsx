"use client";

import { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Truck, 
  Store, 
  ShoppingBag,
  AlertCircle,
  Loader2,
  Save
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  useAdminOrder, 
  useChangeOrderStatus, 
  useUpdateOrderNotes 
} from "@/lib/hooks/admin/use-orders";
import type { OrderStatus, Order } from "@/lib/types/order";

interface OrderDetailDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" }> = {
  pending: { label: "Pendiente", variant: "warning" },
  confirmed: { label: "Confirmado", variant: "secondary" },
  preparing: { label: "En Cocina", variant: "default" },
  ready: { label: "Listo", variant: "success" },
  delivered: { label: "Entregado", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const DELIVERY_LABELS = {
  delivery: "Envío a domicilio",
  takeaway: "Retiro en local",
  in_store: "Consumo en local",
};

const PAYMENT_LABELS = {
  cash: "Efectivo",
  transfer: "Transferencia bancaria",
  card: "Tarjeta de Débito/Crédito",
  other: "Otro método",
};

export function OrderDetailDialog({ orderId, open, onOpenChange }: OrderDetailDialogProps) {
  const { data: order, isLoading, isError } = useAdminOrder(orderId || "", open);
  const changeStatusMutation = useChangeOrderStatus();
  const updateNotesMutation = useUpdateOrderNotes();

  const [internalNotes, setInternalNotes] = useState("");

  // Sync notas internas cuando carga el pedido
  useEffect(() => {
    if (order) {
      const timer = setTimeout(() => setInternalNotes(order.internalNotes || ""), 0);
      return () => clearTimeout(timer);
    }
  }, [order]);

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (!orderId) return;
    changeStatusMutation.mutate({
      id: orderId,
      status: newStatus,
    });
  };

  const handleSaveNotes = () => {
    if (!orderId) return;
    updateNotesMutation.mutate({
      id: orderId,
      internalNotes,
    });
  };

  const statusOptions = order 
    ? [order.status, ...VALID_TRANSITIONS[order.status]] 
    : [];

  const isUpdatingNotes = updateNotesMutation.isPending;
  const isChangingStatus = changeStatusMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col bg-card">
        
        {/* Loader Overlay */}
        {isLoading && (
          <div className="h-[300px] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Cargando detalles del pedido...</p>
          </div>
        )}

        {/* Error view */}
        {!isLoading && isError && (
          <div className="h-[250px] flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h3 className="font-bold text-lg">Error al cargar</h3>
            <p className="text-sm text-muted-foreground">No se pudieron recuperar los datos de este pedido.</p>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-2">Cerrar</Button>
          </div>
        )}

        {/* Full Content */}
        {!isLoading && order && (
          <>
            {/* Header */}
            <DialogHeader className="px-6 py-5 border-b border-border flex flex-row items-center justify-between space-y-0">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  Pedido #{order.orderNumber}
                  <Badge variant={STATUS_CONFIG[order.status].variant}>
                    {STATUS_CONFIG[order.status].label}
                  </Badge>
                </DialogTitle>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(order.createdAt).toLocaleDateString("es-AR")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(order.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
                  </span>
                </div>
              </div>

              {/* Acciones de Estado rápidas (Select) */}
              <div className="pr-6">
                {statusOptions.length > 1 ? (
                  <Select
                    disabled={isChangingStatus}
                    value={order.status}
                    onValueChange={(val) => handleStatusChange(val as OrderStatus)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Cambiar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {STATUS_CONFIG[opt].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-xs font-semibold text-muted-foreground px-3 py-1.5 bg-muted rounded-md border">
                    Estado Finalizado
                  </div>
                )}
              </div>
            </DialogHeader>

            {/* Scrollable body */}
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                
                {/* Grid columns: Cliente & Info Entrega */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Datos Cliente */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cliente</h4>
                    <div className="space-y-2 text-sm bg-muted/30 p-4 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-semibold">{order.customerInfo.name}</span>
                      </div>
                      {order.customerInfo.phone && (
                        <div className="flex items-center gap-2.5">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <a href={`tel:${order.customerInfo.phone}`} className="text-primary hover:underline">
                            {order.customerInfo.phone}
                          </a>
                        </div>
                      )}
                      {order.deliveryMethod === "delivery" && order.customerInfo.address && (
                        <div className="flex items-start gap-2.5">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span>{order.customerInfo.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Método de Entrega / Pago */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Detalles de Pago y Envío</h4>
                    <div className="space-y-2 text-sm bg-muted/30 p-4 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2.5">
                        {order.deliveryMethod === "delivery" ? <Truck className="h-4 w-4 text-muted-foreground" /> : 
                         order.deliveryMethod === "takeaway" ? <Store className="h-4 w-4 text-muted-foreground" /> : 
                         <ShoppingBag className="h-4 w-4 text-muted-foreground" />}
                        <span><strong>Entrega:</strong> {DELIVERY_LABELS[order.deliveryMethod]}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span><strong>Pago:</strong> {PAYMENT_LABELS[order.paymentMethod]}</span>
                      </div>
                      {order.notes && (
                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded text-amber-800 dark:text-amber-300 text-xs">
                          <strong>Aclaraciones:</strong> &quot;{order.notes}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Listado de Items / Productos */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Productos</h4>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted text-muted-foreground font-medium text-left border-b border-border">
                          <th className="p-3 pl-4">Producto</th>
                          <th className="p-3 text-center w-16">Cant.</th>
                          <th className="p-3 text-right w-28">Unitario</th>
                          <th className="p-3 text-right w-28 pr-4">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {order.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/10 bg-card">
                            <td className="p-3 pl-4 align-top">
                              <div className="font-semibold text-card-foreground">{item.productName}</div>
                              {/* Opciones seleccionadas */}
                              {item.selectedOptions && item.selectedOptions.length > 0 && (
                                <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground pl-2 border-l-2 border-muted">
                                  {item.selectedOptions.map((opt, idx) => (
                                    <li key={idx}>
                                      <span className="font-medium">{opt.groupName}:</span> {opt.itemName}
                                      {opt.priceModifier > 0 && (
                                        <span className="ml-1.5 font-semibold text-primary">
                                          (+{formatCurrency(opt.priceModifier)})
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {item.itemNote && (
                                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
                                  Nota: {item.itemNote}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center align-top text-muted-foreground">x{item.quantity}</td>
                            <td className="p-3 text-right align-top">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-3 text-right align-top font-bold text-card-foreground pr-4">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totales */}
                <div className="flex justify-end">
                  <div className="w-full max-w-xs bg-muted/20 rounded-xl border border-border/80 p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.deliveryCost > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Costo de envío</span>
                        <span>{formatCurrency(order.deliveryCost)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base font-bold text-primary pt-1">
                      <span>Total general</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notas internas */}
                <div className="space-y-3 pb-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Notas Internas 
                    <span className="text-[10px] lowercase bg-muted border text-muted-foreground px-2 py-0.5 rounded-full font-normal">
                      (Solo visible por el admin)
                    </span>
                  </h4>
                  <div className="relative">
                    <textarea
                      className="w-full min-h-[80px] text-sm bg-card border border-input rounded-xl p-3 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring resize-none pb-12"
                      placeholder="Añadir comentarios internos, ej: 'Cliente habitual', 'Enviar extra servilletas'..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                    />
                    <div className="absolute bottom-3 right-3">
                      <Button 
                        size="sm" 
                        className="gap-2 h-8 text-xs bg-primary" 
                        onClick={handleSaveNotes}
                        disabled={isUpdatingNotes || internalNotes === (order.internalNotes || "")}
                      >
                        {isUpdatingNotes ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Guardar Notas
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </ScrollArea>

            {/* Footer footer */}
            <DialogFooter className="px-6 py-4 border-t border-border bg-muted/10">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar Detalle
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
