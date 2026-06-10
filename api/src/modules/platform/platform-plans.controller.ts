import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlatformAdminGuard } from './guards/platform-admin.guard.js';
import { SkipRls } from '../../common/decorators/skip-rls.decorator.js';
import { PlatformPlansService } from './platform-plans.service.js';
import { PlatformCreatePlanDto } from './dto/platform-create-plan.dto.js';
import { PlatformUpdatePlanDto } from './dto/platform-update-plan.dto.js';

@SkipRls()
@UseGuards(PlatformAdminGuard)
@Controller('platform/plans')
export class PlatformPlansController {
  constructor(private readonly plansService: PlatformPlansService) {}

  @Get()
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.findOne(id);
  }

  @Get(':id/tenants')
  getTenantsOnPlan(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.getTenantsOnPlan(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: PlatformCreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PlatformUpdatePlanDto,
  ) {
    return this.plansService.update(id, dto);
  }

  @Patch(':id/visibility')
  @HttpCode(HttpStatus.OK)
  toggleVisibility(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.toggleVisibility(id);
  }
}
