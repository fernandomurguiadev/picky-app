"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/catalog";

interface CategoryNavProps {
  categories: Category[];
  slug: string;
}

export function CategoryNav({ categories, slug }: CategoryNavProps) {
  const pathname = usePathname();

  if (!categories.length) return null;

  return (
    <nav className="sticky top-14 z-30 border-b bg-background">
      <div className="mx-auto max-w-4xl">
        <div className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
          <Link
            href={`/${slug}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              pathname === `/${slug}`
                ? "bg-[var(--color-primary)] text-white"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            Inicio
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${slug}/category/${cat.id}`}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                pathname === `/${slug}/category/${cat.id}`
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
