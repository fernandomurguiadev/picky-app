import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './providers/cloudinary.provider.js';
import { UploadService } from './upload.service.js';
import { UploadController } from './upload.controller.js';

@Module({
  providers: [CloudinaryProvider, UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
