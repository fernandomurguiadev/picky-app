import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

// Leer desde env var CORS_ORIGINS (comma-separated) o usar lista de producción por defecto.
// Ejemplo: CORS_ORIGINS=https://picky.orbitech.cloud,https://admin.picky.orbitech.cloud
const ALLOWED_ORIGINS_PROD: string[] = process.env['CORS_ORIGINS']
  ? process.env['CORS_ORIGINS'].split(',').map((o) => o.trim())
  : ['https://picky.ar', 'https://admin.picky.ar'];

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  const isProduction = process.env['NODE_ENV'] === 'production';

  // Helmet: security headers (HSTS, X-Frame-Options, CSP, etc.)
  app.use(
    helmet({
      contentSecurityPolicy: isProduction,
      hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );

  app.enableCors({
    origin: isProduction
      ? ALLOWED_ORIGINS_PROD
      : (_origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => cb(null, true), // dev: permitir cualquier origen local
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env['PORT'] ?? 3000);
}
bootstrap();
