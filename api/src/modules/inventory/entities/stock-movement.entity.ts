import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity.js';
import { Product } from '../../catalog/entities/product.entity.js';
import { Order } from '../../orders/entities/order.entity.js';

export enum StockMovementType {
  PURCHASE_IN = 'purchase_in',
  SALE_OUT = 'sale_out',
  ADJUSTMENT = 'adjustment',
  WASTE = 'waste',
  CANCELLATION_RETURN = 'cancellation_return',
}

@Index(['tenantId', 'productId'])
@Index(['orderId'])
@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({
    type: 'enum',
    enum: StockMovementType,
  })
  type!: StockMovementType;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', nullable: true })
  orderId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @ManyToOne(() => Order, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order!: Order | null;
}
