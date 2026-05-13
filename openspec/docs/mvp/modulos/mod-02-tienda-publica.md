# MOD-02 — Tienda Pública

> Origen: Frontend Tienda (store) · Rutas del grupo `(store)`
> Rutas: `/[slug]`, `/[slug]/category/[id]`, `/[slug]/checkout`, `/[slug]/order-confirmation`

---

## 3.4 Tabla de funcionalidades

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| T-001 | Home de la tienda | Header con logo, nombre del comercio y estado abierto/cerrado. Grilla de categorías. Sección de productos destacados. Banner de anuncios deslizable. | /[slug] — StoreHomePage (RSC) | 🔴 |
| T-002 | Indicador abierto/cerrado | Badge dinámico calculado en servidor con los horarios del tenant. Si cerrado: muestra próxima apertura. | StoreStatusBadge (Server Component) | 🔴 |
| T-003 | Listado de categoría | Lista de productos de la categoría. Barra de búsqueda. | /[slug]/category/[id] — CategoryPage (RSC) | 🔴 |
| T-004 | Card de producto | Imagen principal, nombre, precio, badge 'Agotado'. Botón + para agregar rápido. | ProductCard (Client Component) | 🔴 |
| T-005 | Detalle de producto | **vaul Drawer** en móvil (drag gesture nativo), Dialog en desktop. Carrusel de imágenes, variantes, notas, cantidad. | ProductDetailSheet / ProductDetailDialog | 🔴 |
| T-006 | Selector de variantes | Chips para radio, checkboxes para múltiple. Precio adicional visible. Validación de grupos requeridos. | VariantSelector (Client Component) | 🔴 |
| T-007 | Carrito persistente | Drawer lateral (desktop) o Sheet (móvil). Items, variantes, cantidades, totales. Persiste en Zustand con localStorage middleware. | CartDrawer (Client Component) | 🔴 |
| T-008 | Badge de carrito | Burbuja con cantidad de items. Animación bump al agregar (CSS keyframes). | CartBadge (Client Component) | 🔴 |
| T-009 | Checkout — Datos cliente | Form RHF+Zod: nombre, teléfono, dirección condicional. | /[slug]/checkout — StepCustomerForm | 🔴 |
| T-010 | Checkout — Entrega y pago | Selección de entrega y método de pago. Validación de monto mínimo. | /[slug]/checkout — StepDelivery | 🔴 |
| T-011 | Dispatch por WhatsApp | Generar mensaje estructurado y abrir wa.me con el número del comercio. Resumen previo al envío. | whatsapp.util.ts + ConfirmStep | 🔴 |
| T-012 | Pantalla confirmación de pedido | Número de orden, resumen, instrucciones. Animación de checkmark SVG + confetti. | /[slug]/order-confirmation — OrderConfirmationPage | 🔴 |
| T-013 | Búsqueda en tienda | Barra de búsqueda global. Resultados en tiempo real. | StoreSearchSheet (Client Component) | 🟡 |
| T-014 | Animaciones y micro-interacciones | Transición entre páginas, skeleton loading, bounce al agregar, toast. | CSS animations + Framer Motion (solo Page Transitions) | 🟡 |
| T-015 | Información y ubicación | Horarios, dirección con mapa, redes sociales. | /[slug]/info — StoreInfoPage | 🟡 |
| T-016 | Tema dinámico por tenant | CSS variables aplicadas en el servidor (layout.tsx). **Sin FOUC.** Ver sección 2.6. | app/(store)/[slug]/layout.tsx | 🔴 |

---

## 3.5 Bottom Sheet con vaul (NUEVO — gap crítico de v1)

No usar shadcn `Sheet` para el detalle de producto en móvil porque no tiene drag gesture nativo. Usar `vaul` directamente.

```tsx
// components/store/product-detail-sheet/product-detail-sheet.tsx
'use client'
import { Drawer } from 'vaul'

interface ProductDetailSheetProps {
  product: Product
  open: boolean
  onClose: () => void
}

export function ProductDetailSheet({ product, open, onClose }: ProductDetailSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="
          fixed bottom-0 left-0 right-0 z-50
          bg-white rounded-t-2xl
          max-h-[95dvh] flex flex-col
          md:hidden
        ">
          {/* Handle de drag */}
          <div className="mx-auto mt-3 mb-4 h-1.5 w-12 rounded-full bg-gray-200 shrink-0" />
          
          {/* Contenido scrolleable */}
          <div className="overflow-y-auto flex-1 px-4 pb-safe">
            <ProductDetailContent product={product} onAddToCart={onClose} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

// En desktop: usar Dialog de shadcn/ui
export function ProductDetailDialog({ product, open, onClose }: ProductDetailSheetProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl hidden md:flex">
        <ProductDetailContent product={product} onAddToCart={onClose} />
      </DialogContent>
    </Dialog>
  )
}
```

---

## 3.6 Carrito con Zustand + persistencia en localStorage

```typescript
// lib/stores/cart.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, options: SelectedOption[], qty: number) => void
  removeItem: (itemId: string) => void
  updateQty: (itemId: string, qty: number) => void
  clear: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, options, qty) =>
        set(s => ({
          items: [...s.items, {
            id: crypto.randomUUID(),
            product,
            options,
            qty
          }]
        })),
      removeItem: (id) =>
        set(s => ({ items: s.items.filter(i => i.id !== id) })),
      updateQty: (id, qty) =>
        set(s => ({
          items: s.items.map(i => i.id === id ? { ...i, qty } : i)
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => {
        const optionsTotal = i.options.flatMap(o => o.items).reduce(
          (s, opt) => s + opt.priceModifier, 0
        )
        return sum + (i.product.price + optionsTotal) * i.qty
      }, 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: 'cart-storage',
      // Limpiar carrito si es de otro tenant
      onRehydrateStorage: () => (state) => {
        const currentSlug = window.location.pathname.split('/')[1]
        if (state?.tenantSlug && state.tenantSlug !== currentSlug) {
          state.clear()
        }
      }
    }
  )
)
```

---

## 3.7 Formato del mensaje WhatsApp

```typescript
// lib/utils/whatsapp.ts
export function buildWhatsAppMessage(order: OrderDraft, store: Store): string {
  const items = order.items.map(item => {
    const options = item.options.flatMap(g =>
      g.items.map(o => `  ↳ ${g.groupName}: ${o.itemName}${o.priceModifier > 0 ? ` (+${formatCurrency(o.priceModifier)})` : ''}`)
    ).join('\n')
    return `• ${item.productName} x${item.quantity} — ${formatCurrency(item.subtotal)}${options ? '\n' + options : ''}${item.note ? `\n  📝 ${item.note}` : ''}`
  }).join('\n')

  return `🛒 *NUEVO PEDIDO* #${order.orderNumber}
──────────────────────
👤 *Cliente:* ${order.customer.name}
📱 *Teléfono:* ${order.customer.phone}
📍 *Entrega:* ${DELIVERY_LABELS[order.deliveryMethod]}${order.customer.address ? `\n    ${formatAddress(order.customer.address)}` : ''}

🛍️ *ITEMS:*
${items}

──────────────────────
💰 *Subtotal:* ${formatCurrency(order.subtotal)}
🚚 *Envío:* ${order.deliveryCost > 0 ? formatCurrency(order.deliveryCost) : 'Gratis'}
💵 *TOTAL: ${formatCurrency(order.total)}*
──────────────────────
💳 *Pago:* ${PAYMENT_LABELS[order.paymentMethod]}${order.notes ? `\n📝 *Notas:* ${order.notes}` : ''}
──────────────────────
⏰ Pedido realizado: ${formatDateTime(new Date())}`
}

export function openWhatsApp(phone: string, message: string): void {
  const encoded = encodeURIComponent(message)
  window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encoded}`, '_blank')
}
```
