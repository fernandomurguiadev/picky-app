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
  Relation,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity.js';
import { Category } from './category.entity.js';
import type { OptionGroup } from './option-group.entity.js';
import { Expose } from 'class-transformer';
import { UserRole } from '../../auth/entities/user.entity.js';

@Index(['tenantId', 'categoryId'])
@Index(['tenantId', 'isActive'])
@Index(['tenantId', 'inStock'])
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'integer' })
  price!: number;

  // El rol en el JWT viaja en minúsculas (UserRole.ADMIN = 'admin') — usar el
  // valor real del enum acá, no el string 'ADMIN', o el grupo nunca matchea.
  @Expose({ groups: [UserRole.ADMIN] })
  @Column({ type: 'integer', nullable: true, default: null })
  costPrice!: number | null;

  @Column({ type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  imagePublicId!: string | null;

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: true })
  inStock!: boolean;

  @Column({ type: 'integer', nullable: true, default: null })
  stockQuantity!: number | null;

  @Column({ type: 'integer', default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @OneToMany('OptionGroup', 'product', { cascade: true })
  optionGroups!: Relation<OptionGroup>[];
}
