import type { CartItem } from "@/lib/stores/cart.store";
import { formatCurrency } from "@/lib/utils";

export interface WhatsAppOrderParams {
  storeName: string;
  /** Número del comercio (con o sin código de país) */
  storePhone: string;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  deliveryMethod: "delivery" | "takeaway" | "in_store";
  paymentMethod: string;
  deliveryAddress?: string;
  deliveryCost?: number; // centavos
  notes?: string;
  orderId?: string;
}

export function buildWhatsAppUrl(params: WhatsAppOrderParams): string {
  const {
    storeName,
    storePhone,
    items,
    customerName,
    customerPhone,
    deliveryMethod,
    paymentMethod,
    deliveryAddress,
    deliveryCost = 0,
    notes,
    orderId,
  } = params;

  const itemLines = items
    .map((item) => {
      const unitTotal =
        item.unitPrice +
        item.selectedOptions.reduce((sum, opt) => sum + opt.extraPrice, 0);
      const lineTotal = unitTotal * item.quantity;

      const optionsText =
        item.selectedOptions.length > 0
          ? "\n  _" + item.selectedOptions.map((o) => o.itemName).join(", ") + "_"
          : "";

      return `• ${item.name} x${item.quantity} — ${formatCurrency(lineTotal)}${optionsText}`;
    })
    .join("\n");

  const subtotal = items.reduce((sum, item) => {
    const unitTotal =
      item.unitPrice +
      item.selectedOptions.reduce((s, opt) => s + opt.extraPrice, 0);
    return sum + unitTotal * item.quantity;
  }, 0);

  const total = subtotal + deliveryCost;

  const deliveryLabel = {
    delivery: deliveryAddress ? `Delivery — ${deliveryAddress}` : "Delivery",
    takeaway: "Retiro en local",
    in_store: "En el local",
  }[deliveryMethod];

  const lines = [
    `🛒 *Nuevo pedido${orderId ? ` #${orderId}` : ""} — ${storeName}*`,
    "",
    "*Productos:*",
    itemLines,
    "",
    `*Subtotal:* ${formatCurrency(subtotal)}`,
    ...(deliveryCost > 0
      ? [`*Envío:* ${formatCurrency(deliveryCost)}`]
      : []),
    `*Total: ${formatCurrency(total)}*`,
    "",
    "*Datos del pedido:*",
    `• Cliente: ${customerName}`,
    `• Teléfono: ${customerPhone}`,
    `• Entrega: ${deliveryLabel}`,
    `• Pago: ${paymentMethod}`,
    ...(notes ? [`• Notas: ${notes}`] : []),
  ];

  const message = lines.join("\n");
  const phone = storePhone.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
