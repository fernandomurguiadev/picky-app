"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart.store";

export default function OrderConfirmationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const clearCart = useCartStore((s) => s.clearCart);

  // Limpiar el carrito al montar — idempotente: no hace nada si ya está vacío
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      {/* Checkmark con animación zoom-in */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/50 dark:bg-green-900/20 dark:ring-green-900/10 animate-in zoom-in-50 duration-500">
        <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400" />
      </div>

      {/* Título y descripción */}
      <div className="max-w-sm space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <h1 className="text-2xl font-bold tracking-tight">¡Pedido enviado!</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Tu pedido fue enviado al comercio por WhatsApp.
          Te contactarán a la brevedad para confirmar los detalles.
        </p>
      </div>

      {/* Separador visual */}
      <div className="w-full max-w-xs border-t" />

      {/* CTA */}
      <div className="flex flex-col gap-3 w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <Button
          asChild
          className="w-full gap-2 bg-[var(--color-primary)] text-white hover:opacity-90 py-5"
        >
          <Link href={`/${slug}`}>
            <ShoppingBag className="h-4 w-4" />
            Seguir comprando
          </Link>
        </Button>
      </div>
    </div>
  );
}
