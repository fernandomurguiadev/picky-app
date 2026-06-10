import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity.js';
import { Tenant, TenantStatus } from '../tenants/entities/tenant.entity.js';
import type { PlatformCreatePlanDto } from './dto/platform-create-plan.dto.js';
import type { PlatformUpdatePlanDto } from './dto/platform-update-plan.dto.js';

@Injectable()
export class PlatformPlansService {
  constructor(
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
  ) {}

  findAll() {
    return this.planRepo.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    return plan;
  }

  async create(dto: PlatformCreatePlanDto) {
    const existing = await this.planRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Ya existe un plan con ese nombre');

    const plan = this.planRepo.create(dto);
    return this.planRepo.save(plan);
  }

  async update(id: string, dto: PlatformUpdatePlanDto) {
    const plan = await this.findOne(id);

    if (dto.name && dto.name !== plan.name) {
      const existing = await this.planRepo.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException('Ya existe un plan con ese nombre');
    }

    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  async toggleVisibility(id: string) {
    const plan = await this.findOne(id);

    if (!plan.isHidden) {
      // Verificar que no haya tenants activos O suspendidos en este plan
      // (suspendidos se reactivan al plan que tenían asignado, no debe quedar oculto)
      const assignedCount = await this.tenantRepo.count({
        where: [
          { planId: id, status: TenantStatus.ACTIVE },
          { planId: id, status: TenantStatus.SUSPENDED },
        ],
      });
      if (assignedCount > 0) {
        throw new BadRequestException(
          `No se puede ocultar el plan "${plan.name}": tiene ${assignedCount} tenant(s) asignado(s)`,
        );
      }
    }

    plan.isHidden = !plan.isHidden;
    return this.planRepo.save(plan);
  }

  async getTenantsOnPlan(id: string) {
    await this.findOne(id);
    return this.tenantRepo.find({
      where: { planId: id },
      select: ['id', 'name', 'slug', 'status', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }
}
