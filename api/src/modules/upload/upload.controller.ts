import {
  Controller,
  Post,
  Query,
  Delete,
  BadRequestException,
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

  @Delete('image')
  async deleteImage(
    @Query('publicId') publicId: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean }> {
    if (!publicId) {
      throw new BadRequestException('El parámetro publicId es requerido en la query url.');
    }
    await this.uploadService.deleteImage(publicId, tenantId);
    return { success: true };
  }
}
