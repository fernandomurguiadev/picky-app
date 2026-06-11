import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlanFeature } from './plan-feature.entity.js';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'integer' })
  maxProducts!: number; // -1 = sin límite

  @Column({ type: 'integer' })
  maxCategories!: number; // -1 = sin límite

  @Column({ type: 'integer' })
  maxStaffUsers!: number; // -1 = sin límite

  @Column({ type: 'integer' })
  maxImages!: number; // -1 = sin límite

  @Column({ type: 'integer', default: 0 })
  priceMonthly!: number; // en centavos (0 = gratis / contactar)

  @Column({ type: 'integer', default: 0 })
  sortOrder!: number;

  @Column({ type: 'text', nullable: true, default: null, select: false })
  description!: string | null;

  @Column({ type: 'boolean', default: false })
  isHidden!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => PlanFeature, (pf) => pf.plan)
  planFeatures!: PlanFeature[];
}
