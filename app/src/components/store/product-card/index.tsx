"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductDetailSheet } from "@/components/store/product-detail-sheet";
import { useCartStore } from "@/lib/stores/cart.store";
import type { Product } from "@/lib/types/catalog";

interface ProductCardProps {
  product: Product;
  slug: string;
}

export function ProductCard({ product, slug }: ProductCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const cartQuantity = useCartStore((state) =>
    state.items
      .filter((i) => i.productId === product.id)
      .reduce((sum, i) => sum + i.quantity, 0)
  );

  return (
    <>
      <div
        className="store-card group flex cursor-pointer flex-col overflow-hidden transition-all"
        onClick={(e) => {
          e.currentTarget.blur();
          setSheetOpen(true);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
            setSheetOpen(true);
          }
        }}
        aria-label={`Ver detalle de ${product.name}`}
      >
        {/* Imagen */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-muted-foreground">
              🍽️
            </div>
          )}

          {/* Badge de cantidad en carrito */}
          {cartQuantity > 0 && (
            <div className="absolute right-2 top-2 z-10 flex min-w-[1.375rem] items-center justify-center rounded-full bg-[var(--store-accent)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-[var(--store-accent-foreground)] shadow-md ring-2 ring-[var(--color-background)]">
              {cartQuantity}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="store-card-info flex flex-1 flex-col gap-1 p-3">
          <p className="line-clamp-2 text-sm font-bold leading-tight">
            {product.name}
          </p>
          {product.description && (
            <p className="line-clamp-1 text-xs opacity-75">
              {product.description}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-extrabold text-sm">
              {formatCurrency(product.price)}
            </span>
            <button
              className={`flex h-8 items-center justify-center rounded-full transition-all shadow-sm ${
                cartQuantity > 0
                  ? "gap-1.5 px-2.5 bg-[var(--store-accent)] text-[var(--store-accent-foreground)] ring-2 ring-[var(--store-accent)]/30"
                  : "w-8 bg-[var(--store-accent)] text-[var(--store-accent-foreground)] hover:opacity-90"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setSheetOpen(true);
              }}
              aria-label={`Agregar ${product.name} al carrito`}
            >
              <ShoppingCart className="h-4 w-4 shrink-0" />
              {cartQuantity > 0 && (
                <span className="text-xs font-bold leading-none">{cartQuantity}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <ProductDetailSheet
        product={product}
        slug={slug}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
