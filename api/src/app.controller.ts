import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { SkipRls } from './common/decorators/skip-rls.decorator.js';

@SkipRls()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  async checkHealth() {
    return this.appService.checkHealth();
  }
}
