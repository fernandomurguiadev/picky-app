import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity.js';
import { StoreSettings } from './entities/store-settings.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, StoreSettings])],
  exports: [TypeOrmModule],
})
export class TenantsModule {}
