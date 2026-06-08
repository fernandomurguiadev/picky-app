import {
  IsArray,
  IsBoolean,
  IsIn,
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
  // Modelo de Negocio
  @IsOptional()
  @IsIn(['retail', 'services'])
  storeType?: 'retail' | 'services';

  @IsOptional()
  @IsString()
  customCtaText?: string | null;

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
  @Matches(/^[A-Za-z_\/\-+0-9]+$/, { message: 'Invalid timezone format' })
  timezone?: string;

  // Tema
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'primaryColor must be a valid hex color (#RRGGBB)',
  })
  primaryColor?: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'accentColor must be a valid hex color (#RRGGBB)',
  })
  accentColor?: string;

  @IsOptional()
  @IsIn(['default', 'minimal', 'bold', 'glass', 'soft', 'retro'], {
    message:
      'cardStyle must be one of: default, minimal, bold, glass, soft, retro',
  })
  cardStyle?: string;

  @IsOptional()
  @IsIn([0, 1, 2], { message: 'mobileGridCols must be 0 (list), 1 or 2' })
  mobileGridCols?: number;

  @IsOptional()
  @IsIn(
    [
      '#FFFFFF',
      '#ffffff',
      '#FDFBF7',
      '#fdfbf7',
      '#F8F9FA',
      '#f8f9fa',
      '#F2F5F1',
      '#f2f5f1',
      '#FFF1F2',
      '#fff1f2',
      '#F0FDF4',
      '#f0fdf4',
      '#FFFBEB',
      '#fffbeb',
      '#EEF2FF',
      '#eef2ff',
      '#F1F5F9',
      '#f1f5f9',
      '#111827',
      '#111827',
      '#09090B',
      '#09090b',
      '#064E3B',
      '#064e3b',
      '#1E3A8A',
      '#1e3a8a',
      '#4C0519',
      '#4c0519',
      '#271C19',
      '#271c19',
      '#0F172A',
      '#0f172a',
      '#2E1065',
      '#2e1065',
      '#083344',
      '#083344',
    ],
    { message: 'backgroundColor must be one of the curated elegant presets' },
  )
  backgroundColor?: string;

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
