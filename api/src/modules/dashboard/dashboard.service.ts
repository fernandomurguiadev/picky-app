import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, Between } from 'typeorm';
import { Order } from '../orders/entities/order.entity.js';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { OrderStatus } from '../orders/enums/order.enums.js';
import {
  DashboardMetricsDto,
  TopProductDto,
} from './dto/dashboard-metrics.dto.js';

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

    const [ordersToday, revenueToday, pendingOrders, hourlyOrders, topProducts, deliveredCount] =
      await Promise.all([
        this.countOrdersToday(tenantId, startOfDay, endOfDay),
        this.sumRevenueToday(tenantId, startOfDay, endOfDay),
        this.countPendingOrders(tenantId),
        this.getHourlyOrders(tenantId, startOfDay, endOfDay),
        this.getTopProducts(tenantId, startOfDay, endOfDay),
        this.countDeliveredToday(tenantId, startOfDay, endOfDay),
      ]);

    const averageTicket =
      deliveredCount > 0 ? Math.round(revenueToday / deliveredCount) : 0;

    return {
      ordersToday,
      revenueToday,
      averageTicket,
      pendingOrders,
      hourlyOrders,
      topProducts,
    };
  }

  // ─── Queries privadas ─────────────────────────────────────────────────────

  private countOrdersToday(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    return this.orderRepo.count({
      where: {
        tenantId,
        status: Not(OrderStatus.CANCELLED),
        createdAt: Between(start, end),
      },
    });
  }

  private countDeliveredToday(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    return this.orderRepo.count({
      where: {
        tenantId,
        status: OrderStatus.DELIVERED,
        createdAt: Between(start, end),
      },
    });
  }

  private async sumRevenueToday(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total), 0)', 'sum')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('o.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne<{ sum: string }>();
    return parseInt(result?.sum ?? '0', 10);
  }

  private countPendingOrders(tenantId: string): Promise<number> {
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

  private async getHourlyOrders(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<number[]> {
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

  private async getTopProducts(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<TopProductDto[]> {
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
}
