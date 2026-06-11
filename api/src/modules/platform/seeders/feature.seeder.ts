/**
 * Feature Seeder — carga las features base y las asigna a los planes.
 *
 * Uso:
 *   import { FeatureSeeder } from './seeders/feature.seeder.js';
 *   await new FeatureSeeder(dataSource).run();
 *
 * Es idempotente: usa upsert por `code` y replace atómico de plan_features.
 */
import { DataSource } from 'typeorm';
import { Feature } from '../entities/feature.entity.js';
import { PlanFeature } from '../entities/plan-feature.entity.js';
import { Plan } from '../entities/plan.entity.js';
import { FeatureCode } from '../enums/feature-code.enum.js';

const FEATURES: { code: FeatureCode; name: string; description: string }[] = [
  { code: FeatureCode.REMOVE_BRANDING, name: 'Remover marca Picky', description: 'Oculta el branding de Picky en la tienda pública' },
  { code: FeatureCode.CUSTOM_DOMAIN, name: 'Dominio propio', description: 'Permite conectar un dominio personalizado a la tienda' },
  { code: FeatureCode.ANALYTICS, name: 'Analytics', description: 'Panel de métricas y estadísticas de la tienda' },
  { code: FeatureCode.PRIORITY_SUPPORT, name: 'Soporte prioritario', description: 'Acceso a soporte con respuesta prioritaria' },
  { code: FeatureCode.MULTI_BRANCH, name: 'Multi-sucursal', description: 'Gestión de múltiples sucursales bajo un mismo tenant' },
  { code: FeatureCode.API_ACCESS, name: 'Acceso API', description: 'Acceso a la API pública para integraciones externas' },
  { code: FeatureCode.AI_ASSISTANT, name: 'Asistente IA', description: 'Funcionalidades potenciadas por inteligencia artificial' },
];

const PLAN_FEATURES: Record<string, FeatureCode[]> = {
  FREE: [],
  STARTER: [FeatureCode.REMOVE_BRANDING, FeatureCode.ANALYTICS],
  PRO: [FeatureCode.REMOVE_BRANDING, FeatureCode.ANALYTICS, FeatureCode.CUSTOM_DOMAIN, FeatureCode.PRIORITY_SUPPORT],
  BUSINESS: [
    FeatureCode.REMOVE_BRANDING,
    FeatureCode.CUSTOM_DOMAIN,
    FeatureCode.ANALYTICS,
    FeatureCode.PRIORITY_SUPPORT,
    FeatureCode.MULTI_BRANCH,
    FeatureCode.API_ACCESS,
    FeatureCode.AI_ASSISTANT,
  ],
};

export class FeatureSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async run(): Promise<void> {
    const featureRepo = this.dataSource.getRepository(Feature);
    const planRepo = this.dataSource.getRepository(Plan);
    const planFeatureRepo = this.dataSource.getRepository(PlanFeature);

    // Upsert features por code
    await featureRepo.upsert(FEATURES, { conflictPaths: ['code'], skipUpdateIfNoValuesChanged: true });

    // Cargar el mapa de code → id
    const allFeatures = await featureRepo.find({ select: ['id', 'code'] });
    const codeToId = new Map(allFeatures.map((f) => [f.code, f.id]));

    // Asignar features a cada plan de forma idempotente
    for (const [planName, featureCodes] of Object.entries(PLAN_FEATURES)) {
      const plan = await planRepo.findOne({ where: { name: planName } });
      if (!plan) {
        console.warn(`[FeatureSeeder] Plan "${planName}" no encontrado — se omite.`);
        continue;
      }

      await this.dataSource.transaction(async (manager) => {
        await manager.delete(PlanFeature, { planId: plan.id });
        if (featureCodes.length > 0) {
          const entries = featureCodes.map((code) => {
            const featureId = codeToId.get(code);
            if (!featureId) throw new Error(`[FeatureSeeder] Feature "${code}" no encontrada en DB`);
            return manager.create(PlanFeature, { planId: plan.id, featureId });
          });
          await manager.save(PlanFeature, entries);
        }
      });

      console.log(`[FeatureSeeder] Plan "${planName}" → ${featureCodes.length} feature(s) asignada(s)`);
    }

    console.log('[FeatureSeeder] Completado.');
  }
}
