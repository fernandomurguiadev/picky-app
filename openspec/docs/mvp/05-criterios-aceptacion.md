# Criterios de Aceptación del MVP

> Origen: QA / Product · Validación antes de demo
> Todos los criterios deben cumplirse antes de considerar el MVP completo.

---

## 7.1 Criterios de aceptación por módulo

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

---

## 7.2 Métricas de performance objetivo

| Métrica | Objetivo | Herramienta |
|---------|----------|-------------|
| Largest Contentful Paint (LCP) | < 2.5s (4G) | Lighthouse, WebPageTest |
| First Input Delay (FID) | < 100ms | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| Bundle size inicial (lazy chunk) | < 200KB gzipped por ruta | next/bundle-analyzer |
| Tiempo hasta primer pedido visible (admin) | < 1.5s después de login | Performance DevTools |
| Latencia WebSocket (nuevo pedido) | < 500ms desde creación en BD | Network DevTools |
| Cache hit rate (unstable_cache) | > 80% para datos de tienda pública | Logs de Next.js |
