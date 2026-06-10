import { IsUUID } from 'class-validator';

export class PlatformChangePlanDto {
  @IsUUID()
  planId!: string;
}
