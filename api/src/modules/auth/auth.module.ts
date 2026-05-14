import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from './entities/user.entity.js';
import { TenantMembership } from './entities/tenant-membership.entity.js';
import { Tenant } from '../tenants/entities/tenant.entity.js';
import { StoreSettings } from '../tenants/entities/store-settings.entity.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, StoreSettings, TenantMembership]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        privateKey: cfg.get<string>('jwt.privateKey') ?? '',
        publicKey: cfg.get<string>('jwt.publicKey') ?? '',
        signOptions: {
          algorithm: 'RS256' as const,
          expiresIn: (cfg.get<string>('jwt.accessExpiration') ?? '15m') as `${number}${'s'|'m'|'h'|'d'}`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
