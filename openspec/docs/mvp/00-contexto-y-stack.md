# MVP — Contexto, Alcance y Stack Tecnológico
## Plataforma E-Commerce de Proximidad
**Para desarrollo por agente IA · Next.js 15 · Mobile-First · Latam**

| Versión | Stack | Objetivo | Fecha |
|---------|-------|----------|-------|
| v2.0 | Next.js 15 + NestJS 10 | Demo-Ready MVP | May 2026 |

> ⚠️ **INSTRUCCIÓN PARA EL AGENTE DE DESARROLLO:**
> Este documento es el contrato técnico completo del MVP. Cada módulo, vista, componente y funcionalidad debe implementarse exactamente como se especifica. Las secciones de arquitectura técnica son de cumplimiento obligatorio. No omitir ningún criterio de aceptación. Mobile-first es un requerimiento no negociable.
> **IMPORTANTE:** Los WebSockets se conectan **directamente al servidor NestJS**, nunca a través de Next.js Route Handlers. Los Route Handlers de Next.js no soportan conexiones persistentes.


---

## SECCIÓN 1 — CONTEXTO, ALCANCE Y OBJETIVOS DEL MVP

### 1.1 Objetivos del MVP

| Objetivo | Descripción | Criterio de éxito |
|----------|-------------|-------------------|
| Demo funcional completa | Todo el flujo cliente-final y admin debe funcionar sin errores en una demo en vivo | Zero errores bloqueantes en demo de 20 minutos |
| Superar experiencia de Pedix | UX/UI notablemente superior en mobile, con animaciones, feedback visual y diseño premium | Evaluación subjetiva positiva vs Pedix en primera impresión |
| Arquitectura escalable | El código generado debe ser extensible para sumar módulos futuros sin refactoring mayor | Estructura de módulos Next.js independientes, servicios desacoplados |
| Mobile-first completo | Toda vista debe ser perfectamente usable en móvil 360px antes de adaptarse a desktop | Prueba en viewport 360×640 sin scroll horizontal ni elementos rotos |
| Panel administrador operativo | El administrador puede gestionar su tienda sin asistencia técnica | Onboarding completo sin documentación adicional |

### 1.2 Módulos incluidos en el MVP

✅ **Módulos MVP (incluidos):**
- MOD-01 Catálogo Digital
- MOD-02 Tienda Pública
- MOD-03 Gestión de Pedidos
- MOD-04 Configuración de Tienda
- MOD-05 Panel Administrador
- MOD-06 Autenticación y Seguridad

❌ **Módulos EXCLUIDOS del MVP:**
- Pagos online y pasarelas
- Facturación electrónica
- Integraciones logísticas externas
- CRM avanzado y fidelización
- Módulo de marketing / Meta Ads
- Multi-sucursal
- Analytics avanzado

### 1.3 Stack tecnológico definido

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| Frontend framework | Next.js (App Router) | 15.x | SSR nativo, RSC, optimización de imágenes, routing file-system |
| Lenguaje | TypeScript | 5.x | Tipado estricto en todo el stack |
| Estado global cliente | Zustand | ^5 | Liviano, sin boilerplate, compatible con RSC |
| Estado servidor (cache) | TanStack Query (React Query) | ^5 | Cache de server state, invalidación, optimistic updates |
| Estilos | Tailwind CSS v4 | ^4 | Utility-first, mobile-first nativo, purge automático |
| Componentes UI | shadcn/ui | latest | Componentes accesibles basados en Radix UI, 100% customizables |
| Bottom Sheet / Drawer móvil | vaul | ^1 | Librería oficial de drag gesture que shadcn Sheet usa internamente |
| Formularios | React Hook Form + Zod | ^7 / ^3 | Validaciones complejas, UX de errores inline, inferencia de tipos |
| HTTP Client | Axios + interceptors | ^1 | Manejo centralizado de auth headers, retry, error handling |
| Backend / API | Node.js + NestJS | ^10 | REST API. Módulos desacoplados. DTO + class-validator |
| Base de datos | PostgreSQL + TypeORM | PG 16 | Multi-tenant por tenant_id. Migraciones versionadas |
| Almacenamiento | Cloudinary o S3 compatible | — | Imágenes con transformación on-the-fly (resize, webp) |
| Autenticación | JWT + Refresh Tokens | — | Access token 15min, refresh 7d. Almacenamiento en httpOnly cookie |
| WebSocket | Socket.io (NestJS backend) + socket.io-client | ^4 | Pedidos en tiempo real. **Cliente conecta DIRECTO al NestJS, no pasa por Next.js** |
| Contenedores | Docker + docker-compose | — | Dev y producción unificados. Variables de entorno por stage |
