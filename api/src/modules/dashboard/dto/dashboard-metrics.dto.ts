export class TopProductDto {
  productId!: string;
  productName!: string;
  totalQuantity!: number;
}

export class DashboardMetricsDto {
  ordersToday!: number;
  revenueToday!: number;    // centavos
  averageTicket!: number;   // centavos
  pendingOrders!: number;
  hourlyOrders!: number[];  // longitud 24, índice = hora (0-23)
  topProducts!: TopProductDto[]; // máx 5
}
