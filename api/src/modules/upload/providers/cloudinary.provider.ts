import { v2 as cloudinary, ConfigOptions } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (cfg: ConfigService): typeof cloudinary => {
    const cloudName = cfg.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = cfg.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = cfg.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      const options: ConfigOptions = {
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      };
      cloudinary.config(options);
    }

    return cloudinary;
  },
};
