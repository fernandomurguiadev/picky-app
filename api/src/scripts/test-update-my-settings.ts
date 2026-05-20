import 'dotenv/config';
import { AppDataSource } from '../config/data-source.js';
import { TenantsService } from '../modules/tenants/tenants.service.js';
import { StoreSettings } from '../modules/tenants/entities/store-settings.entity.js';
import { Tenant } from '../modules/tenants/entities/tenant.entity.js';

async function main() {
  await AppDataSource.initialize();
  console.log('DB Initialized');
  
  const tenantsService = new TenantsService(
    AppDataSource.getRepository(Tenant),
    AppDataSource.getRepository(StoreSettings),
  );

  const tenantId = '130c51c8-0ee5-4b54-ab76-6649cbcf21de';

  console.log('--- Calling updateMySettings first time ---');
  const res1 = await tenantsService.updateMySettings(tenantId, {
    primaryColor: '#ff0000',
    accentColor: '#00ff00',
    backgroundColor: '#ffffff'
  });
  console.log('Result 1 ID:', res1?.id, 'primaryColor:', res1?.primaryColor);

  console.log('--- Calling updateMySettings second time ---');
  const res2 = await tenantsService.updateMySettings(tenantId, {
    primaryColor: '#0000ff',
    accentColor: '#00ff00',
    backgroundColor: '#ffffff'
  });
  console.log('Result 2 ID:', res2?.id, 'primaryColor:', res2?.primaryColor);

  await AppDataSource.destroy();
}

main().catch(console.error);
