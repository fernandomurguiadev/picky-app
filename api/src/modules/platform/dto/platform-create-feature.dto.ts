import { IsOptional, IsString, IsUppercase, MaxLength, MinLength } from 'class-validator';

export class PlatformCreateFeatureDto {
  @IsString()
  @IsUppercase()
  @MinLength(2)
  @MaxLength(100)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
