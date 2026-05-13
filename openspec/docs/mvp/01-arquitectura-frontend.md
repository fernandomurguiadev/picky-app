# Arquitectura Next.js 15 (App Router)

> Origen: Frontend · Capa de presentación y routing
> Referencia: `app/` del monorepo

---

## 2.1 Estructura de carpetas del proyecto

La estructura sigue el patrón de **Feature-Sliced Design adaptado a Next.js App Router**. Las rutas de la tienda pública y del admin son grupos de rutas separados. Los componentes compartidos viven en `/components/`. Los servicios de dominio en `/lib/`.

```
├── app/
│   ├── (store)/                        # Grupo de rutas: tienda pública
│   │   └── [slug]/
│   │       ├── layout.tsx              # ← Aplica tema del tenant (SSR anti-FOUC)
│   │       ├── page.tsx                # Home de la tienda
│   │       ├── category/[id]/
│   │       │   └── page.tsx
│   │       ├── product/[id]/
│   │       │   └── page.tsx
│   │       ├── cart/
│   │       │   └── page.tsx
│   │       ├── checkout/
│   │       │   └── page.tsx
│   │       └── order-confirmation/
│   │           └── page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx              # Layout del panel admin
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── orders/
│   │       │   ├── page.tsx            # Vista Kanban
│   │       │   └── list/page.tsx
│   │       ├── catalog/
│   │       │   ├── categories/page.tsx
│   │       │   └── products/
│   │       │       ├── page.tsx
│   │       │       ├── new/page.tsx
│   │       │       └── [id]/edit/page.tsx
│   │       └── settings/
│   │           ├── page.tsx
│   │           ├── info/page.tsx
│   │           ├── hours/page.tsx
│   │           ├── delivery/page.tsx
│   │           ├── payments/page.tsx
│   │           └── theme/page.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── layout.tsx                      # Root layout
│   └── globals.css                     # CSS variables globales
├── components/
│   ├── ui/                             # shadcn/ui components (auto-generados)
│   ├── shared/                         # Componentes custom reutilizables
│   │   ├── button/
│   │   ├── skeleton-loader/
│   │   ├── empty-state/
│   │   ├── image-uploader/
│   │   ├── quantity-selector/
│   │   ├── toast/
│   │   ├── confirm-modal/
│   │   ├── search-bar/
│   │   └── pagination/                 # ← AGREGADO (faltaba en v1)
│   ├── store/                          # Componentes específicos de tienda pública
│   │   ├── product-card/
│   │   ├── category-card/
│   │   ├── cart-drawer/
│   │   ├── product-detail-sheet/       # Usa vaul para drag gesture
│   │   └── variant-selector/
│   └── admin/                          # Componentes específicos del admin
│       ├── order-card/
│       ├── kanban-column/
│       └── metric-card/
├── lib/
│   ├── api/
│   │   ├── axios.ts                    # Instancia Axios con interceptors
│   │   ├── auth.api.ts
│   │   ├── catalog.api.ts
│   │   ├── orders.api.ts
│   │   └── store.api.ts
│   ├── stores/                         # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── cart.store.ts
│   │   └── ui.store.ts
│   ├── hooks/                          # Custom hooks reutilizables
│   │   ├── use-tenant-theme.ts
│   │   ├── use-websocket.ts
│   │   └── use-cart.ts
│   ├── utils/
│   │   ├── whatsapp.ts                 # Generador de mensaje WA
│   │   ├── format-currency.ts
│   │   ├── store-status.ts             # Cálculo abierto/cerrado
│   │   └── print-order.ts
│   └── validations/                    # Zod schemas
│       ├── product.schema.ts
│       ├── checkout.schema.ts
│       └── settings.schema.ts
├── middleware.ts                        # ← Resuelve slug → tenantId (ver 2.5)
├── public/
└── tailwind.config.ts
```

---

## 2.2 Patrones obligatorios Next.js 15

### 2.2.1 Server vs Client Components

Usar **React Server Components (RSC)** por defecto. Agregar `'use client'` solo cuando sea necesario.

```tsx
// ✅ Server Component — fetch de datos sin useEffect
// app/(store)/[slug]/page.tsx
import { getStoreBySlug, getFeaturedProducts } from '@/lib/api/store.api'

export default async function StorePage({ params }: { params: { slug: string } }) {
  const [store, featured] = await Promise.all([
    getStoreBySlug(params.slug),
    getFeaturedProducts(params.slug)
  ])
  
  return <StoreHomeClient store={store} initialFeatured={featured} />
}

// ✅ Client Component — solo para interactividad
'use client'
import { useCartStore } from '@/lib/stores/cart.store'

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore(s => s.addItem)
  return <button onClick={() => addItem(product)}>Agregar</button>
}
```

### 2.2.2 Reglas de uso de RSC

| Usar Server Component | Usar Client Component |
|----------------------|-----------------------|
| Fetch de datos iniciales | Interactividad (onClick, onChange) |
| Acceso a variables de entorno del servidor | Hooks de React (useState, useEffect) |
| Componentes sin estado | WebSocket / Socket.io |
| Mejora de SEO | Zustand stores |
| Layouts y páginas | Animaciones con framer-motion |

### 2.2.3 Data Fetching con TanStack Query

Para datos que cambian (pedidos, catálogo admin) usar TanStack Query en Client Components. Para datos estáticos de la tienda pública usar `fetch` de RSC con caché.

```tsx
// Client Component con TanStack Query
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function OrdersKanban() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll(),
    refetchInterval: false // WebSocket maneja las actualizaciones
  })

  const qc = useQueryClient()
  const updateStatus = useMutation({
    mutationFn: ordersApi.updateStatus,
    onMutate: async ({ orderId, status }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ['orders'] })
      const prev = qc.getQueryData(['orders'])
      qc.setQueryData(['orders'], (old: Order[]) =>
        old.map(o => o.id === orderId ? { ...o, status } : o)
      )
      return { prev }
    },
    onError: (_, __, ctx) => qc.setQueryData(['orders'], ctx?.prev)
  })
}
```

### 2.2.4 Caché de Server Components (tienda pública)

```tsx
// Caché de datos del tenant en la tienda pública
// lib/api/store.api.ts (server-side)
import { unstable_cache } from 'next/cache'

export const getStoreBySlug = unstable_cache(
  async (slug: string) => {
    const res = await fetch(`${process.env.API_URL}/stores/${slug}`)
    return res.json()
  },
  ['store-by-slug'],
  {
    revalidate: 300,  // revalidar cada 5 minutos
    tags: ['store']   // invalidar con revalidateTag('store') cuando admin actualiza
  }
)

export const getFeaturedProducts = unstable_cache(
  async (slug: string) => {
    const res = await fetch(`${process.env.API_URL}/${slug}/products/featured`)
    return res.json()
  },
  ['featured-products'],
  { revalidate: 60 }
)
```

### 2.2.5 Formularios con React Hook Form + Zod

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  price: z.number().positive('El precio debe ser mayor a 0'),
  categoryId: z.string().uuid('Seleccioná una categoría'),
  description: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

export function ProductForm() {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', price: 0 }
  })

  const onSubmit = async (data: ProductFormData) => {
    // ...
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
      )}
    </form>
  )
}
```

---

## 2.3 Sistema de diseño — Tailwind CSS v4 + shadcn/ui

### 2.3.1 CSS Variables globales (`globals.css`)

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  /* Colores primarios — sobreescritos por TenantThemeService en el layout */
  --color-primary:        210 100% 40%;   /* hsl para Tailwind v4 */
  --color-primary-dark:   210 100% 32%;
  --color-primary-light:  210 100% 86%;
  --color-accent:         33 100% 50%;

  /* Superficies */
  --background:           0 0% 100%;
  --surface-card:         210 40% 98%;
  --surface-input:        210 40% 96%;
  --border:               214 32% 91%;

  /* Texto */
  --foreground:           222 47% 11%;
  --text-secondary:       215 16% 47%;
  --text-disabled:        215 20% 65%;

  /* Bordes */
  --radius-sm:    0.375rem;
  --radius-md:    0.75rem;
  --radius-lg:    1rem;

  /* Transiciones */
  --transition-fast:   150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow:   400ms ease;
}
```

### 2.3.2 Breakpoints Tailwind (mobile-first obligatorio)

| Prefijo Tailwind | Valor | Descripción | Uso |
|-----------------|-------|-------------|-----|
| *(sin prefijo)* | 360px base | Móvil pequeño (base) | Diseño base. TODO funciona aquí primero |
| `sm:` | 480px | Móvil estándar | Ajustes menores de spacing |
| `md:` | 768px | Tablet / phablet | Layout de 2 columnas donde aplique |
| `lg:` | 1024px | Desktop pequeño | Sidebar visible, grid 3 columnas |
| `xl:` | 1280px | Desktop estándar | Máximo ancho de contenido: 1200px |

```tsx
// Ejemplo de uso mobile-first con Tailwind
<div className="
  grid grid-cols-2 gap-4
  md:grid-cols-3
  lg:grid-cols-4
">
  {products.map(p => <ProductCard key={p.id} product={p} />)}
</div>
```

---

## 2.4 WebSocket — Arquitectura correcta con Next.js

> ⚠️ **CRÍTICO:** Next.js App Router **NO soporta WebSocket en Route Handlers**. Los Route Handlers son funciones serverless que terminan al retornar la respuesta. **El cliente Next.js se conecta DIRECTAMENTE al servidor NestJS por Socket.io.**

```
Cliente Next.js (Browser)
        │
        │  socket.io-client  ←── Conexión directa al puerto NestJS (ej: :3001)
        │
NestJS WebSocket Gateway (:3001)
        │
        └── OrdersGateway (Socket.io rooms por tenantId)
```

```tsx
// lib/hooks/use-websocket.ts
'use client'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'

export function useOrdersWebSocket(tenantId: string) {
  const socketRef = useRef<Socket | null>(null)
  const qc = useQueryClient()

  useEffect(() => {
    // Conectar DIRECTO al servidor NestJS, no a Next.js
    const socket = io(process.env.NEXT_PUBLIC_NESTJS_WS_URL!, {
      auth: { token: getAccessToken() },
      reconnection: true,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      socket.emit('join-tenant', { tenantId })
    })

    socket.on('order:new', (order: Order) => {
      // Actualizar cache de TanStack Query
      qc.setQueryData(['orders'], (prev: Order[] = []) => [order, ...prev])
      // Disparar notificación sonora
      playNotificationSound()
    })

    socket.on('order:status-changed', ({ orderId, newStatus }) => {
      qc.setQueryData(['orders'], (prev: Order[] = []) =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      )
    })

    socketRef.current = socket
    return () => { socket.disconnect() }
  }, [tenantId])

  return socketRef
}
```

---

## 2.5 Middleware de resolución de tenant (NUEVO — gap crítico de v1)

El middleware resuelve el `slug` de la URL al `tenantId` antes de cualquier render. Esto es necesario para todas las rutas de la tienda pública.

```ts
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Solo aplica a rutas de tienda pública (/[slug]/...)
  const storeMatch = pathname.match(/^\/([^/]+)(\/.*)?$/)
  if (!storeMatch) return NextResponse.next()

  const slug = storeMatch[1]

  // Excluir rutas especiales
  const excluded = ['admin', 'auth', '_next', 'api', 'favicon.ico']
  if (excluded.includes(slug)) return NextResponse.next()

  // Resolver slug → tenantId (con caché en Edge)
  const res = await fetch(`${process.env.API_URL}/stores/${slug}/tenant-id`, {
    next: { revalidate: 300 }
  })

  if (!res.ok) {
    return NextResponse.redirect(new URL('/404', request.url))
  }

  const { tenantId } = await res.json()

  // Inyectar tenantId como header para que los Server Components lo lean
  const response = NextResponse.next()
  response.headers.set('x-tenant-id', tenantId)
  response.headers.set('x-tenant-slug', slug)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 2.6 Estrategia anti-FOUC para tema dinámico por tenant (NUEVO — gap crítico de v1)

El tema dinámico debe aplicarse en el **servidor** para evitar el flash de colores incorrectos (FOUC) al hidratar.

```tsx
// app/(store)/[slug]/layout.tsx
import { headers } from 'next/headers'
import { getStoreTheme } from '@/lib/api/store.api'

export default async function StoreLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const theme = await getStoreTheme(params.slug)

  // Inyectar CSS variables en el <head> desde el servidor
  // Esto evita FOUC: el CSS está disponible antes del primer paint
  const themeCSS = `
    :root {
      --color-primary: ${theme.primaryColor};
      --color-accent: ${theme.accentColor};
      --color-primary-dark: ${adjustBrightness(theme.primaryColor, -15)};
      --color-primary-light: ${adjustBrightness(theme.primaryColor, 40)};
    }
  `

  return (
    <html lang="es">
      <head>
        {/* CRÍTICO: style inline antes que cualquier otro CSS para evitar FOUC */}
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```
