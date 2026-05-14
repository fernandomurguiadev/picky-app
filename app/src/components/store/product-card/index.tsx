"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductDetailSheet } from "@/components/store/product-detail-sheet";
import type { Product } from "@/lib/types/catalog";

interface ProductCardProps {
  product: Product;
  slug: string;
}

export function ProductCard({ product, slug }: ProductCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div
        className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
        onClick={() => setSheetOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setSheetOpen(true)}
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
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="line-clamp-2 text-sm font-medium leading-tight">
            {product.name}
          </p>
          {product.description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {product.description}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-semibold text-[var(--color-primary)]">
              {formatCurrency(product.price)}
            </span>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-white transition-opacity hover:opacity-90"
              onClick={(e) => {
                e.stopPropagation();
                setSheetOpen(true);
              }}
              aria-label={`Agregar ${product.name} al carrito`}
            >
              <ShoppingCart className="h-4 w-4" />
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
