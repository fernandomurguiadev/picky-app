import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OptionGroup } from './option-group.entity.js';

@Entity('option_items')
export class OptionItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  optionGroupId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'integer', default: 0 })
  priceModifier!: number;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'integer', default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => OptionGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optionGroupId' })
  optionGroup!: OptionGroup;
}
