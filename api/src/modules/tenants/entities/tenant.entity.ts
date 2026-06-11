import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Plan } from '../../platform/entities/plan.entity.js';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isOnboardingCompleted!: boolean;

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
  status!: TenantStatus;

  @Column({ type: 'varchar', nullable: true })
  suspensionReason!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  suspendedAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  planId!: string | null;

  @ManyToOne(() => Plan, { nullable: true, eager: false })
  @JoinColumn({ name: 'planId' })
  plan!: Plan | null;

  @Column({ type: 'timestamptz', nullable: true })
  planGraceUntil!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations (lazy — defined in consuming entities)
  @OneToMany('User', 'tenant')
  users!: unknown[];

  @OneToOne('StoreSettings', 'tenant')
  storeSettings!: unknown;
}
