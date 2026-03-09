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

## 4. Especificaciones Técnicas (Angular 19)

### Componentes Clave
- `OrdersKanbanComponent`: Vista de gestión en tiempo real.
- `KanbanColumnComponent`: Columna por estado con scroll independiente.
- `OrderCardComponent`: Resumen visual del pedido en el kanban.
- `OrderDetailModalComponent`: Modal con información detallada.

### Servicios
- `OrdersService`: Gestión de pedidos mediante REST y WebSocket.
- `WebSocketService`: Abstracción de Socket.io para tiempo real.
- `OrderNotificationService`: Gestión de notificaciones sonoras y visuales.

## 5. Criterios de Aceptación
- CA-001: Al llegar un pedido nuevo, aparece la notificación sonora y visual en menos de 2s.
- CA-002: El administrador puede cambiar el estado de un pedido y se refleja en el kanban.
- CA-003: El detalle del pedido muestra correctamente todas las variantes y precios.
- CA-004: El panel admin es completamente usable en móvil 375px.
