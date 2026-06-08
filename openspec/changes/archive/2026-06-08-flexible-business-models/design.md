# Diseño: Modelos de Negocio Flexibles (Simplificado)

## Enfoque Técnico
La configuración del modelo de negocio vivirá 100% a nivel global en `StoreSettings`. No tocaremos la tabla de productos. El frontend actuará como un "intérprete": si la tienda es de servicios, renombrará visualmente los "Productos" a "Servicios", desactivará el widget del carrito, y reemplazará la acción de agregar al carrito por un enlace directo a WhatsApp.

## Decisiones de Arquitectura

### Decisión: Modo Binario de Tienda
**Elección**: La tienda es 100% Retail o 100% Servicios.
**Alternativas consideradas**: Modelo híbrido con bandera `isQuoteOnly` por producto.
**Justificación**: Un modelo binario elimina la necesidad de carritos mixtos y simplifica exponencialmente el código y la experiencia del usuario.

### Decisión: Ocultar Precio para Trabajos a Medida
**Elección**: Si `storeType === 'services'` y el `price` del ítem es 0, el frontend lo oculta.
**Alternativas consideradas**: Hacer el campo `price` opcional en la BD o crear una tabla `services`.
**Justificación**: Mantiene la BD estricta y evita duplicar tablas, esquemas y endpoints.

### Decisión: Implementación de la Acción (Modularidad UI)
**Elección**: Crear componentes de acción separados (`ServiceActionButton` vs `RetailActionButton`) e inyectarlos condicionalmente.
**Justificación**: Evita código espagueti con infinitos `if (storeType === 'services')` dentro de las tarjetas de producto. Mantiene el principio Abierto/Cerrado (SOLID).

### Decisión: Formato del Mensaje de WhatsApp
**Elección**: El mensaje es fijo: `"Hola, estoy interesado en [nombre del servicio]"`. No captura variantes ni opciones.
**Alternativas consideradas**: Capturar las opciones/variantes seleccionadas e incluirlas en el mensaje.
**Justificación**: Una tienda de tipo `services` no tiene option groups — ese concepto pertenece al modelo retail (talle, color, etc.). Las modalidades de un servicio (ej: duración, modalidad) corresponden a un módulo de reservas/turnos fuera del alcance de esta plataforma. El `ServiceActionButton` recibe únicamente `serviceName` y el número de WhatsApp del tenant.

### Decisión: Option Groups en Tiendas de Servicios
**Elección**: Ocultar la sección de option groups en el formulario de producto del Admin si `storeType === 'services'`.
**Justificación**: Los option groups no tienen semántica en un servicio. Mostrarlos genera confusión y lleva al admin a configurar datos que nunca serán utilizados en la vista del cliente.

## Cambios en Archivos

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `api/src/modules/tenants/entities/store-settings.entity.ts` | Modificar | Agregar `storeType` (varchar), `customCtaText` (varchar) |
| `api/src/modules/tenants/dto/update-store-settings.dto.ts` | Modificar | Agregar validación |
| `app/src/app/(admin)/admin/` | Modificar | Selector en Configuración. Renombrar "Productos" a "Servicios". Ocultar pestañas de "Entrega" y "Pagos" para Servicios. |
| `app/src/components/store/actions/service-action-button.tsx` | Nuevo | Componente exclusivo para lógica de WhatsApp. Props: `serviceName`, `whatsappNumber`, `ctaText`. Mensaje: `"Hola, estoy interesado en {serviceName}"` |
| `app/src/components/admin/product-form/` | Modificar | Ocultar sección de option groups si `storeType === 'services'` |
| `app/src/components/store/product-card/product-card.tsx` | Modificar | Inyectar el botón modular correspondiente. Ocultar precio si es 0 |
| `app/src/components/store/product-detail-sheet/product-detail-sheet.tsx` | Modificar | Inyectar el botón modular correspondiente. Ocultar precio si es 0 |
| `app/src/components/store/cart-badge/cart-badge.tsx` | Ocultar | No renderizar si `storeType === 'services'` |
| `app/src/components/store/cart-drawer/cart-drawer.tsx` | Desactivar | No renderizar si `storeType === 'services'` |
| `app/src/components/store/floating-cart-banner/floating-cart-banner.tsx` | Ocultar | No renderizar si `storeType === 'services'` |
| `app/src/components/store/mobile-store-bar/mobile-store-bar.tsx` | Modificar | Ocultar botón de carrito en el footer móvil si es servicios |

## Principio de No Regresión

La restricción no es de código sino de comportamiento: **el flujo retail debe continuar funcionando exactamente igual que antes**. Reescribir o refactorizar componentes es válido si el resultado es una implementación más limpia que soporte ambos modos. Lo que no es aceptable es que una tienda retail pierda funcionalidad existente (carrito, opciones, precios, checkout) como consecuencia de este cambio.

Criterio práctico: si un componente queda más claro reescribiéndolo con soporte dual desde el inicio, se reescribe. Si alcanza con una rama de composición pequeña, se agrega. La guía es la legibilidad y la solidez del resultado, no la preservación del código original.

## Estrategia de Testing
| Capa | Qué probar | Enfoque |
|------|------------|---------|
| Unitario | Valores por defecto | Verificar que `storeType` es retail por defecto |
| Integración | API Settings | Verificar que los nuevos campos se guardan |
