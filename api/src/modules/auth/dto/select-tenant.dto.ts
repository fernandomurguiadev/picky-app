import { IsString, IsUUID, MinLength } from 'class-validator';

export class SelectTenantDto {
  @IsString()
  @MinLength(1)
  selectionToken!: string;

  @IsUUID()
  tenantId!: string;
}
