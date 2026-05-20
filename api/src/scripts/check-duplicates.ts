import { AppDataSource } from '../config/data-source.js';
import { StoreSettings } from '../modules/tenants/entities/store-settings.entity.js';

async function check() {
  await AppDataSource.initialize();
  console.log('DB Initialized');
  
  const results = await AppDataSource.getRepository(StoreSettings)
    .createQueryBuilder('s')
    .select('s.tenantId', 'tenantId')
    .addSelect('COUNT(*)', 'count')
    .groupBy('s.tenantId')
    .having('COUNT(*) > 1')
    .getRawMany();
    
  console.log('Duplicates found:', results);
  
  if (results.length === 0) {
    const total = await AppDataSource.getRepository(StoreSettings).count();
    console.log('Total settings records:', total);
  }

  await AppDataSource.destroy();
}

check().catch(console.error);
