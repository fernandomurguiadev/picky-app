"use client";

import { useState } from "react";
import { LayoutGrid, LayoutList, Rows3, Tag, Share2 } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import { shareViaWhatsApp } from "@/lib/utils/share";
import type { Product } from "@/lib/types/catalog";
import type { Category } from "@/lib/types/catalog";
import type { GridLayout } from "@/lib/types/store";

interface StoreProductListProps {
  featured: Product[];
  categories: Category[];
  productsByCategory: Record<string, Product[]>;
  slug: string;
  defaultLayout: GridLayout;
}

const TOGGLE_CYCLE: Record<GridLayout, GridLayout> = {
  "grid-2": "list",
  "list": "grid-1",
  "grid-1": "grid-2",
};

const NEXT_ICON: Record<GridLayout, React.ReactNode> = {
  "grid-2": <Rows3 className="h-4 w-4" />,
  "list":   <LayoutList className="h-4 w-4" />,
  "grid-1": <LayoutGrid className="h-4 w-4" />,
};

const NEXT_LABEL: Record<GridLayout, string> = {
  "grid-2": "Ver como lista",
  "list":   "Ver en 1 columna",
  "grid-1": "Ver en 2 columnas",
};

const GRID_CLASS: Record<GridLayout, string> = {
  "grid-1": "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  "grid-2": "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4",
  "list":   "flex flex-col gap-2",
};

function ProductSection({
  label,
  products,
  slug,
  layout,
  showToggle,
  onToggle,
  hidePrice,
  groupPrice,
  categoryId,
}: {
  label: string;
  products: Product[];
  slug: string;
  layout: GridLayout;
  showToggle?: boolean;
  onToggle?: () => void;
  hidePrice?: boolean;
  groupPrice?: number | null;
  categoryId?: string;
}) {
  const handleShare = () => {
    if (!categoryId) return;
    const url = `${window.location.origin}/${slug}/category/${categoryId}?utm_source=whatsapp_share&utm_medium=seller_link`;
    shareViaWhatsApp(url);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xl font-bold tracking-tight truncate">{label}</h2>
            <span className="text-sm font-medium text-muted-foreground shrink-0">{products.length}</span>
            {hidePrice && groupPrice != null && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25 px-3 py-1 text-xs font-semibold text-[var(--color-primary)] shrink-0">
                <Tag className="h-3 w-3 shrink-0" />
                {formatCurrency(groupPrice)}
              </span>
            )}
          </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {categoryId && (
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              aria-label={`Compartir categoría ${label}`}
            >
              <Share2 className="h-3 w-3" />
              Compartir
            </button>
          )}
          {showToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden"
              aria-label={NEXT_LABEL[layout]}
            >
              {NEXT_ICON[layout]}
            </button>
          )}
        </div>
        {hidePrice && groupPrice != null && (
          <div className="mt-2 sm:hidden">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              <Tag className="h-3 w-3 shrink-0" />
              {formatCurrency(groupPrice)}
            </span>
          </div>
        )}
      </div>
      <div className={GRID_CLASS[layout]}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            slug={slug}
            layout={layout}
            hidePrice={hidePrice ?? (product.category?.isGroupPricingEnabled === true)}
            groupPrice={hidePrice && groupPrice != null ? groupPrice : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export function StoreProductList({
  featured,
  categories,
  productsByCategory,
  slug,
  defaultLayout,
}: StoreProductListProps) {
  const [layout, setLayout] = useState<GridLayout>(defaultLayout);

  const toggle = () => setLayout((prev) => TOGGLE_CYCLE[prev]);

  return (
    <>
      {/* DESTACADOS */}
      <section>
        {featured.length ? (
          <ProductSection
            label="Destacados"
            products={featured}
            slug={slug}
            layout={layout}
            showToggle
            onToggle={toggle}
          />
        ) : (
          <EmptyState
            title="No hay destacados todavía"
            description="El comercio todavía no marcó productos destacados en su catálogo."
          />
        )}
      </section>

      {/* CATEGORÍAS */}
      <div className="space-y-12">
        {categories.map((category) => {
          const products = productsByCategory[category.id] ?? [];
          if (products.length === 0) return null;

          return (
            <section
              key={category.id}
              id={`category-${category.id}`}
              className="scroll-mt-[130px] lg:scroll-mt-[72px]"
            >
              <div className="border-b pb-2">
                <ProductSection
                  label={category.name}
                  products={products}
                  slug={slug}
                  layout={layout}
                  hidePrice={category.isGroupPricingEnabled === true}
                  groupPrice={category.groupPrice}
                  categoryId={category.id}
                />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
