import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Order, StatusHistoryEntry } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { StoreSettings } from '../tenants/entities/store-settings.entity.js';
import { OrderStatus, DeliveryMethod, PaymentMethod } from './enums/order.enums.js';
import { toBusinessException } from '../../common/errors/business.exception.js';
import { OrderErrors } from './errors/orders.errors.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import type { CreateOrderAdminDto } from './dto/create-order-admin.dto.js';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import type { UpdateOrderNotesDto } from './dto/update-order-notes.dto.js';
import type { OrdersQueryDto } from './dto/orders-query.dto.js';
import { OrdersGateway } from './orders.gateway.js';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]:   [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING,  OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY,       OrderStatus.CANCELLED],
  [OrderStatus.READY]:     [OrderStatus.DELIVERED,   OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(StoreSettings)
    private readonly settingsRepo: Repository<StoreSettings>,
    private readonly dataSource: DataSource,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  // ─── Creación pública (tienda) ────────────────────────────────────────────

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const settings = await this.settingsRepo.findOne({
      where: { tenantId: dto.tenantId },
    });
    if (!settings) {
      throw toBusinessException(OrderErrors.settingsNotFound(dto.tenantId));
    }

    this.validateDeliveryMethod(dto.deliveryMethod, settings);
    this.validatePaymentMethod(dto.paymentMethod, settings);

    const subtotal = this.calculateSubtotal(dto);

    if (
      dto.deliveryMethod === DeliveryMethod.DELIVERY &&
      settings.deliveryMinOrder > 0 &&
      subtotal < settings.deliveryMinOrder
    ) {
      throw toBusinessException(
        OrderErrors.belowMinimumOrder(settings.deliveryMinOrder, subtotal),
      );
    }

    const deliveryCost =
      dto.deliveryMethod === DeliveryMethod.DELIVERY ? settings.deliveryCost : 0;
    const total = subtotal + deliveryCost;
    const orderNumber = this.generateOrderNumber();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = queryRunner.manager.create(Order, {
        tenantId: dto.tenantId,
        orderNumber,
        status: OrderStatus.PENDING,
        deliveryMethod: dto.deliveryMethod,
        paymentMethod: dto.paymentMethod,
        subtotal,
        deliveryCost,
        total,
        customerInfo: {
          name: dto.customer.name,
          phone: dto.customer.phone,
          address: dto.customer.address,
        },
        notes: dto.notes ?? null,
        internalNotes: null,
        statusHistory: [
          { status: OrderStatus.PENDING, changedAt: new Date().toISOString() },
        ],
      });
      await queryRunner.manager.save(Order, order);

      const items = dto.items.map((item) =>
        queryRunner.manager.create(OrderItem, {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          itemNote: item.itemNote ?? null,
          subtotal:
            (item.unitPrice +
              item.selectedOptions.reduce((s, o) => s + o.priceModifier, 0)) *
            item.quantity,
        }),
      );
      await queryRunner.manager.save(OrderItem, items);

      await queryRunner.commitTransaction();

      order.items = items as unknown[];
      this.ordersGateway.emitOrderNew(order.tenantId, order);
      this.notifyOrderN8n(order);

      const businessNumber = process.env.WHATSAPP_BUSINESS_NUMBER || '';
      const message = `Hola, quiero confirmar mi pedido ${order.orderNumber}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodedMessage}`;

      return {
        ...order,
        whatsappConfirmationMessage: message,
        whatsappConfirmationUrl: whatsappUrl,
      } as Order & { whatsappConfirmationMessage: string; whatsappConfirmationUrl: string };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async linkWhatsappNumber(orderNumber: string, whatsappNumber: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { orderNumber } });
    if (!order) {
      throw toBusinessException(OrderErrors.notFound(orderNumber));
    }

    order.verifiedWhatsappNumber = whatsappNumber;
    return this.orderRepo.save(order);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async getAdminOrders(
    tenantId: string,
    query: OrdersQueryDto,
  ): Promise<{ data: Order[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('o.status = :status', { status: query.status });
    }
    if (query.from) {
      qb.andWhere('o.createdAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('o.createdAt <= :to', { to: new Date(query.to) });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getAdminOrderById(tenantId: string, id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw toBusinessException(OrderErrors.notFound(id));
    if (order.tenantId !== tenantId) throw toBusinessException(OrderErrors.forbidden(id));
    return order;
  }

  async updateOrderStatus(
    tenantId: string,
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw toBusinessException(OrderErrors.notFound(id));
    if (order.tenantId !== tenantId) throw toBusinessException(OrderErrors.forbidden(id));

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw toBusinessException(OrderErrors.invalidTransition(order.status, dto.status));
    }

    const historyEntry: StatusHistoryEntry = {
      status: dto.status,
      changedAt: new Date().toISOString(),
      note: dto.note,
    };

    order.status = dto.status;
    order.statusHistory = [...order.statusHistory, historyEntry];
    const saved = await this.orderRepo.save(order);
    this.ordersGateway.emitOrderStatusChanged(saved.tenantId, {
      orderId: saved.id,
      newStatus: saved.status,
      statusHistory: saved.statusHistory,
    });
    return saved;
  }

  async createAdminOrder(tenantId: string, dto: CreateOrderAdminDto): Promise<Order> {
    return this.createOrder({ ...dto, tenantId });
  }

  async updateOrderNotes(
    tenantId: string,
    id: string,
    dto: UpdateOrderNotesDto,
  ): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw toBusinessException(OrderErrors.notFound(id));
    if (order.tenantId !== tenantId) throw toBusinessException(OrderErrors.forbidden(id));

    order.internalNotes = dto.internalNotes;
    return this.orderRepo.save(order);
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private generateOrderNumber(): string {
    const date = new Date();
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `ORD-${yyyymmdd}-${rand}`;
  }

  private calculateSubtotal(dto: CreateOrderDto | { items: CreateOrderDto['items'] }): number {
    return dto.items.reduce((total, item) => {
      const optionsTotal = item.selectedOptions.reduce(
        (s, o) => s + o.priceModifier,
        0,
      );
      return total + (item.unitPrice + optionsTotal) * item.quantity;
    }, 0);
  }

  private validateDeliveryMethod(method: DeliveryMethod, settings: StoreSettings): void {
    if (method === DeliveryMethod.DELIVERY && !settings.deliveryEnabled) {
      throw toBusinessException(OrderErrors.deliveryNotEnabled());
    }
    if (method === DeliveryMethod.TAKEAWAY && !settings.takeawayEnabled) {
      throw toBusinessException(OrderErrors.takeawayNotEnabled());
    }
    if (method === DeliveryMethod.IN_STORE && !settings.inStoreEnabled) {
      throw toBusinessException(OrderErrors.inStoreNotEnabled());
    }
  }

  private validatePaymentMethod(method: PaymentMethod, settings: StoreSettings): void {
    const enabled =
      (method === PaymentMethod.CASH && settings.cashEnabled) ||
      (method === PaymentMethod.TRANSFER && settings.transferEnabled) ||
      (method === PaymentMethod.CARD && settings.cardEnabled) ||
      method === PaymentMethod.OTHER;

    if (!enabled) {
      throw toBusinessException(OrderErrors.paymentNotEnabled(method));
    }
  }

  private notifyOrderN8n(order: Order): void {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    console.log('[N8N DEBUG] URL del webhook:', webhookUrl);
    
    if (!webhookUrl) {
      console.log('[N8N DEBUG] ABORTADO: No hay N8N_WEBHOOK_URL configurado en .env');
      return;
    }

    try {
      const itemsDetail = (order.items as OrderItem[])
        .map(i => `${i.quantity}x ${i.productName}`)
        .join(', ');

      const payload = {
        telefono: order.customerInfo.phone,
        nombreCliente: order.customerInfo.name,
        detallePedido: itemsDetail,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total
      };

      console.log('[N8N DEBUG] Enviando payload:', payload);

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(async res => {
        console.log('[N8N DEBUG] Status respuesta n8n:', res.status);
        if (!res.ok) {
           console.log('[N8N DEBUG] Body respuesta error:', await res.text());
        }
      })
      .catch(err => {
        console.error('[N8N DEBUG] Error fatal en fetch a n8n:', err);
      });
    } catch (err) {
      console.error('[N8N DEBUG] Error al preparar webhook n8n:', err);
    }
  }
}
