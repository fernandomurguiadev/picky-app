import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { PlatformAdmin } from './entities/platform-admin.entity.js';
import { PlatformAuditLog } from './entities/platform-audit-log.entity.js';
import { Plan } from './entities/plan.entity.js';
import { Feature } from './entities/feature.entity.js';
import { PlanFeature } from './entities/plan-feature.entity.js';
import { ImpersonationCode } from './entities/impersonation-code.entity.js';
import { Tenant } from '../tenants/entities/tenant.entity.js';
import { User } from '../auth/entities/user.entity.js';
import { TenantMembership } from '../auth/entities/tenant-membership.entity.js';
import { StoreSettings } from '../tenants/entities/store-settings.entity.js';

import { PlatformAuthService } from './platform-auth.service.js';
import { PlatformSuspensionService } from './platform-suspension.service.js';
import { PlatformImpersonationService } from './platform-impersonation.service.js';
import { PlatformTenantsService } from './platform-tenants.service.js';
import { PlatformPlansService } from './platform-plans.service.js';
import { FeatureService } from './feature.service.js';
import { PlatformCleanupCron } from './platform-cleanup.cron.js';

import { PlatformAuthController } from './platform-auth.controller.js';
import { PlatformImpersonationController } from './platform-impersonation.controller.js';
import { PlatformTenantsController } from './platform-tenants.controller.js';
import { PlatformPlansController } from './platform-plans.controller.js';
import { PlatformFeaturesController } from './platform-features.controller.js';
import { PlatformAuditLogsController } from './platform-audit-logs.controller.js';
import { PublicPlansController } from './public-plans.controller.js';

import { PlatformJwtStrategy } from './strategies/platform-jwt.strategy.js';
import { platformJwtConfig } from '../../config/platform-jwt.config.js';

@Module({
  imports: [
    ConfigModule.forFeature(platformJwtConfig),
    TypeOrmModule.forFeature([
      PlatformAdmin,
      PlatformAuditLog,
      Plan,
      Feature,
      PlanFeature,
      ImpersonationCode,
      Tenant,
      User,
      TenantMembership,
      StoreSettings,
    ]),
    PassportModule,
    JwtModule.register({}),
  ],
  providers: [
    PlatformAuthService,
    PlatformSuspensionService,
    PlatformImpersonationService,
    PlatformTenantsService,
    PlatformPlansService,
    FeatureService,
    PlatformCleanupCron,
    PlatformJwtStrategy,
  ],
  controllers: [
    PlatformAuthController,
    PlatformImpersonationController,
    PlatformTenantsController,
    PlatformPlansController,
    PlatformFeaturesController,
    PlatformAuditLogsController,
    PublicPlansController,
  ],
  exports: [PlatformJwtStrategy, PassportModule, TypeOrmModule, PlatformSuspensionService, FeatureService],
})
export class PlatformModule {}
