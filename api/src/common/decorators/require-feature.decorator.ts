import { SetMetadata } from '@nestjs/common';
import { FEATURE_KEY } from '../guards/feature.guard.js';

export const RequireFeature = (code: string) => SetMetadata(FEATURE_KEY, code);
