# Planificación Frontend — Next.js 15
## Plataforma E-Commerce de Proximidad · MVP

> **Stack:** Next.js 15 App Router · TypeScript strict · TanStack Query v5 · Tailwind CSS v4 · shadcn/ui · vaul · React Hook Form + Zod · Zustand ^5 · Axios · socket.io-client
> **Directorio de trabajo:** `app/`
> **Referencia técnica:** [01-arquitectura-frontend.md](./01-arquitectura-frontend.md)
> **Mobile-first:** 360px mínimo — requerimiento no negociable

---

## Estado actual

| Item | Estado |
|------|--------|
| Proyecto Next.js 15 inicializado | ✅ Completado |
| Tailwind v4 + shadcn/ui | ✅ Completado (Radix Nova preset) |
| Módulos de aplicación | ✅ FASE 0 y FASE 1 implementadas |
| Middleware de rutas | ✅ Completado |

---

## Fases de implementación

### ✅ FASE 0 — Setup base e infraestructura UI

**Objetivo:** Proyecto configurado con todas las dependencias, design system funcional y componentes shared listos para usar.

#### F0-A: Setup del proyecto

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| FE0.1 | Configurar `tsconfig.json` con `strict: true`, paths aliases (`@/`) | `tsconfig.json` | `npm run typecheck` sin errores | ✅ |
| FE0.2 | Instalar y configurar Tailwind CSS v4 con `globals.css` y CSS variables del design system | `app/globals.css`, `tailwind.config.ts` | Variables `--color-primary`, `--radius` etc. funcionan | ✅ |
| FE0.3 | Instalar y configurar shadcn/ui (todos los componentes necesarios: Button, Dialog, Sheet, Drawer, Badge, etc.) | `components/ui/` | `npx shadcn@latest add` sin errores | ✅ |
| FE0.4 | Instalar dependencias: `vaul`, `sonner`, `@tanstack/react-query`, `zustand`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `socket.io-client`, `@dnd-kit/core`, `@dnd-kit/sortable`, `browser-image-compression` | `package.json` | Todas instaladas. `npm run build` sin errores de módulos faltantes. | ✅ |
| FE0.5 | Configurar `TanStack Query` provider en root layout con `QueryClient` y `ReactQueryDevtools` (solo dev) | `app/layout.tsx`, `lib/query-client.ts` | `useQuery` funciona en cualquier page | ✅ |
| FE0.6 | Configurar instancia Axios con base URL, interceptors de auth (adjunta Bearer token) y retry en 401 | `lib/api/axios.ts` | Request adjunta `Authorization: Bearer <token>` automáticamente | ✅ |
| FE0.7 | Configurar Zustand stores base: `auth.store.ts` (token en memory), `ui.store.ts`, `cart.store.ts` (con `persist` a localStorage) | `lib/stores/` | `useAuthStore` retorna `accessToken`. `useCartStore` persiste al recargar. | ✅ |

#### F0-B: Componentes shared

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| FE0.8 | `Button` — variantes: primary, secondary, ghost, destructive, loading state | `components/shared/button/` | Variantes visuales correctas. Loading muestra spinner. | ✅ shadcn |
| FE0.9 | `SkeletonLoader` — skeleton genérico configurable por filas/columnas | `components/shared/skeleton-loader/` | Reemplaza contenido en estado loading | ✅ |
| FE0.10 | `EmptyState` — icono + título + descripción + acción opcional | `components/shared/empty-state/` | Usado en listas vacías | ✅ |
| FE0.11 | `Toast` — wrapper de `sonner` con variantes success/error/info | `components/shared/toast/` | `toast.success('texto')` muestra notificación | ✅ |
| FE0.12 | `ImageUploader` — drag&drop + click, preview inmediato, compresión client-side, progress | `components/shared/image-uploader/` | Sube imagen y retorna URL. Muestra preview antes del upload. | ✅ |
| FE0.13 | `QuantitySelector` — `-` / número / `+`, mínimo configurable, animación en cambio | `components/shared/quantity-selector/` | No permite valor < mínimo | ✅ |
| FE0.14 | `ConfirmModal` — Dialog de confirmación genérico con acción destructiva | `components/shared/confirm-modal/` | Llama `onConfirm` solo si el usuario confirma | ✅ |
| FE0.15 | `SearchBar` — input con icono lupa, debounce 300ms, clear button | `components/shared/search-bar/` | `onChange` no dispara en cada keystroke | ✅ |
| FE0.16 | `Pagination` — componente server-side pagination: prev/next + número de página | `components/shared/pagination/` | Genera links con `?page=N`. No necesita JS. | ✅ |
| FE0.17 | `Badge` — variante por status: pending, confirmed, preparing, ready, delivered, cancelled | `components/shared/badge/` | Cada status tiene color distinto | ✅ |

---

### ✅ FASE 1 — Módulo de Autenticación

**Objetivo:** Login, registro, protección de rutas admin via middleware, refresh token automático.

| # | Tarea | Archivos clave | Criterio de done | Estado |
|---|-------|---------------|-----------------|--------|
| FE1.1 | Página `/auth/login`: formulario RHF+Zod, errores inline, redirect a `returnUrl` o `/admin/dashboard` | `app/auth/login/page.tsx` | Login exitoso redirige. Error 401 muestra mensaje inline. | ✅ |
| FE1.2 | Página `/auth/register`: formulario con email, password (indicador fortaleza), nombre negocio, teléfono | `app/auth/register/page.tsx` | Registro crea tenant + user. Redirige a dashboard. | ✅ |
| FE1.3 | `middleware.ts`: proteger todas las rutas `/admin/*`, redirect a `/auth/login?returnUrl=...` si sin token | `middleware.ts` | `/admin/dashboard` sin cookie → redirect a login | ✅ |
| FE1.4 | `middleware.ts`: resolver `slug → tenantId` via `GET /stores/:slug/tenant-id` para rutas `[slug]` | `middleware.ts` | Slug inválido → redirect a 404 | ✅ |
| FE1.5 | Interceptor Axios 401: llama `POST /auth/refresh`, actualiza token en Zustand, reintenta request original | `lib/api/axios.ts` | Request fallida por token expirado se reintenta automáticamente | ✅ |
| FE1.6 | Función logout: limpia Zustand, llama `POST /auth/logout`, redirige a `/auth/login` | `lib/stores/auth.store.ts` | Token limpiado de memoria. Cookie limpiada por el backend. | ✅ |
| FE1.7 | Página `/auth/forgot-password` y `/auth/reset-password` | `app/auth/` | Flujo completo de recuperación de contraseña | ✅ |
| FE1.8 | Manejar evento `session-expired` del WebSocket: redirect a login con toast de aviso | `lib/hooks/use-websocket.ts` | Si el servidor emite `session-expired`, se redirige a login | ✅ |

---

### ✅ FASE 2 — Admin: Módulo Catálogo

**Objetivo:** CRUD completo de categorías y productos con todas las funcionalidades del spec.

#### F2-A: Categorías

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| FE2.1 | Página `/admin/catalog/categories`: grilla de cards con `@dnd-kit/sortable`, indicador de cantidad de productos | `app/(admin)/admin/catalog/categories/page.tsx` | Drag & drop reordena. Llama `PATCH /admin/categories/reorder`. |
| FE2.2 | `CategoryFormDialog`: formulario RHF+Zod para crear/editar categoría (nombre, imagen, estado) | `components/admin/category-form-dialog/` | Validaciones inline. Upload de imagen con preview. |
| FE2.3 | Eliminar categoría con `ConfirmModal`. Bloquear si tiene productos activos (error del backend). | `app/(admin)/admin/catalog/categories/page.tsx` | Botón eliminar muestra confirm. Error si tiene productos. |

#### F2-B: Productos

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| FE2.4 | Página `/admin/catalog/products`: tabla con filtro por categoría, estado, búsqueda con debounce | `app/(admin)/admin/catalog/products/page.tsx` | Paginación server-side con `PaginationComponent`. |
| FE2.5 | Toggle activo/inactivo inline con optimistic update | `app/(admin)/admin/catalog/products/page.tsx` | Toggle cambia UI inmediatamente, revierte si hay error |
| FE2.6 | `ProductFormPage` sección 1: info básica (nombre, descripción, categoría, isFeatured) | `app/(admin)/admin/catalog/products/new/page.tsx` | Zod valida nombre requerido |
| FE2.7 | `ProductFormPage` sección 2: imágenes (hasta 5, upload múltiple, reordenable con DnD) | `ProductFormPage` | Orden de imágenes se guarda. Preview inmediato. |
| FE2.8 | `ProductFormPage` sección 3: precio en pesos (UI), guardado como centavos enteros | `ProductFormPage` | Input muestra `$1.500`, guarda `150000` |
| FE2.9 | `ProductFormPage` sección 4: variantes con `OptionGroupEditor` usando `useFieldArray` (RHF) | `components/admin/option-group-editor/` | Add/remove grupos e items dinámicamente. Precio adicional por item. |
| FE2.10 | `ProductFormPage` sección 5: estado activo/inactivo | `ProductFormPage` | Toggle de publicación |
| FE2.11 | Autoguardado en localStorage cada 30 segundos con indicador visual "Guardado" | `ProductFormPage` | Si se cierra accidentalmente, el draft se recupera al volver |
| FE2.12 | Sticky footer de acciones en `ProductFormPage` (Cancelar / Guardar) | `ProductFormPage` | Footer visible en todos los tamaños de pantalla |

---

### ✅ FASE 3 — Admin: Configuración de Tienda

**Objetivo:** Panel de configuración completo con todas las secciones del spec.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| FE3.1 | Layout de settings con navegación lateral (desktop) / tabs (móvil) | `app/(admin)/admin/settings/layout.tsx` | Navegación entre secciones funcional en móvil |
| FE3.2 | Sección Info: nombre, descripción, teléfono, dirección, logo (upload) | `app/(admin)/admin/settings/info/page.tsx` | Guardar persiste. Logo con preview inmediato. |
| FE3.3 | Sección Horarios: `HoursEditor` — por día de la semana, hasta 2 turnos, toggle día activo/inactivo | `components/admin/hours-editor/` | Validar que turno 2 no empieza antes de que termine turno 1 |
| FE3.4 | Sección Entrega: métodos (delivery/takeaway/ambos), zonas, monto mínimo, costo | `app/(admin)/admin/settings/delivery/page.tsx` | Monto mínimo guardado en centavos |
| FE3.5 | Sección Pagos: métodos aceptados (efectivo, transferencia, etc.) con toggles | `app/(admin)/admin/settings/payments/page.tsx` | Al menos un método siempre activo (validación) |
| FE3.6 | Sección Tema: `ThemeEditor` — color primario (color picker), tipografía, logo preview en tiempo real | `components/admin/theme-editor/` | Preview muestra cómo se verá la tienda con el tema seleccionado |

---

### ✅ FASE 4 — Tienda Pública: Infraestructura

**Objetivo:** Layout de tienda con SSR de tema (anti-FOUC), middleware de slug, rutas públicas.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| FE4.1 | `app/(store)/[slug]/layout.tsx`: fetch SSR de `StoreSettings`, inyectar CSS variables en `<style>` inline | `app/(store)/[slug]/layout.tsx` | **Sin flash** al cargar la tienda. Color correcto desde el primer render. | ✅ |
| FE4.2 | Middleware resuelve `slug → tenantId`: carga al edge desde `GET /stores/:slug/tenant-id`, pasa como header a las pages | `middleware.ts` | `x-tenant-id` disponible en server components | ✅ |
| FE4.3 | 404 page si el slug no existe | `app/(store)/[slug]/not-found.tsx` | Slug inválido → página 404 amigable | ✅ |
| FE4.4 | `GET /stores/:slug/status` en layout para mostrar badge "Abierto/Cerrado" | `app/(store)/[slug]/layout.tsx` | Badge de estado visible en header de la tienda | ✅ |

---

### ✅ FASE 5 — Tienda Pública: Catálogo y Producto

**Objetivo:** Home de la tienda, grilla de productos, detalle con vaul (móvil) y variantes.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| FE5.1 | Home de tienda (RSC): sección de categorías + productos destacados | `app/(store)/[slug]/page.tsx` | Renderiza en servidor. Sin `useEffect`. LCP < 2.5s. | ✅ |
| FE5.2 | Página `/[slug]/category/[id]`: grilla de productos por categoría, `ProductCard` | `app/(store)/[slug]/category/[id]/page.tsx` | Grilla 2 columnas en móvil, 3-4 en desktop | ✅ |
| FE5.3 | `ProductCard`: imagen (next/image), nombre, precio, botón agregar | `components/store/product-card/` | Imagen con `loading="lazy"`. Precio formateado. | ✅ |
| FE5.4 | `ProductDetailSheet` con vaul (móvil): drag gesture, imagen grande, variantes, `QuantitySelector` | `components/store/product-detail-sheet/` | Drawer con drag gesture funciona en touch. | ✅ |
| FE5.5 | `ProductDetailSheet` desktop: mismo contenido en un `Dialog` de shadcn | `components/store/product-detail-sheet/` | Detecta viewport y usa Dialog en desktop. | ✅ |
| FE5.6 | `VariantSelector`: grupos radio/checkbox, validación de grupos requeridos antes de agregar al carrito | `components/store/variant-selector/` | No puede agregar sin seleccionar grupo `isRequired` | ✅ |
| FE5.7 | Buscador en tienda pública: `SearchBar` client component + resultados RSC | `app/(store)/[slug]/search/page.tsx` | Buscar retorna productos relevantes | ✅ |

---

### FASE 6 — Tienda Pública: Carrito y Checkout

**Objetivo:** Carrito Zustand con persistencia, checkout de 2 pasos, dispatch por WhatsApp.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| FE6.1 | `CartStore` Zustand con `persist` a localStorage: `addItem`, `removeItem`, `updateQuantity`, `clearCart` | `lib/stores/cart.store.ts` | Carrito persiste al recargar. Items con opciones seleccionadas. |
| FE6.2 | `CartDrawer`: panel lateral con lista de items, subtotal, botón ir al checkout | `components/store/cart-drawer/` | Se abre desde `CartBadge`. Items editables. |
| FE6.3 | `CartBadge` en header: contador animado al agregar item | `components/store/` | Animación de rebote al sumar. Número actualizado. |
| FE6.4 | Página `/[slug]/checkout` paso 1: datos del cliente (nombre, teléfono) RHF+Zod, `noValidate` en form | `app/(store)/[slug]/checkout/page.tsx` | Validaciones Zod inline. Sin enviar si hay errores. |
| FE6.5 | Checkout paso 2: método de entrega y pago (según configuración de la tienda) | `app/(store)/[slug]/checkout/page.tsx` | Solo muestra métodos activos en la config del tenant |
| FE6.6 | Validar monto mínimo en checkout si está configurado en la tienda | `app/(store)/[slug]/checkout/page.tsx` | Error claro si no se alcanza el mínimo |
| FE6.7 | Al confirmar: `POST /orders`, luego `window.open(whatsappUrl)` con mensaje generado | `lib/utils/whatsapp.ts` | Mensaje WhatsApp incluye: items, opciones, total, datos de entrega |
| FE6.8 | Página `/[slug]/order-confirmation`: animación checkmark + confetti, número de pedido | `app/(store)/[slug]/order-confirmation/page.tsx` | Animación visible. `clearCart()` llamado al llegar. |

---

### FASE 7 — Admin: Gestión de Pedidos (Kanban + WebSocket)

**Objetivo:** Kanban en tiempo real con WebSocket, notificación sonora/visual, detalle de pedido.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| FE7.1 | Hook `useWebSocket`: conecta `socket.io-client` DIRECTO al NestJS backend (no a Next.js API routes) | `lib/hooks/use-websocket.ts` | Conexión establecida. Console log al conectar. |
| FE7.2 | `useWebSocket` emite `join-tenant` con `tenantId` al conectar, maneja reconexión automática | `lib/hooks/use-websocket.ts` | Desconexión → reconecta automáticamente |
| FE7.3 | `useOrderNotification`: hook que escucha `order:new`, muestra toast + reproduce sonido | `lib/hooks/use-order-notification.ts` | Sonido solo si hubo interacción previa del usuario (Web Audio API policy) |
| FE7.4 | `OrdersKanban`: columnas por status (TanStack Query + WebSocket), scroll horizontal en móvil | `app/(admin)/admin/orders/page.tsx` | Nuevo pedido aparece en columna PENDING sin reload |
| FE7.5 | `OrderCard`: info resumida, swipe actions en móvil para cambiar estado rápido | `components/admin/order-card/` | Swipe derecha → confirmar. Swipe izquierda → cancelar. |
| FE7.6 | `OrderDetailDialog`: detalle completo, cambio de estado, notas internas | `components/admin/order-detail-dialog/` | Cambiar estado hace optimistic update en el kanban |
| FE7.7 | Invalidar TanStack Query cache al recibir evento WebSocket `order:status-changed` | `lib/hooks/use-websocket.ts` | Cache invalidada → kanban re-fetcha solo el pedido actualizado |

---

### FASE 8 — Admin: Dashboard y funcionalidades complementarias

**Objetivo:** Dashboard con métricas, toggle abierto/cerrado, búsqueda en admin, onboarding wizard.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| FE8.1 | `DashboardPage`: layout condicional móvil (resumen de stats) / desktop (gráfico) | `app/(admin)/admin/dashboard/page.tsx` | Desktop muestra gráfico. Móvil muestra cards con métricas. |
| FE8.2 | `MetricCard`: card de métrica con valor, variación porcentual, icono | `components/admin/metric-card/` | 4 métricas: pedidos del día, ingresos, ticket promedio, pendientes |
| FE8.3 | Toggle abierto/cerrado en dashboard/header del admin | `app/(admin)/admin/dashboard/page.tsx` | Cambiar estado llama `PATCH /stores/me` y actualiza UI |
| FE8.4 | Buscador de productos en panel admin con debounce (ya construido en FE2.4, reusar) | `components/shared/search-bar/` | — |
| FE8.5 | Onboarding wizard para nuevos comercios (nombre, logo, primera categoría, primer producto) | `app/(admin)/admin/onboarding/page.tsx` | Nuevo usuario ve el wizard. Completarlo configura la tienda básica. |

---

### FASE 9 — QA Integral

**Objetivo:** Pruebas en viewport móvil real, FOUC test, performance, accesibilidad básica.

| # | Tarea | Criterio de done |
|---|-------|-----------------|
| FE9.1 | Prueba en viewport 360×640: ningún elemento roto, sin scroll horizontal | Toda vista funcional en 360px |
| FE9.2 | FOUC test: cambiar color en config → recargar tienda → color correcto SIN flash | 0 flashes visibles al cargar la tienda pública |
| FE9.3 | LCP < 2.5s en home de tienda pública | Medido con Lighthouse en modo producción |
| FE9.4 | Kanban en tiempo real: crear pedido desde tienda pública → aparece en kanban admin sin reload | Latencia < 500ms en red local |
| FE9.5 | Tokens JWT: verificar que **nunca** se guardan en `localStorage` ni `sessionStorage` | Búsqueda en código: ningún `localStorage.setItem('token')` ni `sessionStorage` con tokens |
| FE9.6 | `dangerouslySetInnerHTML`: verificar que no se usa en ningún componente | Búsqueda en código: 0 ocurrencias |
| FE9.7 | Ejecutar `npm run lint && npm run typecheck` sin errores | 0 errores |
| FE9.8 | Formularios: verificar `noValidate` en todos los `<form>` con validación Zod | Navegador no muestra tooltips nativos de validación |

---

## Dependencias entre fases

```
F0 → F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9
              ↑
         (F2 y F3 son paralelos, F4 depende de F1+F3)
```

---

## Checklist de seguridad pre-entrega

- [ ] JWT: nunca en `localStorage` ni `sessionStorage` — solo en Zustand (memory) o httpOnly cookie
- [ ] `dangerouslySetInnerHTML`: 0 ocurrencias
- [ ] Formularios con `noValidate` (React Hook Form + Zod)
- [ ] API calls: siempre vía Axios con base URL del backend — nunca hardcodear URLs
- [ ] WebSocket: conectar DIRECTO al NestJS, nunca a través de Next.js Route Handlers
- [ ] Imágenes de usuarios: siempre pasar por `next/image` o sanitizar antes de mostrar
- [ ] Precios en UI: mostrar formateados, enviar en centavos al backend

---

## Comandos de referencia

```bash
# Levantar frontend en desarrollo
cd app && npm run dev

# TypeCheck
cd app && npm run typecheck

# Lint
cd app && npm run lint

# Build de producción
cd app && npm run build
```

---

## Referencias cruzadas

| Documento | Contenido |
|-----------|-----------|
| [01-arquitectura-frontend.md](./01-arquitectura-frontend.md) | Estructura de carpetas, patrones RSC/Client, Tailwind, WebSocket, Middleware |
| [02-componentes-shared.md](./02-componentes-shared.md) | Tabla de componentes y hooks shared |
| [00-contexto-producto.md](./00-contexto-producto.md) | Anti-patterns prohibidos, decisiones de arquitectura |
| [modulos/mod-01-catalogo.md](./modulos/mod-01-catalogo.md) | Spec completo MOD-01 Catálogo |
| [modulos/mod-02-tienda-publica.md](./modulos/mod-02-tienda-publica.md) | Spec completo MOD-02 Tienda Pública (vaul, CartStore, WhatsApp) |
| [modulos/mod-03-pedidos.md](./modulos/mod-03-pedidos.md) | Spec completo MOD-03 Pedidos (Kanban, WebSocket, audio) |
| [modulos/mod-04-configuracion.md](./modulos/mod-04-configuracion.md) | Spec completo MOD-04 Configuración (HoursEditor, ThemeEditor) |
| [modulos/mod-05-panel-admin.md](./modulos/mod-05-panel-admin.md) | Spec completo MOD-05 Dashboard |
| [modulos/mod-06-autenticacion.md](./modulos/mod-06-autenticacion.md) | Spec completo MOD-06 Auth |
| [04-ux-ui-diseno.md](./04-ux-ui-diseno.md) | Principios de diseño, animaciones, tipografía |
| [05-criterios-aceptacion.md](./05-criterios-aceptacion.md) | Criterios CA-001 a CA-018 y métricas de performance |
| [openspec/specs/ui-ux-standards.md](../specs/ui-ux-standards.md) | Estándares de UX/UI |
