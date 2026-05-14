import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

@Index(['email'], { unique: true })
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ADMIN })
  role!: UserRole;

  @Column({ type: 'text', nullable: true, select: false })
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
}
