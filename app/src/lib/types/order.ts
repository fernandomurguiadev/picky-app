"use client";

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
export type DeliveryMethod = "delivery" | "takeaway" | "in_store";
export type PaymentMethod = "cash" | "transfer" | "card" | "other";

export interface CustomerInfo {
  name: string;
  phone?: string;
  address?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  changedAt: string;
  note?: string;
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  priceModifier: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  selectedOptions: SelectedOption[];
  itemNote: string | null;
  subtotal: number;
  createdAt: string;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryCost: number;
  total: number;
  customerInfo: CustomerInfo;
  notes: string | null;
  internalNotes: string | null;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}
