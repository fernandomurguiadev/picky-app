import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('tenant_order_sequences')
export class TenantOrderSequence {
  @PrimaryColumn({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'integer', name: 'last_order_number', default: 0 })
  lastOrderNumber!: number;
}
