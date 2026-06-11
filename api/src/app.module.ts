import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import type { DataSourceOptions } from 'typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { databaseConfig } from './config/database.config.js';
import { jwtConfig } from './config/jwt.config.js';
import { validateEnv } from './config/env.config.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { PlanLimitsGuard } from './common/guards/plan-limits.guard.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor.js';
import { RlsInterceptor } from './common/interceptors/rls.interceptor.js';
import { SuspensionInterceptor } from './common/interceptors/suspension.interceptor.js';
import { ImpersonationAuditInterceptor } from './common/interceptors/impersonation-audit.interceptor.js';
import { RedisModule } from './common/redis/redis.module.js';
import { TenantsModule } from './modules/tenants/tenants.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { PlatformModule } from './modules/platform/platform.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [databaseConfig, jwtConfig],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              }
            : {
                targets: [
                  {
                    target: 'pino/file',
                    level: 'info',
                    options: { destination: 1 }, // stdout
                  },
                  {
                    target: 'pino-roll',
                    level: 'info',
                    options: {
                      file: './logs/picky-api.log',
                      frequency: 'daily',
                      mkdir: true,
                      limit: { count: 30 },
                    },
                  },
                ],
              },
        autoLogging: true,
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
        },
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) =>
        cfg.get<DataSourceOptions>('database') as DataSourceOptions,
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    // Rate limiting global: 100 req / 60s por IP (plataforma sobrescribe con @Throttle más estricto)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TenantsModule,
    AuthModule,
    CatalogModule,
    OrdersModule,
    UploadModule,
    DashboardModule,
    InventoryModule,
    PlatformModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: PlanLimitsGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SuspensionInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RlsInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ImpersonationAuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
