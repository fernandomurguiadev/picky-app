# Design — app-fase-4-store-infra

## Estructura de archivos resultante

```
app/
├── src/
│   ├── app/
│   │   └── (store)/
│   │       └── [slug]/
│   │           ├── layout.tsx         ← RSC: fetch SSR + CSS vars inline
│   │           ├── not-found.tsx      ← 404 amigable
│   │           └── page.tsx           ← placeholder (se completa en FASE 5)
│   └── lib/
│       └── hooks/
│           └── use-store.ts           ← hooks para componentes client de la tienda
```

---

## `app/(store)/[slug]/layout.tsx` — SSR con CSS vars anti-FOUC

```typescript
import { notFound } from 'next/navigation';

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { slug } = await params;

  // Fetch en paralelo: datos de la tienda + estado abierto/cerrado
  const [storeRes, statusRes] = await Promise.all([
    fetch(`${process.env.API_URL}/stores/${slug}`, { next: { revalidate: 60 } }),
    fetch(`${process.env.API_URL}/stores/${slug}/status`, { next: { revalidate: 30 } }),
  ]);

  if (!storeRes.ok) notFound();

  const store = await storeRes.json();
  const { isOpen } = await statusRes.json();

  // CSS variables del tema inyectadas inline → sin FOUC
  const themeVars = `
    :root {
      --color-primary: ${store.data.theme?.primaryColor ?? '#f97316'};
      --color-primary-foreground: ${store.data.theme?.primaryForeground ?? '#ffffff'};
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeVars }} />
      <div className="min-h-screen flex flex-col">
        <StoreHeader store={store.data} isOpen={isOpen} />
        <main className="flex-1">{children}</main>
        <StoreFooter store={store.data} />
      </div>
    </>
  );
}
```

> **Nota:** `dangerouslySetInnerHTML` está permitido ÚNICAMENTE en este caso específico
> porque el contenido es generado por el servidor (variables CSS del tenant desde la BD),
> no proviene de input de usuario. La política general de prohibición aplica a contenido
> renderizado de fuentes externas o del usuario.

---

## Badge de estado abierto/cerrado

```typescript
// components/store/store-status-badge/index.tsx
interface StoreStatusBadgeProps {
  isOpen: boolean;
}

export function StoreStatusBadge({ isOpen }: StoreStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${isOpen
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-500'
        }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-400'}`} />
      {isOpen ? 'Abierto' : 'Cerrado'}
    </span>
  );
}
```

---

## `not-found.tsx`

```typescript
import Link from 'next/link';

export default function StoreNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500 text-center">
        No encontramos ninguna tienda en esta dirección.
      </p>
      <Link href="/" className="text-primary underline">
        Volver al inicio
      </Link>
    </div>
  );
}
```

---

## Notas sobre `revalidate`

| Endpoint | `revalidate` | Justificación |
|----------|-------------|---------------|
| `/stores/:slug` | 60s | Datos de tienda cambian poco |
| `/stores/:slug/status` | 30s | Estado abierto/cerrado es más dinámico |

Para cambios inmediatos (el admin cambia el horario), el tenant puede hacer un POST a
`/api/revalidate` en el futuro (mejora futura, no incluida en MVP).
