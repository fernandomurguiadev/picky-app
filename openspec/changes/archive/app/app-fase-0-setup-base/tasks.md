# Tasks — app-fase-0-setup-base

## Fase de implementación: FASE 0 — Setup Base e Infraestructura UI

---

## F0-A: Setup del proyecto

### FE0.1 — tsconfig.json

- [x] Configurar `strict: true` en `tsconfig.json`
- [x] Configurar paths aliases `@/*` → `./src/*`

**Criterio de done:** `npm run typecheck` sin errores.

---

### FE0.2 — Tailwind CSS v4

- [x] Instalar y configurar Tailwind CSS v4
- [x] Crear `globals.css` con `@import "tailwindcss"`
- [x] Definir CSS variables del design system: `--color-primary`, `--radius`, etc.

**Criterio de done:** Variables `--color-primary`, `--radius` etc. funcionan.

---

### FE0.3 — shadcn/ui

- [x] Instalar y configurar shadcn/ui (Radix Nova preset)
- [x] Agregar componentes: Button, Dialog, Sheet, Drawer, Badge, Input, Label, Switch, Select, Checkbox, Separator, ScrollArea, Avatar, Tabs, Skeleton

**Criterio de done:** `npx shadcn@latest add` sin errores.

---

### FE0.4 — Dependencias

- [x] Instalar `vaul`, `sonner`, `@tanstack/react-query`, `zustand`
- [x] Instalar `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`
- [x] Instalar `socket.io-client`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- [x] Instalar `browser-image-compression`

**Criterio de done:** Todas instaladas. `npm run build` sin errores de módulos faltantes.

---

### FE0.5 — TanStack Query provider

- [x] Crear `lib/query-client.ts` con `QueryClient` configurado
- [x] Crear `Providers` client component en root layout
- [x] Agregar `ReactQueryDevtools` solo en dev

**Criterio de done:** `useQuery` funciona en cualquier page.

---

### FE0.6 — Axios instances

- [x] Crear `lib/api/axios.ts` con `apiBff` (base URL `/api/backend/api/v1`)
- [x] Crear `apiServer` para llamadas server-side
- [x] Interceptor de auth: adjunta `Authorization: Bearer <token>` desde Zustand
- [x] Interceptor 401: llama `/api/auth/refresh`, actualiza token, reintenta request

**Criterio de done:** Request adjunta `Authorization: Bearer <token>` automáticamente.

---

### FE0.7 — Zustand stores

- [x] Crear `lib/stores/auth.store.ts` (token en memory only)
- [x] Crear `lib/stores/ui.store.ts`
- [x] Crear `lib/stores/cart.store.ts` con `persist` a localStorage

**Criterio de done:** `useAuthStore` retorna `accessToken`. `useCartStore` persiste al recargar.

---

## F0-B: Componentes shared

### FE0.8 — Button (shadcn)

- [x] Confirmar variantes: primary, secondary, ghost, destructive, loading state

**Criterio de done:** Variantes visuales correctas. Loading muestra spinner.

---

### FE0.9 — SkeletonLoader

- [x] Crear `components/shared/skeleton-loader/index.tsx`
- [x] Configurable por filas/columnas

**Criterio de done:** Reemplaza contenido en estado loading.

---

### FE0.10 — EmptyState

- [x] Crear `components/shared/empty-state/index.tsx`
- [x] Props: `icon?`, `title`, `description?`, `actionLabel?`, `onAction?`

**Criterio de done:** Usado en listas vacías.

---

### FE0.11 — Toast

- [x] Crear `components/shared/toast/index.tsx` como wrapper de `sonner`
- [x] Variantes: success, error, info

**Criterio de done:** `toast.success('texto')` muestra notificación.

---

### FE0.12 — ImageUploader

- [x] Crear `components/shared/image-uploader/index.tsx`
- [x] Drag & drop + click, preview inmediato
- [x] Compresión client-side con `browser-image-compression`
- [x] Validar MIME real via magic bytes
- [x] Subir vía BFF (`POST /api/backend/api/v1/upload`)

**Criterio de done:** Sube imagen y retorna URL. Muestra preview antes del upload.

---

### FE0.13 — QuantitySelector

- [x] Crear `components/shared/quantity-selector/index.tsx`
- [x] Botones `-` / número / `+`, mínimo configurable

**Criterio de done:** No permite valor < mínimo.

---

### FE0.14 — ConfirmModal

- [x] Crear `components/shared/confirm-modal/index.tsx`
- [x] Props: `title`, `description`, `onConfirm`, `destructive?`, `isLoading?`

**Criterio de done:** Llama `onConfirm` solo si el usuario confirma.

---

### FE0.15 — SearchBar

- [x] Crear `components/shared/search-bar/index.tsx`
- [x] Input con icono lupa, debounce 300ms, clear button

**Criterio de done:** `onChange` no dispara en cada keystroke.

---

### FE0.16 — Pagination

- [x] Crear `components/shared/pagination/index.tsx`
- [x] Prev/next + número de página
- [x] Soporte para links SSR y callback client-side (`onPageChange`)

**Criterio de done:** Genera links con `?page=N`. No necesita JS.

---

### FE0.17 — Badge

- [x] Crear `components/shared/badge/index.tsx`
- [x] Variantes por status: pending, confirmed, preparing, ready, delivered, cancelled

**Criterio de done:** Cada status tiene color distinto.
