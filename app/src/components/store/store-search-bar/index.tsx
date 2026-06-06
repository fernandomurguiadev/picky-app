"use client";

import { useRouter, usePathname } from "next/navigation";
import { SearchBar } from "@/components/shared/search-bar";
import { Suspense } from "react";

interface StoreSearchBarProps {
  slug: string;
  defaultValue?: string;
}

function StoreSearchBarInput({ slug, defaultValue = "" }: StoreSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isOnSearchPage = pathname.includes("/search");

  return (
    <SearchBar
      defaultValue={defaultValue}
      placeholder="Buscar en la tienda"
      onChange={(value) => {
        const term = value.trim();
        if (!term) {
          if (isOnSearchPage) {
            router.back();
          }
          return;
        }
        router.push(`/${slug}/search?q=${encodeURIComponent(term)}`);
      }}
    />
  );
}

export function StoreSearchBar(props: StoreSearchBarProps) {
  return (
    <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-lg bg-muted" />}>
      <StoreSearchBarInput {...props} />
    </Suspense>
  );
}
