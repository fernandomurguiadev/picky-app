# Rate Limiting (Limitación de Tasa) - PickyApp

## 1. Objetivo

Proteger la API contra:
- **Abuso**: Uso excesivo de recursos
- **Ataques de fuerza bruta**: Intentos masivos de login
- **DoS**: Denegación de servicio
- **Scraping**: Extracción masiva de datos

## 2. Políticas de Rate Limiting

### 2.1 Endpoints Públicos (Sin Autenticación)

| Endpoint | Límite | Ventana | Razón |
| :--- | :--- | :--- | :--- |
| `GET /:slug/*` | 100 req/min | Por IP | Navegación de tienda |
| `GET /:slug/products/search` | 20 req/min | Por IP | Búsquedas |
| `POST /orders` | 10 req/min | Por IP | Creación de pedidos |
| `POST /auth/login` | 5 req/15min | Por IP | Prevenir fuerza bruta |
| `POST /auth/register` | 3 req/hour | Por IP | Prevenir spam |

### 2.2 Endpoints Autenticados

| Endpoint | Límite | Ventana | Razón |
| :--- | :--- | :--- | :--- |
| `GET /admin/*` | 200 req/min | Por usuario | Uso normal del admin |
| `POST /admin/products` | 30 req/min | Por usuario | Creación de productos |
| `POST /upload/image` | 20 req/min | Por usuario | Upload de imágenes |
| `PATCH /admin/orders/:id/status` | 100 req/min | Por usuario | Cambios de estado |

### 2.3 Endpoints Críticos

| Endpoint | Límite | Ventana | Razón |
| :--- | :--- | :--- | :--- |
| `POST /auth/refresh` | 10 req/min | Por IP | Renovación de tokens |
| `POST /auth/forgot-password` | 3 req/hour | Por IP | Prevenir abuso |
| `DELETE /admin/products/:id` | 20 req/min | Por usuario | Operaciones destructivas |

## 3. Implementación con @nestjs/throttler

### 3.1 Instalación

```bash
npm install @nestjs/throttler
```

### 3.2 Configuración Global

```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // Ventana de tiempo en segundos
      limit: 100 // Número máximo de requests
    })
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
```

### 3.3 Rate Limiting por Endpoint

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // Login: 5 requests cada 15 minutos
  @Post('login')
  @Throttle(5, 900) // 900 segundos = 15 minutos
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Register: 3 requests por hora
  @Post('register')
  @Throttle(3, 3600) // 3600 segundos = 1 hora
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
```

### 3.4 Deshabilitar Rate Limiting

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
export class HealthController {
  // Health check sin rate limiting
  @Get()
  @SkipThrottle()
  check() {
    return { status: 'ok' };
  }
}
```

## 4. Rate Limiting por IP vs Usuario

### 4.1 Por IP (Default)

```typescript
// Automático con ThrottlerGuard
// Usa request.ip para identificar cliente
```

### 4.2 Por Usuario Autenticado

```typescript
// custom-throttler.guard.ts
import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    // Si está autenticado, usar userId
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    // Si no, usar IP
    return req.ip;
  }
}
```

### 4.3 Por Tenant

```typescript
@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    if (req.user?.tenantId) {
      return `tenant:${req.user.tenantId}`;
    }
    return req.ip;
  }
}
```

## 5. Respuesta al Exceder el Límite

### 5.1 Código de Estado

```http
HTTP/1.1 429 Too Many Requests
```

### 5.2 Headers de Respuesta

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1709654460
Retry-After: 60
```

### 5.3 Payload de Error

```json
{
  "success": false,
  "message": "Demasiadas solicitudes. Por favor, intente más tarde.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "details": "Límite de 5 intentos de login excedido. Intente nuevamente en 15 minutos."
  }
}
```

## 6. Implementación con Redis (Producción)

Para entornos con múltiples instancias, usar Redis como storage:

### 6.1 Instalación

```bash
npm install @nestjs/throttler-storage-redis ioredis
```

### 6.2 Configuración

```typescript
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nestjs/throttler-storage-redis';
import Redis from 'ioredis';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
      storage: new ThrottlerStorageRedisService(
        new Redis({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD
        })
      )
    })
  ]
})
export class AppModule {}
```

## 7. Bypass para Testing

### 7.1 Deshabilitar en Tests

```typescript
// test/app.e2e-spec.ts
beforeAll(async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule]
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true }) // Bypass rate limiting
    .compile();

  app = moduleFixture.createNestApplication();
  await app.init();
});
```

### 7.2 Whitelist de IPs

```typescript
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Whitelist de IPs (ej. monitoring, CI/CD)
    const whitelistedIPs = ['127.0.0.1', '::1', process.env.CI_IP];
    
    if (whitelistedIPs.includes(request.ip)) {
      return true;
    }
    
    return super.handleRequest(context, limit, ttl);
  }
}
```

## 8. Monitoreo y Alertas

### 8.1 Logging de Rate Limit Exceeded

```typescript
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(private logger: Logger) {
    super();
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest();
    
    this.logger.warn({
      event: 'rate_limit_exceeded',
      ip: request.ip,
      path: request.url,
      user: request.user?.userId || 'anonymous'
    });
    
    throw new ThrottlerException('Too Many Requests');
  }
}
```

### 8.2 Métricas

Trackear:
- Número de requests bloqueados por rate limiting
- IPs/usuarios que exceden límites frecuentemente
- Endpoints más afectados

## 9. Buenas Prácticas

### ✅ DO

1. **Límites progresivos**: Más estrictos en endpoints críticos
2. **Mensajes claros**: Indicar cuándo puede reintentar
3. **Whitelist para servicios internos**: Monitoring, health checks
4. **Redis en producción**: Para múltiples instancias
5. **Monitorear abusos**: Logs y alertas

### ❌ DON'T

1. **Límites muy estrictos**: Pueden afectar UX legítimo
2. **Mismo límite para todo**: Diferenciar por criticidad
3. **Bloquear permanentemente**: Usar ventanas de tiempo
4. **Ignorar rate limiting en tests**: Puede ocultar problemas

## 10. Testing

```typescript
describe('Rate Limiting', () => {
  it('should block after exceeding limit', async () => {
    // Hacer 6 requests (límite es 5)
    for (let i = 0; i < 6; i++) {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      if (i < 5) {
        expect(response.status).not.toBe(429);
      } else {
        expect(response.status).toBe(429);
        expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      }
    }
  });

  it('should reset after TTL expires', async () => {
    // Exceder límite
    for (let i = 0; i < 6; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
    }
    
    // Esperar TTL (60 segundos)
    await new Promise(resolve => setTimeout(resolve, 61000));
    
    // Debería permitir nuevamente
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    expect(response.status).not.toBe(429);
  });
});
```
