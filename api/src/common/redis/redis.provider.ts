import { FactoryProvider } from '@nestjs/common';
import Redis from 'ioredis';

// Requiere: npm install ioredis

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: FactoryProvider<Redis> = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    const client = new Redis({
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
      password: process.env['REDIS_PASSWORD'] ?? undefined,
      lazyConnect: true,
    });
    client.on('error', (err) => console.error('[Redis] Error:', err));
    return client;
  },
};
