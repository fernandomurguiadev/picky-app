import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProfitabilityQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @IsUUID('4')
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
