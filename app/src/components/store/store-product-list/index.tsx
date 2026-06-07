"use client";

import { useState } from "react";
import { LayoutGrid, LayoutList, Rows3 } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/shared/empty-state";
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
}: {
  label: string;
  products: Product[];
  slug: string;
  layout: GridLayout;
  showToggle?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight">{label}</h2>
          <span className="text-sm font-medium text-muted-foreground">{products.length}</span>
        </div>
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
      <div className={GRID_CLASS[layout]}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} slug={slug} layout={layout} />
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
                />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
