# Design — api-fase-1-auth-entidades-base

## Estructura de archivos resultante

```
api/
└── src/
    ├── config/
    │   └── jwt.config.ts                                    ← NUEVO
    ├── common/
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts                            ← ACTIVADO (era stub en FASE 0)
    │   │   ├── roles.guard.ts                               ← ACTIVADO (era stub en FASE 0)
    │   │   └── tenant.guard.ts                              ← ACTIVADO (era stub en FASE 0)
    │   ├── interceptors/
    │   │   └── tenant-context.interceptor.ts                ← ACTIVADO (era stub en FASE 0)
    │   └── decorators/
    │       ├── tenant-id.decorator.ts                       ← ACTIVADO (era stub en FASE 0)
    │       ├── current-user.decorator.ts                    ← ACTIVADO (era stub en FASE 0)
    │       └── roles.decorator.ts                           ← NUEVO
    └── modules/
        ├── tenants/
        │   ├── tenants.module.ts                            ← NUEVO
        │   └── entities/
        │       ├── tenant.entity.ts                         ← NUEVO
        │       └── store-settings.entity.ts                 ← NUEVO
        ├── auth/
        │   ├── auth.module.ts                               ← NUEVO
        │   ├── auth.controller.ts                           ← NUEVO
        │   ├── auth.service.ts                              ← NUEVO
        │   ├── strategies/
        │   │   └── jwt.strategy.ts                          ← NUEVO
        │   ├── entities/
        │   │   └── user.entity.ts                           ← NUEVO
        │   └── dto/
        │       ├── register.dto.ts                          ← NUEVO
        │       ├── login.dto.ts                             ← NUEVO
        │       ├── forgot-password.dto.ts                   ← NUEVO
        │       └── reset-password.dto.ts                    ← NUEVO
        ├── catalog/
        │   └── entities/
        │       ├── category.entity.ts                       ← NUEVO
        │       ├── product.entity.ts                        ← NUEVO
        │       ├── option-group.entity.ts                   ← NUEVO
        │       └── option-item.entity.ts                    ← NUEVO
        └── orders/
            └── entities/
                ├── order.entity.ts                          ← NUEVO
                └── order-item.entity.ts                     ← NUEVO
```

---

## F1-A: Entidades TypeORM

### B1.1 — Entidad `Tenant`

```typescript
// src/modules/tenants/entities/tenant.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone', nullable: true })
  updatedAt: Date
}
```

### B1.2 — Entidad `User`

```typescript
// src/modules/auth/entities/user.entity.ts
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ type: 'varchar', length: 255 })
  email: string

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ADMIN })
  role: UserRole

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string | null

  @Column({ name: 'reset_password_token', type: 'varchar', length: 255, nullable: true })
  resetPasswordToken: string | null

  @Column({ name: 'reset_password_expires_at', type: 'timestamp with time zone', nullable: true })
  resetPasswordExpiresAt: Date | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone', nullable: true })
  updatedAt: Date
}
```

### B1.3 — Entidad `StoreSettings`

El campo `schedule` implementa el schema `DaySchedule[]` como JSONB.

```typescript
// src/modules/tenants/entities/store-settings.entity.ts
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from './tenant.entity'

export interface Shift {
  open: string   // "HH:mm"
  close: string  // "HH:mm"
}

export interface DaySchedule {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  isOpen: boolean
  shifts: Shift[]
}

@Entity('store_settings')
export class StoreSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid', unique: true })
  tenantId: string

  @OneToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  // --- Información básica ---
  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null

  @Column({ name: 'phone', type: 'varchar', length: 50, nullable: true })
  phone: string | null

  @Column({ name: 'whatsapp', type: 'varchar', length: 50, nullable: true })
  whatsapp: string | null

  @Column({ name: 'address', type: 'text', nullable: true })
  address: string | null

  // --- Horarios ---
  @Column({ name: 'schedule', type: 'jsonb', nullable: true })
  schedule: DaySchedule[] | null

  @Column({ name: 'timezone', type: 'varchar', length: 100, default: 'America/Argentina/Buenos_Aires' })
  timezone: string

  // --- Tema visual ---
  @Column({ name: 'primary_color', type: 'varchar', length: 7, default: '#000000' })
  primaryColor: string

  @Column({ name: 'accent_color', type: 'varchar', length: 7, default: '#ffffff' })
  accentColor: string

  // --- Entrega ---
  @Column({ name: 'delivery_enabled', type: 'boolean', default: false })
  deliveryEnabled: boolean

  @Column({ name: 'delivery_cost', type: 'integer', default: 0 })
  deliveryCost: number // centavos

  @Column({ name: 'delivery_min_order', type: 'integer', default: 0 })
  deliveryMinOrder: number // centavos

  @Column({ name: 'takeaway_enabled', type: 'boolean', default: true })
  takeawayEnabled: boolean

  @Column({ name: 'in_store_enabled', type: 'boolean', default: false })
  inStoreEnabled: boolean

  // --- Pagos ---
  @Column({ name: 'cash_enabled', type: 'boolean', default: true })
  cashEnabled: boolean

  @Column({ name: 'transfer_enabled', type: 'boolean', default: false })
  transferEnabled: boolean

  @Column({ name: 'transfer_alias', type: 'varchar', length: 100, nullable: true })
  transferAlias: string | null

  @Column({ name: 'card_enabled', type: 'boolean', default: false })
  cardEnabled: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone', nullable: true })
  updatedAt: Date
}
```

### B1.4 — Entidad `Category`

```typescript
// src/modules/catalog/entities/category.entity.ts
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'

@Entity('categories')
@Index(['tenantId', 'order'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null

  @Column({ type: 'integer', default: 0 })
  order: number

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone', nullable: true })
  updatedAt: Date
}
```

### B1.5 — Entidad `Product`

```typescript
// src/modules/catalog/entities/product.entity.ts
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'
import { Category } from './category.entity'
import { OptionGroup } from './option-group.entity'

@Entity('products')
@Index(['tenantId', 'categoryId'])
@Index(['tenantId', 'isActive'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'integer' })
  price: number // centavos — NUNCA float

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @Column({ type: 'integer', default: 0 })
  order: number

  @OneToMany(() => OptionGroup, (group) => group.product, { cascade: true })
  optionGroups: OptionGroup[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone', nullable: true })
  updatedAt: Date
}
```

### B1.6 — Entidades `OptionGroup` y `OptionItem`

```typescript
// src/modules/catalog/entities/option-group.entity.ts
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Product } from './product.entity'
import { OptionItem } from './option-item.entity'

export enum OptionGroupType {
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
}

@Entity('option_groups')
export class OptionGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string

  @ManyToOne(() => Product, (product) => product.optionGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'enum', enum: OptionGroupType, default: OptionGroupType.RADIO })
  type: OptionGroupType

  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired: boolean

  @Column({ name: 'min_selections', type: 'integer', default: 0 })
  minSelections: number

  @Column({ name: 'max_selections', type: 'integer', default: 1 })
  maxSelections: number

  @Column({ type: 'integer', default: 0 })
  order: number

  @OneToMany(() => OptionItem, (item) => item.optionGroup, { cascade: true })
  items: OptionItem[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date
}
```

```typescript
// src/modules/catalog/entities/option-item.entity.ts
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { OptionGroup } from './option-group.entity'

@Entity('option_items')
export class OptionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'option_group_id', type: 'uuid' })
  optionGroupId: string

  @ManyToOne(() => OptionGroup, (group) => group.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'option_group_id' })
  optionGroup: OptionGroup

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ name: 'price_modifier', type: 'integer', default: 0 })
  priceModifier: number // centavos — 0 si no tiene precio adicional

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean

  @Column({ type: 'integer', default: 0 })
  order: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date
}
```

### B1.7 — Entidad `Order`

```typescript
// src/modules/orders/entities/order.entity.ts
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'
import { OrderItem } from './order-item.entity'

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DeliveryMethod {
  DELIVERY = 'delivery',
  TAKEAWAY = 'takeaway',
  IN_STORE = 'in_store',
}

export enum PaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  CARD = 'card',
  OTHER = 'other',
}

@Entity('orders')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ name: 'order_number', type: 'varchar', length: 50 })
  orderNumber: string // ORD-YYYYMMDD-XXX

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus

  @Column({ name: 'delivery_method', type: 'enum', enum: DeliveryMethod })
  deliveryMethod: DeliveryMethod

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod

  @Column({ name: 'subtotal', type: 'integer' })
  subtotal: number // centavos

  @Column({ name: 'delivery_cost', type: 'integer', default: 0 })
  deliveryCost: number // centavos

  @Column({ name: 'total', type: 'integer' })
  total: number // centavos

  @Column({ name: 'customer_info', type: 'jsonb' })
  customerInfo: Record<string, unknown>

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes: string | null

  @Column({ name: 'status_history', type: 'jsonb', default: '[]' })
  statusHistory: Record<string, unknown>[]

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone', nullable: true })
  updatedAt: Date
}
```

### B1.8 — Entidad `OrderItem`

```typescript
// src/modules/orders/entities/order-item.entity.ts
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Order } from './order.entity'

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string

  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName: string // snapshot — nombre al momento del pedido

  @Column({ name: 'unit_price', type: 'integer' })
  unitPrice: number // centavos — snapshot del precio

  @Column({ type: 'integer', default: 1 })
  quantity: number

  @Column({ name: 'selected_options', type: 'jsonb', default: '[]' })
  selectedOptions: Record<string, unknown>[]

  @Column({ name: 'item_note', type: 'text', nullable: true })
  itemNote: string | null

  @Column({ name: 'subtotal', type: 'integer' })
  subtotal: number // centavos

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date
}
```

---

## F1-B: Módulo Auth

### B1.10-B1.12 — JWT Config

```typescript
// src/config/jwt.config.ts
import { registerAs } from '@nestjs/config'

export default registerAs('jwt', () => ({
  privateKey: Buffer.from(
    process.env['JWT_PRIVATE_KEY'] ?? '',
    'base64',
  ).toString('utf-8'),
  publicKey: Buffer.from(
    process.env['JWT_PUBLIC_KEY'] ?? '',
    'base64',
  ).toString('utf-8'),
  accessExpiration: process.env['JWT_ACCESS_EXPIRATION'] ?? '15m',
  refreshExpiration: process.env['JWT_REFRESH_EXPIRATION'] ?? '7d',
}))
```

### B1.12 — JWT Strategy (RS256)

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

export interface JwtPayload {
  sub: string
  email: string
  tenantId: string
  iat: number
  exp: number
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.publicKey'),
      algorithms: ['RS256'],
    })
  }

  validate(payload: JwtPayload): { userId: string; email: string; tenantId: string } {
    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
    }
  }
}
```

### B1.10 — RegisterDto y LoginDto

```typescript
// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator'
import { Transform } from 'class-transformer'

export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  storeName: string

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug solo puede contener letras minúsculas, números y guiones' })
  slug: string
}
```

```typescript
// src/modules/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator'
import { Transform } from 'class-transformer'

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string

  @IsString()
  @MinLength(1)
  password: string
}
```

### B1.15 — ForgotPasswordDto y ResetPasswordDto

```typescript
// src/modules/auth/dto/forgot-password.dto.ts
import { IsEmail } from 'class-validator'
import { Transform } from 'class-transformer'

export class ForgotPasswordDto {
  @IsEmail()
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string
}
```

```typescript
// src/modules/auth/dto/reset-password.dto.ts
import { IsString, MinLength, MaxLength } from 'class-validator'

export class ResetPasswordDto {
  @IsString()
  token: string

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string
}
```

### B1.16 — Guards activados

```typescript
// src/common/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles || requiredRoles.length === 0) return true

    const request = context.switchToHttp().getRequest<{ user?: { role?: string } }>()
    const user = request.user
    return requiredRoles.some((role) => user?.role === role)
  }
}
```

```typescript
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
```

### B1.17 — TenantContextInterceptor activado

```typescript
// src/common/interceptors/tenant-context.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'

interface RequestWithUser extends Request {
  user?: { tenantId?: string }
  tenantId?: string
}

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    if (request.user?.tenantId) {
      request.tenantId = request.user.tenantId
    }
    return next.handle()
  }
}
```

```typescript
// src/common/decorators/tenant-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

interface RequestWithTenantId extends Request {
  tenantId?: string
}

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenantId>()
    return request.tenantId
  },
)
```

---

## Variables de entorno nuevas (agregar a `.env.example`)

```dotenv
# Auth — JWT RS256
JWT_PRIVATE_KEY=<base64 de private.pem>
JWT_PUBLIC_KEY=<base64 de public.pem>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Auth — bcrypt
BCRYPT_ROUNDS=12
```

---

## Registro de módulos en AppModule

```typescript
// Agregar en app.module.ts:
// imports: [
//   ...
//   TypeOrmModule.forFeature([Tenant, StoreSettings, User, Category, Product, OptionGroup, OptionItem, Order, OrderItem]),
//   ConfigModule.forRoot({ load: [databaseConfig, jwtConfig], ... }),
//   TenantsModule,
//   AuthModule,
// ]
```

> **Nota:** Las entidades se registran en cada módulo con `TypeOrmModule.forFeature([...])`. El `forRoot` en `AppModule` las detecta automáticamente vía glob `**/*.entity{.ts,.js}`.
