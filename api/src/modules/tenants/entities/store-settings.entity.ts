import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity.js';
import type { DaySchedule } from '../interfaces/schedule.interface.js';

@Entity('store_settings')
export class StoreSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  tenantId!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  logoUrl!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  whatsapp!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  schedule!: DaySchedule[] | null;

  @Column({ type: 'varchar', length: 100, default: 'America/Argentina/Buenos_Aires' })
  timezone!: string;

  // Tema
  @Column({ type: 'varchar', length: 7, default: '#000000' })
  primaryColor!: string;

  @Column({ type: 'varchar', length: 7, default: '#ffffff' })
  accentColor!: string;

  // Entrega
  @Column({ type: 'boolean', default: false })
  deliveryEnabled!: boolean;

  @Column({ type: 'integer', default: 0 })
  deliveryCost!: number;

  @Column({ type: 'integer', default: 0 })
  deliveryMinOrder!: number;

  @Column({ type: 'boolean', default: true })
  takeawayEnabled!: boolean;

  @Column({ type: 'boolean', default: false })
  inStoreEnabled!: boolean;

  // Pagos
  @Column({ type: 'boolean', default: true })
  cashEnabled!: boolean;

  @Column({ type: 'boolean', default: false })
  transferEnabled!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transferAlias!: string | null;

  @Column({ type: 'boolean', default: false })
  cardEnabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;
}
