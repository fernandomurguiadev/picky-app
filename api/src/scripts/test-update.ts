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

  // We will run the query on the real repository
  const repo = AppDataSource.getRepository(StoreSettings);
  
  // Find a tenant settings record that exists
  const existing = await repo.findOne({ where: {} });
  if (!existing) {
    console.log('No existing settings found to test.');
    await AppDataSource.destroy();
    return;
  }

  console.log('Testing with tenantId:', existing.tenantId, 'Existing ID:', existing.id);
  
  // Now call updateMySettings
  console.log('--- Calling updateMySettings ---');
  let settings = await repo.findOne({ where: { tenantId: existing.tenantId } });
  console.log('Found settings in test:', settings ? 'YES, ID: ' + settings.id : 'NO');
  
  if (settings) {
    Object.assign(settings, { primaryColor: '#aabbcc' });
    const saved = await repo.save(settings);
    console.log('Saved settings. New ID:', saved.id, 'Original ID was:', existing.id);
  }

  await AppDataSource.destroy();
}

main().catch(console.error);
