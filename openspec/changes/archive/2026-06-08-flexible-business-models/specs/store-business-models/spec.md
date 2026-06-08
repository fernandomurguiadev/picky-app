# Especificación: store-business-models

## Propósito

Define los modos operativos para las tiendas (retail o servicios) y cómo alteran el flujo de pago (checkout) y el llamado a la acción (CTA).

## Requisitos

### Requisito: Tipos de Tienda Binario

El sistema DEBE permitir que una tienda opere en uno de dos modos globales (`retail`, `services`).

#### Escenario: Tienda Retail por Defecto
- DADO una tienda sin `storeType` configurado explícitamente
- CUANDO se cargan las configuraciones de la tienda
- ENTONCES el sistema DEBERÍA aplicar el modo `retail` por defecto.

### Requisito: Texto de CTA Personalizado

El sistema DEBE soportar un texto de CTA configurable que reemplace "Agregar al Carrito" cuando el modo lo requiera.

#### Escenario: CTA en Tienda de Servicios
- DADO una tienda configurada como `services` con `customCtaText` = "Pedir Turno"
- CUANDO un usuario visualiza la lista de productos
- ENTONCES todos los botones de los productos DEBEN mostrar "Pedir Turno" en lugar del texto por defecto de agregar al carrito.

#### Escenario: Ocultar precio base cuando es cero
- DADO una tienda configurada como `services`
- Y un producto de esa tienda tiene `price` exactamente igual a `0`
- CUANDO un usuario ve la tarjeta del producto
- ENTONCES el precio visual DEBE estar completamente oculto.
