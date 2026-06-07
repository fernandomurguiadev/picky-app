"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  MapPin,
  CreditCard,
  CheckCircle,
  Loader2,
  AlertCircle,
  Truck,
  Store,
  Phone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/stores/cart.store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/shared/toast";
import type { StorePublicData } from "@/lib/types/store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItemDisplay {
  cartItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: { itemName: string; extraPrice: number }[];
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const notesSchema = z.object({
  notes: z.string().max(300, "Máximo 300 caracteres").optional(),
});

const PHONE_REGEX = /^\+?[\d\s\-()]+$/;

const deliverySchema = z
  .object({
    deliveryMethod: z.enum(["delivery", "takeaway", "in_store"]),
    name: z.string().max(80, "Nombre demasiado largo").optional(),
    phone: z.string().optional(),
    deliveryAddress: z.string().max(200).optional(),
    tableNumber: z.string().max(20).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === "delivery" || data.deliveryMethod === "takeaway") {
      if (!data.name || data.name.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El nombre debe tener al menos 2 caracteres",
          path: ["name"],
        });
      }
      if (!data.phone || data.phone.trim().length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ingresá un teléfono válido",
          path: ["phone"],
        });
      } else if (!PHONE_REGEX.test(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Teléfono inválido",
          path: ["phone"],
        });
      }
    }
    if (data.deliveryMethod === "delivery" && !data.deliveryAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingresá la dirección de entrega",
        path: ["deliveryAddress"],
      });
    }
  });

const paymentSchema = z.object({
  paymentMethod: z.string().min(1, "Seleccioná un método de pago"),
});

type NotesData = z.infer<typeof notesSchema>;
type DeliveryData = z.infer<typeof deliverySchema>;
type PaymentData = z.infer<typeof paymentSchema>;
type CheckoutStep = "order" | "delivery" | "payment" | "success";

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { key: "order" as CheckoutStep, label: "Tu pedido" },
  { key: "delivery" as CheckoutStep, label: "Entrega" },
  { key: "payment" as CheckoutStep, label: "Pago" },
];

function StepIndicator({ step }: { step: CheckoutStep }) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-2 text-sm">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              i === activeIndex
                ? "bg-[var(--color-primary)] text-white"
                : i < activeIndex
                ? "bg-green-500 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i < activeIndex ? (
              <CheckCircle className="h-3.5 w-3.5" />
            ) : (
              i + 1
            )}
          </div>
          <span
            className={
              i === activeIndex ? "font-semibold" : "text-muted-foreground"
            }
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

// ─── Step 1: Tu pedido ────────────────────────────────────────────────────────

function OrderStep({
  items,
  cartSubtotal,
  onNext,
  defaultValues,
}: {
  items: CartItemDisplay[];
  cartSubtotal: number;
  onNext: (data: NotesData) => void;
  defaultValues?: NotesData;
}) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NotesData>({
    resolver: zodResolver(notesSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-5">
      {/* Lista de productos */}
      <div className="rounded-xl border bg-muted/30 overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 text-sm font-medium">
          <ShoppingBag className="h-4 w-4 text-[var(--color-primary)]" />
          Detalle del pedido
        </div>
        <Separator />
        <ul className="max-h-52 overflow-y-auto px-4 py-3 space-y-2">
          {items.map((item) => {
            const itemTotal =
              (item.unitPrice +
                item.selectedOptions.reduce((s, o) => s + o.extraPrice, 0)) *
              item.quantity;
            const isExpanded = expandedItem === item.cartItemId;
            const hasOptions = item.selectedOptions.length > 0;
            return (
              <li key={item.cartItemId} className="flex items-start gap-2 text-sm">
                {/* Nombre — tap/click expande, hover en desktop muestra cursor pointer */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedItem(isExpanded ? null : item.cartItemId)
                  }
                  className="flex-1 min-w-0 text-left"
                >
                  <span
                    className={
                      isExpanded
                        ? "font-medium break-words leading-snug"
                        : "font-medium truncate block"
                    }
                  >
                    {item.name}
                  </span>
                  {isExpanded && hasOptions && (
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      {item.selectedOptions.map((o) => o.itemName).join(" · ")}
                    </span>
                  )}
                </button>

                {/* Cantidad — chip con color del tema */}
                <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)] min-w-[2rem]">
                  ×{item.quantity}
                </span>

                {/* Precio — columna fija, dígitos tabulares */}
                <span className="shrink-0 w-20 text-right tabular-nums font-medium text-foreground">
                  {formatCurrency(itemTotal)}
                </span>
              </li>
            );
          })}
        </ul>
        <Separator />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">Subtotal</span>
          <span className="text-sm font-bold text-[var(--color-primary)]">
            {formatCurrency(cartSubtotal)}
          </span>
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-1.5">
        <Label htmlFor="checkout-notes">
          Notas{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <textarea
          id="checkout-notes"
          placeholder="Alergias, aclaraciones del pedido..."
          rows={3}
          {...register("notes")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] resize-none"
        />
        <FieldError message={errors.notes?.message} />
      </div>

      <Button
        type="submit"
        className="w-full gap-2 bg-[var(--store-accent)] text-white hover:opacity-90 py-5"
      >
        Continuar
        <ChevronRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

// ─── Step 2: Entrega ──────────────────────────────────────────────────────────

function DeliveryStep({
  store,
  cartSubtotal,
  onBack,
  onNext,
  defaultValues,
}: {
  store: StorePublicData;
  cartSubtotal: number;
  onBack: () => void;
  onNext: (data: DeliveryData) => void;
  defaultValues?: Partial<DeliveryData>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DeliveryData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      deliveryMethod: store.deliveryEnabled
        ? "delivery"
        : store.takeawayEnabled
        ? "takeaway"
        : "in_store",
      ...defaultValues,
    },
  });

  const deliveryMethod = watch("deliveryMethod");

  const deliveryMethods = [
    {
      key: "delivery" as const,
      label: "Delivery",
      icon: Truck,
      enabled: store.deliveryEnabled,
      extra:
        store.deliveryCost && store.deliveryCost > 0
          ? `+${formatCurrency(store.deliveryCost)}`
          : undefined,
    },
    {
      key: "takeaway" as const,
      label: "Retiro en local",
      icon: ShoppingBag,
      enabled: store.takeawayEnabled,
    },
    {
      key: "in_store" as const,
      label: "En el local",
      icon: Store,
      enabled: store.inStoreEnabled,
    },
  ].filter((m) => m.enabled);

  const minOrder = store.deliveryMinOrder ?? 0;
  const isBelowMinimum =
    deliveryMethod === "delivery" && minOrder > 0 && cartSubtotal < minOrder;

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-6">
      {/* Método de entrega */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
          Método de entrega
        </Label>
        <div className="grid gap-2">
          {deliveryMethods.map((method) => {
            const Icon = method.icon;
            return (
              <label
                key={method.key}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  deliveryMethod === method.key
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <input
                  type="radio"
                  value={method.key}
                  {...register("deliveryMethod")}
                  className="accent-[var(--color-primary)]"
                />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{method.label}</span>
                {method.extra && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {method.extra}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Campos para delivery */}
      {deliveryMethod === "delivery" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="d-name" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Nombre completo
            </Label>
            <Input
              id="d-name"
              placeholder="Ej: María García"
              autoComplete="name"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Teléfono
            </Label>
            <Input
              id="d-phone"
              type="tel"
              placeholder="Ej: +54 9 11 1234-5678"
              autoComplete="tel"
              {...register("phone")}
              className={errors.phone ? "border-destructive" : ""}
            />
            <FieldError message={errors.phone?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-address" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Dirección de entrega
            </Label>
            <Input
              id="d-address"
              placeholder="Calle, número, piso/depto..."
              autoComplete="street-address"
              {...register("deliveryAddress")}
              className={errors.deliveryAddress ? "border-destructive" : ""}
            />
            <FieldError message={errors.deliveryAddress?.message} />
          </div>
        </div>
      )}

      {/* Campos para takeaway */}
      {deliveryMethod === "takeaway" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-name" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Nombre completo
            </Label>
            <Input
              id="t-name"
              placeholder="Ej: María García"
              autoComplete="name"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Teléfono
            </Label>
            <Input
              id="t-phone"
              type="tel"
              placeholder="Ej: +54 9 11 1234-5678"
              autoComplete="tel"
              {...register("phone")}
              className={errors.phone ? "border-destructive" : ""}
            />
            <FieldError message={errors.phone?.message} />
          </div>
        </div>
      )}

      {/* Campos para en el local */}
      {deliveryMethod === "in_store" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="i-name">
              Nombre{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Input
              id="i-name"
              placeholder="Ej: María"
              autoComplete="name"
              {...register("name")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i-table">
              Número de mesa{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Input
              id="i-table"
              placeholder="Ej: 5"
              {...register("tableNumber")}
            />
          </div>
        </div>
      )}

      {/* Alerta monto mínimo */}
      {isBelowMinimum && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800/40 dark:bg-amber-900/20">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-amber-800 dark:text-amber-300">
            El monto mínimo para delivery es{" "}
            <strong>{formatCurrency(minOrder)}</strong>. Tu pedido es de{" "}
            {formatCurrency(cartSubtotal)}.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </Button>
        <Button
          type="submit"
          disabled={isBelowMinimum}
          className="flex-1 gap-2 bg-[var(--store-accent)] text-white hover:opacity-90 py-5 disabled:opacity-50"
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ─── Step 3: Pago ─────────────────────────────────────────────────────────────

function PaymentStep({
  store,
  cartSubtotal,
  deliveryMethod,
  onBack,
  onSubmit,
  isSubmitting,
  defaultValues,
}: {
  store: StorePublicData;
  cartSubtotal: number;
  deliveryMethod: string;
  onBack: () => void;
  onSubmit: (data: PaymentData) => void;
  isSubmitting: boolean;
  defaultValues?: PaymentData;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues,
  });

  const paymentMethod = watch("paymentMethod");

  const deliveryCost =
    deliveryMethod === "delivery" ? (store.deliveryCost ?? 0) : 0;
  const total = cartSubtotal + deliveryCost;

  const paymentMethods = [
    { key: "cash", label: "Efectivo", enabled: store.cashEnabled },
    {
      key: "transfer",
      label: store.transferAlias
        ? `Transferencia (${store.transferAlias})`
        : "Transferencia",
      enabled: store.transferEnabled,
    },
    { key: "card", label: "Tarjeta", enabled: store.cardEnabled },
  ].filter((m) => m.enabled);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Método de pago */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="h-4 w-4 text-[var(--color-primary)]" />
          Método de pago
        </Label>
        {paymentMethods.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay métodos de pago activos.
          </p>
        ) : (
          <div className="grid gap-2">
            {paymentMethods.map((method) => (
              <label
                key={method.key}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  paymentMethod === method.key
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <input
                  type="radio"
                  value={method.key}
                  {...register("paymentMethod")}
                  className="accent-[var(--color-primary)]"
                />
                <span className="text-sm font-medium">{method.label}</span>
              </label>
            ))}
          </div>
        )}
        <FieldError message={errors.paymentMethod?.message} />
      </div>

      {/* Resumen de totales */}
      <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(cartSubtotal)}</span>
        </div>
        {deliveryCost > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Envío</span>
            <span>{formatCurrency(deliveryCost)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span className="text-[var(--color-primary)]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || paymentMethods.length === 0}
          className="flex-1 gap-2 bg-[var(--store-accent)] text-white hover:opacity-90 py-5 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <span>{isSubmitting ? "Enviando..." : "Confirmar pedido"}</span>
        </Button>
      </div>
    </form>
  );
}

// ─── Página principal de Checkout ──────────────────────────────────────────────

interface CheckoutPageClientProps {
  store: StorePublicData;
}

export function CheckoutPageClient({ store }: CheckoutPageClientProps) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { items, subtotal } = useCartStore();
  const cartSubtotal = subtotal();

  const [step, setStep] = useState<CheckoutStep>("order");
  const [notesData, setNotesData] = useState<NotesData | null>(null);
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1000";

  useEffect(() => {
    if (items.length === 0 && step !== "success") {
      router.replace(`/${slug}`);
    }
  }, [items.length, router, slug, step]);

  if (items.length === 0 && step !== "success") {
    return null;
  }

  const handleNotesNext = (data: NotesData) => {
    setNotesData(data);
    setStep("delivery");
  };

  const handleDeliveryNext = (data: DeliveryData) => {
    setDeliveryData(data);
    setStep("payment");
  };

  const handlePaymentSubmit = async (paymentData: PaymentData) => {
    if (!deliveryData) return;
    setIsSubmitting(true);

    const deliveryCost =
      deliveryData.deliveryMethod === "delivery"
        ? (store.deliveryCost ?? 0)
        : 0;

    const orderPayload = {
      tenantId: store.id,
      deliveryMethod: deliveryData.deliveryMethod,
      paymentMethod: paymentData.paymentMethod,
      notes: notesData?.notes ?? "",
      tableNumber: deliveryData.tableNumber ?? undefined,
      customer: {
        name: deliveryData.name ?? "",
        phone: deliveryData.phone ?? "",
        address: deliveryData.deliveryAddress ?? "",
      },
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        selectedOptions: item.selectedOptions.map((opt) => ({
          groupId: opt.groupId,
          groupName: opt.groupName,
          itemId: opt.itemId,
          itemName: opt.itemName,
          priceModifier: opt.extraPrice,
        })),
      })),
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const json = res.ok ? await res.json() : null;
      setCreatedOrder(json?.data);
      setStep("success");
      useCartStore.getState().clearCart();
    } catch {
      toast.error("Error al procesar el pedido. Intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/50 dark:bg-green-900/20 dark:ring-green-900/10">
          <CheckCircle className="h-10 w-10 text-green-500 dark:text-green-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          ¡Pedido generado correctamente!
        </h1>
        <p className="mb-6 text-muted-foreground">
          Número de pedido:{" "}
          <strong className="text-foreground">
            {createdOrder?.orderNumber ?? "..."}
          </strong>
        </p>

        <div className="rounded-xl border bg-muted/30 p-6 mb-8 text-sm">
          <p className="mb-4">
            Para finalizar, envianos un mensaje por WhatsApp para que podamos
            confirmar tu pedido y asignarlo a tu número.
          </p>
          <Button
            type="button"
            className="w-full gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white py-6 text-base font-semibold shadow-md"
            onClick={() => {
              if (createdOrder?.whatsappConfirmationUrl) {
                window.open(
                  createdOrder.whatsappConfirmationUrl,
                  "_blank",
                  "noopener,noreferrer"
                );
              } else {
                toast.error("No se pudo generar el enlace de WhatsApp.");
              }
            }}
          >
            Confirmar por WhatsApp
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Header */}
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          {items.reduce((s, i) => s + i.quantity, 0)} productos en tu carrito
        </p>
      </div>

      {/* Indicador de paso */}
      <div className="mb-8">
        <StepIndicator step={step} />
      </div>

      {/* Resumen compacto del carrito (pasos 2 y 3) */}
      {(step === "delivery" || step === "payment") && (
        <div className="mb-6 flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <ShoppingBag className="h-4 w-4 text-[var(--color-primary)]" />
            {store.name}
          </div>
          <span className="font-bold text-[var(--color-primary)]">
            {formatCurrency(cartSubtotal)}
          </span>
        </div>
      )}

      {/* Paso activo */}
      {step === "order" && (
        <OrderStep
          items={items as unknown as CartItemDisplay[]}
          cartSubtotal={cartSubtotal}
          onNext={handleNotesNext}
          defaultValues={notesData ?? undefined}
        />
      )}
      {step === "delivery" && (
        <DeliveryStep
          store={store}
          cartSubtotal={cartSubtotal}
          onBack={() => setStep("order")}
          onNext={handleDeliveryNext}
          defaultValues={deliveryData ?? undefined}
        />
      )}
      {step === "payment" && deliveryData && (
        <PaymentStep
          store={store}
          cartSubtotal={cartSubtotal}
          deliveryMethod={deliveryData.deliveryMethod}
          onBack={() => setStep("delivery")}
          onSubmit={handlePaymentSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
