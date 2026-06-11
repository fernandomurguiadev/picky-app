import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_USERNAME: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_NAME: z.string().min(1),
  DATABASE_SSL: z.string().default('false'),
  DATABASE_LOGGING: z.string().default('false'),

  // JWT — RS256 (FASE 1 las usará; se validan aquí para fail-fast)
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Platform Admin JWT — RS256 key pair separado
  PLATFORM_JWT_PRIVATE_KEY: z.string().min(1).optional(),
  PLATFORM_JWT_PUBLIC_KEY: z.string().min(1).optional(),
  PLATFORM_JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  PLATFORM_JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  PLATFORM_MFA_ENCRYPTION_KEY: z.string().min(32).optional(),
  PLATFORM_ADMIN_EMAIL: z.string().email().optional(),
  PLATFORM_ADMIN_PASSWORD: z.string().min(8).optional(),

  // Frontend URL (requerida para WebSocket CORS)
  FRONTEND_URL: z.string().url().optional(),

  // Cloudinary (requeridas para el módulo de upload)
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),

  // N8N Webhook
  N8N_WEBHOOK_URL: z.string().url().optional(),

  // WhatsApp
  WHATSAPP_BUSINESS_NUMBER: z.string().min(1),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.issues
      .map((e) => `  ${String(e.path.join('.'))}: ${e.message}`)
      .join('\n');
    throw new Error(`Configuración de entorno inválida:\n${formatted}`);
  }
  return result.data;
}
