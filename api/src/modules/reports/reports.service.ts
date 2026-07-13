import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { Product } from '../catalog/entities/product.entity.js';
import { OrderStatus } from '../orders/enums/order.enums.js';
import type { ProfitabilityQueryDto } from './dto/profitability-query.dto.js';

// Estados que representan una venta que el comerciante ya se comprometió a
// cumplir. Se excluyen 'pending' (todavía puede rechazarse) y 'cancelled'.
const REALIZED_STATUSES = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERED,
];

export interface ProfitabilityByProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  grossMargin: number;
  marginPercent: number;
  unitsMissingCost: number;
}

export interface PeriodComparison {
  revenueChangePercent: number | null;
  costChangePercent: number | null;
  grossMarginChangePercent: number | null;
}

export interface ProfitabilitySummary {
  revenue: number;
  cost: number;
  grossMargin: number;
  marginPercent: number;
  byProduct: ProfitabilityByProduct[];
  comparison: PeriodComparison;
}

interface Totals {
  revenue: number;
  cost: number;
  grossMargin: number;
  marginPercent: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  async getProfitability(
    tenantId: string,
    query: ProfitabilityQueryDto,
  ): Promise<ProfitabilitySummary> {
    const from = new Date(query.from);
    // `to` llega como fecha "YYYY-MM-DD" (medianoche UTC) — sin extenderlo a
    // fin de día, el BETWEEN excluiría por completo el último día del rango.
    const to = new Date(query.to);
    to.setUTCHours(23, 59, 59, 999);

    const byProduct = await this.aggregateByProduct(
      tenantId,
      from,
      to,
      query.categoryId,
      query.productId,
    );
    const totals = this.sumTotals(byProduct);

    // Período anterior: mismo rango de días, inmediatamente anterior al solicitado.
    const durationMs = Math.max(to.getTime() - from.getTime(), 0);
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);
    const prevByProduct = await this.aggregateByProduct(
      tenantId,
      prevFrom,
      prevTo,
      query.categoryId,
      query.productId,
    );
    const prevTotals = this.sumTotals(prevByProduct);

    return {
      ...totals,
      byProduct,
      comparison: this.buildComparison(totals, prevTotals),
    };
  }

  private async aggregateByProduct(
    tenantId: string,
    from: Date,
    to: Date,
    categoryId?: string,
    productId?: string,
  ): Promise<ProfitabilityByProduct[]> {
    const qb = this.orderItemRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .select('oi.productId', 'productId')
      .addSelect('oi.productName', 'productName')
      .addSelect('SUM(oi.quantity)', 'unitsSold')
      .addSelect(
        'SUM(CASE WHEN oi.unitCost IS NOT NULL THEN oi.subtotal ELSE 0 END)',
        'revenue',
      )
      .addSelect(
        'SUM(CASE WHEN oi.unitCost IS NOT NULL THEN oi.unitCost * oi.quantity ELSE 0 END)',
        'cost',
      )
      .addSelect(
        'SUM(CASE WHEN oi.unitCost IS NULL THEN oi.quantity ELSE 0 END)',
        'unitsMissingCost',
      )
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.status IN (:...statuses)', { statuses: REALIZED_STATUSES })
      .andWhere('o.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('oi.productId')
      .addGroupBy('oi.productName');

    if (categoryId) {
      // Join a Product solo cuando hace falta filtrar por categoría — un
      // innerJoin incondicional descartaría en TODO reporte los ítems de
      // productos ya eliminados (deleteProduct permite borrar productos con
      // solo pedidos DELIVERED/CANCELLED históricos, que siguen contando acá).
      qb.innerJoin(Product, 'p', 'p.id = oi.productId').andWhere(
        'p.categoryId = :categoryId',
        { categoryId },
      );
    }
    if (productId) {
      qb.andWhere('oi.productId = :productId', { productId });
    }

    const rows = await qb.getRawMany<{
      productId: string;
      productName: string;
      unitsSold: string;
      revenue: string;
      cost: string;
      unitsMissingCost: string;
    }>();

    return rows.map((r) => {
      const revenue = Number(r.revenue);
      const cost = Number(r.cost);
      const grossMargin = revenue - cost;
      return {
        productId: r.productId,
        productName: r.productName,
        unitsSold: Number(r.unitsSold),
        revenue,
        cost,
        grossMargin,
        marginPercent: revenue > 0 ? (grossMargin / revenue) * 100 : 0,
        unitsMissingCost: Number(r.unitsMissingCost),
      };
    });
  }

  private sumTotals(byProduct: ProfitabilityByProduct[]): Totals {
    const revenue = byProduct.reduce((sum, p) => sum + p.revenue, 0);
    const cost = byProduct.reduce((sum, p) => sum + p.cost, 0);
    const grossMargin = revenue - cost;
    return {
      revenue,
      cost,
      grossMargin,
      marginPercent: revenue > 0 ? (grossMargin / revenue) * 100 : 0,
    };
  }

  private buildComparison(current: Totals, previous: Totals): PeriodComparison {
    const changePercent = (curr: number, prev: number): number | null => {
      if (prev === 0) return null;
      return ((curr - prev) / Math.abs(prev)) * 100;
    };
    return {
      revenueChangePercent: changePercent(current.revenue, previous.revenue),
      costChangePercent: changePercent(current.cost, previous.cost),
      grossMarginChangePercent: changePercent(
        current.grossMargin,
        previous.grossMargin,
      ),
    };
  }
}
