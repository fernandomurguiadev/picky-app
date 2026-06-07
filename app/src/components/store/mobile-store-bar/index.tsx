"use client";

import { usePathname } from "next/navigation";
import { StoreSearchBar } from "@/components/store/store-search-bar";
import { MobileCategoryButton } from "@/components/store/mobile-category-button";
import type { Category } from "@/lib/types/catalog";

interface MobileStoreBarProps {
  slug: string;
  categories: Category[];
}

const HIDDEN_PATHS = ["/checkout", "/order-confirmation"];

export function MobileStoreBar({ slug, categories }: MobileStoreBarProps) {
  const pathname = usePathname();

  if (HIDDEN_PATHS.some((p) => pathname.endsWith(p))) return null;

  return (
    <div className="w-full bg-[var(--color-background)] border-b border-[var(--border)] lg:hidden pointer-events-auto">
      <div className="mx-auto max-w-4xl px-4 py-2 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <StoreSearchBar slug={slug} />
        </div>
        {categories.length > 0 && (
          <MobileCategoryButton categories={categories} />
        )}
      </div>
    </div>
  );
}
