# MOD-03 — Gestión de Pedidos en Tiempo Real

> Origen: Frontend Admin + Backend WebSocket Gateway
> Rutas: `/admin/orders`, `/admin/orders/list`

---

## 3.8 Tabla de funcionalidades

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| P-001 | Centro de pedidos — Vista Kanban | Columnas por estado. Cards arrastrables con @dnd-kit. Auto-actualización por WebSocket directo a NestJS. | /admin/orders — OrdersKanbanPage | 🔴 |
| P-002 | Vista lista de pedidos | Tabla con filtros por fecha, estado, forma de entrega. Paginación. | /admin/orders/list — OrdersListPage | 🟡 |
| P-003 | Detalle de pedido | Dialog con detalle completo: items, cliente, entrega, pago, historial de estados. | OrderDetailDialog | 🔴 |
| P-004 | Cambio de estado manual | Botones de acción para mover al siguiente estado. Optimistic update con TanStack Query. | OrderStatusActions | 🔴 |
| P-005 | Notificación sonora y visual | Sonido configurable + toast de alta prominencia + document.title parpadeo. **Solo funciona si el usuario ya interactuó con la página (limitación de navegadores móviles).** | useOrderNotification hook | 🔴 |
| P-006 | Pedido manual (admin) | Formulario para crear pedido desde el panel. | CreateOrderDialog | 🟡 |
| P-007 | Imprimir pedido | Vista de impresión optimizada para carta y ticket 80mm. | print-order.util.ts | 🟡 |
| P-008 | Notas internas | Campo de nota privada en el detalle del pedido. | OrderDetailDialog — notes field | 🟡 |

---

## 3.9 Modelo de datos — Pedido

```typescript
// lib/types/order.types.ts

export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'on_way' | 'delivered' | 'cancelled'
export type DeliveryMethod = 'delivery' | 'takeaway' | 'in_store'
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'other'

export interface OrderItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  selectedOptions: SelectedOption[]
  itemNote?: string
  subtotal: number
}

export interface SelectedOption {
  groupId: string
  groupName: string
  items: { itemId: string; itemName: string; priceModifier: number }[]
}

export interface CustomerInfo {
  name: string
  phone: string
  email?: string
  address?: DeliveryAddress
}

export interface DeliveryAddress {
  street: string
  number: string
  apartment?: string
  city: string
  references?: string
}

export interface Order {
  id: string
  orderNumber: string        // ORD-YYYYMMDD-XXX legible
  tenantId: string
  status: OrderStatus
  items: OrderItem[]
  customer: CustomerInfo
  deliveryMethod: DeliveryMethod
  deliveryCost: number
  paymentMethod: PaymentMethod
  subtotal: number
  total: number
  notes?: string
  internalNotes?: string
  statusHistory: StatusChange[]
  createdAt: string
  updatedAt: string
}

export interface StatusChange {
  status: OrderStatus
  changedAt: string
  changedBy: string
}
```

---

## 3.10 Kanban en móvil — Manejo de estado con WebSocket en background (NUEVO — gap de v1)

En móvil el Kanban usa pestañas horizontales. El estado de los pedidos debe actualizarse en background incluso cuando la pestaña activa no es "Nuevo".

```tsx
// components/admin/orders-kanban/orders-kanban.tsx
'use client'
import { useState } from 'react'
import { useOrdersWebSocket } from '@/lib/hooks/use-websocket'
import { useQuery } from '@tanstack/react-query'

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: 'new',       label: 'Nuevos' },
  { status: 'confirmed', label: 'Confirmados' },
  { status: 'preparing', label: 'En preparación' },
  { status: 'on_way',    label: 'En camino' },
  { status: 'delivered', label: 'Entregados' },
]

export function OrdersKanban({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTab] = useState<OrderStatus>('new')
  
  // TanStack Query mantiene el estado global de pedidos
  // WebSocket actualiza este estado en background sin importar qué tab está visible
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll
  })

  // WebSocket actualiza la query cache directamente
  useOrdersWebSocket(tenantId)

  // Agrupar pedidos por columna
  const ordersByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = orders.filter(o => o.status === col.status)
    return acc
  }, {} as Record<OrderStatus, Order[]>)

  return (
    <div>
      {/* Tabs de columnas en móvil */}
      <div className="flex overflow-x-auto gap-2 pb-2 md:hidden">
        {COLUMNS.map(col => (
          <button
            key={col.status}
            onClick={() => setActiveTab(col.status)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium",
              activeTab === col.status
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600"
            )}
          >
            {col.label}
            {ordersByStatus[col.status].length > 0 && (
              <span className="ml-1.5 bg-white/30 rounded-full px-1.5">
                {ordersByStatus[col.status].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Vista móvil: solo la columna activa */}
      <div className="md:hidden">
        <KanbanColumn
          status={activeTab}
          orders={ordersByStatus[activeTab]}
        />
      </div>

      {/* Vista desktop: todas las columnas */}
      <div className="hidden md:flex gap-4 overflow-x-auto">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            orders={ordersByStatus[col.status]}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 3.11 Notificación sonora — Limitación de navegadores móviles (NUEVO — gap de v1)

Los navegadores móviles bloquean audio sin interacción previa del usuario. Documentar este comportamiento explícitamente y manejar el fallback.

```tsx
// lib/hooks/use-order-notification.ts
'use client'
import { useRef, useCallback } from 'react'

export function useOrderNotification() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasInteracted = useRef(false)

  // Registrar interacción del usuario para desbloquear audio
  const registerInteraction = useCallback(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = true
      // Pre-cargar el audio después de la primera interacción
      audioRef.current = new Audio('/sounds/new-order.mp3')
      audioRef.current.load()
    }
  }, [])

  const notify = useCallback(() => {
    // Notificación visual siempre funciona
    document.title = '🔔 NUEVO PEDIDO!'
    setTimeout(() => { document.title = 'Panel Admin' }, 5000)

    // Audio solo si el usuario ya interactuó
    if (hasInteracted.current && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Silenciar el error — el navegador bloqueó el audio
        console.warn('Audio bloqueado por el navegador. Requiere interacción del usuario.')
      })
    }
  }, [])

  return { notify, registerInteraction }
}
```
