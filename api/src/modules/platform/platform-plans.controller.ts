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
  Put,
  UseGuards,
} from '@nestjs/common';
import { PlatformAdminGuard } from './guards/platform-admin.guard.js';
import { SkipRls } from '../../common/decorators/skip-rls.decorator.js';
import { PlatformPlansService } from './platform-plans.service.js';
import { FeatureService } from './feature.service.js';
import { PlatformCreatePlanDto } from './dto/platform-create-plan.dto.js';
import { PlatformUpdatePlanDto } from './dto/platform-update-plan.dto.js';
import { PlatformReorderPlansDto } from './dto/platform-reorder-plans.dto.js';
import { PlatformAssignFeaturesDto } from './dto/platform-assign-features.dto.js';

@SkipRls()
@UseGuards(PlatformAdminGuard)
@Controller('platform/plans')
export class PlatformPlansController {
  constructor(
    private readonly plansService: PlatformPlansService,
    private readonly featureService: FeatureService,
  ) {}

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

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  reorder(@Body() dto: PlatformReorderPlansDto) {
    return this.plansService.reorder(dto.ids);
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

  @Get(':id/features')
  getFeaturesForPlan(@Param('id', ParseUUIDPipe) id: string) {
    return this.featureService.getFeaturesForPlan(id);
  }

  @Put(':id/features')
  @HttpCode(HttpStatus.OK)
  assignFeaturesToPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PlatformAssignFeaturesDto,
  ) {
    return this.featureService.assignFeaturesToPlan(id, dto.featureIds);
  }
}
