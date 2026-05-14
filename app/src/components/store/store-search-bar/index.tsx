"use client";

import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/shared/search-bar";

interface StoreSearchBarProps {
  slug: string;
  defaultValue?: string;
}

export function StoreSearchBar({ slug, defaultValue = "" }: StoreSearchBarProps) {
  const router = useRouter();

  return (
    <SearchBar
      defaultValue={defaultValue}
      placeholder="Buscar en la tienda"
      onChange={(value) => {
        const term = value.trim();
        if (!term) {
          router.replace(`/${slug}/search`);
          return;
        }

        router.replace(`/${slug}/search?q=${encodeURIComponent(term)}`);
      }}
    />
  );
}