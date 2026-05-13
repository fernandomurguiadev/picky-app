# Plan de Implementación

> Origen: Gestión de proyecto · Orden de entrega sugerido
> Seguir este orden estrictamente. Cada fase debe estar completa y sin errores antes de avanzar.

---

> 🤖 **Instrucción para el agente de desarrollo:** Ejecutar prueba funcional al finalizar cada fase.

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
| F7 | 23 | Búsqueda en tienda (bar Client + backend) | F2-7 | Buscar 'mila' retorna todos los productos con 'mila' en nombre/descripción |
| F7 | 24 | Onboarding wizard para nuevos comercios | F3-11 | Nuevo usuario ve el wizard. Completarlo configura la tienda básica. |
| F8 | 25 | QA integral: flujo completo en móvil 360px, Kanban en tiempo real, FOUC test, LCP medido | Todas | Sin errores bloqueantes. LCP < 2.5s. Kanban funciona en tiempo real. FOUC: ninguno. |
