# Resumen Ejecutivo — Gaps Resueltos v1 → v2

> Origen: Revisión técnica · Diferencias entre versión 1 y versión 2 del AF
> Documento de referencia para entender qué cambió y por qué.

---

| Gap identificado en v1 | Estado en v2 | Sección |
|------------------------|-------------|---------|
| WebSocket pasaba por Next.js (imposible) | ✅ Documentado explícitamente: cliente conecta directo a NestJS | [01-arquitectura-frontend.md § 2.4](./01-arquitectura-frontend.md) |
| Resolver slug → tenantId no documentado | ✅ Middleware Next.js con edge caching | [01-arquitectura-frontend.md § 2.5](./01-arquitectura-frontend.md) |
| FOUC de tema dinámico no resuelto | ✅ Inline `<style>` SSR en layout del tenant | [01-arquitectura-frontend.md § 2.6](./01-arquitectura-frontend.md) |
| DaySchedule schema no definido | ✅ Interfaces TypeScript completas con ejemplo | [mod-04-configuracion.md § 3.13](./modulos/mod-04-configuracion.md) |
| ProductFormPage subestimado | ✅ Especificación completa de 5 secciones + autoguardado | [mod-01-catalogo.md § 3.3](./modulos/mod-01-catalogo.md) |
| Bottom sheet sin drag gesture | ✅ vaul (librería con gesture nativo) | [mod-02-tienda-publica.md § 3.5](./modulos/mod-02-tienda-publica.md) |
| Paginación no había componente shared | ✅ PaginationComponent documentado e implementado | [02-componentes-shared.md § 4.2](./02-componentes-shared.md) |
| Notificación sonora sin manejo de bloqueo móvil | ✅ Fallback documentado + registerInteraction pattern | [mod-03-pedidos.md § 3.11](./modulos/mod-03-pedidos.md) |
| Sesión expirada durante edición = pérdida de datos | ✅ Evento `auth:session-expired` + guardado inmediato | [mod-04-configuracion.md § 3.14](./modulos/mod-04-configuracion.md) |
| Dashboard ilegible en 360px | ✅ Versión simplificada para móvil documentada | [mod-05-panel-admin.md § 3.16](./modulos/mod-05-panel-admin.md) |
| Sin estrategia de caché para tienda pública | ✅ `unstable_cache` de Next.js con revalidación | [01-arquitectura-frontend.md § 2.2.4](./01-arquitectura-frontend.md) |
| Stack Angular documentado, ahora Next.js | ✅ Todo el documento actualizado a Next.js 15 + React | Todos |

---

*Documento v2.0 — Stack: Next.js 15 + NestJS 10 + PostgreSQL + Socket.io · Mayo 2026*
*65+ funcionalidades · 6 módulos frontend · 1 backend NestJS · 25 fases de desarrollo*
