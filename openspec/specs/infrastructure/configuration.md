# Configuración del Sistema - PickyApp

## 1. Gestión de Configuración

Se utilizan **Variables de Entorno** para toda configuración que varía entre despliegues (desarrollo, staging, producción).

**Principios**:
- Nunca hardcodear valores en el código
- Secrets nunca en el repositorio
- Validación de configuración al inicio
- Defaults sensatos para desarrollo

## 2. Variables de Entorno

### 2.1 Backend (NestJS)

```env
# .env.example (commitear este archivo como template)

# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4200

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=pickyapp_dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pickyapp_dev

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis (opcional para MVP)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS
CORS_ORIGINS=http://localhost:4200,https://pickyapp.com

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=debug
```

### 2.2 Frontend (Next.js 15)

```env
# app/.env.local (Desarrollo local)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# app/.env.production (Producción - se reemplaza por config del hosting)
NEXT_PUBLIC_API_URL=https://api.pickyapp.com
NEXT_PUBLIC_WS_URL=wss://api.pickyapp.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=pickyapp-prod
```

Las variables con prefijo `NEXT_PUBLIC_` se inyectan automáticamente y son legibles tanto en Client Components (RCC) como en Server Components (RSC).


## 3. Validación de Configuración

### 3.1 Schema de Validación (Backend)

```typescript
// src/config/env.validation.ts
import { plainToClass } from 'class-transformer';
import { IsString, IsNumber, IsEnum, IsUrl, validateSync, Min, Max } from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test'
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(1000)
  @Max(65535)
  PORT: number;

  @IsUrl({ require_tld: false })
  APP_URL: string;

  @IsString()
  DATABASE_HOST: string;

  @IsNumber()
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USERNAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  CLOUDINARY_CLOUD_NAME: string;

  @IsString()
  CLOUDINARY_API_KEY: string;

  @IsString()
  CLOUDINARY_API_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }

  return validatedConfig;
}
```

### 3.2 Uso en NestJS

```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`
    })
  ]
})
export class AppModule {}
```

## 4. Configuración por Entorno

### 4.1 Archivos de Entorno

```
.env.development    # Desarrollo local
.env.staging        # Staging/QA
.env.production     # Producción
.env.test           # Tests automatizados
```

### 4.2 Cargar Configuración Específica

```typescript
// main.ts
import { config } from 'dotenv';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
config({ path: envFile });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuración específica por entorno
  if (process.env.NODE_ENV === 'production') {
    app.enableCors({
      origin: process.env.CORS_ORIGINS.split(','),
      credentials: true
    });
  } else {
    app.enableCors(); // Permitir todo en desarrollo
  }
  
  await app.listen(process.env.PORT || 3000);
}
```

## 5. Configuración Tipada

### 5.1 Servicio de Configuración

```typescript
// config/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get database() {
    return {
      host: this.configService.get<string>('DATABASE_HOST'),
      port: this.configService.get<number>('DATABASE_PORT'),
      username: this.configService.get<string>('DATABASE_USERNAME'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      database: this.configService.get<string>('DATABASE_NAME')
    };
  }

  get jwt() {
    return {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m')
    };
  }

  get cloudinary() {
    return {
      cloudName: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      apiKey: this.configService.get<string>('CLOUDINARY_API_KEY'),
      apiSecret: this.configService.get<string>('CLOUDINARY_API_SECRET')
    };
  }
}
```

### 5.2 Uso en Servicios

```typescript
@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService
  ) {}

  generateToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.jwt.secret,
        expiresIn: this.configService.jwt.expiresIn
      }
    );
  }
}
```

## 6. Secrets Management

### 6.1 Desarrollo Local

```bash
# .env (nunca commitear)
DATABASE_PASSWORD=local_password
JWT_SECRET=local_secret_key_for_development
```

### 6.2 CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
```

### 6.3 Producción (Docker Secrets)

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    image: pickyapp:latest
    secrets:
      - db_password
      - jwt_secret
    environment:
      DATABASE_PASSWORD_FILE: /run/secrets/db_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

## 7. Feature Flags

Para habilitar/deshabilitar funcionalidades sin deploy:

```typescript
// config/features.config.ts
export const features = {
  enableWebSocket: process.env.ENABLE_WEBSOCKET === 'true',
  enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  enableAuditLogs: process.env.ENABLE_AUDIT_LOGS === 'true',
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || '5242880') // 5MB
};
```

## 8. Configuración de Base de Datos

### 8.1 TypeORM Config

```typescript
// config/typeorm.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from './config.service';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.database.host,
  port: configService.database.port,
  username: configService.database.username,
  password: configService.database.password,
  database: configService.database.database,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false, // ❌ NUNCA true en producción
  logging: configService.isDevelopment,
  ssl: configService.isProduction ? { rejectUnauthorized: false } : false
});
```

## 9. Buenas Prácticas

### ✅ DO

1. **Validar al inicio**: Fallar rápido si falta configuración
2. **Defaults sensatos**: Valores por defecto para desarrollo
3. **Tipado fuerte**: Usar TypeScript para configuración
4. **Documentar variables**: Mantener .env.example actualizado
5. **Rotar secrets**: Cambiar periódicamente en producción

### ❌ DON'T

1. **Commitear secrets**: Nunca subir .env al repositorio
2. **Hardcodear valores**: Usar variables de entorno
3. **Secrets en logs**: Filtrar información sensible
4. **Configuración en código**: Separar config de lógica
5. **Mismos secrets en todos los entornos**: Usar diferentes por entorno

## 10. Checklist de Configuración

### Desarrollo
- [ ] .env.example actualizado
- [ ] .env en .gitignore
- [ ] Validación de configuración implementada
- [ ] Defaults para desarrollo configurados

### Staging/Producción
- [ ] Variables de entorno configuradas en servidor
- [ ] Secrets rotados y seguros
- [ ] SSL/TLS habilitado
- [ ] Logging configurado apropiadamente
- [ ] Rate limiting habilitado
- [ ] CORS configurado restrictivamente
- [ ] Backup de configuración realizado
