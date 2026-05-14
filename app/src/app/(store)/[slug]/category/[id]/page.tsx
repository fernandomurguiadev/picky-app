import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/store/category-nav";
import { ProductCard } from "@/components/store/product-card";
import { StoreSearchBar } from "@/components/store/store-search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import type { Category, PaginatedResponse, Product } from "@/lib/types/catalog";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

interface CategoryPageProps {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ slug, id }, query] = await Promise.all([params, searchParams]);
  const page = Number(query.page ?? "1");

  const [categoriesRes, productsRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}/categories`, {
      next: { revalidate: 60 },
    }),
    fetch(
      `${BACKEND_URL}/api/v1/stores/${slug}/categories/${id}/products?page=${page}&limit=12`,
      { next: { revalidate: 30 } }
    ),
  ]);

  if (!productsRes.ok && productsRes.status === 404) {
    notFound();
  }

  const categoriesJson = categoriesRes.ok ? await categoriesRes.json() : { data: [] };
  const productsJson: PaginatedResponse<Product> = productsRes.ok
    ? await productsRes.json()
    : { data: [], meta: { page, limit: 12, total: 0, totalPages: 1 } };

  const categories: Category[] = categoriesJson.data ?? [];
  const currentCategory = categories.find((category) => category.id === id);

  return (
    <div className="pb-10">
      <CategoryNav categories={categories} slug={slug} />

      <section className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Categoría</p>
            <h1 className="text-2xl font-bold">{currentCategory?.name ?? "Productos"}</h1>
          </div>
          <span className="text-sm text-muted-foreground">
            {productsJson.meta.total} resultados
          </span>
        </div>
        <div className="mb-5 max-w-md">
          <StoreSearchBar slug={slug} />
        </div>

        {productsJson.data.length ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {productsJson.data.map((product) => (
                <ProductCard key={product.id} product={product} slug={slug} />
              ))}
            </div>
            <div className="mt-8">
              <Pagination
                page={productsJson.meta.page}
                totalPages={productsJson.meta.totalPages}
                basePath={`/${slug}/category/${id}`}
              />
            </div>
          </>
        ) : (
          <EmptyState
            title="Esta categoría está vacía"
            description="Todavía no hay productos publicados en esta sección."
          />
        )}
      </section>
    </div>
  );
}
