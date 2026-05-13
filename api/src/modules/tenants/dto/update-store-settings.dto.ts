import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayScheduleDto } from './day-schedule.dto.js';

export class UpdateStoreSettingsDto {
  // Info básica
  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  whatsapp?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  // Horarios
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  schedule?: DayScheduleDto[];

  @IsOptional()
  @IsString()
  timezone?: string;

  // Tema
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'primaryColor must be a valid hex color (#RRGGBB)' })
  primaryColor?: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'accentColor must be a valid hex color (#RRGGBB)' })
  accentColor?: string;

  // Entrega
  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryCost?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryMinOrder?: number;

  @IsOptional()
  @IsBoolean()
  takeawayEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  inStoreEnabled?: boolean;

  // Pagos
  @IsOptional()
  @IsBoolean()
  cashEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  transferEnabled?: boolean;

  @IsOptional()
  @IsString()
  transferAlias?: string | null;

  @IsOptional()
  @IsBoolean()
  cardEnabled?: boolean;
}
