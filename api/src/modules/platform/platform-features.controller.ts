import {
  Body,
  Controller,
  Delete,
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
import { FeatureService } from './feature.service.js';
import { PlatformCreateFeatureDto } from './dto/platform-create-feature.dto.js';
import { PlatformUpdateFeatureDto } from './dto/platform-update-feature.dto.js';

@SkipRls()
@UseGuards(PlatformAdminGuard)
@Controller('platform/features')
export class PlatformFeaturesController {
  constructor(private readonly featureService: FeatureService) {}

  @Get()
  findAll() {
    return this.featureService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: PlatformCreateFeatureDto) {
    return this.featureService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PlatformUpdateFeatureDto,
  ) {
    return this.featureService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.featureService.remove(id);
  }
}
