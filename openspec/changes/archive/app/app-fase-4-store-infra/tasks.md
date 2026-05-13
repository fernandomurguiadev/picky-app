# Tasks — app-fase-4-store-infra

## Fase de implementación: FASE 4 — Tienda Pública: Infraestructura

**Prerequisito:** FASE 1 completada (middleware + resolución slug).

---

### FE4.1 — Layout SSR con CSS variables anti-FOUC

- [x] Crear `app/(store)/[slug]/layout.tsx` como RSC (sin `'use client'`)
- [x] `fetch` en paralelo de `/stores/:slug` y `/stores/:slug/status`
- [x] Extraer `theme.primaryColor` y generar string de CSS variables
- [x] Inyectar en `<style dangerouslySetInnerHTML={{ __html: themeVars }} />` (único uso permitido — CSS del servidor)
- [x] Agregar `StoreHeader` con logo, nombre y `StoreStatusBadge`
- [x] Configurar `next: { revalidate: 60 }` en fetch de datos de tienda

**Criterio de done:** Sin FOUC al cargar la tienda. Color correcto desde el primer render.

---

### FE4.2 — Header de la tienda pública

- [x] Crear `components/store/store-header/index.tsx`
- [x] Mostrar: logo (next/image), nombre del comercio, `StoreStatusBadge`
- [x] Placeholder para `CartBadge` (se conecta en FASE 6)
- [x] Responsive: logo pequeño en móvil

**Criterio de done:** Header renderiza correctamente con datos del SSR.

---

### FE4.3 — Página 404 para slug inválido

- [x] Crear `app/(store)/[slug]/not-found.tsx`
- [x] Mensaje amigable: "No encontramos ninguna tienda en esta dirección"
- [x] Link para volver al inicio
- [x] Layout básico sin dependencias del slug

**Criterio de done:** `/slug-inexistente/` → página 404 amigable.

---

### FE4.4 — Badge de estado abierto/cerrado

- [x] Crear `components/store/store-status-badge/index.tsx`
- [x] Estado abierto: punto verde + texto "Abierto"
- [x] Estado cerrado: punto gris + texto "Cerrado"
- [x] Recibe `isOpen: boolean` como prop
- [x] Usar `next: { revalidate: 30 }` en el fetch de status

**Criterio de done:** Badge visible en el header con el estado correcto.

---

### Verificación final

- [x] Probar FOUC: cambiar `primaryColor` en BD → recargar tienda → color correcto sin flash
- [x] Slug inexistente muestra 404 amigable (no crash)
- [x] Header `x-tenant-id` disponible en server components (verificar en middleware FASE 1)
- [x] `npm run typecheck` — sin errores
