import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { StockMovementType } from '../entities/stock-movement.entity.js';

export class CreateStockMovementDto {
  @IsEnum(StockMovementType, {
    message: 'El tipo de movimiento debe ser uno de: purchase_in, adjustment, waste',
  })
  type!: StockMovementType;

  @IsInt()
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  quantity!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
