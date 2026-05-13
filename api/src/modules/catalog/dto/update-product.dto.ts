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

export class UpdateOptionItemDto {
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

export class UpdateOptionGroupDto {
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
  @Type(() => UpdateOptionItemDto)
  items!: UpdateOptionItemDto[];
}

export class UpdateProductDto {
  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string | null;

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
  @Type(() => UpdateOptionGroupDto)
  @IsOptional()
  optionGroups?: UpdateOptionGroupDto[];
}
