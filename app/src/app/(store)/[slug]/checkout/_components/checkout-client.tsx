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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/stores/cart.store";
import { formatCurrency } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { toast } from "@/components/shared/toast";
import type { StorePublicData } from "@/lib/types/store";

// ─── Schemas Zod ─────────────────────────────────────────────────────────────

const customerSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "Nombre demasiado largo"),
  phone: z
    .string()
    .min(8, "Ingresá un teléfono válido")
    .regex(/^\+?[\d\s\-()]+$/, "Teléfono inválido"),
  notes: z.string().max(300, "Máximo 300 caracteres").optional(),
});

const deliverySchema = z
  .object({
    deliveryMethod: z.enum(["delivery", "takeaway", "in_store"]),
    deliveryAddress: z.string().max(200).optional(),
    paymentMethod: z.string().min(1, "Seleccioná un método de pago"),
  })
  .refine(
    (data) =>
      data.deliveryMethod !== "delivery" || !!data.deliveryAddress?.trim(),
    {
      message: "Ingresá la dirección de entrega",
      path: ["deliveryAddress"],
    }
  );

type CustomerData = z.infer<typeof customerSchema>;
type DeliveryData = z.infer<typeof deliverySchema>;
type CheckoutStep = "customer" | "delivery" | "success";

// ─── Sub-componentes de pasos ─────────────────────────────────────────────────

function StepIndicator({ step }: { step: CheckoutStep }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
          step === "customer"
            ? "bg-[var(--color-primary)] text-white"
            : "bg-muted text-muted-foreground"
        }`}
      >
        1
      </div>
      <span
        className={
          step === "customer" ? "font-semibold" : "text-muted-foreground"
        }
      >
        Tus datos
      </span>

      <ChevronRight className="h-4 w-4 text-muted-foreground" />

      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
          step === "delivery"
            ? "bg-[var(--color-primary)] text-white"
            : "bg-muted text-muted-foreground"
        }`}
      >
        2
      </div>
      <span
        className={
          step === "delivery" ? "font-semibold" : "text-muted-foreground"
        }
      >
        Entrega y pago
      </span>
    </div>
  );
}

// ─── Paso 1: Datos del cliente ─────────────────────────────────────────────────

function CustomerStep({
  onNext,
  defaultValues,
}: {
  onNext: (data: CustomerData) => void;
  defaultValues?: Partial<CustomerData>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerData>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="checkout-name">Nombre completo</Label>
        <Input
          id="checkout-name"
          placeholder="Ej: María García"
          autoComplete="name"
          {...register("name")}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="checkout-phone">Teléfono</Label>
        <Input
          id="checkout-phone"
          type="tel"
          placeholder="Ej: +54 9 11 1234-5678"
          autoComplete="tel"
          {...register("phone")}
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.phone.message}
          </p>
        )}
      </div>

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
        {errors.notes && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.notes.message}
          </p>
        )}
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

// ─── Paso 2: Entrega y pago ────────────────────────────────────────────────────

function DeliveryStep({
  store,
  cartSubtotal,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  store: StorePublicData;
  cartSubtotal: number;
  onBack: () => void;
  onSubmit: (data: DeliveryData) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DeliveryData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      deliveryMethod: store.deliveryEnabled
        ? "delivery"
        : store.takeawayEnabled
        ? "takeaway"
        : "in_store",
      paymentMethod: "",
    },
  });

  const deliveryMethod = watch("deliveryMethod");
  const paymentMethod = watch("paymentMethod");

  const deliveryCost = deliveryMethod === "delivery" ? store.deliveryCost ?? 0 : 0;
  const total = cartSubtotal + deliveryCost;

  // Monto mínimo (solo aplica para delivery)
  const minOrder = store.deliveryMinOrder ?? 0;
  const isBelowMinimum =
    deliveryMethod === "delivery" && minOrder > 0 && cartSubtotal < minOrder;

  const deliveryMethods = [
    { key: "delivery", label: "Delivery", enabled: store.deliveryEnabled },
    { key: "takeaway", label: "Retiro en local", enabled: store.takeawayEnabled },
    { key: "in_store", label: "En el local", enabled: store.inStoreEnabled },
  ].filter((m) => m.enabled);

  const paymentMethods = [
    { key: "cash", label: "Efectivo", enabled: store.cashEnabled },
    { key: "transfer", label: store.transferAlias ? `Transferencia (${store.transferAlias})` : "Transferencia", enabled: store.transferEnabled },
    { key: "card", label: "Tarjeta", enabled: store.cardEnabled },
  ].filter((m) => m.enabled);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Método de entrega */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
          Método de entrega
        </Label>
        <div className="grid gap-2">
          {deliveryMethods.map((method) => (
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
              <span className="text-sm font-medium">{method.label}</span>
              {method.key === "delivery" && deliveryCost > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  +{formatCurrency(deliveryCost)}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Dirección (solo si delivery) */}
      {deliveryMethod === "delivery" && (
        <div className="space-y-1.5">
          <Label htmlFor="delivery-address">Dirección de entrega</Label>
          <Input
            id="delivery-address"
            placeholder="Calle, número, piso/depto..."
            autoComplete="street-address"
            {...register("deliveryAddress")}
            className={errors.deliveryAddress ? "border-destructive" : ""}
          />
          {errors.deliveryAddress && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.deliveryAddress.message}
            </p>
          )}
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

      {/* Método de pago */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="h-4 w-4 text-[var(--color-primary)]" />
          Método de pago
        </Label>
        <div className="grid gap-2">
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay métodos de pago activos.
            </p>
          ) : (
            paymentMethods.map((method) => (
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
            ))
          )}
        </div>
        {errors.paymentMethod && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.paymentMethod.message}
          </p>
        )}
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
          disabled={isSubmitting || isBelowMinimum || paymentMethods.length === 0}
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

  const [step, setStep] = useState<CheckoutStep>("customer");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1000";

  // Guard: carrito vacío → redirigir a tienda
  useEffect(() => {
    if (items.length === 0 && step !== "success") {
      router.replace(`/${slug}`);
    }
  }, [items.length, router, slug, step]);

  if (items.length === 0 && step !== "success") {
    return null;
  }

  const handleCustomerNext = (data: CustomerData) => {
    setCustomerData(data);
    setStep("delivery");
  };

  const handleDeliverySubmit = async (deliveryData: DeliveryData) => {
    if (!customerData) return;
    setIsSubmitting(true);

    const deliveryCost =
      deliveryData.deliveryMethod === "delivery" ? (store.deliveryCost ?? 0) : 0;

    const orderPayload = {
      tenantId: store.id,
      deliveryMethod: deliveryData.deliveryMethod,
      paymentMethod: deliveryData.paymentMethod,
      notes: customerData.notes ?? "",
      customer: {
        name: customerData.name,
        phone: customerData.phone,
        address: deliveryData.deliveryAddress ?? "",
      },
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.name,          // API espera 'productName'
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        selectedOptions: item.selectedOptions.map((opt) => ({
          groupId: opt.groupId,
          groupName: opt.groupName,
          itemId: opt.itemId,
          itemName: opt.itemName,
          priceModifier: opt.extraPrice, // API espera 'priceModifier'
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
      const orderId = json?.data?.id ?? json?.data?.orderId ?? undefined;
      
      // Guardar el pedido creado para mostrar en la pantalla de éxito
      setCreatedOrder(json?.data);
      setStep("success");
      
      // Limpiar el carrito (opcional pero recomendado)
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
        <h1 className="mb-2 text-2xl font-bold tracking-tight">¡Pedido generado correctamente!</h1>
        <p className="mb-6 text-muted-foreground">
          Número de pedido: <strong className="text-foreground">{createdOrder?.orderNumber ?? "..."}</strong>
        </p>

        <div className="rounded-xl border bg-muted/30 p-6 mb-8 text-sm">
          <p className="mb-4">
            Para finalizar, envianos un mensaje por WhatsApp para que podamos confirmar tu pedido y asignarlo a tu número.
          </p>
          <Button
            type="button"
            className="w-full gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white py-6 text-base font-semibold shadow-md"
            onClick={() => {
              if (createdOrder?.whatsappConfirmationUrl) {
                window.open(createdOrder.whatsappConfirmationUrl, "_blank", "noopener,noreferrer");
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

      {/* Resumen rápido del carrito */}
      {/* Resumen rápido del carrito */}
      <style dangerouslySetInnerHTML={{ __html: `
        .always-visible-scroll::-webkit-scrollbar {
          width: 6px;
          -webkit-appearance: none;
        }
        .always-visible-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .always-visible-scroll::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
        }
        .dark .always-visible-scroll::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
        }
        .dark .always-visible-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
        }
      `}} />
      <div className="mb-6 rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShoppingBag className="h-4 w-4 text-[var(--color-primary)]" />
            {store.name}
          </div>
          <span className="text-sm font-bold text-[var(--color-primary)]">
            {formatCurrency(cartSubtotal)}
          </span>
        </div>
        
        <div className="relative mt-3">
          <ul className="space-y-1 max-h-32 overflow-y-auto pr-2 always-visible-scroll">
            {items.map((item) => (
              <li key={item.cartItemId} className="text-xs text-muted-foreground flex justify-between py-0.5">
                <span className="line-clamp-1 flex-1 mr-2">
                  {item.name} x{item.quantity}
                </span>
                <span>{formatCurrency((item.unitPrice + item.selectedOptions.reduce((s, o) => s + o.extraPrice, 0)) * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Paso activo */}
      {step === "customer" ? (
        <CustomerStep
          onNext={handleCustomerNext}
          defaultValues={customerData ?? undefined}
        />
      ) : (
        <DeliveryStep
          store={store}
          cartSubtotal={cartSubtotal}
          onBack={() => setStep("customer")}
          onSubmit={handleDeliverySubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
