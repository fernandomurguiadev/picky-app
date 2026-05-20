"use client";

import React, { useState, useEffect, useRef } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart.store";
import { cn } from "@/lib/utils";

export const CartBadge = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>(
  ({ className, ...props }, ref) => {
    const totalItems = useCartStore((state) =>
      state.items.reduce((sum, item) => sum + item.quantity, 0)
    );
    
    const [isMounted, setIsMounted] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const prevCountRef = useRef(totalItems);

    useEffect(() => {
      const timer = setTimeout(() => setIsMounted(true), 0);
      return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
      if (!isMounted) return;

      if (totalItems > prevCountRef.current) {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 500); // 500ms bounce duration
        return () => clearTimeout(timer);
      }
      prevCountRef.current = totalItems;
    }, [totalItems, isMounted]);

    // Evitar hidratación desfasada (Zustand persistido en localStorage en cliente)
    if (!isMounted || totalItems === 0) return null;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 dark:bg-black/15 text-[var(--color-primary-foreground)] hover:bg-white/20 dark:hover:bg-black/25 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-foreground)]/30 hover:scale-105 active:scale-95",
          isAnimating && "animate-bounce",
          className
        )}
        aria-label={`Ver carrito, ${totalItems} productos`}
        {...props}
      >
        <ShoppingBag className="h-5 w-5 transition-transform group-hover:scale-105" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--store-accent)] text-[10px] font-extrabold text-[var(--store-accent-foreground)] shadow-xs animate-in zoom-in-50 border border-[var(--color-primary)]">
          {totalItems}
        </span>
      </button>
    );
  }
);

CartBadge.displayName = "CartBadge";
