import { registerAs } from '@nestjs/config';

export const platformJwtConfig = registerAs('platformJwt', () => ({
  privateKey: (process.env['PLATFORM_JWT_PRIVATE_KEY'] ?? '').replace(/\\n/g, '\n'),
  publicKey: (process.env['PLATFORM_JWT_PUBLIC_KEY'] ?? '').replace(/\\n/g, '\n'),
  accessExpiration: process.env['PLATFORM_JWT_ACCESS_EXPIRATION'] ?? '15m',
  refreshExpiration: process.env['PLATFORM_JWT_REFRESH_EXPIRATION'] ?? '7d',
  mfaEncryptionKey: process.env['PLATFORM_MFA_ENCRYPTION_KEY'] ?? '',
}));
