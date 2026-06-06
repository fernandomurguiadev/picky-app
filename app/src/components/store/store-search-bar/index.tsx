"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/shared/search-bar";
import { Suspense, useTransition } from "react";

interface StoreSearchBarProps {
  slug: string;
  defaultValue?: string;
  categoryId?: string;
}

function StoreSearchBarInput({ slug, defaultValue = "", categoryId }: StoreSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Si no tenemos categoryId como prop, nos fijamos si está en los parámetros de búsqueda de la URL
  const activeCategoryId = categoryId || searchParams.get("category") || "";
  // Si no se pasa defaultValue, intentamos leer 'q' de la URL
  const activeDefaultValue = defaultValue || searchParams.get("q") || "";

  return (
    <div className={isPending ? "opacity-75" : ""}>
      <SearchBar
        defaultValue={activeDefaultValue}
        placeholder="Buscar en la tienda"
        onChange={(value) => {
          const term = value.trim();
          startTransition(() => {
            if (!term) {
              if (activeCategoryId) {
                router.replace(`/${slug}/category/${activeCategoryId}`);
              } else {
                router.replace(`/${slug}`);
              }
              return;
            }

            const categoryQuery = activeCategoryId ? `&category=${activeCategoryId}` : "";
            router.replace(`/${slug}/search?q=${encodeURIComponent(term)}${categoryQuery}`);
          });
        }}
      />
    </div>
  );
}

export function StoreSearchBar(props: StoreSearchBarProps) {
  return (
    <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-lg bg-muted" />}>
      <StoreSearchBarInput {...props} />
    </Suspense>
  );
}