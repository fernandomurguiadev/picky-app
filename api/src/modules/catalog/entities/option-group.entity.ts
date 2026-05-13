import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity.js';

export enum OptionGroupType {
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
}

@Entity('option_groups')
export class OptionGroup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: OptionGroupType, default: OptionGroupType.RADIO })
  type!: OptionGroupType;

  @Column({ type: 'boolean', default: false })
  isRequired!: boolean;

  @Column({ type: 'integer', default: 0 })
  minSelections!: number;

  @Column({ type: 'integer', default: 1 })
  maxSelections!: number;

  @Column({ type: 'integer', default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @OneToMany('OptionItem', 'optionGroup', { cascade: true })
  items!: unknown[];
}
