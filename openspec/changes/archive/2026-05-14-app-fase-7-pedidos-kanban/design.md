# Design — app-fase-7-pedidos-kanban

## Estructura de archivos resultante

```
app/
├── src/
│   ├── app/
│   │   └── (admin)/
│   │       └── admin/
│   │           └── orders/
│   │               └── page.tsx                ← Kanban de pedidos
│   ├── components/
│   │   └── admin/
│   │       ├── order-card/
│   │       │   └── index.tsx                   ← card con swipe
│   │       └── order-detail-dialog/
│   │           └── index.tsx
│   └── lib/
│       └── hooks/
│           ├── use-websocket.ts
│           └── use-order-notification.ts
```

---

## `lib/hooks/use-websocket.ts`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { ordersKeys } from '@/lib/hooks/use-orders';

export function useWebSocket(tenantId: string) {
  const socketRef = useRef<Socket | null>(null);
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken || !tenantId) return;

    const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token: accessToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      socket.emit('join-tenant', { tenantId });
    });

    socket.on('order:new', () => {
      qc.invalidateQueries({ queryKey: ordersKeys.admin() });
    });

    socket.on('order:status-changed', ({ orderId }: { orderId: string }) => {
      qc.invalidateQueries({ queryKey: ordersKeys.detail(orderId) });
      qc.invalidateQueries({ queryKey: ordersKeys.admin() });
    });

    socket.on('session-expired', () => {
      window.location.href = '/auth/login';
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [accessToken, tenantId, qc]);

  return socketRef.current;
}
```

---

## `lib/hooks/use-order-notification.ts`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { toast } from '@/components/shared/toast';
import { useQueryClient } from '@tanstack/react-query';

// Sonido generado con Web Audio API para evitar carga de archivo externo
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // Web Audio API puede fallar si no hubo interacción previa — ignorar silenciosamente
  }
}

export function useOrderNotification() {
  const hasInteracted = useRef(false);

  useEffect(() => {
    const markInteracted = () => { hasInteracted.current = true; };
    window.addEventListener('click', markInteracted, { once: true });
    return () => window.removeEventListener('click', markInteracted);
  }, []);

  function notifyNewOrder(orderNumber: string) {
    if (hasInteracted.current) {
      playNotificationSound();
    }
    toast.success(`Nuevo pedido #${orderNumber}`, { duration: 8000 });
  }

  return { notifyNewOrder };
}
```

---

## Kanban — columnas por status

```typescript
// app/(admin)/admin/orders/page.tsx
'use client';

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Pendientes' },
  { status: 'CONFIRMED', label: 'Confirmados' },
  { status: 'PREPARING', label: 'En preparación' },
  { status: 'READY', label: 'Listos' },
  { status: 'DELIVERED', label: 'Entregados' },
];

export default function OrdersPage() {
  const { data: orders = [] } = useAdminOrders();
  const tenantId = useAuthStore((s) => s.tenantId);
  useWebSocket(tenantId!);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[70vh]">
      {COLUMNS.map((col) => (
        <KanbanColumn
          key={col.status}
          label={col.label}
          orders={orders.filter((o) => o.status === col.status)}
        />
      ))}
    </div>
  );
}
```

---

## `OrderCard` — swipe actions en móvil

```typescript
// Swipe implementado con @dnd-kit o CSS touch events
// Swipe derecha: acción primaria (confirmar/siguiente estado)
// Swipe izquierda: cancelar

interface OrderCardProps {
  order: Order;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onClick: () => void;
}
```

---

## Optimistic update — cambio de estado

```typescript
export function useChangeOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/admin/orders/${id}/status`, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ordersKeys.admin() });
      const prev = qc.getQueryData(ordersKeys.admin());
      qc.setQueryData(ordersKeys.admin(), (old: Order[]) =>
        old.map((o) => (o.id === id ? { ...o, status } : o))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(ordersKeys.admin(), ctx?.prev);
      toast.error('No se pudo cambiar el estado');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ordersKeys.admin() }),
  });
}
```
