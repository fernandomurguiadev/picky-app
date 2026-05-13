# Guías de UX/UI y Diseño

> Origen: Diseño · Aplica a Frontend (tienda pública y admin)
> Requerimiento: Mobile-first absoluto en todos los componentes

---

## 6.1 Principios de diseño no negociables

1. **Mobile-first absoluto:** Diseñar siempre para 360px primero. Clases Tailwind sin prefijo = mobile. NUNCA diseñar desktop y luego adaptar a móvil.

2. **Feedback inmediato:** Cada acción debe tener respuesta visual en menos de 100ms. Usar optimistic updates con TanStack Query donde sea posible.

3. **Estados de carga explícitos:** NUNCA mostrar pantalla vacía. Siempre usar `SkeletonLoader`. No usar spinners sin contexto.

4. **Errores accionables:** Los mensajes de error deben decir qué hacer, no solo qué salió mal. Incluir siempre una acción de recuperación.

5. **Reutilización estricta:** Nunca duplicar JSX. Colores NUNCA hardcodeados — siempre usar CSS variables o clases Tailwind con variables.

---

## 6.2 Animaciones y micro-interacciones

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

---

## 6.3 Tipografía con Tailwind

| Elemento | Clases Tailwind | Uso |
|----------|----------------|-----|
| Display / Precio grande | `text-4xl font-bold` | Precio en detalle de producto, total en carrito |
| H1 — Título de página | `text-2xl md:text-3xl font-bold` | Nombre del comercio, títulos principales |
| H2 — Subtítulo de sección | `text-xl font-semibold` | Nombre de categoría, título de card de pedido |
| H3 — Nombre de ítem | `text-base md:text-lg font-semibold` | Nombre de producto, nombre de pedido |
| Body — Descripción | `text-sm md:text-base text-gray-600` | Descripción de productos, textos de ayuda |
| Caption — Metadatos | `text-xs text-gray-400` | Timestamps, 'hace X min', precio adicional |
| Label — Botones y chips | `text-sm font-medium` | Texto en botones, badges, chips de filtro |
