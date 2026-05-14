# Design — app-fase-6-carrito-checkout

## Estructura de archivos resultante

```
app/
├── src/
│   ├── app/
│   │   └── (store)/
│   │       └── [slug]/
│   │           ├── checkout/
│   │           │   └── page.tsx          ← checkout 2 pasos
│   │           └── order-confirmation/
│   │               └── page.tsx          ← checkmark + confetti
│   ├── components/
│   │   └── store/
│   │       ├── cart-badge/
│   │       │   └── index.tsx
│   │       └── cart-drawer/
│   │           └── index.tsx
│   └── lib/
│       └── utils/
│           └── whatsapp.ts               ← generador de mensaje
```

---

## `lib/utils/whatsapp.ts`

```typescript
interface WhatsAppMessageParams {
  storeName: string;
  storePhone: string;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  deliveryMethod: 'delivery' | 'takeaway';
  paymentMethod: string;
  deliveryAddress?: string;
  notes?: string;
}

export function buildWhatsAppUrl(params: WhatsAppMessageParams): string {
  const { storeName, storePhone, items, ...order } = params;

  const itemLines = items
    .map((item) => {
      const optionsText = Object.entries(item.selectedOptions)
        .map(([group, selections]) => `  - ${group}: ${selections.join(', ')}`)
        .join('\n');
      return `• ${item.name} x${item.quantity} — ${formatPrice(item.price * item.quantity)}${optionsText ? '\n' + optionsText : ''}`;
    })
    .join('\n');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const message = [
    `🛒 *Nuevo pedido - ${storeName}*`,
    '',
    `*Productos:*`,
    itemLines,
    '',
    `*Total: ${formatPrice(subtotal)}*`,
    '',
    `*Datos del pedido:*`,
    `• Cliente: ${order.customerName}`,
    `• Teléfono: ${order.customerPhone}`,
    `• Entrega: ${order.deliveryMethod === 'delivery' ? `Delivery - ${order.deliveryAddress}` : 'Retiro en local'}`,
    `• Pago: ${order.paymentMethod}`,
    order.notes ? `• Notas: ${order.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const phone = storePhone.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
```

---

## Página de checkout — 2 pasos

```typescript
// app/(store)/[slug]/checkout/page.tsx
'use client';

type CheckoutStep = 'customer-info' | 'delivery-payment';

export default function CheckoutPage({ params }: { params: { slug: string } }) {
  const [step, setStep] = useState<CheckoutStep>('customer-info');
  const items = useCartStore((s) => s.items);
  const { data: settings } = useStorePublicSettings(params.slug);

  // Paso 1: datos del cliente
  // Paso 2: método de entrega y pago
  // Submit final: POST /orders → window.open(whatsappUrl)
}
```

---

## Schema Zod — Checkout

```typescript
const customerSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  phone: z.string().min(8, 'Teléfono inválido'),
  notes: z.string().optional(),
});

const deliverySchema = z.object({
  deliveryMethod: z.enum(['delivery', 'takeaway']),
  deliveryAddress: z.string().optional(),
  paymentMethod: z.string().min(1, 'Seleccioná un método de pago'),
}).refine((data) => {
  if (data.deliveryMethod === 'delivery') {
    return !!data.deliveryAddress?.trim();
  }
  return true;
}, { message: 'Ingresá la dirección de entrega', path: ['deliveryAddress'] });
```

---

## `CartBadge` — contador animado

```typescript
// components/store/cart-badge/index.tsx
'use client';

export function CartBadge({ onOpen }: { onOpen: () => void }) {
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const prevCount = useRef(count);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (count > prevCount.current) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
    prevCount.current = count;
  }, [count]);

  if (count === 0) return null;

  return (
    <button onClick={onOpen} className="relative">
      <ShoppingBag className="w-6 h-6" />
      <span
        className={`absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs 
          w-5 h-5 rounded-full flex items-center justify-center
          ${isAnimating ? 'animate-bounce' : ''}`}
      >
        {count}
      </span>
    </button>
  );
}
```

---

## Página de confirmación

```typescript
// app/(store)/[slug]/order-confirmation/page.tsx
'use client';

export default function OrderConfirmationPage() {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart(); // Idempotente: limpiar carrito al llegar a la confirmación
  }, [clearCart]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-4">
      <CheckCircle className="w-20 h-20 text-green-500 animate-in zoom-in-50" />
      <h1 className="text-2xl font-bold text-center">¡Pedido enviado!</h1>
      <p className="text-muted-foreground text-center">
        Tu pedido fue enviado al comercio por WhatsApp.
        Te contactarán a la brevedad para confirmar.
      </p>
    </div>
  );
}
```
