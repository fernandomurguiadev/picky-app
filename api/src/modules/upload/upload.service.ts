import {
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { v2 as CloudinaryType, UploadApiResponse } from 'cloudinary';
import { CLOUDINARY } from './providers/cloudinary.provider.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class UploadService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: typeof CloudinaryType,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    tenantId: string,
  ): Promise<{ url: string; publicId: string }> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeException('La imagen supera el límite de 5 MB.');
    }

    const detectedMime = this.detectMime(file.buffer);
    if (!detectedMime || !(ALLOWED_MIME_TYPES as readonly string[]).includes(detectedMime)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Se aceptan: jpg, png, webp.',
      );
    }

    return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        {
          folder: `tenants/${tenantId}`,
          resource_type: 'image',
          allowed_formats: ['jpg', 'png', 'webp'],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) return reject(error ?? new Error('Upload falló sin resultado.'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(file.buffer);
    });
  }

  private detectMime(buffer: Buffer): string | null {
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    // PNG: 89 50 4E 47
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }
    // WEBP: RIFF en bytes 0-3 + WEBP en bytes 8-11
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp';
    }
    return null;
  }
}
