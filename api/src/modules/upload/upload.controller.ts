import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantId } from '../../common/decorators/tenant-id.decorator.js';
import { UploadService } from './upload.service.js';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @TenantId() tenantId: string,
  ): Promise<{ url: string; publicId: string }> {
    return this.uploadService.uploadImage(file, tenantId);
  }
}
