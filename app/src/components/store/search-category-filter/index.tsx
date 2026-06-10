"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { Category } from "@/lib/types/catalog";

interface SearchCategoryFilterProps {
  categories: Category[];
  slug: string;
  term: string;
  activeCategoryId: string;
}

export function SearchCategoryFilter({
  categories,
  slug,
  term,
  activeCategoryId,
}: SearchCategoryFilterProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const buildUrl = (categoryId: string) => {
    const base = new URLSearchParams({ q: term });
    if (categoryId) base.set("category", categoryId);
    return `/${slug}/search?${base.toString()}`;
  };

  const chipClass = (active: boolean) =>
    cn(
      "shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
      active
        ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent"
        : "border-border text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="mb-5 flex items-center gap-2">
      {/* Chips scrollables */}
      <div className="relative flex-1 min-w-0 overflow-hidden">
        <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-none pb-1">
          <Link href={buildUrl("")} scroll={false} className={chipClass(!activeCategoryId)}>
            Todos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl(activeCategoryId === cat.id ? "" : cat.id)}
              scroll={false}
              className={chipClass(activeCategoryId === cat.id)}
            >
              {cat.name}
            </Link>
          ))}
          {/* Spacer para el fade */}
          <div className="w-6 shrink-0 md:hidden" />
        </div>
        {/* Fade derecho en mobile */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--color-background)] to-transparent md:hidden" />
      </div>

      {/* Botón de categorías — solo mobile */}
      <div className="shrink-0 md:hidden">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 shadow-sm"
              aria-label="Ver todas las categorías"
            >
              <Menu className="h-4 w-4" />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-md">
              <DrawerHeader>
                <DrawerTitle>Filtrar por categoría</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto">
                <div className="flex flex-col gap-2">
                  <Link
                    href={buildUrl("")}
                    scroll={false}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center rounded-lg px-4 py-3 font-medium transition-colors",
                      !activeCategoryId
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                        : "bg-muted/50 text-foreground"
                    )}
                  >
                    Todos
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={buildUrl(cat.id)}
                      scroll={false}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "flex items-center rounded-lg px-4 py-3 font-medium transition-colors",
                        activeCategoryId === cat.id
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          : "bg-muted/50 text-foreground"
                      )}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
