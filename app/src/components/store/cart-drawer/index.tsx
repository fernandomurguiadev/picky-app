"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { ShoppingBag, Trash2, ArrowRight, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuantitySelector } from "@/components/shared/quantity-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { useCartStore } from "@/lib/stores/cart.store";
import { formatCurrency } from "@/lib/utils";

interface CartDrawerProps {
  children: React.ReactNode;
}

export function CartDrawer({ children }: CartDrawerProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [isOpen, setIsOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCartStore();
  const cartSubtotal = subtotal();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setIsOpen(false);
    router.push(`/${slug}/checkout`);
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                <ShoppingBag className="h-5 w-5 text-[var(--color-primary)]" />
                Tu carrito
                {totalItems > 0 && (
                  <span className="ml-1 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                    {totalItems}
                  </span>
                )}
              </SheetTitle>
              {totalItems > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Vaciar
                </Button>
              )}
            </div>
          </SheetHeader>

          {totalItems === 0 ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                title="Tu carrito está vacío"
                description="Parece que todavía no agregaste productos. ¡Explorá la tienda para empezar!"
              />
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6">
                <div className="divide-y divide-border py-2">
                  {items.map((item) => {
                    const itemSubtotal =
                      (item.unitPrice +
                        item.selectedOptions.reduce(
                          (sum, opt) => sum + opt.extraPrice,
                          0
                        )) *
                      item.quantity;

                    return (
                      <div key={item.cartItemId} className="flex gap-4 py-5">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-3xl">
                              🍽️
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold leading-snug line-clamp-2">
                                {item.name}
                              </h4>
                              <button
                                onClick={() => removeItem(item.cartItemId)}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Eliminar item"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            {item.selectedOptions.length > 0 && (
                              <p className="text-xs text-muted-foreground leading-tight">
                                {item.selectedOptions
                                  .map((opt) => opt.itemName)
                                  .join(", ")}
                              </p>
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <QuantitySelector
                              value={item.quantity}
                              onChange={(val) => updateQuantity(item.cartItemId, val)}
                              className="scale-90 origin-left border-muted bg-muted/30"
                            />
                            <span className="text-sm font-bold">
                              {formatCurrency(itemSubtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="border-t bg-muted/20 px-6 py-6 space-y-4">
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Subtotal</span>
                  <span className="text-lg font-bold text-[var(--color-primary)]">
                    {formatCurrency(cartSubtotal)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Los costos de envío y detalles finales se calculan en el checkout.
                </p>
                <Button
                  onClick={handleCheckout}
                  className="w-full gap-2 bg-[var(--color-primary)] text-white hover:opacity-90 py-6 text-base font-semibold rounded-xl"
                >
                  Iniciar pedido
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmModal
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="¿Vaciar el carrito?"
        description="Esta acción eliminará todos los productos agregados. ¿Deseás continuar?"
        confirmLabel="Sí, vaciar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleClearCart}
      />
    </>
  );
}
