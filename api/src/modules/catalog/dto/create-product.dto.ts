import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OptionGroupType } from '../entities/option-group.entity.js';

export class CreateOptionItemDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsInt()
  @Min(0)
  priceModifier!: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class CreateOptionGroupDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsEnum(OptionGroupType)
  type!: OptionGroupType;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  minSelections?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxSelections?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionItemDto)
  items!: CreateOptionItemDto[];
}

export class CreateProductDto {
  @IsUUID('4')
  categoryId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionGroupDto)
  @IsOptional()
  optionGroups?: CreateOptionGroupDto[];
}
