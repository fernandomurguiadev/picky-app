# Módulo MOD-03: Gestión de Pedidos

## 1. Visión General
El módulo de Gestión de Pedidos permite al administrador recibir y gestionar los pedidos realizados por los clientes en tiempo real.

## 2. Funcionalidades (Back-office)

| ID | Funcionalidad | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **P-001** | **Centro de pedidos — Vista Kanban** | Columnas por estado: Nuevo / Preparación / Camino / Entregado / Cancelado. | Alta |
| **P-002** | **Vista lista de pedidos** | Tabla con filtros por fecha, estado, entrega y paginación. | Media |
| **P-003** | **Detalle de pedido** | Modal con items, variantes, datos cliente, historial. | Alta |
| **P-004** | **Cambio de estado manual** | Botones de acción en el detalle para mover al siguiente estado. | Alta |
| **P-005** | **Notificación sonora y visual** | Al llegar un pedido nuevo por WebSocket: sonido + badge parpadeante. | Alta |
| **P-006** | **Pedido manual (admin)** | Formulario para crear un pedido desde el panel. | Media |
| **P-007** | **Imprimir pedido** | Vista optimizada para papel carta y ticket 80mm. | Media |
| **P-008** | **Notas internas** | Campo de nota privada en el detalle del pedido. | Media |

## 3. Modelo de Datos (Dominio)

### Order
```typescript
export interface Order {
  id: string;
  orderNumber: string; // ORD-YYYYMMDD-XXX
  tenantId: string;
  status: OrderStatus;
  items: OrderItem[];
  customer: CustomerInfo;
  deliveryMethod: DeliveryMethod;
  deliveryCost: number;
  paymentMethod: PaymentMethod;
  subtotal: number;
  total: number;
  notes?: string;
  internalNotes?: string;
  statusHistory: StatusChange[];
  createdAt: Date;
  updatedAt: Date;
}
```

## 4. Especificaciones Técnicas (Next.js 15)

### Arquitectura de Rutas (`app/`)
- `(admin)/dashboard/orders/page.tsx`: Tablero Kanban en tiempo real (RCC).
- `(admin)/dashboard/orders/[id]/page.tsx`: Detalle completo de la orden con historial interactivo.

### Componentes de Interfaz (RCC)
- `OrderKanbanBoard`: Tablero contenedor de estados gestionado mediante flex layout.
- `OrderCard`: Card compacta optimizada con badges de urgencia temporal.
- `OrderDetailModal`: Modal dinámico de shadcn/ui (`Dialog`) para previsualizaciones rápidas.

### Gestión de Tiempo Real e Integración
- `useSocketIO()`: Custom Hook que inicializa y provee la conexión al Gateway de NestJS, escuchando el evento `order.created` en el room del tenant.
- `useOrderSoundNotification()`: Hook que gestiona el objeto HTML5 Audio y el estado del título del documento (alert flash) ante la llegada de nuevos pedidos sin leer.
- `useUpdateOrderStatus()`: Mutación optimista de TanStack Query para reflejar el movimiento Kanban inmediatamente antes de recibir confirmación del servidor.


## 5. Criterios de Aceptación
- CA-001: Al llegar un pedido nuevo, aparece la notificación sonora y visual en menos de 2s.
- CA-002: El administrador puede cambiar el estado de un pedido y se refleja en el kanban.
- CA-003: El detalle del pedido muestra correctamente todas las variantes y precios.
- CA-004: El panel admin es completamente usable en móvil 375px.
