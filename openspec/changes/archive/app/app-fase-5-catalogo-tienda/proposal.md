# Proposal — app-fase-5-catalogo-tienda

## Resumen

Vista pública del catálogo: home de la tienda con categorías y destacados (RSC), grilla de
productos por categoría, detalle del producto en vaul drawer (móvil) / Dialog (desktop),
selector de variantes y buscador.

## Motivación

Es la funcionalidad core del cliente final de la plataforma. Sin esta fase el consumidor
no puede ver el catálogo de la tienda ni agregar productos al carrito.

## Alcance

### Frontend (`app/`)

- `app/(store)/[slug]/page.tsx` — home RSC: categorías + destacados
- `app/(store)/[slug]/category/[id]/page.tsx` — grilla de productos
- `app/(store)/[slug]/search/page.tsx` — resultados de búsqueda
- `components/store/product-card/index.tsx` — card de producto
- `components/store/product-detail-sheet/index.tsx` — vaul (móvil) + Dialog (desktop)
- `components/store/variant-selector/index.tsx` — grupos de opciones
- `components/store/category-nav/index.tsx` — navegación por categorías

## Rutas de API consumidas

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/:slug/categories` | Categorías activas |
| GET | `/:slug/products/featured` | Destacados (max 10) |
| GET | `/:slug/categories/:id/products` | Productos de una categoría (paginado) |
| GET | `/:slug/products/search` | Búsqueda por `q=` |

## Notas de implementación

- Home es RSC puro: `fetch` directo sin `useEffect`
- `ProductDetailSheet`: detecta viewport con `useMediaQuery` → vaul en móvil, Dialog en desktop
- `VariantSelector`: grupos `isRequired` bloquean el botón "Agregar al carrito" si no hay selección
- Precios: formatear con `Intl.NumberFormat` en la UI, nunca mostrar el valor en centavos
- Imágenes: `next/image` con `loading="lazy"` en todas las cards
