import { IsBoolean, IsInt, IsOptional, IsString, Min, MaxLength, MinLength } from 'class-validator';

export class PlatformUpdatePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxProducts?: number;

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxCategories?: number;

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxStaffUsers?: number;

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxImages?: number;

  @IsOptional()
  @IsInt()
  @Min(-1)
  priceMonthly?: number; // 0 = gratis, -1 = contactar, >0 = precio en centavos

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}
