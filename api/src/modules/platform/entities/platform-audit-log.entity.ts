import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuditAction {
  // Tenant
  TENANT_CREATED = 'TENANT_CREATED',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  TENANT_REACTIVATED = 'TENANT_REACTIVATED',
  TENANT_PLAN_CHANGED = 'TENANT_PLAN_CHANGED',
  // Impersonación
  IMPERSONATION_STARTED = 'IMPERSONATION_STARTED',
  IMPERSONATION_ENDED = 'IMPERSONATION_ENDED',
  IMPERSONATION_PRODUCT_CREATED = 'IMPERSONATION_PRODUCT_CREATED',
  IMPERSONATION_PRODUCT_UPDATED = 'IMPERSONATION_PRODUCT_UPDATED',
  IMPERSONATION_PRODUCT_DELETED = 'IMPERSONATION_PRODUCT_DELETED',
  IMPERSONATION_CATEGORY_CREATED = 'IMPERSONATION_CATEGORY_CREATED',
  IMPERSONATION_CATEGORY_UPDATED = 'IMPERSONATION_CATEGORY_UPDATED',
  IMPERSONATION_CATEGORY_DELETED = 'IMPERSONATION_CATEGORY_DELETED',
  // Sesión superadmin
  PLATFORM_LOGIN = 'PLATFORM_LOGIN',
  PLATFORM_LOGIN_FAILED = 'PLATFORM_LOGIN_FAILED',
  PLATFORM_LOGOUT = 'PLATFORM_LOGOUT',
}

@Entity('platform_audit_logs')
export class PlatformAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  actorId!: string;

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Column({ type: 'varchar', nullable: true })
  onBehalfOfTenantId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
