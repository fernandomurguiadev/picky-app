# Componentes Compartidos (Shared)

> Origen: Frontend · `components/shared/` y `lib/`
> Aplica a: Admin y Tienda Pública

---

## 4.1 Componentes shared obligatorios

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
| BottomSheet | Usar `vaul` directamente | — | No crear wrapper custom. Usar vaul `<Drawer.Root>` (ver mod-02-tienda-publica.md § 3.5). |

---

## 4.2 Componente Pagination (NUEVO — faltaba en v1)

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

---

## 4.3 Servicios y hooks core obligatorios

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
