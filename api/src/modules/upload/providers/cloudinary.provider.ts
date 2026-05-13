import { v2 as cloudinary, ConfigOptions } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (cfg: ConfigService): typeof cloudinary => {
    const options: ConfigOptions = {
      cloud_name: cfg.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: cfg.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: cfg.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    };
    cloudinary.config(options);
    return cloudinary;
  },
};
