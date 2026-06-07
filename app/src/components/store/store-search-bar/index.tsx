"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/shared/search-bar";
import { Suspense } from "react";

interface StoreSearchBarProps {
  slug: string;
}

function StoreSearchBarInput({ slug }: StoreSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOnSearchPage = pathname.includes("/search");
  const showSearch = !pathname.includes("/checkout") && !pathname.includes("/order-confirmation");

  // defaultValue solo se usa al montar; carga el término actual si entramos a la página de búsqueda
  const initialTerm = isOnSearchPage ? (searchParams.get("q") ?? "") : "";

  if (!showSearch) return null;

  return (
    <SearchBar
      // Key fijo por tienda: evita remounts durante la escritura.
      // El input nunca se resetea al cambiar de ruta dentro del mismo store.
      key={slug}
      defaultValue={initialTerm}
      placeholder="Buscar en la tienda"
      onChange={(value) => {
        const term = value.trim();
        if (!term) {
          if (isOnSearchPage) router.push(`/${slug}`);
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
