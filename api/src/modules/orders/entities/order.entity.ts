import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity.js';
import { OrderStatus, DeliveryMethod, PaymentMethod } from '../enums/order.enums.js';

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

@Index(['tenantId', 'status'])
@Index(['tenantId', 'createdAt'])
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 50 })
  orderNumber!: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({ type: 'enum', enum: DeliveryMethod })
  deliveryMethod!: DeliveryMethod;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'integer' })
  subtotal!: number;

  @Column({ type: 'integer', default: 0 })
  deliveryCost!: number;

  @Column({ type: 'integer' })
  total!: number;

  @Column({ type: 'jsonb' })
  customerInfo!: CustomerInfo;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'text', nullable: true })
  internalNotes!: string | null;

  @Column({ type: 'jsonb', default: [] })
  statusHistory!: StatusHistoryEntry[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @OneToMany('OrderItem', 'order', { cascade: true })
  items!: unknown[];
}
