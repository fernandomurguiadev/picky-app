import 'reflect-metadata';
import { IsNull } from 'typeorm';
import { AppDataSource } from '../config/data-source.js';
import { Plan } from '../modules/platform/entities/plan.entity.js';
import { Tenant, TenantStatus } from '../modules/tenants/entities/tenant.entity.js';

const PLANS = [
  { name: 'Free',     maxProducts: 10, maxCategories: 3,  maxStaffUsers: 1, maxImages: 10  },
  { name: 'Starter',  maxProducts: 20, maxCategories: 8,  maxStaffUsers: 2, maxImages: 20  },
  { name: 'Pro',      maxProducts: 40, maxCategories: 15, maxStaffUsers: 3, maxImages: 80  },
  { name: 'Business', maxProducts: -1, maxCategories: -1, maxStaffUsers: -1, maxImages: -1 },
];

async function seedPlans() {
  console.log('Iniciando seed de planes...');

  try {
    await AppDataSource.initialize();
    console.log('Conexión establecida.');

    const planRepo = AppDataSource.getRepository(Plan);
    const tenantRepo = AppDataSource.getRepository(Tenant);

    // Upsert planes
    for (const planData of PLANS) {
      const existing = await planRepo.findOne({ where: { name: planData.name } });
      if (existing) {
        await planRepo.update(existing.id, planData);
        console.log(`Plan "${planData.name}" actualizado.`);
      } else {
        await planRepo.save(planRepo.create(planData));
        console.log(`Plan "${planData.name}" creado.`);
      }
    }

    // Asignar plan Free a todos los tenants sin plan
    const freePlan = await planRepo.findOneOrFail({ where: { name: 'Free' } });
    const tenantsWithoutPlan = await tenantRepo.find({ where: { planId: IsNull() } });

    if (tenantsWithoutPlan.length > 0) {
      await tenantRepo.update(
        tenantsWithoutPlan.map((t) => t.id),
        { planId: freePlan.id, status: TenantStatus.ACTIVE },
      );
      console.log(`Plan Free asignado a ${tenantsWithoutPlan.length} tenant(s) existentes.`);
    } else {
      console.log('Todos los tenants ya tienen plan asignado.');
    }

    console.log('Seed de planes completado.');
  } catch (error) {
    console.error('Error durante seed de planes:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seedPlans();
