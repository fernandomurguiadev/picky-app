# Design — app-fase-5-catalogo-tienda

## Estructura de archivos resultante

```
app/
├── src/
│   ├── app/
│   │   └── (store)/
│   │       └── [slug]/
│   │           ├── page.tsx                   ← RSC: home de tienda
│   │           ├── category/
│   │           │   └── [id]/
│   │           │       └── page.tsx           ← RSC: grilla de productos
│   │           └── search/
│   │               └── page.tsx               ← RSC: resultados de búsqueda
│   └── components/
│       └── store/
│           ├── category-nav/
│           │   └── index.tsx
│           ├── product-card/
│           │   └── index.tsx
│           ├── product-detail-sheet/
│           │   └── index.tsx                  ← vaul + Dialog según viewport
│           └── variant-selector/
│               └── index.tsx
```

---

## `app/(store)/[slug]/page.tsx` — Home RSC

```typescript
export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [categoriesRes, featuredRes] = await Promise.all([
    fetch(`${process.env.API_URL}/${slug}/categories`, { next: { revalidate: 60 } }),
    fetch(`${process.env.API_URL}/${slug}/products/featured`, { next: { revalidate: 30 } }),
  ]);

  const categories = await categoriesRes.json();
  const featured = await featuredRes.json();

  return (
    <>
      <CategoryNav categories={categories.data} slug={slug} />
      {featured.data.length > 0 && (
        <section>
          <h2>Destacados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.data.map((product: Product) => (
              <ProductCard key={product.id} product={product} slug={slug} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
```

---

## `ProductCard` — con next/image

```typescript
// components/store/product-card/index.tsx
'use client';

interface ProductCardProps {
  product: Product;
  slug: string;
}

export function ProductCard({ product, slug }: ProductCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="group flex flex-col rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative aspect-square bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col gap-1">
          <p className="font-medium text-sm line-clamp-2">{product.name}</p>
          <p className="text-primary font-bold">{formatPrice(product.price)}</p>
        </div>
      </button>
      <ProductDetailSheet product={product} open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
```

---

## `ProductDetailSheet` — vaul/Dialog según viewport

```typescript
// components/store/product-detail-sheet/index.tsx
'use client';

import { Drawer } from 'vaul';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const MOBILE_BREAKPOINT = 768;

export function ProductDetailSheet({ product, open, onClose }: ProductDetailSheetProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const content = <ProductDetailContent product={product} onClose={onClose} />;

  if (isMobile) {
    return (
      <Drawer.Root open={open} onClose={onClose}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-background max-h-[90vh] overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mt-3 mb-4" />
            {content}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">{content}</DialogContent>
    </Dialog>
  );
}
```

---

## `VariantSelector` — bloqueo por grupos requeridos

```typescript
// components/store/variant-selector/index.tsx
'use client';

interface VariantSelectorProps {
  groups: OptionGroup[];
  onChange: (selections: Record<string, string[]>) => void;
  onValidityChange: (isValid: boolean) => void;
}

export function VariantSelector({ groups, onChange, onValidityChange }: VariantSelectorProps) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const allRequiredSelected = groups
      .filter((g) => g.isRequired)
      .every((g) => selections[g.id]?.length > 0);
    onValidityChange(allRequiredSelected);
  }, [selections, groups, onValidityChange]);

  // Grupos radio (isRequired, maxSelections=1) o checkbox (múltiple)
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <VariantGroup
          key={group.id}
          group={group}
          selected={selections[group.id] ?? []}
          onChange={(itemIds) => setSelections((prev) => ({ ...prev, [group.id]: itemIds }))}
        />
      ))}
    </div>
  );
}
```
