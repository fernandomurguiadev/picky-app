import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { SearchCategoryFilter } from "@/components/store/search-category-filter";
import { SearchShareButton } from "@/components/store/search-share-button";
import type { Category, PaginatedResponse, Product } from "@/lib/types/catalog";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

interface SearchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const term = query.q?.trim() ?? "";
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
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

  const searchRes = await fetch(searchUrl.toString(), { cache: "no-store" });
  const searchJson: PaginatedResponse<Product> & {
    categoryFacets?: Array<{ categoryId: string; count: number }>;
  } = searchRes.ok
    ? await searchRes.json()
    : { data: [], meta: { page, limit: 24, total: 0, totalPages: 1 } };

  // Solo mostrar categorías que tienen al menos un resultado para este término
  const facetIds = new Set((searchJson.categoryFacets ?? []).map((f) => f.categoryId));
  const matchedCategories = categories.filter((c) => facetIds.has(c.id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header con término, total y botón de compartir */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Resultados para</p>
          <h1 className="text-2xl font-bold truncate">"{term}"</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {searchJson.meta.total} encontrados
          </span>
          <SearchShareButton />
        </div>
      </div>

      {/* Chips de categoría + botón drawer en mobile — solo categorías con resultados */}
      {matchedCategories.length > 0 && (
        <SearchCategoryFilter
          categories={matchedCategories}
          slug={slug}
          term={term}
          activeCategoryId={activeCategoryId}
        />
      )}

      {searchJson.data.length ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {searchJson.data.map((product) => (
              <ProductCard key={product.id} product={product} slug={slug} />
            ))}
          </div>
          <div className="mt-8">
            <Pagination
              page={searchJson.meta.page}
              totalPages={searchJson.meta.totalPages}
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
