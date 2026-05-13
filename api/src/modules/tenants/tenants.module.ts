import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity.js';
import { StoreSettings } from './entities/store-settings.entity.js';
import { TenantsService } from './tenants.service.js';
import { TenantsController } from './tenants.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, StoreSettings])],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TypeOrmModule, TenantsService],
})
export class TenantsModule {}
