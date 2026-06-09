import {
  IsBoolean,
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isGroupPricingEnabled?: boolean;

  @ValidateIf((o) => o.isGroupPricingEnabled === true)
  @IsDefined({
    message:
      'El precio grupal es requerido cuando el precio grupal está habilitado',
  })
  @IsInt()
  @Min(0)
  groupPrice?: number | null;
}
