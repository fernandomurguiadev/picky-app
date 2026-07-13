import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity.js';

import { Expose } from 'class-transformer';
import { UserRole } from '../../auth/entities/user.entity.js';

export interface SelectedOption {
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  priceModifier: number;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ type: 'varchar', length: 255 })
  productName!: string;

  @Column({ type: 'integer' })
  unitPrice!: number;

  // El rol en el JWT viaja en minúsculas (UserRole.ADMIN = 'admin') — usar el
  // valor real del enum acá, no el string 'ADMIN', o el grupo nunca matchea.
  @Expose({ groups: [UserRole.ADMIN] })
  @Column({ type: 'integer', nullable: true, default: null })
  unitCost!: number | null;

  @Column({ type: 'integer', default: 1 })
  quantity!: number;

  @Column({ type: 'jsonb', default: [] })
  selectedOptions!: SelectedOption[];

  @Column({ type: 'text', nullable: true })
  itemNote!: string | null;

  @Column({ type: 'integer' })
  subtotal!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;
}
