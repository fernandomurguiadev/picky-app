import { CategoryNav } from "@/components/store/category-nav";
import { ProductCard } from "@/components/store/product-card";
import { StoreSearchBar } from "@/components/store/store-search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import type { Category, Product } from "@/lib/types/catalog";
import type { StorePublicData } from "@/lib/types/store";
import { MapPin, Truck, ShoppingBag } from "lucide-react";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;

  const [categoriesRes, featuredRes, storeRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}/categories`, {
      next: { revalidate: 60 },
    }),
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}/products/featured`, {
      next: { revalidate: 30 },
    }),
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}`, {
      cache: "no-store",
    }),
  ]);

  const categoriesJson = categoriesRes.ok ? await categoriesRes.json() : { data: [] };
  const featuredJson = featuredRes.ok ? await featuredRes.json() : { data: [] };
  const storeJson = storeRes.ok ? await storeRes.json() : { data: null };

  const categories: Category[] = categoriesJson.data ?? [];
  const featured: Product[] = featuredJson.data ?? [];
  const store: StorePublicData | null = storeJson?.data;

  // Fetch products for all categories in parallel
  const categoryProductsPromises = categories.map((cat) =>
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}/categories/${cat.id}/products?limit=100`, {
      next: { revalidate: 60 },
    }).then((res) => (res.ok ? res.json() : { data: [] }))
  );

  const categoriesProductsData = await Promise.all(categoryProductsPromises);
  const productsByCategory: Record<string, Product[]> = {};
  categories.forEach((cat, index) => {
    productsByCategory[cat.id] = categoriesProductsData[index]?.data ?? [];
  });

  const storeName = store?.name ?? "Nuestra Tienda";
  const storeDescription = store?.description || "Explorá nuestro catálogo digital, seleccioná tus productos favoritos y confirmá tu pedido directamente por WhatsApp.";

  return (
    <div className="pb-10">
      <CategoryNav categories={categories} slug={slug} />

      {/* 🚀 HERO BANNER DE BIENVENIDA DE MARCA (DINÁMICO Y PREMIUM) */}
      <section id="inicio" className="mx-auto max-w-4xl px-4 py-6 scroll-mt-[130px]">
        <div 
          className="relative rounded-3xl border border-border/50 p-6 sm:p-8 overflow-hidden bg-card/40 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-all duration-500 group"
        >
          {/* Ambient Glows: Modernos, orgánicos y ultra-premium */}
          <div 
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 opacity-20 group-hover:scale-110 group-hover:opacity-25"
            style={{
              background: `var(--color-primary)`,
            }}
          />
          <div 
            className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-[90px] pointer-events-none transition-all duration-1000 opacity-[0.06] group-hover:scale-105"
            style={{
              background: `var(--color-primary)`,
            }}
          />
          
          <div className="relative z-10 space-y-4">
            <div className="space-y-1.5">
              <p className="text-[10px] sm:text-xs font-extrabold tracking-[0.25em] uppercase text-[var(--color-primary)]/80 drop-shadow-sm">
                Bienvenidos a
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                {storeName}
              </h1>
            </div>

            <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground/90 font-medium line-clamp-3 sm:line-clamp-none">
              {storeDescription}
            </p>

            {/* Información rápida y modalidades del comercio */}
            <div className="flex flex-wrap gap-2 pt-1.5">
              {store?.address && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-background/60 backdrop-blur border border-border/40 px-3 py-1 text-[11px] font-semibold text-foreground/70 shadow-sm">
                  <MapPin className="w-3 h-3 text-[var(--color-primary)]/80 shrink-0" />
                  <span className="truncate max-w-[160px] sm:max-w-[300px]">{store.address}</span>
                </div>
              )}
              
              {store?.deliveryEnabled && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <Truck className="w-3 h-3 shrink-0" />
                  <span>Reparto disponible</span>
                </div>
              )}

              {store?.takeawayEnabled && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3 py-1 text-[11px] font-bold text-[var(--color-primary)]/90 shadow-sm">
                  <ShoppingBag className="w-3 h-3 shrink-0" />
                  <span>Retiro en Local</span>
                </div>
              )}
            </div>

            <div className="pt-2 max-w-md w-full">
              <StoreSearchBar slug={slug} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Destacados</h2>
          <span className="text-sm font-medium text-muted-foreground">{featured.length} productos</span>
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

      {/* 📋 LISTADO COMPLETO POR CATEGORÍAS (SCROLLSPY) */}
      <div className="mx-auto max-w-4xl px-4 mt-8 space-y-12">
        {categories.map((category) => {
          const categoryProducts = productsByCategory[category.id] ?? [];
          if (categoryProducts.length === 0) return null;

          return (
            <section
              key={category.id}
              id={`category-${category.id}`}
              className="scroll-mt-[130px]" // Offset ajustado para no tapar los títulos
            >
              <div className="mb-4 flex items-center justify-between border-b pb-2">
                <h2 className="text-xl font-bold tracking-tight">{category.name}</h2>
                <span className="text-sm font-medium text-muted-foreground">
                  {categoryProducts.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} slug={slug} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
