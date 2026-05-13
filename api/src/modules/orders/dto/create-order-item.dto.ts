import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SelectedOptionDto } from './selected-option.dto.js';

export class CreateOrderItemDto {
  @IsUUID('4')
  productId!: string;

  @IsString()
  @MaxLength(255)
  productName!: string;

  @IsInt()
  @Min(1)
  unitPrice!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedOptionDto)
  selectedOptions!: SelectedOptionDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  itemNote?: string;
}
