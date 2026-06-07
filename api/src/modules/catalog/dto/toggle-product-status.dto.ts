import { IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ToggleProductStatusDto {
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isActive!: boolean;
}
