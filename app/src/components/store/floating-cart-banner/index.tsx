"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart.store";
import { formatCurrency, cn } from "@/lib/utils";

// Este componente no lleva "CartDrawer" integrado internamente, 
// para que pueda ser envuelto por CartDrawer desde el layout
export const FloatingCartBanner = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => {
  const { items, subtotal } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = subtotal();
  const pathname = usePathname();

  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevCountRef = useRef(totalItems);
  const [displayTotal, setDisplayTotal] = useState(cartSubtotal);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (totalItems > prevCountRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totalItems;
  }, [totalItems, isMounted]);

  // Actualizar el precio con una leve tardanza para el efecto "caja registradora"
  useEffect(() => {
    if (cartSubtotal !== displayTotal) {
      const timer = setTimeout(() => {
        setDisplayTotal(cartSubtotal);
      }, 350); // Se actualiza justo después de que termina el "pop" de la cantidad
      return () => clearTimeout(timer);
    }
  }, [cartSubtotal, displayTotal]);

  // No mostramos el banner si estamos en el checkout, ni si no hay items
  if (!isMounted || totalItems === 0 || pathname?.includes("/checkout") || pathname?.includes("/order-confirmation")) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 animate-in slide-in-from-bottom-8 duration-300 pointer-events-none md:hidden">
      <button
        ref={ref}
        type="button"
        className={cn(
          "pointer-events-auto relative w-full flex items-center justify-between rounded-2xl bg-[var(--store-accent)] px-5 py-4 text-[var(--store-accent-foreground)] shadow-xl transition-transform active:scale-[0.98]",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
              isAnimating
                ? "bg-white scale-125 text-[var(--store-accent)] shadow-[0_0_15px_rgba(255,255,255,0.5)] rotate-12"
                : "bg-[var(--store-accent-foreground)]/20 scale-100 text-[var(--store-accent-foreground)]"
            )}
          >
            <span className="text-sm font-bold">{totalItems}</span>
          </div>
          <span className="font-semibold tracking-tight text-sm">Ver mi pedido</span>
        </div>
        
        <span 
          key={displayTotal}
          className="font-bold tracking-tight animate-in slide-in-from-bottom-2 fade-in duration-300"
        >
          {formatCurrency(displayTotal)}
        </span>
      </button>
      </div>
      {/* Espaciador transparente al final del DOM para evitar que el banner tape contenido */}
      <div className="h-24 md:hidden pointer-events-none w-full shrink-0" />
    </>
  );
});

FloatingCartBanner.displayName = "FloatingCartBanner";
