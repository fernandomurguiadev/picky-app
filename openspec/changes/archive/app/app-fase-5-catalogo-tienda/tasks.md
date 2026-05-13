# Tasks — app-fase-5-catalogo-tienda

## Fase de implementación: FASE 5 — Tienda Pública: Catálogo y Producto

**Prerequisito:** FASE 4 completada.

---

### FE5.1 — Home de tienda (RSC)

- [x] Completar `app/(store)/[slug]/page.tsx` como RSC
- [x] Fetch en paralelo: categorías activas + productos destacados
- [x] Sección de categorías: grilla de cards o lista horizontal con scroll
- [x] Sección de destacados: grilla 2 columnas (móvil) / 4 columnas (desktop)
- [x] Sin `useEffect` — todo renderizado en servidor
- [x] `revalidate: 60` para categorías, `revalidate: 30` para destacados

**Criterio de done:** Renderiza en servidor. Sin `useEffect`. LCP medible con Lighthouse < 2.5s.

---

### FE5.2 — Página de productos por categoría

- [x] Crear `app/(store)/[slug]/category/[id]/page.tsx`
- [x] RSC: fetch de `/:slug/categories/:id/products` con paginación
- [x] Grilla: 2 columnas en móvil, 3 en tablet, 4 en desktop
- [x] Componente `Pagination` (shared) para navegación de páginas
- [x] `notFound()` si la categoría no existe

**Criterio de done:** Grilla responsive correcta. Paginación funciona.

---

### FE5.3 — `ProductCard`

- [x] Crear `components/store/product-card/index.tsx`
- [x] Imagen con `next/image`, `fill`, `loading="lazy"` + placeholder si no hay imagen
- [x] Nombre (máx 2 líneas con `line-clamp-2`), precio formateado
- [x] Botón "Agregar" que abre `ProductDetailSheet`
- [x] Hover: sombra sutil

**Criterio de done:** Imagen con `loading="lazy"`. Precio formateado en ARS.

---

### FE5.4 — `ProductDetailSheet` (móvil — vaul)

- [x] Crear `components/store/product-detail-sheet/index.tsx`
- [x] Usar `vaul` `Drawer` para viewport móvil (< 768px)
- [x] Drag gesture funcional en touch
- [x] Contenido: imagen grande, nombre, descripción, precio, `VariantSelector`, `QuantitySelector`
- [x] Botón "Agregar al carrito" en el footer del drawer

**Criterio de done:** Drawer con drag gesture funciona en touch screen.

---

### FE5.5 — `ProductDetailSheet` (desktop — Dialog)

- [x] Extender `ProductDetailSheet` para detectar viewport con `useEffect` + `matchMedia`
- [x] En desktop (≥ 768px): usar `Dialog` de shadcn/ui con misma información
- [x] Mismo componente, distinto contenedor

**Criterio de done:** En desktop se abre Dialog. En móvil se abre vaul Drawer.

---

### FE5.6 — `VariantSelector`

- [x] Crear `components/store/variant-selector/index.tsx`
- [x] Grupos radio (máx 1 selección) vs checkbox (múltiple) según configuración del grupo
- [x] Grupos `isRequired` muestran indicador visual de obligatorio
- [x] Emitir `onValidityChange(false)` si hay grupos requeridos sin seleccionar
- [x] Botón "Agregar al carrito" deshabilitado mientras `!isValid`

**Criterio de done:** No se puede agregar sin seleccionar grupos requeridos.

---

### FE5.7 — Buscador en tienda pública

- [x] Crear `app/(store)/[slug]/search/page.tsx`
- [x] `SearchBar` (shared) como client component con debounce
- [x] Resultados como RSC o con TanStack Query para actualizaciones
- [x] Mensaje "Sin resultados" con `EmptyState` (shared)
- [x] `q` en los searchParams de la URL

**Criterio de done:** Búsqueda retorna productos relevantes. Sin resultados muestra EmptyState.

---

### Verificación final

- [x] `npm run typecheck` — sin errores
- [x] Probar en 360px: grilla 2 columnas sin overflow horizontal
- [x] Verificar que todas las imágenes usan `next/image` (sin `<img>` desnudo)
- [x] Drawer vaul funciona en touch (probar en Chrome DevTools mobile)
