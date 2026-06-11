import { IsArray, IsUUID } from 'class-validator';

export class PlatformAssignFeaturesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  featureIds!: string[];
}
