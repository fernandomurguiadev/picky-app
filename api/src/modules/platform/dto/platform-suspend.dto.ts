import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PlatformSuspendDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
