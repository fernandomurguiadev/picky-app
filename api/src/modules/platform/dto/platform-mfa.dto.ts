import { IsString, Length } from 'class-validator';

export class PlatformMfaVerifyDto {
  @IsString()
  @Length(6, 6)
  totpCode!: string;
}

export class PlatformMfaConfirmDto {
  @IsString()
  @Length(6, 6)
  totpCode!: string;
}
