import { IsString, IsNotEmpty } from 'class-validator';

export class LinkWhatsappDto {
  @IsString()
  @IsNotEmpty()
  orderNumber!: string;

  @IsString()
  @IsNotEmpty()
  verifiedWhatsappNumber!: string;
}
