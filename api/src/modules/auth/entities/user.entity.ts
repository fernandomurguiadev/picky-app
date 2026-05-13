import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity.js';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

@Index(['tenantId', 'email'], { unique: true })
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ADMIN })
  role!: UserRole;

  @Column({ type: 'text', nullable: true })
  refreshToken!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resetPasswordToken!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpiresAt!: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;
}
