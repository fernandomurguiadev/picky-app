import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../enums/order.enums.js';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
