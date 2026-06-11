import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Feature } from './entities/feature.entity.js';
import { PlanFeature } from './entities/plan-feature.entity.js';
import { Tenant } from '../tenants/entities/tenant.entity.js';
import type { PlatformCreateFeatureDto } from './dto/platform-create-feature.dto.js';
import type { PlatformUpdateFeatureDto } from './dto/platform-update-feature.dto.js';

@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Feature) private readonly featureRepo: Repository<Feature>,
    @InjectRepository(PlanFeature) private readonly planFeatureRepo: Repository<PlanFeature>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Feature[]> {
    return this.featureRepo.find({ order: { code: 'ASC' } });
  }

  async create(dto: PlatformCreateFeatureDto): Promise<Feature> {
    const existing = await this.featureRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Ya existe una feature con el código "${dto.code}"`);

    const feature = this.featureRepo.create(dto);
    return this.featureRepo.save(feature);
  }

  async update(id: string, dto: PlatformUpdateFeatureDto): Promise<Feature> {
    const feature = await this.featureRepo.findOne({ where: { id } });
    if (!feature) throw new NotFoundException('Feature no encontrada');

    Object.assign(feature, dto);
    return this.featureRepo.save(feature);
  }

  async remove(id: string): Promise<void> {
    const feature = await this.featureRepo.findOne({ where: { id } });
    if (!feature) throw new NotFoundException('Feature no encontrada');

    const assignedCount = await this.planFeatureRepo.count({ where: { featureId: id } });
    if (assignedCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la feature "${feature.code}": está asignada a ${assignedCount} plan(es)`,
      );
    }

    await this.featureRepo.remove(feature);
  }

  async getFeaturesForPlan(planId: string): Promise<Feature[]> {
    const planFeatures = await this.planFeatureRepo.find({
      where: { planId },
      relations: { feature: true },
      order: { feature: { code: 'ASC' } },
    });
    return planFeatures.map((pf) => pf.feature);
  }

  async assignFeaturesToPlan(planId: string, featureIds: string[]): Promise<Feature[]> {
    if (featureIds.length > 0) {
      const features = await this.featureRepo.find({ where: { id: In(featureIds) } });
      if (features.length !== featureIds.length) {
        const foundIds = new Set(features.map((f) => f.id));
        const missing = featureIds.find((id) => !foundIds.has(id));
        throw new NotFoundException(`Feature con id "${missing}" no encontrada`);
      }
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(PlanFeature, { planId });
      if (featureIds.length > 0) {
        const newEntries = featureIds.map((featureId) =>
          manager.create(PlanFeature, { planId, featureId }),
        );
        await manager.save(PlanFeature, newEntries);
      }
    });

    return this.getFeaturesForPlan(planId);
  }

  async hasFeature(tenantId: string, featureCode: string): Promise<boolean> {
    try {
      const tenant = await this.tenantRepo.findOne({
        where: { id: tenantId },
        select: ['planId'],
      });
      if (!tenant?.planId) return false;

      const exists = await this.dataSource
        .createQueryBuilder()
        .select('1')
        .from(PlanFeature, 'pf')
        .innerJoin(Feature, 'f', 'f.id = pf.featureId')
        .where('pf.planId = :planId', { planId: tenant.planId })
        .andWhere('f.code = :code', { code: featureCode })
        .getExists();

      return exists;
    } catch {
      return false;
    }
  }
}
