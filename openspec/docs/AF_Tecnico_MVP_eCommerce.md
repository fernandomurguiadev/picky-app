# ANÁLISIS FUNCIONAL & TÉCNICO MVP — Índice
## Plataforma E-Commerce de Proximidad
**Para desarrollo por agente IA · Next.js 15 · Mobile-First · Latam**

| Versión | Stack | Objetivo | Fecha |
|---------|-------|----------|-------|
| v2.0 | Next.js 15 + NestJS 10 | Demo-Ready MVP | May 2026 |

> Este archivo es el **índice** del AF Técnico del MVP. El contenido fue descompuesto en archivos separados por origen/dominio dentro de `openspec/docs/mvp/`.

---

## Archivos del AF Técnico

### 📌 Leer primero

| Archivo | Contenido |
|---------|-----------|
| [mvp/00-contexto-producto.md](./mvp/00-contexto-producto.md) | **Briefing del producto:** qué es, usuarios, problema, Pedix, modelo de negocio, flujos, decisiones de arquitectura y su por qué, anti-patterns, vocabulario, variables de entorno |

### Contexto y arquitectura técnica

| Archivo | Contenido |
|---------|-----------|
| [mvp/00-contexto-y-stack.md](./mvp/00-contexto-y-stack.md) | Objetivos del MVP, módulos incluidos/excluidos, stack tecnológico completo |
| [mvp/01-arquitectura-frontend.md](./mvp/01-arquitectura-frontend.md) | Estructura de carpetas Next.js, patrones RSC/Client, TanStack Query, Tailwind, WebSocket, Middleware, anti-FOUC |
| [mvp/03-backend-api.md](./mvp/03-backend-api.md) | Estructura NestJS, todos los endpoints REST, WebSocket Gateway, estrategia multi-tenant |

### Módulos funcionales

| Archivo | Módulo | Rutas |
|---------|--------|-------|
| [mvp/modulos/mod-01-catalogo.md](./mvp/modulos/mod-01-catalogo.md) | MOD-01 Catálogo | `/admin/catalog/**` |
| [mvp/modulos/mod-02-tienda-publica.md](./mvp/modulos/mod-02-tienda-publica.md) | MOD-02 Tienda Pública | `/[slug]/**` |
| [mvp/modulos/mod-03-pedidos.md](./mvp/modulos/mod-03-pedidos.md) | MOD-03 Pedidos | `/admin/orders/**` |
| [mvp/modulos/mod-04-configuracion.md](./mvp/modulos/mod-04-configuracion.md) | MOD-04 Configuración | `/admin/settings/**` |
| [mvp/modulos/mod-05-panel-admin.md](./mvp/modulos/mod-05-panel-admin.md) | MOD-05 Panel Admin | `/admin/dashboard` |
| [mvp/modulos/mod-06-autenticacion.md](./mvp/modulos/mod-06-autenticacion.md) | MOD-06 Auth | `/auth/**` |

### Diseño, calidad y entrega

| Archivo | Contenido |
|---------|-----------|
| [mvp/02-componentes-shared.md](./mvp/02-componentes-shared.md) | Todos los shared components, Pagination (nuevo), hooks y utils core |
| [mvp/04-ux-ui-diseno.md](./mvp/04-ux-ui-diseno.md) | Principios mobile-first, animaciones, tipografía Tailwind |
| [mvp/05-criterios-aceptacion.md](./mvp/05-criterios-aceptacion.md) | 18 criterios de aceptación + métricas de performance |
| [mvp/06-plan-implementacion.md](./mvp/06-plan-implementacion.md) | 25 tareas en 8 fases ordenadas por dependencias |
| [mvp/07-gaps-resueltos.md](./mvp/07-gaps-resueltos.md) | Tabla de gaps identificados en v1 y cómo fueron resueltos en v2 |

---

> ⚠️ **INSTRUCCIÓN PARA EL AGENTE DE DESARROLLO:**
> Este documento es el contrato técnico completo del MVP. Cada módulo, vista, componente y funcionalidad debe implementarse exactamente como se especifica. Las secciones de arquitectura técnica son de cumplimiento obligatorio. No omitir ningún criterio de aceptación. Mobile-first es un requerimiento no negociable.
> **IMPORTANTE:** Los WebSockets se conectan **directamente al servidor NestJS**, nunca a través de Next.js Route Handlers. Los Route Handlers de Next.js no soportan conexiones persistentes.

---

## SECCIÓN 1 — CONTEXTO, ALCANCE Y OBJETIVOS DEL MVP

### 1.1 Objetivos del MVP

| Objetivo | Descripción | Criterio de éxito |
|----------|-------------|-------------------|
| Demo funcional completa | Todo el flujo cliente-final y admin debe funcionar sin errores en una demo en vivo | Zero errores bloqueantes en demo de 20 minutos |
| Superar experiencia de Pedix | UX/UI notablemente superior en mobile, con animaciones, feedback visual y diseño premium | Evaluación subjetiva positiva vs Pedix en primera impresión |
| Arquitectura escalable | El código generado debe ser extensible para sumar módulos futuros sin refactoring mayor | Estructura de módulos Next.js independientes, servicios desacoplados |
| Mobile-first completo | Toda vista debe ser perfectamente usable en móvil 360px antes de adaptarse a desktop | Prueba en viewport 360×640 sin scroll horizontal ni elementos rotos |
| Panel administrador operativo | El administrador puede gestionar su tienda sin asistencia técnica | Onboarding completo sin documentación adicional |

### 1.2 Módulos incluidos en el MVP

✅ **Módulos MVP (incluidos):**
- MOD-01 Catálogo Digital
- MOD-02 Tienda Pública
- MOD-03 Gestión de Pedidos
- MOD-04 Configuración de Tienda
- MOD-05 Panel Administrador
- MOD-06 Autenticación y Seguridad

❌ **Módulos EXCLUIDOS del MVP:**
- Pagos online y pasarelas
- Facturación electrónica
- Integraciones logísticas externas
- CRM avanzado y fidelización
- Módulo de marketing / Meta Ads
- Multi-sucursal
- Analytics avanzado

### 1.3 Stack tecnológico definido

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| Frontend framework | Next.js (App Router) | 15.x | SSR nativo, RSC, optimización de imágenes, routing file-system |
| Lenguaje | TypeScript | 5.x | Tipado estricto en todo el stack |
| Estado global cliente | Zustand | ^5 | Liviano, sin boilerplate, compatible con RSC |
| Estado servidor (cache) | TanStack Query (React Query) | ^5 | Cache de server state, invalidación, optimistic updates |
| Estilos | Tailwind CSS v4 | ^4 | Utility-first, mobile-first nativo, purge automático |
| Componentes UI | shadcn/ui | latest | Componentes accesibles basados en Radix UI, 100% customizables |
| Bottom Sheet / Drawer móvil | vaul | ^1 | Librería oficial de drag gesture que shadcn Sheet usa internamente |
| Formularios | React Hook Form + Zod | ^7 / ^3 | Validaciones complejas, UX de errores inline, inferencia de tipos |
| HTTP Client | Axios + interceptors | ^1 | Manejo centralizado de auth headers, retry, error handling |
| Backend / API | Node.js + NestJS | ^10 | REST API. Módulos desacoplados. DTO + class-validator |
| Base de datos | PostgreSQL + TypeORM | PG 16 | Multi-tenant por tenant_id. Migraciones versionadas |
| Almacenamiento | Cloudinary o S3 compatible | — | Imágenes con transformación on-the-fly (resize, webp) |
| Autenticación | JWT + Refresh Tokens | — | Access token 15min, refresh 7d. Almacenamiento en httpOnly cookie |
| WebSocket | Socket.io (NestJS backend) + socket.io-client | ^4 | Pedidos en tiempo real. **Cliente conecta DIRECTO al NestJS, no pasa por Next.js** |
| Contenedores | Docker + docker-compose | — | Dev y producción unificados. Variables de entorno por stage |

---

## SECCIÓN 2 — ARQUITECTURA NEXT.JS 15 (APP ROUTER)

### 2.1 Estructura de carpetas del proyecto

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

### 2.2 Patrones obligatorios Next.js 15

#### 2.2.1 Server vs Client Components

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

#### 2.2.2 Reglas de uso de RSC

| Usar Server Component | Usar Client Component |
|----------------------|-----------------------|
| Fetch de datos iniciales | Interactividad (onClick, onChange) |
| Acceso a variables de entorno del servidor | Hooks de React (useState, useEffect) |
| Componentes sin estado | WebSocket / Socket.io |
| Mejora de SEO | Zustand stores |
| Layouts y páginas | Animaciones con framer-motion |

#### 2.2.3 Data Fetching con TanStack Query

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

#### 2.2.4 Caché de Server Components (tienda pública)

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

#### 2.2.5 Formularios con React Hook Form + Zod

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
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
      )}
    </form>
  )
}
```

### 2.3 Sistema de diseño — Tailwind CSS v4 + shadcn/ui

#### 2.3.1 CSS Variables globales (`globals.css`)

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

#### 2.3.2 Breakpoints Tailwind (mobile-first obligatorio)

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

### 2.4 WebSocket — Arquitectura correcta con Next.js

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

### 2.5 Middleware de resolución de tenant (NUEVO — gap crítico de v1)

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

### 2.6 Estrategia anti-FOUC para tema dinámico por tenant (NUEVO — gap crítico de v1)

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

---

## SECCIÓN 3 — MÓDULOS FUNCIONALES DEL MVP

### MOD-01 — GESTIÓN DEL CATÁLOGO

#### 3.1 Tabla de funcionalidades — MOD-01

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| C-001 | Listado de categorías | Vista grilla con cards. Drag & drop para reordenar con @dnd-kit/core. Indicador de cantidad de productos. | /admin/catalog/categories — CategoriesListPage | 🔴 |
| C-002 | Crear / editar categoría | Formulario RHF+Zod: nombre (req), imagen (upload con preview), estado activo/inactivo. Validación inline. | CategoryFormDialog (shadcn Dialog) | 🔴 |
| C-003 | Eliminar categoría | Confirmar con ConfirmModal. Bloquear si tiene productos activos. | ConfirmModal component | 🔴 |
| C-004 | Listado de productos | Tabla con filtro por categoría, estado y búsqueda. **Paginación server-side con PaginationComponent.** | /admin/catalog/products — ProductsListPage | 🔴 |
| C-005 | Crear / editar producto | Form multi-sección: info básica, imágenes (hasta 5, upload múltiple, reordenable), precio, variantes, estado. **Autoguardado en localStorage cada 30s.** | /admin/catalog/products/new — ProductFormPage | 🔴 |
| C-006 | Variantes y opciones | Grupos de opciones en el form del producto: tipo radio/checkbox, items con nombre y precio adicional. Add/remove dinámico con useFieldArray (RHF). | OptionGroupEditor (embebido en ProductForm) | 🔴 |
| C-007 | Activar / desactivar producto | Toggle rápido en la lista sin abrir el form. Optimistic update. | ProductsListPage — inline toggle | 🔴 |
| C-008 | Upload de imágenes | Drag & drop o click. Preview inmediato. Compresión client-side con browser-image-compression antes de enviar. Progress indicator. | ImageUploaderComponent (shared) | 🔴 |
| C-009 | Buscador de productos (admin) | Input con debounce 300ms via useDebounce hook. Búsqueda por nombre contra API. | SearchBarComponent | 🔴 |
| C-010 | Productos destacados | Checkbox 'Destacado' en el form. Sección en home de la tienda con productos marcados. | ProductFormPage — campo isFeatured | 🟡 |

#### 3.2 Interfaces TypeScript — MOD-01

```typescript
// lib/types/catalog.types.ts

export interface Category {
  id: string
  tenantId: string
  name: string
  imageUrl: string
  order: number
  isActive: boolean
  productCount?: number
  createdAt: string
  updatedAt: string
}

export interface OptionItem {
  id: string
  name: string
  priceModifier: number   // 0 si no tiene precio adicional
  isDefault: boolean
}

export interface OptionGroup {
  id: string
  name: string                 // ej: 'Tamaño', 'Extras', 'Cocción'
  type: 'radio' | 'checkbox'  // radio = selección única, checkbox = múltiple
  isRequired: boolean
  minSelections: number        // para checkbox: mínimo a seleccionar
  maxSelections: number        // para checkbox: máximo
  items: OptionItem[]
}

export interface Product {
  id: string
  tenantId: string
  categoryId: string
  name: string
  description: string
  price: number
  images: ProductImage[]
  optionGroups: OptionGroup[]
  isActive: boolean
  isFeatured: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: string
  url: string
  order: number
  isMain: boolean
}
```

#### 3.3 Especificación del ProductFormPage (EXPANDIDA — era gap crítico de v1)

El formulario de producto es el componente más complejo de todo el sistema. Se le dedica especificación propia.

**Estructura del formulario (5 secciones colapsables en móvil, todas visibles en desktop):**

```tsx
// Sección 1: Información básica
// Campos: name (req, min 2), description (textarea, max 500), categoryId (req, Select)

// Sección 2: Imágenes
// - ImageUploader múltiple, hasta 5 imágenes
// - Lista reordenable con @dnd-kit/sortable
// - Primera imagen = principal (badge visual)
// - Preview inmediato con URL.createObjectURL

// Sección 3: Precio
// - price: input numérico con formateo de moneda en blur
// - Mínimo: 0, no negativo

// Sección 4: Variantes (OptionGroupEditor)
// - useFieldArray para grupos dinámicos
// - Dentro de cada grupo: otro useFieldArray para items
// - Tipo radio/checkbox como Switch
// - isRequired toggle
// - minSelections/maxSelections solo visible cuando type === 'checkbox'
// - Validar: minSelections <= maxSelections <= items.length

// Sección 5: Configuración
// - isActive: Switch (default: true)
// - isFeatured: Switch (default: false)
```

**Autoguardado en localStorage:**

```tsx
// components/admin/product-form/use-product-autosave.ts
'use client'
import { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'

const DRAFT_KEY = (id?: string) => `product_draft_${id ?? 'new'}`

export function useProductAutosave(form: UseFormReturn<ProductFormData>, productId?: string) {
  // Cargar borrador al montar
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY(productId))
    if (draft) {
      const parsed = JSON.parse(draft)
      form.reset(parsed)
    }
  }, [])

  // Guardar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const values = form.getValues()
      localStorage.setItem(DRAFT_KEY(productId), JSON.stringify(values))
    }, 30_000)
    return () => clearInterval(interval)
  }, [form, productId])

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY(productId))
  return { clearDraft }
}
```

**Sticky footer con botones Guardar/Cancelar en móvil:**

```tsx
<div className="
  sticky bottom-0 left-0 right-0
  bg-white border-t border-border
  px-4 py-3 flex gap-3
  md:static md:border-0 md:px-0 md:pt-6
">
  <Button variant="outline" onClick={handleCancel} className="flex-1 md:flex-none">
    Cancelar
  </Button>
  <Button type="submit" loading={isSubmitting} className="flex-1 md:flex-none">
    Guardar producto
  </Button>
</div>
```

---

### MOD-02 — TIENDA PÚBLICA

#### 3.4 Tabla de funcionalidades — MOD-02

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| T-001 | Home de la tienda | Header con logo, nombre del comercio y estado abierto/cerrado. Grilla de categorías. Sección de productos destacados. Banner de anuncios deslizable. | /[slug] — StoreHomePage (RSC) | 🔴 |
| T-002 | Indicador abierto/cerrado | Badge dinámico calculado en servidor con los horarios del tenant. Si cerrado: muestra próxima apertura. | StoreStatusBadge (Server Component) | 🔴 |
| T-003 | Listado de categoría | Lista de productos de la categoría. Barra de búsqueda. | /[slug]/category/[id] — CategoryPage (RSC) | 🔴 |
| T-004 | Card de producto | Imagen principal, nombre, precio, badge 'Agotado'. Botón + para agregar rápido. | ProductCard (Client Component) | 🔴 |
| T-005 | Detalle de producto | **vaul Drawer** en móvil (drag gesture nativo), Dialog en desktop. Carrusel de imágenes, variantes, notas, cantidad. | ProductDetailSheet / ProductDetailDialog | 🔴 |
| T-006 | Selector de variantes | Chips para radio, checkboxes para múltiple. Precio adicional visible. Validación de grupos requeridos. | VariantSelector (Client Component) | 🔴 |
| T-007 | Carrito persistente | Drawer lateral (desktop) o Sheet (móvil). Items, variantes, cantidades, totales. Persiste en Zustand con localStorage middleware. | CartDrawer (Client Component) | 🔴 |
| T-008 | Badge de carrito | Burbuja con cantidad de items. Animación bump al agregar (CSS keyframes). | CartBadge (Client Component) | 🔴 |
| T-009 | Checkout — Datos cliente | Form RHF+Zod: nombre, teléfono, dirección condicional. | /[slug]/checkout — StepCustomerForm | 🔴 |
| T-010 | Checkout — Entrega y pago | Selección de entrega y método de pago. Validación de monto mínimo. | /[slug]/checkout — StepDelivery | 🔴 |
| T-011 | Dispatch por WhatsApp | Generar mensaje estructurado y abrir wa.me con el número del comercio. Resumen previo al envío. | whatsapp.util.ts + ConfirmStep | 🔴 |
| T-012 | Pantalla confirmación de pedido | Número de orden, resumen, instrucciones. Animación de checkmark SVG + confetti. | /[slug]/order-confirmation — OrderConfirmationPage | 🔴 |
| T-013 | Búsqueda en tienda | Barra de búsqueda global. Resultados en tiempo real. | StoreSearchSheet (Client Component) | 🟡 |
| T-014 | Animaciones y micro-interacciones | Transición entre páginas, skeleton loading, bounce al agregar, toast. | CSS animations + Framer Motion (solo Page Transitions) | 🟡 |
| T-015 | Información y ubicación | Horarios, dirección con mapa, redes sociales. | /[slug]/info — StoreInfoPage | 🟡 |
| T-016 | Tema dinámico por tenant | CSS variables aplicadas en el servidor (layout.tsx). **Sin FOUC.** Ver sección 2.6. | app/(store)/[slug]/layout.tsx | 🔴 |

#### 3.5 Bottom Sheet con vaul (NUEVO — gap crítico de v1)

No usar shadcn `Sheet` para el detalle de producto en móvil porque no tiene drag gesture nativo. Usar `vaul` directamente.

```tsx
// components/store/product-detail-sheet/product-detail-sheet.tsx
'use client'
import { Drawer } from 'vaul'

interface ProductDetailSheetProps {
  product: Product
  open: boolean
  onClose: () => void
}

export function ProductDetailSheet({ product, open, onClose }: ProductDetailSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="
          fixed bottom-0 left-0 right-0 z-50
          bg-white rounded-t-2xl
          max-h-[95dvh] flex flex-col
          md:hidden
        ">
          {/* Handle de drag */}
          <div className="mx-auto mt-3 mb-4 h-1.5 w-12 rounded-full bg-gray-200 shrink-0" />
          
          {/* Contenido scrolleable */}
          <div className="overflow-y-auto flex-1 px-4 pb-safe">
            <ProductDetailContent product={product} onAddToCart={onClose} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

// En desktop: usar Dialog de shadcn/ui
export function ProductDetailDialog({ product, open, onClose }: ProductDetailSheetProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl hidden md:flex">
        <ProductDetailContent product={product} onAddToCart={onClose} />
      </DialogContent>
    </Dialog>
  )
}
```

#### 3.6 Carrito con Zustand + persistencia en localStorage

```typescript
// lib/stores/cart.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, options: SelectedOption[], qty: number) => void
  removeItem: (itemId: string) => void
  updateQty: (itemId: string, qty: number) => void
  clear: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, options, qty) =>
        set(s => ({
          items: [...s.items, {
            id: crypto.randomUUID(),
            product,
            options,
            qty
          }]
        })),
      removeItem: (id) =>
        set(s => ({ items: s.items.filter(i => i.id !== id) })),
      updateQty: (id, qty) =>
        set(s => ({
          items: s.items.map(i => i.id === id ? { ...i, qty } : i)
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => {
        const optionsTotal = i.options.flatMap(o => o.items).reduce(
          (s, opt) => s + opt.priceModifier, 0
        )
        return sum + (i.product.price + optionsTotal) * i.qty
      }, 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: 'cart-storage',
      // Limpiar carrito si es de otro tenant
      onRehydrateStorage: () => (state) => {
        const currentSlug = window.location.pathname.split('/')[1]
        if (state?.tenantSlug && state.tenantSlug !== currentSlug) {
          state.clear()
        }
      }
    }
  )
)
```

#### 3.7 Formato del mensaje WhatsApp

```typescript
// lib/utils/whatsapp.ts
export function buildWhatsAppMessage(order: OrderDraft, store: Store): string {
  const items = order.items.map(item => {
    const options = item.options.flatMap(g =>
      g.items.map(o => `  ↳ ${g.groupName}: ${o.itemName}${o.priceModifier > 0 ? ` (+${formatCurrency(o.priceModifier)})` : ''}`)
    ).join('\n')
    return `• ${item.productName} x${item.quantity} — ${formatCurrency(item.subtotal)}${options ? '\n' + options : ''}${item.note ? `\n  📝 ${item.note}` : ''}`
  }).join('\n')

  return `🛒 *NUEVO PEDIDO* #${order.orderNumber}
──────────────────────
👤 *Cliente:* ${order.customer.name}
📱 *Teléfono:* ${order.customer.phone}
📍 *Entrega:* ${DELIVERY_LABELS[order.deliveryMethod]}${order.customer.address ? `\n    ${formatAddress(order.customer.address)}` : ''}

🛍️ *ITEMS:*
${items}

──────────────────────
💰 *Subtotal:* ${formatCurrency(order.subtotal)}
🚚 *Envío:* ${order.deliveryCost > 0 ? formatCurrency(order.deliveryCost) : 'Gratis'}
💵 *TOTAL: ${formatCurrency(order.total)}*
──────────────────────
💳 *Pago:* ${PAYMENT_LABELS[order.paymentMethod]}${order.notes ? `\n📝 *Notas:* ${order.notes}` : ''}
──────────────────────
⏰ Pedido realizado: ${formatDateTime(new Date())}`
}

export function openWhatsApp(phone: string, message: string): void {
  const encoded = encodeURIComponent(message)
  window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encoded}`, '_blank')
}
```

---

### MOD-03 — GESTIÓN DE PEDIDOS EN TIEMPO REAL

#### 3.8 Tabla de funcionalidades — MOD-03

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| P-001 | Centro de pedidos — Vista Kanban | Columnas por estado. Cards arrastrables con @dnd-kit. Auto-actualización por WebSocket directo a NestJS. | /admin/orders — OrdersKanbanPage | 🔴 |
| P-002 | Vista lista de pedidos | Tabla con filtros por fecha, estado, forma de entrega. Paginación. | /admin/orders/list — OrdersListPage | 🟡 |
| P-003 | Detalle de pedido | Dialog con detalle completo: items, cliente, entrega, pago, historial de estados. | OrderDetailDialog | 🔴 |
| P-004 | Cambio de estado manual | Botones de acción para mover al siguiente estado. Optimistic update con TanStack Query. | OrderStatusActions | 🔴 |
| P-005 | Notificación sonora y visual | Sonido configurable + toast de alta prominencia + document.title parpadeo. **Solo funciona si el usuario ya interactuó con la página (limitación de navegadores móviles).** | useOrderNotification hook | 🔴 |
| P-006 | Pedido manual (admin) | Formulario para crear pedido desde el panel. | CreateOrderDialog | 🟡 |
| P-007 | Imprimir pedido | Vista de impresión optimizada para carta y ticket 80mm. | print-order.util.ts | 🟡 |
| P-008 | Notas internas | Campo de nota privada en el detalle del pedido. | OrderDetailDialog — notes field | 🟡 |

#### 3.9 Modelo de datos — Pedido

```typescript
// lib/types/order.types.ts

export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'on_way' | 'delivered' | 'cancelled'
export type DeliveryMethod = 'delivery' | 'takeaway' | 'in_store'
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'other'

export interface OrderItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  selectedOptions: SelectedOption[]
  itemNote?: string
  subtotal: number
}

export interface SelectedOption {
  groupId: string
  groupName: string
  items: { itemId: string; itemName: string; priceModifier: number }[]
}

export interface CustomerInfo {
  name: string
  phone: string
  email?: string
  address?: DeliveryAddress
}

export interface DeliveryAddress {
  street: string
  number: string
  apartment?: string
  city: string
  references?: string
}

export interface Order {
  id: string
  orderNumber: string        // ORD-YYYYMMDD-XXX legible
  tenantId: string
  status: OrderStatus
  items: OrderItem[]
  customer: CustomerInfo
  deliveryMethod: DeliveryMethod
  deliveryCost: number
  paymentMethod: PaymentMethod
  subtotal: number
  total: number
  notes?: string
  internalNotes?: string
  statusHistory: StatusChange[]
  createdAt: string
  updatedAt: string
}

export interface StatusChange {
  status: OrderStatus
  changedAt: string
  changedBy: string
}
```

#### 3.10 Kanban en móvil — Manejo de estado con WebSocket en background (NUEVO — gap de v1)

En móvil el Kanban usa pestañas horizontales. El estado de los pedidos debe actualizarse en background incluso cuando la pestaña activa no es "Nuevo".

```tsx
// components/admin/orders-kanban/orders-kanban.tsx
'use client'
import { useState } from 'react'
import { useOrdersWebSocket } from '@/lib/hooks/use-websocket'
import { useQuery } from '@tanstack/react-query'

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: 'new',       label: 'Nuevos' },
  { status: 'confirmed', label: 'Confirmados' },
  { status: 'preparing', label: 'En preparación' },
  { status: 'on_way',    label: 'En camino' },
  { status: 'delivered', label: 'Entregados' },
]

export function OrdersKanban({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTab] = useState<OrderStatus>('new')
  
  // TanStack Query mantiene el estado global de pedidos
  // WebSocket actualiza este estado en background sin importar qué tab está visible
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll
  })

  // WebSocket actualiza la query cache directamente
  useOrdersWebSocket(tenantId)

  // Agrupar pedidos por columna
  const ordersByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = orders.filter(o => o.status === col.status)
    return acc
  }, {} as Record<OrderStatus, Order[]>)

  return (
    <div>
      {/* Tabs de columnas en móvil */}
      <div className="flex overflow-x-auto gap-2 pb-2 md:hidden">
        {COLUMNS.map(col => (
          <button
            key={col.status}
            onClick={() => setActiveTab(col.status)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium",
              activeTab === col.status
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600"
            )}
          >
            {col.label}
            {ordersByStatus[col.status].length > 0 && (
              <span className="ml-1.5 bg-white/30 rounded-full px-1.5">
                {ordersByStatus[col.status].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Vista móvil: solo la columna activa */}
      <div className="md:hidden">
        <KanbanColumn
          status={activeTab}
          orders={ordersByStatus[activeTab]}
        />
      </div>

      {/* Vista desktop: todas las columnas */}
      <div className="hidden md:flex gap-4 overflow-x-auto">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            orders={ordersByStatus[col.status]}
          />
        ))}
      </div>
    </div>
  )
}
```

#### 3.11 Notificación sonora — Limitación de navegadores móviles (NUEVO — gap de v1)

Los navegadores móviles bloquean audio sin interacción previa del usuario. Documentar este comportamiento explícitamente y manejar el fallback.

```tsx
// lib/hooks/use-order-notification.ts
'use client'
import { useRef, useCallback } from 'react'

export function useOrderNotification() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasInteracted = useRef(false)

  // Registrar interacción del usuario para desbloquear audio
  const registerInteraction = useCallback(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = true
      // Pre-cargar el audio después de la primera interacción
      audioRef.current = new Audio('/sounds/new-order.mp3')
      audioRef.current.load()
    }
  }, [])

  const notify = useCallback(() => {
    // Notificación visual siempre funciona
    document.title = '🔔 NUEVO PEDIDO!'
    setTimeout(() => { document.title = 'Panel Admin' }, 5000)

    // Audio solo si el usuario ya interactuó
    if (hasInteracted.current && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Silenciar el error — el navegador bloqueó el audio
        console.warn('Audio bloqueado por el navegador. Requiere interacción del usuario.')
      })
    }
  }, [])

  return { notify, registerInteraction }
}
```

---

### MOD-04 — CONFIGURACIÓN DE LA TIENDA

#### 3.12 Tabla de funcionalidades — MOD-04

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| S-001 | Información básica del negocio | Formulario RHF+Zod: nombre, descripción, logo, WhatsApp, teléfono, email, dirección. | /admin/settings/info | 🔴 |
| S-002 | Redes sociales | Links a Instagram, Facebook, TikTok. Validación de URL con Zod. | /admin/settings/info | 🟡 |
| S-003 | Horarios de atención | Configuración por día. Activo/inactivo. **2 turnos por día** (ver schema completo abajo). | /admin/settings/hours — HoursEditor | 🔴 |
| S-004 | Formas de entrega | Activar/desactivar: Delivery, Take Away, Consumir en el local. Configurar descripción, tiempo estimado, costo. | /admin/settings/delivery | 🔴 |
| S-005 | Métodos de pago | Activar/desactivar: Efectivo, Transferencia (CBU/alias), Otro. Recargo/descuento porcentual. | /admin/settings/payments | 🔴 |
| S-006 | Monto mínimo de pedido | Input numérico de monto mínimo. Por forma de entrega. | /admin/settings/delivery | 🔴 |
| S-007 | Tema visual | Color picker primario y acento. Preview en tiempo real. Aplica como CSS variables via TenantThemeService. | /admin/settings/theme — ThemeEditor | 🔴 |
| S-008 | Anuncios en tienda | CRUD de banners con texto y fondo configurable. | /admin/settings/announcements | 🟡 |
| S-009 | URL de la tienda | Mostrar URL pública. Copiar al portapapeles. Generar QR (PNG con qrcode npm package). | /admin/settings/store | 🟡 |
| S-010 | Vista previa de tienda | Botón 'Ver mi tienda' abre la URL pública en nueva pestaña. | Topbar del admin | 🟡 |

#### 3.13 Schema de horarios — DaySchedule (NUEVO — gap crítico de v1)

Este schema no estaba definido en v1. El agente debe usarlo exactamente.

```typescript
// lib/types/settings.types.ts

export interface Shift {
  open: string   // formato "HH:mm" — ej: "09:00"
  close: string  // formato "HH:mm" — ej: "13:00"
}

export interface DaySchedule {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Domingo, 1 = Lunes, ... 6 = Sábado
  isOpen: boolean
  shifts: Shift[]  // Máximo 2 turnos por día. Array vacío si isOpen = false.
}

export interface StoreHours {
  schedule: DaySchedule[]  // Siempre 7 elementos, uno por día
  timezone: string          // ej: "America/Argentina/Buenos_Aires"
}

// Ejemplo de datos para un comercio con horarios partido:
const exampleSchedule: StoreHours = {
  timezone: "America/Argentina/Buenos_Aires",
  schedule: [
    { dayOfWeek: 0, isOpen: false, shifts: [] },                                          // Domingo: cerrado
    { dayOfWeek: 1, isOpen: true,  shifts: [{ open: "09:00", close: "13:00" }, { open: "17:00", close: "21:00" }] }, // Lunes: partido
    { dayOfWeek: 2, isOpen: true,  shifts: [{ open: "09:00", close: "21:00" }] },         // Martes: corrido
    // ...etc
  ]
}
```

**Lógica de cálculo de estado abierto/cerrado:**

```typescript
// lib/utils/store-status.ts
import { toZonedTime } from 'date-fns-tz'
import { format, isAfter, isBefore, parse } from 'date-fns'

export function isStoreOpen(hours: StoreHours, now = new Date()): boolean {
  const zonedNow = toZonedTime(now, hours.timezone)
  const dayOfWeek = zonedNow.getDay()
  const currentTime = format(zonedNow, 'HH:mm')

  const today = hours.schedule.find(d => d.dayOfWeek === dayOfWeek)
  if (!today?.isOpen || today.shifts.length === 0) return false

  return today.shifts.some(shift => {
    return currentTime >= shift.open && currentTime <= shift.close
  })
}

export function getNextOpenTime(hours: StoreHours, now = new Date()): string | null {
  // Buscar el próximo turno de apertura en los próximos 7 días
  // Retorna string legible: "Hoy a las 17:00" / "Mañana a las 9:00" / "El lunes a las 9:00"
  // ... implementación
}
```

#### 3.14 Manejo de sesión expirada durante operación (NUEVO — gap de v1)

Cuando el refresh token expira (7 días), el usuario puede estar editando un producto. Antes de redirigir al login, guardar el estado en localStorage.

```typescript
// lib/api/axios.ts
import axios from 'axios'
import { useAuthStore } from '@/lib/stores/auth.store'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true  // necesario para httpOnly cookie del refresh token
})

api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // Intentar renovar con refresh token (httpOnly cookie se envía automáticamente)
        const { data } = await axios.post('/auth/refresh', {}, { withCredentials: true })
        useAuthStore.getState().setAccessToken(data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch {
        // Refresh token expirado: guardar estado antes de redirigir
        const currentPath = window.location.pathname
        
        // Disparar evento para que los formularios guarden su estado
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
        
        // Guardar URL de retorno
        sessionStorage.setItem('auth:return-url', currentPath)
        
        useAuthStore.getState().clearAuth()
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// En ProductFormPage: escuchar el evento y guardar el borrador inmediatamente
useEffect(() => {
  const handler = () => {
    const values = form.getValues()
    localStorage.setItem(DRAFT_KEY(productId), JSON.stringify(values))
  }
  window.addEventListener('auth:session-expired', handler)
  return () => window.removeEventListener('auth:session-expired', handler)
}, [])
```

---

### MOD-05 — PANEL ADMINISTRADOR

#### 3.15 Tabla de funcionalidades — MOD-05

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| A-001 | Layout responsivo del admin | Móvil: bottom navigation bar con 4 tabs. Desktop: sidebar colapsable + topbar. | AdminLayout (app/(admin)/admin/layout.tsx) | 🔴 |
| A-002 | Dashboard principal | Métricas del día. Gráfico de barras de pedidos por hora. Últimos 5 pedidos. Toggle abierto/cerrado. **Versión simplificada en móvil.** | /admin/dashboard — DashboardPage | 🔴 |
| A-003 | Topbar del admin | Logo del comercio, nombre, 'Ver tienda', notificaciones, menú de usuario. | AdminTopbar | 🔴 |
| A-004 | Estadísticas básicas | Ventas del día/semana/mes. Top 5 productos. Comparativa vs período anterior. | /admin/analytics | 🟡 |
| A-005 | Onboarding wizard | Wizard de 5 pasos para nuevos comercios con barra de progreso. Completar luego. | OnboardingWizard | 🟡 |
| A-006 | Notificaciones in-app | Centro de notificaciones para eventos importantes. | NotificationCenter | 🟡 |

#### 3.16 Dashboard en móvil — Versión simplificada (NUEVO — gap de v1)

El gráfico de barras de pedidos por hora es ilegible en 360px. El dashboard debe tener dos layouts.

```tsx
// components/admin/dashboard/dashboard-layout.tsx
'use client'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

export function DashboardPage() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div>
      {/* Métricas: iguales en móvil y desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Pedidos hoy" value={metrics.ordersToday} delta={metrics.deltaOrders} />
        <MetricCard label="Facturación" value={formatCurrency(metrics.revenueToday)} />
        <MetricCard label="Ticket promedio" value={formatCurrency(metrics.avgTicket)} />
        <MetricCard label="Pendientes" value={metrics.pendingOrders} alert={metrics.pendingOrders > 0} />
      </div>

      {/* Toggle abierto/cerrado */}
      <StoreStatusToggle />

      {/* Gráfico: solo en desktop */}
      {!isMobile && (
        <div className="bg-white rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Pedidos por hora (últimas 12hs)</h3>
          <HourlyOrdersChart data={metrics.hourlyData} />
        </div>
      )}

      {/* En móvil: resumen de texto en lugar del gráfico */}
      {isMobile && (
        <div className="bg-white rounded-xl p-4 mb-6 text-sm text-gray-600">
          <p>Hora pico hoy: <strong>{metrics.peakHour}hs</strong> con {metrics.peakOrders} pedidos</p>
        </div>
      )}

      {/* Pedidos activos */}
      <RecentOrdersList orders={recentOrders} />
    </div>
  )
}
```

---

### MOD-06 — AUTENTICACIÓN Y SEGURIDAD

#### 3.17 Tabla de funcionalidades — MOD-06

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| AU-001 | Registro de comerciante | Formulario RHF+Zod: email, contraseña (min 8, indicador de fortaleza), nombre del negocio, teléfono. | /auth/register | 🔴 |
| AU-002 | Login | Email + contraseña. Remember me. Errores inline. Redirect a /admin/dashboard. | /auth/login | 🔴 |
| AU-003 | Middleware de protección | Next.js middleware protege todas las rutas /admin. Redirect a /auth/login si no autenticado. Guarda URL de retorno. | middleware.ts | 🔴 |
| AU-004 | JWT + Refresh Token | Access token 15min en memory (Zustand), refresh token 7d en httpOnly cookie. Interceptor Axios para renovar. | axios.ts interceptor | 🔴 |
| AU-005 | Logout | Limpiar tokens, estado Zustand y redirigir. Invalidar refresh en el servidor. | auth.store.ts | 🔴 |
| AU-006 | Recuperar contraseña | Form de email para solicitar reset. Página de nueva contraseña desde link de email. | /auth/forgot-password, /auth/reset-password | 🟡 |

**Middleware de protección de rutas admin (Next.js):**

```typescript
// middleware.ts (agregar a la lógica del tenant resolver)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Proteger rutas admin
  if (pathname.startsWith('/admin')) {
    const accessToken = request.cookies.get('access-token')?.value
      || request.headers.get('authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verificación ligera del JWT (sin llamar al backend)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      if (payload.exp * 1000 < Date.now()) {
        // Token expirado — intentar refresh lo maneja el cliente via Axios interceptor
        // En middleware solo redirigimos si no hay token en absoluto
      }
    } catch {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ... lógica de tenant resolver
}
```

---

## SECCIÓN 4 — COMPONENTES COMPARTIDOS (SHARED)

### 4.1 Componentes shared obligatorios

Todos los componentes shared deben usar Tailwind CSS, ser completamente accesibles (ARIA), y no depender de ningún dominio de negocio.

| Componente | Archivo | Props clave | Descripción |
|-----------|---------|-------------|-------------|
| Button | `components/shared/button.tsx` | `variant`, `size`, `loading`, `disabled`, `icon` | Basado en shadcn Button. Maneja estado loading con spinner inline. |
| SkeletonLoader | `components/shared/skeleton-loader.tsx` | `type` (text/card/list/grid), `count` | Placeholder shimmer. Usar SIEMPRE en lugar de spinner global. |
| EmptyState | `components/shared/empty-state.tsx` | `icon`, `title`, `message`, `actionLabel` | Estado vacío con SVG, título, mensaje y CTA opcional. |
| Toast | `components/shared/toast-provider.tsx` | Usar `sonner` (shadcn toast) | Notificaciones temporales. Top-center en móvil, bottom-right en desktop. |
| ImageUploader | `components/shared/image-uploader.tsx` | `maxFiles`, `maxSizeMb`, `accept` | Drag & drop + click. Preview. Compresión con browser-image-compression. |
| QuantitySelector | `components/shared/quantity-selector.tsx` | `value`, `min`, `max`, `onChange` | Selector +/- con input numérico. Animación bounce. |
| ConfirmModal | `components/shared/confirm-modal.tsx` | `title`, `message`, `confirmLabel`, `confirmColor` | Modal de confirmación destructiva. Botón confirm deshabilitado 1s. |
| SearchBar | `components/shared/search-bar.tsx` | `placeholder`, `debounceMs`, `onSearch` | Input con lupa, botón clear, debounce configurable. |
| **Pagination** | **`components/shared/pagination.tsx`** | **`page`, `totalPages`, `onChange`** | **NUEVO — faltaba en v1. Paginación server-side reutilizable para todas las listas.** |
| Badge | `components/shared/badge.tsx` | `label`, `variant` (success/warning/error/info) | Chips/etiquetas de estado. Colores semánticos. |
| BottomSheet | Usar `vaul` directamente | — | No crear wrapper custom. Usar vaul `<Drawer.Root>` (ver sección 3.5). |

### 4.2 Componente Pagination (NUEVO — faltaba en v1)

```tsx
// components/shared/pagination.tsx
'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = generatePageNumbers(page, totalPages)

  return (
    <nav className={cn("flex items-center justify-center gap-1", className)} aria-label="Paginación">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === '...'
          ? <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
          : <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                "min-w-[36px] h-9 px-3 rounded-md text-sm font-medium",
                p === page
                  ? "bg-primary text-white"
                  : "hover:bg-gray-100 text-gray-700"
              )}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Página siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}
```

### 4.3 Servicios y hooks core obligatorios

| Servicio / Hook | Archivo | Responsabilidad |
|----------------|---------|-----------------|
| `useCart` | `lib/hooks/use-cart.ts` | Wrapper de useCartStore con helpers de negocio |
| `useTenantTheme` | `lib/hooks/use-tenant-theme.ts` | Actualizar CSS variables desde el cliente (admin preview) |
| `useOrdersWebSocket` | `lib/hooks/use-websocket.ts` | Conexión Socket.io directo a NestJS. Reconexión automática. |
| `useOrderNotification` | `lib/hooks/use-order-notification.ts` | Sonido + visual. Con fallback si audio bloqueado. |
| `useMediaQuery` | `lib/hooks/use-media-query.ts` | Detección de breakpoints para lógica condicional en Client Components |
| `useDebounce` | `lib/hooks/use-debounce.ts` | Debounce de valores para búsqueda |
| `catalogApi` | `lib/api/catalog.api.ts` | CRUD de categorías y productos |
| `ordersApi` | `lib/api/orders.api.ts` | CRUD de pedidos + cambio de estado |
| `storeApi` | `lib/api/store.api.ts` | Datos del tenant, settings, tema |
| `uploadApi` | `lib/api/upload.api.ts` | Upload de imágenes a Cloudinary/S3 |
| `whatsappUtil` | `lib/utils/whatsapp.ts` | Generación del mensaje y apertura de wa.me |
| `storeStatusUtil` | `lib/utils/store-status.ts` | Cálculo de abierto/cerrado con soporte de 2 turnos |
| `printOrderUtil` | `lib/utils/print-order.ts` | Impresión de pedido en formato A4 y ticket 80mm |

---

## SECCIÓN 5 — BACKEND API NESTJS

### 5.1 Estructura de módulos NestJS

*(Sin cambios estructurales respecto a v1 — NestJS se mantiene igual)*

```
src/
├── main.ts
├── app.module.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/ (jwt.strategy.ts, local.strategy.ts)
│   │   └── dto/ (login.dto.ts, register.dto.ts)
│   ├── tenants/
│   │   ├── tenants.module.ts
│   │   ├── tenants.controller.ts
│   │   ├── tenants.service.ts
│   │   └── entities/ (tenant.entity.ts, store-settings.entity.ts)
│   ├── catalog/
│   │   ├── catalog.module.ts
│   │   ├── categories.controller.ts
│   │   ├── products.controller.ts
│   │   ├── catalog.service.ts
│   │   └── entities/ (category.entity.ts, product.entity.ts, option-group.entity.ts)
│   ├── orders/
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   ├── orders.gateway.ts   ← WebSocket Gateway
│   │   └── entities/ (order.entity.ts, order-item.entity.ts)
│   └── upload/
│       ├── upload.module.ts
│       └── upload.service.ts   (Cloudinary / S3)
├── common/
│   ├── decorators/ (tenant-id.decorator.ts, current-user.decorator.ts)
│   ├── guards/ (jwt-auth.guard.ts, tenant.guard.ts)
│   ├── interceptors/ (tenant-context.interceptor.ts)
│   └── filters/ (http-exception.filter.ts)
└── config/ (database.config.ts, jwt.config.ts)
```

### 5.2 Endpoint adicional requerido por el middleware de Next.js (NUEVO)

El middleware de Next.js necesita resolver `slug → tenantId` sin cargar toda la configuración del store.

```
| GET | /stores/:slug/tenant-id | — | Retorna solo { tenantId } para uso del middleware Edge. Respuesta mínima para máxima velocidad. |
```

### 5.3 Endpoints REST del MVP

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | /auth/register | — | Registro. Crea tenant + usuario admin. |
| POST | /auth/login | — | Login. Retorna access_token + seta refresh_token en httpOnly cookie. |
| POST | /auth/refresh | Cookie | Renueva access_token. |
| POST | /auth/logout | JWT | Invalida refresh_token en BD. |
| **GET** | **/stores/:slug/tenant-id** | — | **NUEVO. Solo { tenantId }. Para middleware Next.js.** |
| GET | /stores/:slug | — | Datos públicos del comercio (tienda pública). |
| GET | /stores/:slug/status | — | Estado abierto/cerrado calculado. Sin auth. |
| PATCH | /stores/me | JWT | Actualizar configuración del comercio. |
| GET | /stores/me/settings | JWT | Toda la configuración del comercio. |
| GET | /:slug/categories | — | Categorías activas (tienda pública). |
| GET | /admin/categories | JWT | Categorías (admin, incluye inactivas). |
| POST | /admin/categories | JWT | Crear categoría. |
| PUT | /admin/categories/:id | JWT | Editar categoría. |
| DELETE | /admin/categories/:id | JWT | Eliminar (validar sin productos activos). |
| PATCH | /admin/categories/reorder | JWT | Reordenar. Body: `{ ids: string[] }` |
| GET | /:slug/categories/:id/products | — | Productos activos de categoría (tienda pública). |
| GET | /:slug/products/featured | — | Productos destacados (tienda pública). |
| GET | /:slug/products/search | — | Búsqueda. Query: `q=string`. |
| GET | /admin/products | JWT | Listado con filtros y paginación. |
| GET | /admin/products/:id | JWT | Detalle de producto. |
| POST | /admin/products | JWT | Crear producto con opciones. |
| PUT | /admin/products/:id | JWT | Editar producto completo. |
| PATCH | /admin/products/:id/status | JWT | Toggle activo/inactivo. |
| DELETE | /admin/products/:id | JWT | Eliminar producto. |
| POST | /upload/image | JWT | Upload de imagen → `{ url, publicId }` |
| POST | /orders | — | Crear pedido (tienda pública, sin auth). |
| GET | /admin/orders | JWT | Listado con filtros y paginación. |
| GET | /admin/orders/:id | JWT | Detalle de pedido. |
| PATCH | /admin/orders/:id/status | JWT | Cambiar estado. |
| POST | /admin/orders | JWT | Crear pedido manual. |
| PATCH | /admin/orders/:id/notes | JWT | Actualizar notas internas. |
| GET | /admin/analytics/summary | JWT | Métricas del día/semana/mes. |
| GET | /admin/analytics/hourly | JWT | Pedidos por hora del día. |

### 5.4 WebSocket — NestJS Gateway

```typescript
// modules/orders/orders.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  // El cliente Next.js se conecta DIRECTAMENTE a este gateway
  // NO pasa por ningún Route Handler de Next.js
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server

  handleConnection(client: Socket) {
    // Validar JWT del cliente
  }

  handleDisconnect(client: Socket) {
    // Cleanup
  }

  @SubscribeMessage('join-tenant')
  handleJoinTenant(client: Socket, payload: { tenantId: string }) {
    client.join(`tenant:${payload.tenantId}`)
  }

  // Llamado desde OrdersService cuando llega un pedido nuevo
  notifyNewOrder(tenantId: string, order: Order) {
    this.server.to(`tenant:${tenantId}`).emit('order:new', order)
  }

  notifyStatusChanged(tenantId: string, data: { orderId: string; newStatus: string }) {
    this.server.to(`tenant:${tenantId}`).emit('order:status-changed', data)
  }
}
```

**Tabla de eventos WebSocket:**

| Evento | Dirección | Payload | Descripción |
|--------|-----------|---------|-------------|
| `join-tenant` | Client → Server | `{ tenantId: string }` | El admin se une a la sala del tenant. |
| `order:new` | Server → Client | `Order` (completo) | Nuevo pedido. Trigger notificación sonora. |
| `order:status-changed` | Server → Client | `{ orderId, newStatus, changedAt }` | Estado de pedido cambió. |
| `order:cancelled` | Server → Client | `{ orderId, reason? }` | Pedido cancelado. |
| `tenant:store-status` | Server → Client | `{ isOpen: boolean }` | Cambio de estado de la tienda. |

### 5.5 Estrategia multi-tenant

```typescript
// Todos los entities tienen tenant_id
@Column({ name: 'tenant_id' })
tenantId: string

// TenantContextInterceptor extrae tenantId del JWT y lo adjunta al request
// Todos los servicios filtran por tenantId automáticamente:
async getCategories(tenantId: string): Promise<Category[]> {
  return this.categoryRepo.find({
    where: { tenantId, isActive: true },
    order: { order: 'ASC' }
  })
}

// Tienda pública: tenantId se resuelve desde el slug vía middleware de Next.js
// Ver sección 2.5 — el header x-tenant-id se inyecta en el Edge
```

---

## SECCIÓN 6 — GUÍAS DE UX/UI Y DISEÑO

### 6.1 Principios de diseño no negociables

1. **Mobile-first absoluto:** Diseñar siempre para 360px primero. Clases Tailwind sin prefijo = mobile. NUNCA diseñar desktop y luego adaptar a móvil.

2. **Feedback inmediato:** Cada acción debe tener respuesta visual en menos de 100ms. Usar optimistic updates con TanStack Query donde sea posible.

3. **Estados de carga explícitos:** NUNCA mostrar pantalla vacía. Siempre usar `SkeletonLoader`. No usar spinners sin contexto.

4. **Errores accionables:** Los mensajes de error deben decir qué hacer, no solo qué salió mal. Incluir siempre una acción de recuperación.

5. **Reutilización estricta:** Nunca duplicar JSX. Colores NUNCA hardcodeados — siempre usar CSS variables o clases Tailwind con variables.

### 6.2 Animaciones y micro-interacciones

| Interacción | Tipo | Duración | Implementación |
|-------------|------|----------|----------------|
| Navegar entre páginas | Fade + slide | 300ms | `next/navigation` + Framer Motion `AnimatePresence` |
| Abrir vaul bottom sheet | Slide desde abajo | 250ms ease-out | Nativo en vaul |
| Cerrar vaul bottom sheet | Slide hacia abajo | 200ms ease-in | Nativo en vaul |
| Agregar al carrito | Scale bounce en badge | 400ms | CSS keyframes en `CartBadge` |
| Toast aparece | Fade + slide desde arriba | 200ms | Sonner (shadcn toast) |
| Hover en cards (desktop) | Elevación + scale | 200ms | `hover:shadow-md hover:scale-[1.02] transition-all` |
| Shimmer de skeleton | Gradiente animado | 1.5s loop | `animate-pulse` de Tailwind |
| Toggle activo/inactivo | Slide del thumb | 200ms | shadcn Switch con colores del tema |
| Confirmación de pedido | Checkmark SVG + confetti | 600ms | `stroke-dashoffset` animation + `canvas-confetti` |

### 6.3 Tipografía con Tailwind

| Elemento | Clases Tailwind | Uso |
|----------|----------------|-----|
| Display / Precio grande | `text-4xl font-bold` | Precio en detalle de producto, total en carrito |
| H1 — Título de página | `text-2xl md:text-3xl font-bold` | Nombre del comercio, títulos principales |
| H2 — Subtítulo de sección | `text-xl font-semibold` | Nombre de categoría, título de card de pedido |
| H3 — Nombre de ítem | `text-base md:text-lg font-semibold` | Nombre de producto, nombre de pedido |
| Body — Descripción | `text-sm md:text-base text-gray-600` | Descripción de productos, textos de ayuda |
| Caption — Metadatos | `text-xs text-gray-400` | Timestamps, 'hace X min', precio adicional |
| Label — Botones y chips | `text-sm font-medium` | Texto en botones, badges, chips de filtro |

---

## SECCIÓN 7 — CRITERIOS DE ACEPTACIÓN DEL MVP

### 7.1 Criterios de aceptación por módulo

| ID | Criterio | Módulo | Tipo |
|----|----------|--------|------|
| CA-001 | El cliente puede completar el flujo completo (home → categoría → detalle → carrito → checkout → WhatsApp) en un smartphone 360px sin errores. | MOD-02 | Funcional |
| CA-002 | El mensaje de WhatsApp contiene todos los ítems con variantes, precio correcto, datos del cliente y total exacto. | MOD-02 | Funcional |
| CA-003 | Al llegar un pedido nuevo al admin, aparece notificación sonora/visual en menos de 2 segundos sin recargar la página. | MOD-03 | Rendimiento |
| CA-004 | El administrador puede cambiar el estado de un pedido y el cambio se refleja en el kanban sin reload. | MOD-03 | Funcional |
| CA-005 | Con variantes requeridas, el cliente NO puede agregar al carrito sin seleccionarlas. Muestra error inline. | MOD-01/02 | Validación |
| CA-006 | Los colores del tema del comercio se aplican en la tienda pública SIN flash de colores incorrectos (FOUC). | MOD-04/02 | Visual |
| CA-007 | El indicador abierto/cerrado es correcto con los horarios configurados, incluyendo 2 turnos por día. | MOD-04/02 | Lógica |
| CA-008 | Todas las vistas tienen skeleton loader durante la carga. No hay pantallas en blanco. | Todos | UX |
| CA-009 | Todos los formularios validan correctamente con errores descriptivos inline. No se puede enviar formulario inválido. | Todos | Validación |
| CA-010 | La aplicación funciona en Chrome/Safari/Firefox mobile y desktop (últimas 2 versiones). | Todos | Compatibilidad |
| CA-011 | El carrito persiste en localStorage. Ítems presentes al cerrar y reabrir el browser. | MOD-02 | Funcional |
| CA-012 | El panel admin es usable en viewport 375px (iPhone SE). Bottom nav visible y funcional. | MOD-05 | Responsive |
| CA-013 | LCP de la tienda pública es menor a 2.5s en conexión 4G simulada. | MOD-02 | Rendimiento |
| CA-014 | Todas las imágenes tienen lazy loading. Next.js Image component usado en toda la tienda pública. | Todos | Rendimiento |
| CA-015 | Rutas del admin protegidas por middleware. Acceder sin token redirige a /auth/login con returnUrl. | MOD-06 | Seguridad |
| **CA-016** | **El cliente Next.js se conecta al WebSocket DIRECTAMENTE al puerto NestJS. No hay ningún WebSocket en Route Handlers de Next.js.** | MOD-03 | Arquitectura |
| **CA-017** | **El tema del tenant se aplica con inline style en el `<head>` desde el servidor (SSR). No hay FOUC en ningún navegador.** | MOD-02/04 | Visual |
| **CA-018** | **El componente de paginación es el mismo en todas las listas (productos, pedidos). No hay implementaciones inline inconsistentes.** | MOD-01/03 | Calidad |

### 7.2 Métricas de performance objetivo

| Métrica | Objetivo | Herramienta |
|---------|----------|-------------|
| Largest Contentful Paint (LCP) | < 2.5s (4G) | Lighthouse, WebPageTest |
| First Input Delay (FID) | < 100ms | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| Bundle size inicial (lazy chunk) | < 200KB gzipped por ruta | next/bundle-analyzer |
| Tiempo hasta primer pedido visible (admin) | < 1.5s después de login | Performance DevTools |
| Latencia WebSocket (nuevo pedido) | < 500ms desde creación en BD | Network DevTools |
| Cache hit rate (unstable_cache) | > 80% para datos de tienda pública | Logs de Next.js |

---

## SECCIÓN 8 — PLAN DE IMPLEMENTACIÓN

> 🤖 **Instrucción para el agente de desarrollo:** Seguir este orden estrictamente. Cada fase debe estar completa y sin errores antes de avanzar a la siguiente. Ejecutar prueba funcional al finalizar cada fase.

| Fase | # | Tarea | Dependencias | Entregable de validación |
|------|---|-------|-------------|--------------------------|
| F0 | 1 | Setup Next.js 15 + NestJS con Docker, TypeScript strict, variables de entorno | — | docker-compose up levanta frontend (:3000) y backend (:3001) sin errores |
| F0 | 2 | Configurar Tailwind v4, shadcn/ui, globals.css con CSS variables, instalar vaul, sonner | — | Página de tokens visuales con todos los componentes shadcn instalados |
| F0 | 3 | Implementar todos los shared components (Button, Skeleton, EmptyState, Toast, ImageUploader, QuantitySelector, ConfirmModal, SearchBar, **Pagination**, Badge) | F0-2 | Storybook o página de preview con cada componente en todas las variantes |
| F1 | 4 | Backend: entidades TypeORM + migraciones (Tenant, User, Category, Product, Order, StoreSettings con DaySchedule schema) | F0 | Migraciones ejecutan sin errores |
| F1 | 5 | Backend: módulo auth (register, login, JWT 15min, refresh token 7d httpOnly cookie) | F1-4 | POST /auth/register y /auth/login funcionan. JWT válido retornado. |
| F1 | 6 | Frontend: módulo auth (login, registro, middleware de protección de rutas, Axios interceptor con refresh) | F1-5 | Login funciona. /admin redirige a login si no autenticado. returnUrl funciona. |
| F2 | 7 | Backend: CRUD categorías + CRUD productos con opciones | F1-4 | Todos los endpoints de catálogo responden con Postman |
| F2 | 8 | Frontend admin: gestión de categorías (listado con drag&drop @dnd-kit, form dialog, eliminar) | F1-6, F2-7 | CRUD completo de categorías |
| F2 | 9 | Frontend admin: gestión de productos (listado con paginación compartida, ProductFormPage completo con 5 secciones, variantes useFieldArray, autoguardado, upload imágenes) | F2-8 | CRUD completo de productos con imágenes y variantes |
| F3 | 10 | Backend: módulo configuración de tienda (info, horarios DaySchedule, entrega, pagos, tema) + endpoint /stores/:slug/tenant-id | F1-4 | GET y PATCH /stores/me funcionan |
| F3 | 11 | Frontend admin: panel de configuración completo (todas las secciones, HoursEditor con 2 turnos, ThemeEditor con preview) | F3-10 | Guardar cualquier configuración persiste |
| F3 | 12 | Middleware Next.js: resolver slug → tenantId + protección de rutas admin | F3-10 | /:slug redirige a 404 si slug no existe. /admin redirige a login sin token. |
| F3 | 13 | Layout de tienda pública con inyección SSR de tema (anti-FOUC) | F3-11, F3-12 | Cambiar color en config → recargar tienda → color aplicado SIN flash |
| F4 | 14 | Frontend tienda: home (RSC), grilla de categorías, productos destacados | F2-7, F3-13 | Tienda pública renderiza correctamente para el slug configurado |
| F4 | 15 | Frontend tienda: detalle de producto con vaul (móvil) + Dialog (desktop), variantes, validación | F4-14 | Selección de variantes funciona. Vaul con drag gesture en móvil. Validación de grupos requeridos. |
| F4 | 16 | Frontend tienda: carrito Zustand con persistencia localStorage, CartDrawer, CartBadge con animación | F4-15 | Agregar/quitar ítems. Carrito persiste al recargar. |
| F5 | 17 | Frontend tienda: checkout 2 pasos (RHF+Zod), validaciones, WhatsApp dispatch, lógica de monto mínimo | F4-16 | Flujo completo funciona. Mensaje WhatsApp correcto con todos los campos. |
| F5 | 18 | Frontend tienda: POST /orders, pantalla de confirmación con animación checkmark + confetti | F5-17 | Pedido creado en BD. Pantalla de confirmación con número de orden. |
| F6 | 19 | Backend: NestJS WebSocket Gateway (join-tenant, order:new, order:status-changed) | F1-4 | Evento emitido al room correcto con Postman/wscat |
| F6 | 20 | Frontend admin: kanban (TanStack Query + WebSocket), notificación sonora/visual, swipe actions móvil | F6-19 | Nuevo pedido aparece en kanban en tiempo real. Notificación sonora si hubo interacción previa. |
| F6 | 21 | Frontend admin: detalle de pedido (Dialog), cambio de estado con optimistic update | F6-20 | Cambiar estado en un pedido. Kanban actualiza sin reload. |
| F7 | 22 | Frontend admin: dashboard con métricas, gráfico (solo desktop), toggle abierto/cerrado | F6-21 | Dashboard carga métricas del día. Gráfico visible en desktop, resumen en móvil. |
| F7 | 23 | Búsqueda en tienda (barClient + backend) | F2-7 | Buscar 'mila' retorna todos los productos con 'mila' en nombre/descripción |
| F7 | 24 | Onboarding wizard para nuevos comercios | F3-11 | Nuevo usuario ve el wizard. Completarlo configura la tienda básica. |
| F8 | 25 | QA integral: flujo completo en móvil 360px, Kanban en tiempo real, FOUC test, LCP medido | Todas | Sin errores bloqueantes. LCP < 2.5s. Kanban funciona en tiempo real. FOUC: ninguno. |

---

## RESUMEN EJECUTIVO — GAPS RESUELTOS v1 → v2

| Gap identificado en v1 | Estado en v2 | Sección |
|------------------------|-------------|---------|
| WebSocket pasaba por Next.js (imposible) | ✅ Documentado explícitamente: cliente conecta directo a NestJS | 2.4 |
| Resolver slug → tenantId no documentado | ✅ Middleware Next.js con edge caching | 2.5 |
| FOUC de tema dinámico no resuelto | ✅ Inline `<style>` SSR en layout del tenant | 2.6 |
| DaySchedule schema no definido | ✅ Interfaces TypeScript completas con ejemplo | 3.13 |
| ProductFormPage subestimado | ✅ Especificación completa de 5 secciones + autoguardado | 3.3 |
| Bottom sheet sin drag gesture | ✅ vaul (librería con gesture nativo) | 3.5 |
| Paginación no había componente shared | ✅ PaginationComponent documentado e implementado | 4.2 |
| Notificación sonora sin manejo de bloqueo móvil | ✅ Fallback documentado + registerInteraction pattern | 3.11 |
| Sesión expirada durante edición = pérdida de datos | ✅ Evento `auth:session-expired` + guardado inmediato | 3.14 |
| Dashboard ilegible en 360px | ✅ Versión simplificada para móvil documentada | 3.16 |
| Sin estrategia de caché para tienda pública | ✅ `unstable_cache` de Next.js con revalidación | 2.4 |
| Stack Angular documentado, ahora Next.js | ✅ Todo el documento actualizado a Next.js 15 + React | Todo |

---

*Documento v2.0 — Stack: Next.js 15 + NestJS 10 + PostgreSQL + Socket.io · Mayo 2026*
*65+ funcionalidades · 6 módulos frontend · 1 backend NestJS · 25 fases de desarrollo*