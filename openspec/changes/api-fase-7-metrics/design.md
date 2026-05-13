# Design — api-fase-7-metrics

## Estructura de archivos resultante

```
api/
└── src/
    └── modules/
        └── dashboard/
            ├── dto/
            │   └── dashboard-metrics.dto.ts    ← NUEVO
            ├── dashboard.service.ts             ← NUEVO
            ├── dashboard.controller.ts          ← NUEVO
            └── dashboard.module.ts              ← NUEVO
```

---

## `dashboard-metrics.dto.ts`

```typescript
export class TopProductDto {
  productId: string;
  productName: string;
  totalQuantity: number;
}

export class DashboardMetricsDto {
  ordersToday: number;
  revenueToday: number;       // centavos
  averageTicket: number;      // centavos
  pendingOrders: number;
  hourlyOrders: number[];     // longitud exacta 24, índice = hora (0-23)
  topProducts: TopProductDto[]; // máx 5
}
```

---

## `dashboard.service.ts`

```typescript
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  async getMetrics(tenantId: string): Promise<DashboardMetricsDto> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [ordersToday, revenueToday, pendingOrders, hourlyOrders, topProducts] =
      await Promise.all([
        this.countOrdersToday(tenantId, startOfDay, endOfDay),
        this.sumRevenueToday(tenantId, startOfDay, endOfDay),
        this.countPendingOrders(tenantId),
        this.getHourlyOrders(tenantId, startOfDay, endOfDay),
        this.getTopProducts(tenantId, startOfDay, endOfDay),
      ]);

    const deliveredCount = await this.countDeliveredToday(tenantId, startOfDay, endOfDay);
    const averageTicket = deliveredCount > 0 ? Math.round(revenueToday / deliveredCount) : 0;

    return { ordersToday, revenueToday, averageTicket, pendingOrders, hourlyOrders, topProducts };
  }
}
```

### Queries auxiliares

```typescript
// Órdenes del día (excluye CANCELLED)
private countOrdersToday(tenantId, start, end): Promise<number> {
  return this.orderRepo.count({
    where: {
      tenantId,
      status: Not(OrderStatus.CANCELLED),
      createdAt: Between(start, end),
    },
  });
}

// Facturación: suma de `total` en órdenes DELIVERED del día
private async sumRevenueToday(tenantId, start, end): Promise<number> {
  const result = await this.orderRepo
    .createQueryBuilder('o')
    .select('COALESCE(SUM(o.total), 0)', 'sum')
    .where('o.tenantId = :tenantId', { tenantId })
    .andWhere('o.status = :status', { status: OrderStatus.DELIVERED })
    .andWhere('o.createdAt BETWEEN :start AND :end', { start, end })
    .getRawOne<{ sum: string }>();
  return parseInt(result?.sum ?? '0', 10);
}

// Pedidos activos (no terminales)
private countPendingOrders(tenantId): Promise<number> {
  return this.orderRepo.count({
    where: {
      tenantId,
      status: In([
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
      ]),
    },
  });
}

// Distribución horaria — array[24]
private async getHourlyOrders(tenantId, start, end): Promise<number[]> {
  const rows = await this.orderRepo
    .createQueryBuilder('o')
    .select('EXTRACT(HOUR FROM o.createdAt)::int', 'hour')
    .addSelect('COUNT(*)::int', 'count')
    .where('o.tenantId = :tenantId', { tenantId })
    .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
    .andWhere('o.createdAt BETWEEN :start AND :end', { start, end })
    .groupBy('hour')
    .getRawMany<{ hour: number; count: number }>();

  const buckets = Array<number>(24).fill(0);
  for (const row of rows) {
    buckets[row.hour] = row.count;
  }
  return buckets;
}

// Top 5 productos por cantidad vendida hoy
private async getTopProducts(tenantId, start, end): Promise<TopProductDto[]> {
  return this.orderItemRepo
    .createQueryBuilder('oi')
    .innerJoin('oi.order', 'o')
    .select('oi.productId', 'productId')
    .addSelect('MAX(oi.productName)', 'productName')
    .addSelect('SUM(oi.quantity)::int', 'totalQuantity')
    .where('o.tenantId = :tenantId', { tenantId })
    .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
    .andWhere('o.createdAt BETWEEN :start AND :end', { start, end })
    .groupBy('oi.productId')
    .orderBy('"totalQuantity"', 'DESC')
    .limit(5)
    .getRawMany<TopProductDto>();
}
```

---

## `dashboard.controller.ts`

```typescript
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getMetrics(@TenantId() tenantId: string) {
    const data = await this.dashboardService.getMetrics(tenantId);
    return { data };
  }
}
```

---

## `dashboard.module.ts`

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
```

---

## Cambios en `app.module.ts`

```typescript
// Agregar a imports:
DashboardModule,
```
