import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ToggleStoreStatusDto {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === null ? null : typeof value === 'boolean' ? value : undefined,
  )
  isManualOpen: boolean | null = null;
}
