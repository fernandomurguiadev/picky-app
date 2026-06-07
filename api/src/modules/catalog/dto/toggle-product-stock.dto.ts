import { IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ToggleProductStockDto {
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  inStock!: boolean;
}
