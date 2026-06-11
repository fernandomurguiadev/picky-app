import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity.js';
import { SkipRls } from '../../common/decorators/skip-rls.decorator.js';

@SkipRls()
@Controller('public/plans')
export class PublicPlansController {
  constructor(
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
  ) {}

  @Get()
  findVisible() {
    return this.planRepo.find({
      where: { isHidden: false },
      relations: { planFeatures: { feature: true } },
      order: { sortOrder: 'ASC', priceMonthly: 'ASC' },
    });
  }
}
