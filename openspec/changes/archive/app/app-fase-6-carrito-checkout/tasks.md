# Tasks — app-fase-6-carrito-checkout

## Fase de implementación: FASE 6 — Tienda Pública: Carrito y Checkout

**Prerequisito:** FASE 5 completada.

---

### FE6.1 — `CartStore` completo

- [x] Completar `lib/stores/cart.store.ts` con campo `tenantId: string | null`
- [x] `addItem`: si `tenantId` actual es distinto al del nuevo item → mostrar `ConfirmModal` de "¿Vaciar carrito?"
- [x] `addItem` cuando el producto ya existe: sumar `quantity`
- [x] `persist` configurado solo para campos que no son tokens
- [x] Verificar que el store NO persiste `accessToken`

**Criterio de done:** Carrito persiste al recargar. No guarda tokens.

---

### FE6.2 — `CartDrawer`

- [x] Crear `components/store/cart-drawer/index.tsx` usando `Sheet` de shadcn/ui
- [x] Lista de items con: imagen thumbnail, nombre, opciones seleccionadas, precio, controles de cantidad
- [x] `QuantitySelector` (shared) por item
- [x] Botón `×` para eliminar item individual
- [x] Subtotal calculado en tiempo real
- [x] Botón "Ir al checkout" → navega a `/[slug]/checkout`
- [x] Botón "Vaciar carrito" con `ConfirmModal`
- [x] Mensaje vacío con `EmptyState` si no hay items

**Criterio de done:** Items editables. Subtotal actualiza en tiempo real.

---

### FE6.3 — `CartBadge` en header

- [x] Crear `components/store/cart-badge/index.tsx`
- [x] Contador del total de items (`quantity` sumada)
- [x] Se oculta si el carrito está vacío
- [x] Animación de rebote al agregar un item (`animate-bounce` por 300ms)
- [x] Al hacer click: abre `CartDrawer`
- [x] Conectar al `StoreHeader` (FASE 4)

**Criterio de done:** Contador animado al agregar. Desaparece cuando el carrito está vacío.

---

### FE6.4 — Checkout paso 1: datos del cliente

- [x] Crear `app/(store)/[slug]/checkout/page.tsx`
- [x] Paso 1: campos `name`, `phone`, `notes` (opcional)
- [x] `<form noValidate>` + RHF + Zod
- [x] Errores inline bajo cada campo
- [x] Botón "Siguiente" → avanzar a paso 2

**Criterio de done:** Validaciones Zod inline. Sin enviar si hay errores.

---

### FE6.5 — Checkout paso 2: entrega y pago

- [x] Paso 2: `deliveryMethod` (radio: delivery/takeaway — según config del tenant)
- [x] Si `delivery`: mostrar input de dirección (requerido)
- [x] `paymentMethod` (radio — solo métodos activos en la config del tenant)
- [x] Mostrar subtotal + costo de envío (si aplica)

**Criterio de done:** Solo muestra métodos activos configurados en la tienda.

---

### FE6.6 — Validar monto mínimo

- [x] Antes de habilitar "Confirmar pedido": verificar subtotal ≥ monto mínimo configurado
- [x] Error visual claro: "El monto mínimo del pedido es $X"
- [x] Botón de confirmación deshabilitado si no se alcanza el mínimo

**Criterio de done:** No se puede confirmar si no se alcanza el mínimo.

---

### FE6.7 — Confirmar pedido: API + WhatsApp

- [x] Al confirmar: `POST /orders` con los datos del pedido (items en centavos)
- [x] Si la API responde 201: generar URL de WhatsApp con `buildWhatsAppUrl`
- [x] Abrir WhatsApp con `window.open(url, '_blank')`
- [x] Redirigir a `/[slug]/order-confirmation`
- [x] Si la API falla: `toast.error` con el mensaje del error

**Criterio de done:** Pedido creado en la BD. WhatsApp se abre con mensaje correcto.

---

### FE6.8 — Página de confirmación

- [x] Crear `app/(store)/[slug]/order-confirmation/page.tsx`
- [x] `useEffect` → `clearCart()` al montar
- [x] Animación: icono checkmark verde con `animate-in zoom-in-50`
- [x] Número de pedido visible (si la API lo retorna)
- [x] Botón "Seguir comprando" → volver al home de la tienda

**Criterio de done:** Carrito limpiado al llegar. Animación visible.

---

### Verificación final

- [x] `npm run typecheck` — sin errores
- [x] Verificar que `cart-storage` en localStorage no contiene tokens
- [x] Mensaje de WhatsApp generado correctamente (probar con console.log antes de window.open)
- [x] Probar en 360px: checkout completamente funcional
