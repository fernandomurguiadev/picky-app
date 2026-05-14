import { ProductCard } from "@/components/store/product-card";
import { StoreSearchBar } from "@/components/store/store-search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import type { PaginatedResponse, Product } from "@/lib/types/catalog";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

interface SearchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const term = query.q?.trim() ?? "";
  const page = Number(query.page ?? "1");

  if (!term) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 max-w-md">
          <StoreSearchBar slug={slug} />
        </div>
        <EmptyState
          title="Buscá un producto"
          description="Escribí el nombre de un producto para ver resultados dentro de la tienda."
        />
      </div>
    );
  }

  const searchRes = await fetch(
    `${BACKEND_URL}/api/v1/stores/${slug}/products/search?q=${encodeURIComponent(term)}&page=${page}&limit=12`,
    { next: { revalidate: 10 } }
  );

  const results: PaginatedResponse<Product> = searchRes.ok
    ? await searchRes.json()
    : { data: [], meta: { page, limit: 12, total: 0, totalPages: 1 } };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 max-w-md">
        <StoreSearchBar slug={slug} defaultValue={term} />
      </div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Resultados para</p>
          <h1 className="text-2xl font-bold">“{term}”</h1>
        </div>
        <span className="text-sm text-muted-foreground">{results.meta.total} encontrados</span>
      </div>

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
              searchParams={{ q: term }}
            />
          </div>
        </>
      ) : (
        <EmptyState
          title="Sin resultados"
          description="No encontramos productos con esa búsqueda. Probá con otro término."
        />
      )}
    </div>
  );
}
