import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryMethod, PaymentMethod } from '../enums/order.enums.js';
import { CustomerInfoDto } from './customer-info.dto.js';
import { CreateOrderItemDto } from './create-order-item.dto.js';

export class CreateOrderDto {
  @IsUUID('4')
  tenantId!: string;

  @IsEnum(DeliveryMethod)
  deliveryMethod!: DeliveryMethod;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer!: CustomerInfoDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
