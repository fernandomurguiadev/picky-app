import { IsInt, IsString, IsUUID } from 'class-validator';

export class SelectedOptionDto {
  @IsUUID('4')
  groupId!: string;

  @IsString()
  groupName!: string;

  @IsUUID('4')
  itemId!: string;

  @IsString()
  itemName!: string;

  @IsInt()
  priceModifier!: number;
}
