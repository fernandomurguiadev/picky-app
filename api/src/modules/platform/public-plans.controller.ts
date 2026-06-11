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
    return this.planRepo.query(`
      SELECT id, name, "maxProducts", "maxCategories", "maxStaffUsers", "maxImages", "priceMonthly",
             CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.columns
               WHERE table_name = 'plans' AND column_name = 'description'
             ) THEN description ELSE NULL END AS description
      FROM plans
      WHERE "isHidden" = false
      ORDER BY "sortOrder" ASC, "priceMonthly" ASC
    `);
  }
}
