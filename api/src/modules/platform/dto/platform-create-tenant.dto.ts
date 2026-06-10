import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class PlatformCreateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug solo puede contener letras minúsculas, números y guiones' })
  slug!: string;

  @IsEmail()
  @MaxLength(255)
  ownerEmail!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  ownerPassword!: string;
}
