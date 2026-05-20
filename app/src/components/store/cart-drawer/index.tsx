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

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCartStore();
  const cartSubtotal = subtotal();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setIsSheetOpen(false);
    setIsPopoverOpen(false);
    router.push(`/${slug}/checkout`);
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  const renderCartContent = (onClose: () => void) => (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-bold text-foreground">
            <ShoppingBag className="h-5 w-5 text-[var(--color-primary)]" />
            Tu carrito
            {totalItems > 0 && (
              <span className="ml-1 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                {totalItems}
              </span>
            )}
          </div>
          {totalItems > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Vaciar
            </Button>
          )}
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6 min-h-[220px]">
          <EmptyState
            title="Tu carrito está vacío"
            description="Parece que todavía no agregaste productos. ¡Explorá la tienda para empezar!"
          />
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 px-6 max-h-[350px]">
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
                  <div key={item.cartItemId} className="flex gap-4 py-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/30">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold leading-snug line-clamp-2 text-foreground">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.cartItemId)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Eliminar item"
                          >
                            <X className="h-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.selectedOptions.length > 0 && (
                          <p className="text-[10px] text-muted-foreground leading-tight">
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
                          className="scale-85 origin-left border-muted bg-muted/30"
                        />
                        <span className="text-xs font-bold text-foreground">
                          {formatCurrency(itemSubtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="border-t bg-muted/20 px-6 py-5 space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Subtotal</span>
              <span className="text-base font-bold text-[var(--color-primary)]">
                {formatCurrency(cartSubtotal)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Los costos de envío y detalles finales se calculan en el checkout.
            </p>
            <Button
              onClick={() => {
                onClose();
                handleCheckout();
              }}
              className="w-full gap-2 bg-[var(--store-accent)] text-white hover:opacity-90 py-5 text-sm font-semibold rounded-xl"
            >
              Iniciar pedido
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="relative">
      {/* 📱 VISTA MÓVIL: Dispara el Sheet lateral */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <button type="button" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-foreground)] rounded-full">
              {children}
            </button>
          </SheetTrigger>
          <SheetContent className="flex w-full flex-col p-0 sm:max-w-md bg-background">
            {renderCartContent(() => setIsSheetOpen(false))}
          </SheetContent>
        </Sheet>
      </div>

      {/* 💻 VISTA ESCRITORIO: Dispara el Popover flotante premium */}
      <div className="hidden md:block">
        <button
          type="button"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-foreground)] rounded-full transition-transform hover:scale-105 active:scale-95"
        >
          {children}
        </button>

        {isPopoverOpen && (
          <>
            {/* Capa de fondo invisible para capturar el clic exterior y cerrar */}
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setIsPopoverOpen(false)}
            />

            {/* Popover del Carrito */}
            <div className="absolute right-0 top-full mt-3.5 w-96 rounded-2xl border border-border/70 bg-card/98 backdrop-blur-md p-0 shadow-[0_12px_38px_rgba(0,0,0,0.14)] z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              {renderCartContent(() => setIsPopoverOpen(false))}
            </div>
          </>
        )}
      </div>

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
    </div>
  );
}
