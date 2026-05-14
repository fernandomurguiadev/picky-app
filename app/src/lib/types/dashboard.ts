export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
}

export interface DashboardMetrics {
  ordersToday: number;
  revenueToday: number;
  averageTicket: number;
  pendingOrders: number;
  hourlyOrders: number[]; // 24 buckets (hours)
  topProducts: TopProduct[];
}
