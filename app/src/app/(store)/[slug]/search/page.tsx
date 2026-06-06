import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { StoreSearchBar } from "@/components/store/store-search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import type { Category, PaginatedResponse, Product } from "@/lib/types/catalog";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

interface SearchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const term = query.q?.trim() ?? "";
  const page = Number(query.page ?? "1");
  const activeCategoryId = query.category ?? "";

  const categoriesRes = await fetch(
    `${BACKEND_URL}/api/v1/stores/${slug}/categories`,
    { next: { revalidate: 60 } }
  );
  const categories: Category[] = categoriesRes.ok
    ? (await categoriesRes.json()).data ?? []
    : [];

  if (!term) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">

        <EmptyState
          title="Buscá un producto"
          description="Escribí el nombre de un producto para ver resultados dentro de la tienda."
        />
      </div>
    );
  }

  const searchUrl = new URL(`${BACKEND_URL}/api/v1/stores/${slug}/products/search`);
  searchUrl.searchParams.set("q", term);
  searchUrl.searchParams.set("page", String(page));
  searchUrl.searchParams.set("limit", "24");
  if (activeCategoryId) searchUrl.searchParams.set("categoryId", activeCategoryId);

  const searchRes = await fetch(searchUrl.toString(), { next: { revalidate: 10 } });
  const results: PaginatedResponse<Product> = searchRes.ok
    ? await searchRes.json()
    : { data: [], meta: { page, limit: 24, total: 0, totalPages: 1 } };

  const buildSearchUrl = (params: Record<string, string>) => {
    const base = new URLSearchParams({ q: term });
    Object.entries(params).forEach(([k, v]) => v ? base.set(k, v) : base.delete(k));
    return `/${slug}/search?${base.toString()}`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">


      {/* Header con término y total */}
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Resultados para</p>
          <h1 className="text-2xl font-bold">"{term}"</h1>
        </div>
        <span className="text-sm text-muted-foreground shrink-0">
          {results.meta.total} encontrados
        </span>
      </div>

      {/* Chips de categoría como filtros */}
      {categories.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <Link
            href={buildSearchUrl({ category: "" })}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              !activeCategoryId
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildSearchUrl({ category: activeCategoryId === cat.id ? "" : cat.id })}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                activeCategoryId === cat.id
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {results.data.length ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {results.data.map((product) => (
              <ProductCard key={product.id} product={product} slug={slug} />
            ))}
          </div>
          <div className="mt-8">
            <Pagination
              page={results.meta.page}
              totalPages={results.meta.totalPages}
              basePath={`/${slug}/search`}
              searchParams={{ q: term, ...(activeCategoryId && { category: activeCategoryId }) }}
            />
          </div>
        </>
      ) : (
        <EmptyState
          title="Sin resultados"
          description={
            activeCategoryId
              ? "No hay productos con esa búsqueda en esta categoría. Probá sin filtro de categoría."
              : "No encontramos productos con esa búsqueda. Probá con otro término."
          }
        />
      )}
    </div>
  );
}
