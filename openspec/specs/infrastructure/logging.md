# Logging - PickyApp

## 1. Estrategia de Logging

**Objetivos**:
- Debugging de problemas en producción
- Auditoría de operaciones críticas
- Monitoreo de performance
- Análisis de patrones de uso

**Niveles de Log**:
-   **ERROR**: Errores que requieren atención inmediata
-   **WARN**: Situaciones anormales pero manejables
-   **INFO**: Eventos importantes del sistema
-   **DEBUG**: Información detallada para debugging (solo desarrollo)

## 2. Formato de Logs

### 2.1 Desarrollo (Pretty Format)

```
[2026-02-23 14:35:22] INFO  [AuthService] User logged in: comercio@example.com
[2026-02-23 14:35:23] DEBUG [CatalogService] Fetching products for tenant: abc-123
[2026-02-23 14:35:24] ERROR [OrdersService] Failed to create order: Invalid product ID
```

### 2.2 Producción (JSON Format)

```json
{
  "timestamp": "2026-02-23T14:35:22.123Z",
  "level": "INFO",
  "context": "AuthService",
  "message": "User logged in",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "comercio@example.com",
  "ip": "192.168.1.100",
  "requestId": "req-uuid-here",
  "duration": 45
}
```

## 3. Implementación con Winston

### 3.1 Configuración

```typescript
// logger.config.ts
import * as winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    return `[${timestamp}] ${level} [${context || 'App'}] ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

export const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return winston.createLogger({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    format: isDevelopment ? developmentFormat : logFormat,
    transports: [
      new winston.transports.Console(),
      ...(isDevelopment
        ? []
        : [
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              maxsize: 10485760, // 10MB
              maxFiles: 5
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              maxsize: 10485760,
              maxFiles: 10
            })
          ])
    ]
  });
};
```

### 3.2 Logger Service (NestJS)

```typescript
// logger.service.ts
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger } from './logger.config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger = createLogger();

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Métodos personalizados
  logRequest(req: Request, res: Response, duration: number) {
    this.logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.userId,
      requestId: req.id
    });
  }

  logError(error: Error, context?: string, metadata?: any) {
    this.logger.error(error.message, {
      context,
      stack: error.stack,
      ...metadata
    });
  }
}
```

## 4. Contexto de Logs

### 4.1 Request ID

Agregar ID único a cada request para trazabilidad:

```typescript
// request-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    req.id = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-Id', req.id);
    next();
  }
}
```

### 4.2 Logging Interceptor

```typescript
// logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const startTime = Date.now();

    this.logger.debug(`Incoming Request: ${method} ${url}`, 'HTTP', {
      body,
      userId: user?.userId,
      requestId: request.id
    });

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const duration = Date.now() - startTime;

        this.logger.logRequest(request, response, duration);
      })
    );
  }
}
```

## 5. Logs por Tipo de Evento

### 5.1 HTTP Requests

```typescript
// Automático con LoggingInterceptor
{
  "timestamp": "2026-02-23T14:35:22.123Z",
  "level": "INFO",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/admin/products",
  "statusCode": 201,
  "duration": 45,
  "ip": "192.168.1.100",
  "userId": "user-uuid",
  "requestId": "req-uuid"
}
```

### 5.2 Errores

```typescript
try {
  await this.catalogService.createProduct(dto);
} catch (error) {
  this.logger.logError(error, 'ProductsController', {
    dto,
    userId: user.userId,
    tenantId: user.tenantId
  });
  throw error;
}
```

### 5.3 Operaciones de Negocio

```typescript
this.logger.log('Product created successfully', 'CatalogService', {
  productId: product.id,
  productName: product.name,
  tenantId: product.tenantId,
  userId: user.userId
});
```

### 5.4 Performance

```typescript
const startTime = Date.now();
const result = await this.heavyOperation();
const duration = Date.now() - startTime;

if (duration > 1000) {
  this.logger.warn('Slow operation detected', 'PerformanceMonitor', {
    operation: 'heavyOperation',
    duration,
    threshold: 1000
  });
}
```

## 6. Filtrado de Información Sensible

### 6.1 Campos a Filtrar

```typescript
// logger.utils.ts
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'creditCard'
];

export function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...obj };

  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
}
```

### 6.2 Uso

```typescript
this.logger.log('User data', 'AuthService', sanitizeObject({
  email: user.email,
  password: user.password, // Será [REDACTED]
  name: user.name
}));
```

## 7. Rotación de Logs

### 7.1 Configuración

```typescript
new winston.transports.File({
  filename: 'logs/combined.log',
  maxsize: 10485760, // 10MB
  maxFiles: 10,      // Mantener últimos 10 archivos
  tailable: true     // Rotar cuando alcanza maxsize
})
```

### 7.2 Limpieza Manual

```bash
# Eliminar logs mayores a 30 días
find logs/ -name "*.log" -mtime +30 -delete

# Comprimir logs antiguos
gzip logs/*.log.1 logs/*.log.2
```

## 8. Agregación de Logs (Producción)

### 8.1 Opciones

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana Loki**
- **CloudWatch Logs** (AWS)
- **Datadog**
- **Sentry** (para errores)

### 8.2 Enviar a Servicio Externo

```typescript
// Ejemplo con Sentry
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV
  });
}

// En error handler
Sentry.captureException(error, {
  user: { id: user.userId, email: user.email },
  tags: { tenantId: user.tenantId },
  extra: { requestId: req.id }
});
```

## 9. Consultas de Logs

### 9.1 Buscar por Request ID

```bash
# Todos los logs de un request
grep "req-uuid-here" logs/combined.log

# Con jq para JSON
cat logs/combined.log | jq 'select(.requestId == "req-uuid-here")'
```

### 9.2 Buscar Errores

```bash
# Errores de las últimas 24 horas
cat logs/error.log | jq 'select(.timestamp > "2026-02-22")'

# Errores por contexto
cat logs/error.log | jq 'select(.context == "OrdersService")'
```

### 9.3 Análisis de Performance

```bash
# Requests lentos (> 1 segundo)
cat logs/combined.log | jq 'select(.duration > 1000)'

# Promedio de duración por endpoint
cat logs/combined.log | jq -s 'group_by(.url) | map({url: .[0].url, avg: (map(.duration) | add / length)})'
```

## 10. Monitoreo de Logs

### 10.1 Alertas

Configurar alertas para:
- Tasa de errores > 1% en 5 minutos
- Requests lentos > 5 segundos
- Errores 500 consecutivos
- Logins fallidos > 10 en 1 minuto

### 10.2 Dashboard

Métricas a visualizar:
- Requests por minuto
- Tasa de errores
- Latencia promedio (p50, p95, p99)
- Errores por endpoint
- Usuarios activos

## 11. Buenas Prácticas

### ✅ DO

1. **Loguear eventos importantes**: Login, creación de recursos, errores
2. **Incluir contexto**: userId, tenantId, requestId
3. **Usar niveles apropiados**: ERROR para errores, INFO para eventos
4. **Estructurar logs**: JSON en producción
5. **Rotar logs**: Evitar llenar disco

### ❌ DON'T

1. **Loguear passwords**: Nunca loguear información sensible
2. **Loguear en exceso**: No loguear cada línea de código
3. **Logs sin contexto**: Siempre incluir información útil
4. **Ignorar performance**: Logging no debe afectar performance
5. **Logs sin rotación**: Configurar límites de tamaño

## 12. Checklist de Logging

- [ ] Winston configurado con niveles apropiados
- [ ] Formato JSON en producción
- [ ] Request ID en todos los logs
- [ ] Información sensible filtrada
- [ ] Rotación de logs configurada
- [ ] Logs de errores capturados
- [ ] Performance logging implementado
- [ ] Agregación de logs en producción (opcional)
- [ ] Alertas configuradas
- [ ] Dashboard de monitoreo (opcional)
