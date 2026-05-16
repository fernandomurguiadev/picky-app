import { SetMetadata } from '@nestjs/common';

export const SKIP_RLS_KEY = 'skipRls';
export const SkipRls = () => SetMetadata(SKIP_RLS_KEY, true);
