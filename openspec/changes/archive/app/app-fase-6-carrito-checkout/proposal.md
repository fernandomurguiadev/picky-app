# Proposal — app-fase-6-carrito-checkout

## Resumen

Flujo completo de compra: CartStore Zustand con persistencia, CartDrawer lateral, checkout
de 2 pasos (datos del cliente + método de entrega/pago), creación del pedido via API y
apertura automática de WhatsApp con el mensaje del pedido.

## Motivación

Es el flujo de conversión final de la tienda pública. Sin esta fase el cliente puede ver el
catálogo pero no puede realizar pedidos. El dispatch por WhatsApp es el mecanismo principal
de comunicación pedido→comerciante en el MVP.

## Alcance

### Frontend (`app/`)

- `lib/stores/cart.store.ts` — ya creado en FASE 0, completar con lógica tenant
- `components/store/cart-drawer/index.tsx` — panel lateral de carrito
- `components/store/cart-badge/index.tsx` — contador en header
- `app/(store)/[slug]/checkout/page.tsx` — checkout 2 pasos
- `app/(store)/[slug]/order-confirmation/page.tsx` — confirmación con animación
- `lib/utils/whatsapp.ts` — generador de mensaje WhatsApp

## Rutas de API consumidas

| Método | Path | Descripción |
|--------|------|-------------|
| POST | `/orders` | Crear pedido (sin auth) |
| GET | `/stores/:slug/settings` | Para obtener configuración de entrega/pagos en checkout |

## Notas de implementación

- Carrito persiste a localStorage (sin tokens — solo items con precios)
- Al agregar item de una tienda distinta: limpiar carrito automáticamente con `ConfirmModal`
- Subtotal calculado en el frontend (centavos), enviado como `totalAmount` al backend
- Mensaje WhatsApp: generado en el cliente con `encodeURIComponent`, abierto con `window.open`
- Monto mínimo: validar en frontend con los datos de `StoreSettings` antes de crear el pedido
- Página de confirmación: llamar `clearCart()` al montar (idempotente)
