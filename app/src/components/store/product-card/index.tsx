"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductDetailSheet } from "@/components/store/product-detail-sheet";
import { ServiceActionButton } from "@/components/store/actions/service-action-button";
import { useCartStore } from "@/lib/stores/cart.store";
import { useStoreConfig } from "@/components/store/store-config-provider";
import type { Product } from "@/lib/types/catalog";
import type { GridLayout } from "@/lib/types/store";

interface ProductCardProps {
  product: Product;
  slug: string;
  layout?: GridLayout;
}

export function ProductCard({ product, slug, layout = 'grid-2' }: ProductCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { storeType, customCtaText, whatsapp } = useStoreConfig();
  const isServices = storeType === "services";

  const cartQuantity = useCartStore((state) =>
    state.items
      .filter((i) => i.productId === product.id)
      .reduce((sum, i) => sum + i.quantity, 0)
  );

  const outOfStock = !product.inStock;
  const showPrice = !(isServices && product.price === 0);
  const handleOpen = () => setSheetOpen(true);

  if (layout === 'list') {
    return (
      <>
        <div
          className="store-card group flex cursor-pointer flex-row items-stretch overflow-hidden transition-all"
          data-list-card=""
          onClick={handleOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter") handleOpen(); }}
          aria-label={`Ver detalle de ${product.name}`}
        >
          {/* Imagen */}
          <div className="relative w-24 shrink-0 overflow-hidden bg-muted" style={{ minHeight: "5rem" }}>
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className={`object-cover transition-transform group-hover:scale-105${outOfStock ? " opacity-50" : ""}`}
                sizes="96px"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground">
                🍽️
              </div>
            )}
            {!isServices && cartQuantity > 0 && !outOfStock && (
              <div
                className="absolute right-1.5 top-1.5 z-10 flex min-w-[1.25rem] items-center justify-center bg-[var(--store-accent)] px-1 py-0.5 text-[10px] font-bold leading-none text-[var(--store-accent-foreground)] shadow-md ring-2 ring-[var(--color-background)]"
                style={{ borderRadius: "var(--radius)" }}
              >
                {cartQuantity}
              </div>
            )}
            {outOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  Sin stock
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="store-card-info flex flex-1 min-w-0 flex-row items-center justify-between gap-3 px-4 py-3">
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className={`line-clamp-2 text-sm font-bold leading-tight${outOfStock ? " opacity-50" : ""}`}>
                {product.name}
              </p>
              {product.description && (
                <p className={`line-clamp-1 text-xs${outOfStock ? " opacity-40" : " opacity-75"}`}>
                  {product.description}
                </p>
              )}
              {showPrice && (
                <p className={`font-extrabold text-sm pt-0.5${outOfStock ? " opacity-50" : ""}`}>
                  {formatCurrency(product.price)}
                </p>
              )}
            </div>
            {isServices ? (
              <ServiceActionButton
                serviceName={product.name}
                whatsappNumber={whatsapp}
                ctaText={customCtaText}
                size="sm"
                className="h-9 w-9 shrink-0"
              />
            ) : (
              <button
                disabled={outOfStock}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--store-accent)] text-[var(--store-accent-foreground)] transition-opacity hover:opacity-90 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={(e) => { e.stopPropagation(); if (!outOfStock) handleOpen(); }}
                aria-label={outOfStock ? `${product.name} sin stock` : `Agregar ${product.name} al carrito`}
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            )}
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

  return (
    <>
      <div
        className="store-card group flex cursor-pointer flex-col overflow-hidden transition-all"
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") handleOpen(); }}
        aria-label={`Ver detalle de ${product.name}`}
      >
        {/* Imagen */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className={`object-cover transition-transform group-hover:scale-105${outOfStock ? " opacity-50" : ""}`}
              sizes="(max-width: 768px) 50vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-muted-foreground">
              🍽️
            </div>
          )}

          {!isServices && cartQuantity > 0 && !outOfStock && (
            <div
              className="absolute right-2 top-2 z-10 flex min-w-[1.375rem] items-center justify-center bg-[var(--store-accent)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-[var(--store-accent-foreground)] shadow-md ring-2 ring-[var(--color-background)]"
              style={{ borderRadius: "var(--radius)" }}
            >
              {cartQuantity}
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-end justify-start bg-black/20 p-2">
              <span className="rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                Sin stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="store-card-info flex flex-1 flex-col gap-1 p-3">
          <p className={`line-clamp-2 text-sm font-bold leading-tight${outOfStock ? " opacity-50" : ""}`}>
            {product.name}
          </p>
          {product.description && (
            <p className={`line-clamp-1 text-xs${outOfStock ? " opacity-40" : " opacity-75"}`}>
              {product.description}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            {showPrice ? (
              <span className={`font-extrabold text-sm${outOfStock ? " opacity-50" : ""}`}>
                {formatCurrency(product.price)}
              </span>
            ) : (
              <span />
            )}
            {isServices ? (
              <ServiceActionButton
                serviceName={product.name}
                whatsappNumber={whatsapp}
                ctaText={customCtaText}
                size="sm"
                className="h-8 w-8"
              />
            ) : (
              <button
                disabled={outOfStock}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--store-accent)] text-[var(--store-accent-foreground)] transition-opacity hover:opacity-90 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={(e) => { e.stopPropagation(); if (!outOfStock) handleOpen(); }}
                aria-label={outOfStock ? `${product.name} sin stock` : `Agregar ${product.name} al carrito`}
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            )}
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
