import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ type: 'boolean', default: false })
  isHidden!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
