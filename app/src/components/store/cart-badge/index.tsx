"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart.store";
import { cn } from "@/lib/utils";

export function CartBadge() {
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
      type="button"
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 text-foreground hover:bg-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        isAnimating && "animate-bounce"
      )}
      aria-label={`Ver carrito, ${totalItems} productos`}
    >
      <ShoppingBag className="h-5 w-5 group-hover:text-[var(--color-primary)] transition-colors" />
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white animate-in zoom-in-50">
        {totalItems}
      </span>
    </button>
  );
}
