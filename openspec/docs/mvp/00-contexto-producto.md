# CONTEXTO DEL PROYECTO — Instrucción para Agentes Desarrolladores
## Plataforma SaaS de E-Commerce de Proximidad · Latam

> 📌 **Este documento debe leerse ANTES de ejecutar cualquier tarea de desarrollo.**
> Su propósito es darte el contexto completo del producto, el negocio, los usuarios, las decisiones de arquitectura y las reglas que no están en el spec técnico pero que son igual de importantes. Un agente que entiende el "por qué" toma mejores decisiones que uno que solo ejecuta el "qué".

---

## 1. QUÉ ES ESTE PRODUCTO

Es una **plataforma SaaS multi-tenant** que permite a comercios físicos pequeños y medianos de Latinoamérica tener su propia **tienda digital en minutos**, sin saber programar y sin pagar una agencia.

Cada comercio que se registra obtiene:
- Una **tienda pública** accesible en una URL propia (`plataforma.com/nombre-del-comercio`) donde sus clientes pueden ver el catálogo, armar un pedido y enviarlo por WhatsApp.
- Un **panel administrador** accesible desde el celular para gestionar el catálogo, ver y procesar pedidos en tiempo real, y configurar todos los aspectos de la tienda.

El producto **no es un marketplace**. Cada tienda es independiente y solo muestra los productos del comercio dueño de ese slug. Los clientes no tienen cuenta, no se registran, no hay login del lado del cliente.

---

## 2. A QUIÉN ESTÁ DIRIGIDO

### 2.1 El comerciante (usuario primario del panel admin)

Es el dueño o encargado de un negocio físico pequeño o mediano en Latinoamérica. Ejemplos reales del target:

- Restaurante o rotisería que recibe pedidos por WhatsApp y los anota en papel o en un chat grupal
- Almacén o dietética con delivery propio en el barrio
- Pizzería, hamburguesería, o panadería con carta variable por día
- Comercio de ropa o accesorios que vende por Instagram y WhatsApp

**Características clave de este usuario:**
- Trabaja desde el celular. No tiene tiempo de sentarse frente a una computadora mientras atiende el local.
- No es técnico. No sabe qué es una API, un JSON, ni un slug.
- Está acostumbrado a WhatsApp como herramienta de negocio principal.
- Tiene conexión de datos variable (no siempre 4G estable).
- Su horario de mayor actividad coincide con el horario de atención del comercio: mediodía y noche.
- Si algo no funciona en el momento pico de pedidos, lo abandona y vuelve al papel.

**Lo que más le importa:**
1. Ver los pedidos nuevos al instante, sin tener que recargar la página.
2. Poder gestionar todo desde el celular con una mano (la otra está en la caja o en la cocina).
3. Que sus clientes puedan pedir fácil, sin fricción, sin registrarse.
4. Que el sistema se vea profesional — es la imagen de su negocio.

### 2.2 El cliente final (usuario de la tienda pública)

Es el consumidor que entra a la tienda del comercio. Puede haberle llegado el link por WhatsApp, Instagram, un QR impreso, o buscando en Google.

**Características clave:**
- Entra sin registrarse. No hay login, no hay cuenta, no hay contraseña.
- En la gran mayoría de los casos, está en el celular.
- Tiene poca paciencia: si la tienda tarda en cargar o es confusa, cierra y llama por teléfono.
- Está acostumbrado a pedir por WhatsApp. El checkout que termina en WhatsApp le resulta familiar y confiable.
- Puede estar en una zona con señal de datos mediocre.

**Lo que más le importa:**
1. Ver bien el menú o catálogo, con fotos.
2. Poder personalizar su pedido (sin cebolla, tamaño grande, extra queso).
3. Saber cuánto le va a salir antes de confirmar.
4. Que el proceso sea rápido — de entrar a enviar el pedido por WA en menos de 2 minutos.

---

## 3. EL PROBLEMA QUE RESUELVE

### Situación actual del mercado objetivo

La mayoría de estos comercios hoy operan así:
1. El cliente manda un WhatsApp al número del negocio.
2. El encargado lee el mensaje, responde confirmando disponibilidad y precio.
3. El pedido se anota en papel, en un chat de WhatsApp interno, o en una nota del celular.
4. Se arma el pedido, se coordina la entrega, se cobra.

**Los problemas de ese flujo:**
- Se pierden pedidos porque nadie leyó el mensaje a tiempo.
- El encargado tiene que tipear precio y disponibilidad cada vez.
- No hay registro histórico de pedidos ni de clientes.
- La imagen del negocio parece amateur frente a competidores con app propia.
- No hay forma de mostrar fotos, variantes, ni precios actualizados de forma escalable.

### Lo que esta plataforma resuelve

- El cliente arma el pedido solo, con fotos, variantes y precios claros.
- El mensaje de WhatsApp que llega al comerciante ya viene estructurado, con todos los detalles.
- El panel admin muestra los pedidos en tiempo real, organizados por estado.
- El comerciante puede responder y actualizar el estado del pedido desde el celular.
- El historial queda registrado.

### Lo que NO resuelve (y no debe prometer)

- **No procesa pagos online.** El pago sigue siendo por fuera: efectivo, transferencia, etc. Decisión deliberada para el MVP — las pasarelas de pago en Latam tienen complejidad regulatoria y de onboarding fuera del scope inicial.
- **No reemplaza a un sistema de gestión (ERP/POS).** No hay control de stock real, no hay facturación electrónica, no hay integración contable.
- **No es logística.** No gestiona repartidores, no integra con plataformas de delivery como Rappi o PedidosYa.
- **No es CRM.** No hay fidelización, puntos, cupones ni campañas de marketing en este MVP.

---

## 4. COMPETIDOR DE REFERENCIA: PEDIX

El benchmark directo es **Pedix** (pedix.app), una plataforma similar actualmente activa en el mercado latinoamericano, principalmente en Argentina.

**Por qué Pedix es el benchmark:**
- Resuelve el mismo problema con un enfoque similar (tienda pública + WhatsApp dispatch + panel admin).
- Es conocido en el segmento gastronómico argentino.
- Sus limitaciones actuales son la oportunidad de diferenciación de este producto.

**Dónde Pedix falla (y dónde este producto debe ser mejor):**

| Área | Pedix hoy | Este producto debe |
|------|-----------|-------------------|
| Panel admin en móvil | Difícil de usar en celular, pensado para desktop | Ser 100% operable con una mano en 360px |
| Diseño visual | Funcional pero genérico, anticuado | Premium, moderno, con animaciones y micro-interacciones |
| Tiempo real | Requiere recargar para ver pedidos nuevos | WebSocket: los pedidos aparecen instantáneamente |
| Experiencia del cliente | Básica, sin animaciones, lenta | Fluida, rápida, con feedback visual en cada acción |
| Onboarding del comerciante | Tedioso | Wizard de 5 pasos, funcional en minutos |

**Lo que Pedix hace bien y no hay que romper:**
- El concepto de dispatch por WhatsApp funciona y los comerciantes lo entienden.
- La simplicidad del flujo del cliente (sin registro) es correcta y debe mantenerse.

---

## 5. MODELO DE NEGOCIO (CONTEXTO PARA DECISIONES TÉCNICAS)

Aunque el modelo de monetización no está implementado en el MVP, entenderlo es importante para tomar decisiones de arquitectura correctas.

**El modelo inferido es SaaS por suscripción mensual**, con planes diferenciados por volumen de pedidos o funcionalidades. Los módulos excluidos del MVP (analytics avanzado, CRM, multi-sucursal, Meta Ads, facturación) son claramente **features de planes superiores**.

**Implicaciones técnicas de esto:**

1. **La arquitectura multi-tenant es no negociable.** Cada comercio es un tenant aislado. Sus datos no pueden cruzarse con los de otro comercio bajo ninguna circunstancia. El `tenant_id` debe estar en absolutamente todas las tablas y filtrarse en absolutamente todas las queries.

2. **El sistema debe poder escalar a cientos de comercios** sin cambios estructurales. La estrategia de `tenant_id` en cada tabla (row-level tenancy) es la correcta para este volumen. No es necesario un schema separado por tenant en PostgreSQL hasta miles de comercios.

3. **Las funcionalidades deben poder activarse/desactivarse por plan.** Aunque no está implementado en el MVP, el código debe estar estructurado de forma que agregar un feature flag por tenant sea sencillo. Evitar lógica hardcodeada que asuma que todos los tenants tienen las mismas capacidades.

4. **El onboarding debe ser autónomo.** El comerciante no debe necesitar contactar soporte para empezar a usar la plataforma. El wizard de 5 pasos es crítico para el modelo de negocio — un comerciante que no completa el onboarding no convierte.

---

## 6. EL FLUJO COMPLETO DEL PRODUCTO

Entender el flujo de punta a punta es esencial antes de tocar cualquier módulo.

### Flujo del comerciante (setup inicial)

```
1. Se registra en la plataforma (email + contraseña + nombre del negocio)
   → Se crea automáticamente un tenant con un slug basado en el nombre

2. Onboarding wizard (5 pasos):
   → Paso 1: Información del negocio (nombre, WhatsApp, dirección)
   → Paso 2: Logo e imagen de portada
   → Paso 3: Primera categoría del catálogo
   → Paso 4: Primer producto con foto y precio
   → Paso 5: Configurar forma de entrega (delivery/takeaway/presencial)

3. Recibe su URL: plataforma.com/mi-negocio
4. La comparte con sus clientes por WhatsApp, Instagram, QR
```

### Flujo del cliente final (pedido)

```
1. Entra a plataforma.com/nombre-del-negocio desde el link o QR
2. Ve el home: logo, nombre, estado abierto/cerrado, categorías, destacados
3. Toca una categoría → ve los productos con fotos y precios
4. Toca un producto → bottom sheet con detalle, variantes y cantidad
5. Selecciona variantes (tamaño, extras, cocción...) → Agregar al carrito
6. Repite para más productos
7. Abre el carrito → revisa ítems y total
8. Toca "Hacer pedido" → Checkout paso 1: nombre y teléfono (y dirección si es delivery)
9. Checkout paso 2: elegir entrega y forma de pago
10. Confirma → se abre WhatsApp con el mensaje armado listo para enviar
11. El cliente envía el mensaje al número del comercio
12. Pantalla de confirmación con número de pedido
```

### Flujo del comerciante (operación diaria)

```
1. Abre el panel admin en el celular
2. Dashboard: ve pedidos del día, facturación, pedidos pendientes
3. Cuando llega un pedido nuevo:
   → Notificación sonora + visual instantánea (WebSocket)
   → El pedido aparece en la columna "Nuevos" del kanban
4. Toca el pedido → ve el detalle completo
5. Confirma el pedido → se mueve a "En preparación"
6. Cuando está listo → "En camino" (si es delivery) o "Listo para retirar"
7. Al entregar → "Entregado"
8. Si hay problema → "Cancelado" con motivo
```

---

## 7. DECISIONES DE ARQUITECTURA Y SU RAZÓN DE SER

Estas decisiones ya están tomadas. No deben cuestionarse ni revertirse. Si algo parece no encajar, el problema probablemente está en la implementación, no en la decisión.

### 7.1 Next.js App Router con RSC (no Pages Router, no SPA pura)

**Por qué:** La tienda pública necesita SSR para que el LCP sea menor a 2.5s en 4G y para que Google pueda indexar el catálogo. El panel admin puede ser más SPA-like pero vive en el mismo proyecto para simplificar el deploy. RSC permite hacer fetch de datos en el servidor sin useEffect, lo que reduce el tiempo a primer contenido visible.

**Implicación práctica:** Los componentes son Server Components por defecto. Solo se agrega `'use client'` cuando hay interactividad real (onClick, useState, WebSocket, Zustand). No agregar `'use client'` por costumbre o porque "siempre lo hice así".

### 7.2 WebSocket directo al NestJS, no pasando por Next.js

**Por qué:** Los Route Handlers de Next.js son funciones serverless. Terminan en cuanto retornan una respuesta. No pueden mantener una conexión abierta. Intentar implementar WebSocket en un Route Handler falla silenciosamente o con errores crípticos.

**Implicación práctica:** El frontend Next.js tiene DOS orígenes de datos:
- `NEXT_PUBLIC_API_URL` → para llamadas REST (puede ser el mismo dominio con proxy o distinto)
- `NEXT_PUBLIC_NESTJS_WS_URL` → para WebSocket, siempre apunta directamente al servidor NestJS

Ambas variables de entorno deben estar definidas. El WebSocket nunca pasa por `/api/` de Next.js.

### 7.3 Tema dinámico por tenant con SSR anti-FOUC

**Por qué:** Si los colores del tema se aplican en el cliente (con useEffect o con un script), hay un flash visual donde el cliente ve los colores default antes de que se apliquen los del comercio. En una demo eso se ve amateur. En producción genera una mala primera impresión.

**Implicación práctica:** El `layout.tsx` de `app/(store)/[slug]/` es async, hace fetch del tema del tenant en el servidor, y renderiza un `<style>` inline en el `<head>` con las CSS variables antes de que llegue cualquier CSS externo. Esto garantiza que el primer paint ya tiene los colores correctos.

### 7.4 Zustand para estado del carrito con middleware persist

**Por qué:** El carrito debe persistir aunque el usuario cierre el browser. localStorage es la única opción viable sin login. Zustand con el middleware `persist` lo hace en 3 líneas. Redux sería excesivo para este caso de uso.

**Implicación práctica:** El store del carrito vive en el cliente. No intentar leerlo en Server Components. Si necesitás el conteo del carrito en el header del servidor, pasalo como prop desde el Client Component que wrappea el header.

### 7.5 TanStack Query para estado del server en el admin

**Por qué:** El panel admin necesita datos frescos, invalidación de caché cuando el admin cambia algo, y optimistic updates para que la UI responda instantáneamente sin esperar al servidor. TanStack Query resuelve todo esto con muy poco código. useEffect + fetch manual es propenso a bugs de race condition y doble fetch.

**Implicación práctica:** Todos los datos del admin (pedidos, productos, categorías, settings) viven en el cache de TanStack Query. Las mutaciones usan `onMutate` para optimistic update y `onError` para rollback. El WebSocket invalida el cache cuando llegan eventos nuevos, no reemplaza a TanStack Query.

### 7.6 vaul para bottom sheets en móvil

**Por qué:** shadcn/ui `Sheet` es un drawer simple sin soporte de drag gesture. En móvil, el usuario espera poder cerrar el detalle de un producto arrastrando hacia abajo. Si no puede, la UX se siente como una web del 2015. vaul es la librería que shadcn usa internamente y provee drag gesture, snap points y backdrop nativo.

**Implicación práctica:** Para el detalle de producto en móvil, usar `vaul` directamente (`import { Drawer } from 'vaul'`). Para el carrito en móvil, también vaul. shadcn `Sheet` se puede usar para cosas simples que no necesiten drag (menú lateral del admin en mobile, por ejemplo).

### 7.7 Row-level tenancy con tenant_id en cada tabla

**Por qué:** Es el approach más simple para el volumen objetivo (decenas a cientos de comercios). Schema-per-tenant requeriría migraciones más complejas y no aporta beneficio real a esta escala. Database-per-tenant sería demasiado costoso operativamente.

**Implicación práctica:** **Absolutamente toda** query al backend que no sea pública debe filtrar por `tenantId`. No hay excepciones. El `TenantContextInterceptor` de NestJS extrae el `tenantId` del JWT y lo adjunta al request para que todos los servicios lo usen. Para las rutas públicas de la tienda (sin JWT), el `tenantId` se resuelve desde el `slug` via el middleware de Next.js que lo pasa como header `x-tenant-id`.

---

## 8. LO QUE NO DEBE HACERSE (ANTI-PATTERNS)

Esta sección existe porque los errores más costosos no son los bugs técnicos sino las decisiones de diseño equivocadas que hay que revertir. Leer antes de implementar cualquier módulo.

### ❌ No implementar WebSocket dentro de Next.js Route Handlers
Ya explicado en §7.2. Si ves código que hace `new WebSocketServer()` o similar dentro de `app/api/`, está mal. El WebSocket vive 100% en NestJS.

### ❌ No aplicar el tema del tenant con useEffect en el cliente
Si ves `useEffect(() => { document.documentElement.style.setProperty('--color-primary', ...) })` en el layout de la tienda pública, va a causar FOUC. El tema debe aplicarse como `<style>` inline en el servidor (ver [01-arquitectura-frontend.md § 2.6](./01-arquitectura-frontend.md)).

### ❌ No hardcodear colores en componentes de la tienda pública
Todos los colores de la tienda pública deben usar las CSS variables (`var(--color-primary)`, etc.) o las clases Tailwind que las usan. Si un componente tiene `#1565C0` hardcodeado, el sistema de temas no va a funcionar para ese comercio.

### ❌ No implementar la paginación inline en cada lista
El componente `Pagination` es shared y debe usarse en todas las listas (productos admin, pedidos admin, etc.). Implementar la paginación de forma distinta en cada página genera inconsistencia visual y bugs difíciles de rastrear (ver [02-componentes-shared.md § 4.2](./02-componentes-shared.md)).

### ❌ No hacer fetch en useEffect para datos iniciales de páginas
En Next.js App Router, el fetch de datos iniciales va en el Server Component de la página (la función async por defecto). useEffect + fetch es el patrón de Pages Router. Usarlo en App Router genera waterfalls de red y peor performance.

### ❌ No olvidar el tenant_id en ninguna query del backend
Una query sin filtro de `tenantId` en una ruta autenticada es una brecha de seguridad. Un comercio nunca debe poder ver, modificar ni borrar datos de otro comercio. TypeORM no lo hace automáticamente — el desarrollador debe incluirlo explícitamente en cada `find`, `findOne`, `update`, etc.

### ❌ No agregar 'use client' por defecto a todos los componentes
Es el error más común al migrar de SPA a Next.js App Router. `'use client'` debe agregarse solo cuando el componente usa hooks de React, eventos del browser, o APIs del cliente (localStorage, WebSocket, etc.). Todo lo demás debe ser Server Component para maximizar el rendimiento.

### ❌ No mostrar pantallas vacías mientras carga
Siempre usar `SkeletonLoader` durante estados de carga. Nunca una pantalla en blanco, nunca solo un spinner sin contexto. Es el criterio de aceptación CA-008.

---

## 9. VOCABULARIO DEL DOMINIO

Para evitar ambigüedades, estos términos tienen significado específico en este proyecto:

| Término | Significado en este proyecto |
|---------|------------------------------|
| **Tenant** | Un comercio registrado en la plataforma. Tiene un ID único (`tenantId`) y un slug único (ej: `la-pizzeria-de-juan`). |
| **Slug** | El identificador URL-friendly del comercio. Aparece en la URL pública: `plataforma.com/[slug]`. Debe ser único, sin espacios, sin mayúsculas. |
| **Tienda pública** | El frontend visible para el cliente final. Accesible sin login en `plataforma.com/[slug]`. |
| **Panel admin** | El backoffice del comerciante. Accesible con login en `plataforma.com/admin`. |
| **Producto** | Un ítem del catálogo. Tiene nombre, precio, imágenes, y puede tener grupos de opciones (variantes). |
| **Categoría** | Agrupación de productos. Ej: "Hamburguesas", "Bebidas", "Postres". |
| **Grupo de opciones** | Un conjunto de modificadores de un producto. Ej: "Tamaño" (radio), "Extras" (checkbox). |
| **Opción** | Un ítem dentro de un grupo de opciones. Puede tener precio adicional. Ej: "Grande (+$300)". |
| **Variante seleccionada** | La opción que el cliente eligió al agregar el producto al carrito. |
| **Carrito** | La selección de productos del cliente antes de hacer el pedido. Persiste en localStorage. |
| **Pedido** | El carrito confirmado con datos del cliente y forma de entrega. Se registra en la BD al hacer el checkout. |
| **Dispatch** | El acto de enviar el pedido al comerciante. En este MVP se hace abriendo WhatsApp con el mensaje armado. |
| **Order number** | Identificador legible del pedido. Formato: `ORD-YYYYMMDD-XXX`. Visible para el cliente y el comerciante. |
| **Kanban** | Vista de pedidos del admin organizada en columnas por estado. |
| **Turno** | Un rango horario dentro de un día. Un comercio puede tener hasta 2 turnos por día (ej: 9-13 y 17-21). |
| **Tema** | Los colores primario y de acento que el comerciante elige para su tienda. Se aplican como CSS variables. |
| **FOUC** | Flash of Unstyled Content. El parpadeo visual que ocurre cuando los estilos se aplican después del primer render. A evitar. |

---

## 10. CONTEXTO DEL EQUIPO Y FORMA DE TRABAJO

### Cómo se usa este documento en el proceso de desarrollo

El desarrollo de este MVP está siendo realizado por **agentes de IA** guiados por prompts. El spec técnico es el contrato de implementación. Este documento de contexto es el briefing previo que debe leerse antes de ejecutar cualquier tarea.

**El flujo de trabajo esperado para cada tarea es:**

```
1. Leer este documento de contexto (una sola vez al inicio)
2. Leer la sección relevante del spec técnico para la tarea
3. Verificar las dependencias de la fase en el plan de implementación (06-plan-implementacion.md)
4. Implementar
5. Validar contra los criterios de aceptación (05-criterios-aceptacion.md)
6. No avanzar a la siguiente fase hasta que la actual esté sin errores
```

### Principio de implementación más importante

**El producto es para el celular primero.** Cada decisión de diseño, cada componente, cada layout debe pensarse primero en 360px de ancho. La versión desktop es una adaptación de la versión móvil, nunca al revés.

Si en algún momento un componente "no cabe" en 360px, el problema no es el viewport — es el diseño del componente. Hay que rediseñarlo, no hacer scroll horizontal ni reducir el font-size a menos de 12px.

### Criterio de "terminado"

Una tarea no está terminada hasta que:
- Funciona en Chrome mobile en viewport 360px sin scroll horizontal ni elementos rotos
- Tiene skeleton loader durante los estados de carga
- Los formularios tienen validación inline con mensajes descriptivos
- No hay colores hardcodeados (todo via CSS variables o clases Tailwind)
- No hay `console.error` ni warnings en la consola del browser
- La prueba funcional del entregable de validación de esa fase pasa sin errores

---

## 11. VARIABLES DE ENTORNO REQUERIDAS

### Frontend (Next.js) — `.env.local`

```bash
# URL base del backend NestJS para llamadas REST
NEXT_PUBLIC_API_URL=http://localhost:3001

# URL del servidor NestJS para conexión WebSocket directa
# NUNCA apuntar esto a Next.js — los Route Handlers no soportan WS
NEXT_PUBLIC_NESTJS_WS_URL=http://localhost:3001

# Solo si se usa Next.js como proxy para la API (opcional)
# API_URL=http://nestjs:3001  # URL interna docker-compose
```

### Backend (NestJS) — `.env`

```bash
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce_db

# JWT
JWT_SECRET=tu-secret-muy-largo-y-seguro
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=otro-secret-diferente
REFRESH_TOKEN_EXPIRES_IN=7d

# Cloudinary (o S3)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# CORS — URL del frontend Next.js
FRONTEND_URL=http://localhost:3000
```

---

## 12. GUÍA RÁPIDA DE REFERENCIA

Para que el agente pueda encontrar rápidamente qué documentación aplica a cada tarea:

| Si estás trabajando en... | Lee... |
|--------------------------|--------|
| Cualquier tarea | Este documento primero |
| Setup inicial del proyecto | [00-contexto-y-stack.md § 1.3](./00-contexto-y-stack.md), [06-plan-implementacion.md Fase F0](./06-plan-implementacion.md) |
| Cualquier componente de la tienda pública | [01-arquitectura-frontend.md § 2.5-2.6](./01-arquitectura-frontend.md), [modulos/mod-02-tienda-publica.md](./modulos/mod-02-tienda-publica.md) |
| Bottom sheet de detalle de producto | [modulos/mod-02-tienda-publica.md § 3.5](./modulos/mod-02-tienda-publica.md) |
| Carrito y persistencia | [modulos/mod-02-tienda-publica.md § 3.6](./modulos/mod-02-tienda-publica.md) |
| Checkout y WhatsApp dispatch | [modulos/mod-02-tienda-publica.md § 3.7](./modulos/mod-02-tienda-publica.md) |
| Panel admin — cualquier módulo | [01-arquitectura-frontend.md § 2.2](./01-arquitectura-frontend.md), [modulos/mod-05-panel-admin.md](./modulos/mod-05-panel-admin.md) |
| Kanban de pedidos | [modulos/mod-03-pedidos.md § 3.10](./modulos/mod-03-pedidos.md) |
| WebSocket | [01-arquitectura-frontend.md § 2.4](./01-arquitectura-frontend.md), [03-backend-api.md § 5.4](./03-backend-api.md) |
| Notificaciones sonoras | [modulos/mod-03-pedidos.md § 3.11](./modulos/mod-03-pedidos.md) |
| Dashboard admin | [modulos/mod-05-panel-admin.md § 3.16](./modulos/mod-05-panel-admin.md) |
| Formularios | [01-arquitectura-frontend.md § 2.2.5](./01-arquitectura-frontend.md) |
| Horarios de atención | [modulos/mod-04-configuracion.md § 3.13](./modulos/mod-04-configuracion.md) |
| Tema dinámico | [01-arquitectura-frontend.md § 2.6](./01-arquitectura-frontend.md) |
| Autenticación y guards | [modulos/mod-06-autenticacion.md](./modulos/mod-06-autenticacion.md) |
| Sesión expirada durante edición | [modulos/mod-04-configuracion.md § 3.14](./modulos/mod-04-configuracion.md) |
| Paginación | [02-componentes-shared.md § 4.2](./02-componentes-shared.md) |
| Shared components | [02-componentes-shared.md § 4.1](./02-componentes-shared.md) |
| Backend — cualquier endpoint | [03-backend-api.md § 5.3](./03-backend-api.md), [03-backend-api.md § 5.5](./03-backend-api.md) |
| Performance y caché | [01-arquitectura-frontend.md § 2.2.4](./01-arquitectura-frontend.md), [05-criterios-aceptacion.md § 7.2](./05-criterios-aceptacion.md) |
| Criterios de aceptación | [05-criterios-aceptacion.md](./05-criterios-aceptacion.md) |

---

*Documento de contexto v1.0 · Proyecto: Plataforma E-Commerce de Proximidad Latam · Mayo 2026*
*Leer antes de ejecutar cualquier tarea de desarrollo.*
