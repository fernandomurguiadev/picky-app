import { CategoryNav } from "@/components/store/category-nav";
import { CategorySidebar } from "@/components/store/category-sidebar";
import { StoreProductList } from "@/components/store/store-product-list";
import type { Category, Product } from "@/lib/types/catalog";
import type { StorePublicData } from "@/lib/types/store";
import { MOBILE_COLS_TO_LAYOUT } from "@/lib/types/store";
import { MapPin, Truck, ShoppingBag } from "lucide-react";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;

  const [categoriesRes, featuredRes, storeRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}/categories`, {
      next: { revalidate: 15 },
    }),
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}/products/featured`, {
      next: { revalidate: 10 },
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
  const defaultLayout = MOBILE_COLS_TO_LAYOUT[(store?.theme?.mobileGridCols ?? 2) as 0 | 1 | 2];

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
      {/* Nav horizontal — solo mobile/tablet. `contents` hace el wrapper transparente al layout
          para que el sticky de CategoryNav siga usando el contenedor de página como bloque contenedor. */}
      <div className="contents lg:hidden">
        <CategoryNav categories={categories} />
      </div>

      {/* Wrapper general con max-w amplio en desktop */}
      <div className="mx-auto max-w-4xl lg:max-w-7xl px-4">
        <div className="flex gap-8 items-start">

          {/* ── SIDEBAR DESKTOP ── */}
          <aside className="hidden lg:block w-52 shrink-0 sticky top-14 self-start max-h-[calc(100vh-56px)] overflow-y-auto border-r border-border/40">
            <CategorySidebar categories={categories} slug={slug} />
          </aside>

          {/* ── CONTENIDO PRINCIPAL ── */}
          <div className="flex-1 min-w-0 space-y-8 py-6">

            {/* 🚀 HERO BANNER */}
            <section id="inicio" className="scroll-mt-[130px] lg:scroll-mt-[72px]">
              <div
                className="relative rounded-3xl border border-border/50 p-6 sm:p-8 overflow-hidden bg-card/40 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-all duration-500 group"
              >
                {/* Ambient Glows */}
                <div
                  className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 opacity-20 group-hover:scale-110 group-hover:opacity-25"
                  style={{ background: `var(--color-primary)` }}
                />
                <div
                  className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-[90px] pointer-events-none transition-all duration-1000 opacity-[0.06] group-hover:scale-105"
                  style={{ background: `var(--color-primary)` }}
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


                </div>
              </div>
            </section>

            <StoreProductList
              featured={featured}
              categories={categories}
              productsByCategory={productsByCategory}
              slug={slug}
              defaultLayout={defaultLayout}
            />

          </div>
        </div>
      </div>
    </div>
  );
}
