import { CategoryNav } from "@/components/store/category-nav";
import { ProductCard } from "@/components/store/product-card";
import { StoreSearchBar } from "@/components/store/store-search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import type { Category, Product } from "@/lib/types/catalog";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;

  const [categoriesRes, featuredRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}/categories`, {
      next: { revalidate: 60 },
    }),
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}/products/featured`, {
      next: { revalidate: 30 },
    }),
  ]);

  const categoriesJson = categoriesRes.ok ? await categoriesRes.json() : { data: [] };
  const featuredJson = featuredRes.ok ? await featuredRes.json() : { data: [] };

  const categories: Category[] = categoriesJson.data ?? [];
  const featured: Product[] = featuredJson.data ?? [];

  return (
    <div className="pb-10">
      <CategoryNav categories={categories} slug={slug} />

      <section className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-3xl border bg-gradient-to-br from-orange-50 via-background to-amber-50 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-primary)]">
            Tienda digital
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Pedí en minutos y recibí por WhatsApp
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Explorá el catálogo, elegí tus variantes y confirmá el pedido sin registrarte.
          </p>
          <div className="mt-5 max-w-md">
            <StoreSearchBar slug={slug} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Destacados</h2>
          <span className="text-sm text-muted-foreground">{featured.length} productos</span>
        </div>

        {featured.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} slug={slug} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay destacados todavía"
            description="El comercio todavía no marcó productos destacados en su catálogo."
          />
        )}
      </section>
    </div>
  );
}
