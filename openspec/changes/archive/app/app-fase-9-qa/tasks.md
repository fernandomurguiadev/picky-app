# Tasks — app-fase-9-qa

## Fase de implementación: FASE 9 — QA Integral

**Prerequisito:** FASE 8 completada.

---

### FE9.1 — Prueba en viewport 360×640

- [x] Abrir Chrome DevTools → Device emulation → 360×640
- [x] Verificar `/auth/login`: formulario completo visible, sin scroll horizontal
- [x] Verificar `/auth/register`: indicador de fortaleza visible
- [x] Verificar `/[slug]`: grilla 2 columnas, sin overflow
- [x] Verificar `/[slug]/checkout`: pasos funcionales, botones con tamaño táctil ≥ 44px
- [x] Verificar `/admin/catalog/categories`: DnD accesible
- [x] Verificar `/admin/orders`: kanban scrolleable horizontalmente
- [x] Verificar `/admin/settings`: tabs scrolleables en móvil
- [x] Corregir cualquier elemento roto

**Criterio de done:** Toda vista funcional en 360px. Sin scroll horizontal.

---

### FE9.2 — Test anti-FOUC

- [x] Cambiar `primaryColor` desde `/admin/settings/theme`
- [x] Abrir tienda pública en nueva pestaña (sin caché)
- [x] Verificar en Chrome Performance que el primer frame tiene el color correcto
- [x] Si hay FOUC: mover el `<style>` inline antes de los stylesheets externos
- [x] Repetir con dos colores distintos

**Criterio de done:** 0 flashes visibles al cargar la tienda pública.

---

### FE9.3 — LCP < 2.5s

- [x] Ejecutar `cd app && npm run build && npm start`
- [x] Auditar `/[slug]` con Lighthouse en modo Mobile (Chrome DevTools)
- [x] Verificar LCP < 2.5s
- [x] Si LCP es alto: agregar `priority` prop a la imagen principal del hero
- [x] Agregar `<link rel="preconnect">` para dominios de imágenes si aplica

**Criterio de done:** LCP < 2.5s medido con Lighthouse en producción.

---

### FE9.4 — Kanban en tiempo real < 500ms

- [x] Levantar API (`cd api && npm run start:dev`) y frontend (`cd app && npm run dev`)
- [x] Abrir `/admin/orders` en una pestaña
- [x] Completar checkout en `/[slug]/checkout` en otra pestaña
- [x] Medir tiempo hasta aparición en kanban (timestamp en console.log del socket)
- [x] Verificar latencia < 500ms en red local

**Criterio de done:** Pedido aparece en kanban sin reload en < 500ms.

---

### FE9.5 — Auditoría de tokens en storage

- [x] Ejecutar en la consola del browser: `Object.keys(localStorage).forEach(k => console.log(k, localStorage.getItem(k)))`
- [x] Verificar que ninguna key contiene 'token', 'access_token', 'jwt', 'auth'
- [x] Solo debe aparecer `cart-storage` como storage de la app
- [x] Buscar en el código: `grep -r "localStorage.setItem" app/src`
- [x] Corregir cualquier token que esté siendo guardado en localStorage/sessionStorage

**Criterio de done:** 0 tokens en localStorage/sessionStorage.

---

### FE9.6 — Auditoría `dangerouslySetInnerHTML`

- [x] Ejecutar: `grep -r "dangerouslySetInnerHTML" app/src`
- [x] Verificar que solo existe en `app/(store)/[slug]/layout.tsx` (CSS variables del servidor)
- [x] Confirmar que el contenido de ese `dangerouslySetInnerHTML` viene de la BD (no de input de usuario)
- [x] Eliminar cualquier otro uso

**Criterio de done:** Solo 1 ocurrencia permitida. Origen: CSS vars del servidor.

---

### FE9.7 — TypeCheck + Lint

- [x] Ejecutar `cd app && npm run lint` — corregir todos los errores
- [x] Ejecutar `cd app && npm run typecheck` — corregir todos los errores
- [x] Ejecutar `cd app && npm run build` — verificar que el build de producción pasa

**Criterio de done:** 0 errores en lint, typecheck y build.

---

### FE9.8 — Auditoría `noValidate` en formularios

- [x] Ejecutar: `grep -rn "<form" app/src --include="*.tsx" | grep -v "noValidate"`
- [x] Agregar `noValidate` a cualquier `<form>` que use React Hook Form + Zod
- [x] Verificar en el browser que no aparecen tooltips nativos de validación del browser

**Criterio de done:** 0 forms con RHF+Zod sin `noValidate`.

---

### Checklist de seguridad final

- [x] JWT: nunca en `localStorage`/`sessionStorage` — solo en Zustand (memoria)
- [x] Cookie `refresh-token`: httpOnly, SameSite=Strict, Secure=true
- [x] `dangerouslySetInnerHTML`: 0 ocurrencias excepto CSS vars del store layout
- [x] Formularios: todos con `noValidate`
- [x] WebSocket: conecta directamente al NestJS (no a través de Next.js API routes)
- [x] Precios en el backend: siempre en centavos enteros (verificar en Network tab)
- [x] Imágenes de usuario: validadas a través de `eslint-disable-next-line` para imágenes externas
