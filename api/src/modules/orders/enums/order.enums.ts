export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DeliveryMethod {
  DELIVERY = 'delivery',
  TAKEAWAY = 'takeaway',
  IN_STORE = 'in_store',
}

export enum PaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  CARD = 'card',
  OTHER = 'other',
}
