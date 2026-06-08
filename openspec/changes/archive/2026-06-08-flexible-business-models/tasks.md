# Tareas: Modelos de Negocio Flexibles (Simplificado)

## Fase 1: Base de Datos y API (Fundamentos)

- [x] 1.1 Agregar `storeType` y `customCtaText` a la entidad `StoreSettings`.
- [x] 1.2 Actualizar `UpdateStoreSettingsDto` con reglas de zod/class-validator.
- [x] 1.3 Generar y ejecutar la migración de TypeORM.

## Fase 2: Frontend Admin (Configuración)

- [x] 2.1 Onboarding paso 1: selector de tipo de tienda (retail/servicios). Pasos 2 y 3 adaptan su terminología y ejemplos según el tipo elegido.
- [x] 2.2 Crear página `/admin/settings/business-model` con selector visual de tipo de tienda y campo `customCtaText`.
- [x] 2.3 Ocultar las secciones de "Métodos de Entrega" y "Métodos de Pago" en la nav de Configuración si `storeType === 'services'`.
- [x] 2.4 Sidebar y mobile nav: "Productos" → "Servicios", ocultar "Pedidos" e "Inventario" en modo servicios. Página de catálogo: título, botón, placeholder y empty state dinámicos.
- [x] 2.5 Product form: ocultar option groups y sección "Control de stock" en servicios. Renombrar "Disponible (en stock)" → "Disponible".

## Fase 3: Frontend Store (Vista del Cliente)

- [x] 3.1 Ocultar `cart-badge` (StoreHeader) y `floating-cart-banner` (layout) si `storeType === 'services'`. Creado `StoreConfigProvider` para distribuir config vía contexto.
- [x] 3.2 Crear componente modular `ServiceActionButton`. Props: `serviceName`, `whatsappNumber`, `ctaText`. Construye URL `https://wa.me/{whatsappNumber}?text=Hola, estoy interesado en {serviceName}` y redirige. Sin captura de variantes.
- [x] 3.3 Actualizar `product-card` para renderizar el `ServiceActionButton` si es tienda de servicios, en lugar del botón normal, y ocultar el precio si es `0`.
- [x] 3.4 Actualizar `product-detail-sheet`: muestra `ServiceActionButton`, oculta `VariantSelector` y `QuantitySelector`, y oculta precio si es `0`.

## Fase 4: Testing y Limpieza

- [x] 4.1 Verificar flujo Retail (sin cambios).
- [x] 4.2 Verificar flujo Servicios (sin carrito, directo a WhatsApp, UI adaptada).
