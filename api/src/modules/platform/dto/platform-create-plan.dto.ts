import { IsBoolean, IsInt, IsOptional, IsString, Min, MaxLength, MinLength } from 'class-validator';

export class PlatformCreatePlanDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsInt()
  @Min(-1)
  maxProducts!: number;

  @IsInt()
  @Min(-1)
  maxCategories!: number;

  @IsInt()
  @Min(-1)
  maxStaffUsers!: number;

  @IsInt()
  @Min(-1)
  maxImages!: number;

  @IsOptional()
  @IsInt()
  @Min(-1)
  priceMonthly?: number = 0; // 0 = gratis, -1 = contactar, >0 = precio en centavos

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean = false;
}
