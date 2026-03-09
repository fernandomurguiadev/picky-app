# Auditoría y Logging de Seguridad - PickyApp

## 1. Objetivo

Registrar eventos críticos para:
- **Seguridad**: Detectar accesos no autorizados
- **Cumplimiento**: Auditorías y regulaciones
- **Debugging**: Investigar incidentes
- **Análisis**: Patrones de uso y abusos

## 2. Eventos a Auditar

### 2.1 Autenticación

| Evento | Código | Nivel | Datos a Loguear |
| :--- | :--- | :--- | :--- |
| Login exitoso | `AUTH_LOGIN_SUCCESS` | INFO | userId, email, ip, userAgent |
| Login fallido | `AUTH_LOGIN_FAILED` | WARN | email, ip, reason |
| Logout | `AUTH_LOGOUT` | INFO | userId, ip |
| Token renovado | `AUTH_TOKEN_REFRESHED` | INFO | userId, ip |
| Password cambiado | `AUTH_PASSWORD_CHANGED` | WARN | userId, ip |
| Password reset solicitado | `AUTH_PASSWORD_RESET_REQUESTED` | WARN | email, ip |

### 2.2 Autorización

| Evento | Código | Nivel | Datos a Loguear |
| :--- | :--- | :--- | :--- |
| Acceso denegado | `AUTH_ACCESS_DENIED` | WARN | userId, resource, action, ip |
| Intento de acceso a otro tenant | `AUTH_TENANT_VIOLATION` | ERROR | userId, attemptedTenantId, ip |

### 2.3 Operaciones Críticas

| Evento | Código | Nivel | Datos a Loguear |
| :--- | :--- | :--- | :--- |
| Producto eliminado | `CATALOG_PRODUCT_DELETED` | WARN | userId, productId, productName |
| Categoría eliminada | `CATALOG_CATEGORY_DELETED` | WARN | userId, categoryId, categoryName |
| Pedido cancelado | `ORDER_CANCELLED` | INFO | userId, orderId, reason |
| Configuración modificada | `SETTINGS_UPDATED` | INFO | userId, settingKey, oldValue, newValue |

### 2.4 Errores de Seguridad

| Evento | Código | Nivel | Datos a Loguear |
| :--- | :--- | :--- | :--- |
| Rate limit excedido | `SECURITY_RATE_LIMIT_EXCEEDED` | WARN | ip, endpoint, attemptCount |
| Token inválido | `SECURITY_INVALID_TOKEN` | WARN | ip, tokenPrefix |
| SQL Injection detectado | `SECURITY_SQL_INJECTION_ATTEMPT` | ERROR | ip, payload, endpoint |

## 3. Estructura del Log de Auditoría

### 3.1 Formato JSON

```json
{
  "timestamp": "2026-02-23T14:35:22.123Z",
  "level": "WARN",
  "event_type": "AUTH_LOGIN_FAILED",
  "event_category": "authentication",
  "user_id": null,
  "tenant_id": null,
  "email": "comercio@example.com",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "resource_type": "user",
  "resource_id": null,
  "action": "login",
  "result": "failed",
  "reason": "invalid_credentials",
  "metadata": {
    "attempt_count": 3,
    "lockout_remaining": 2
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 3.2 Campos Obligatorios

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `timestamp` | ISO 8601 | Fecha y hora del evento |
| `level` | string | INFO, WARN, ERROR |
| `event_type` | string | Código del evento |
| `event_category` | string | authentication, authorization, data_access, etc. |
| `user_id` | UUID \| null | ID del usuario (null si no autenticado) |
| `tenant_id` | UUID \| null | ID del tenant |
| `ip_address` | string | IP del cliente |
| `request_id` | UUID | ID único del request |

## 4. Implementación

### 4.1 Servicio de Auditoría

```typescript
// audit-log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  async log(event: AuditLogEvent): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      timestamp: new Date(),
      level: event.level,
      eventType: event.eventType,
      eventCategory: event.eventCategory,
      userId: event.userId || null,
      tenantId: event.tenantId || null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      action: event.action,
      result: event.result,
      reason: event.reason,
      metadata: event.metadata,
      requestId: event.requestId
    });

    // Guardar en DB de forma asíncrona
    await this.auditLogRepository.save(auditLog);

    // También loguear en consola/archivo
    this.logger.log(JSON.stringify(auditLog));
  }

  async logAuthSuccess(userId: string, email: string, ip: string, requestId: string) {
    await this.log({
      level: 'INFO',
      eventType: 'AUTH_LOGIN_SUCCESS',
      eventCategory: 'authentication',
      userId,
      tenantId: null,
      ipAddress: ip,
      action: 'login',
      result: 'success',
      metadata: { email },
      requestId
    });
  }

  async logAuthFailure(email: string, ip: string, reason: string, requestId: string) {
    await this.log({
      level: 'WARN',
      eventType: 'AUTH_LOGIN_FAILED',
      eventCategory: 'authentication',
      userId: null,
      tenantId: null,
      ipAddress: ip,
      action: 'login',
      result: 'failed',
      reason,
      metadata: { email },
      requestId
    });
  }

  async logAccessDenied(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
    ip: string,
    requestId: string
  ) {
    await this.log({
      level: 'WARN',
      eventType: 'AUTH_ACCESS_DENIED',
      eventCategory: 'authorization',
      userId,
      tenantId,
      ipAddress: ip,
      resourceType: resource,
      action,
      result: 'denied',
      requestId
    });
  }
}
```

### 4.2 Uso en Controllers

```typescript
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private auditLogService: AuditLogService
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() request: Request) {
    try {
      const result = await this.authService.login(dto);
      
      // Loguear éxito
      await this.auditLogService.logAuthSuccess(
        result.user.id,
        dto.email,
        request.ip,
        request.id
      );
      
      return result;
    } catch (error) {
      // Loguear fallo
      await this.auditLogService.logAuthFailure(
        dto.email,
        request.ip,
        error.message,
        request.id
      );
      
      throw error;
    }
  }
}
```

### 4.3 Interceptor Global

```typescript
// audit-log.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip } = request;

    // Solo auditar operaciones de escritura
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(() => {
          // Éxito
          this.auditLogService.log({
            level: 'INFO',
            eventType: `${method}_${url}`,
            eventCategory: 'data_access',
            userId: user?.userId,
            tenantId: user?.tenantId,
            ipAddress: ip,
            action: method.toLowerCase(),
            result: 'success',
            requestId: request.id
          });
        }),
        catchError((error) => {
          // Error
          this.auditLogService.log({
            level: 'ERROR',
            eventType: `${method}_${url}_FAILED`,
            eventCategory: 'data_access',
            userId: user?.userId,
            tenantId: user?.tenantId,
            ipAddress: ip,
            action: method.toLowerCase(),
            result: 'failed',
            reason: error.message,
            requestId: request.id
          });
          throw error;
        })
      );
    }

    return next.handle();
  }
}
```

## 5. Almacenamiento

### 5.1 Base de Datos (PostgreSQL)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  level VARCHAR(10) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  user_id UUID,
  tenant_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  resource_type VARCHAR(50),
  resource_id UUID,
  action VARCHAR(50),
  result VARCHAR(20),
  reason TEXT,
  metadata JSONB,
  request_id UUID
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);
```

### 5.2 Retención de Logs

```sql
-- Eliminar logs mayores a 1 año
DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '1 year';

-- Archivar logs antiguos
INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs WHERE timestamp < NOW() - INTERVAL '90 days';

DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '90 days';
```

## 6. Consultas Comunes

### 6.1 Logins Fallidos por Usuario

```sql
SELECT 
  email,
  COUNT(*) as failed_attempts,
  MAX(timestamp) as last_attempt
FROM audit_logs
WHERE event_type = 'AUTH_LOGIN_FAILED'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY email
HAVING COUNT(*) > 5
ORDER BY failed_attempts DESC;
```

### 6.2 Accesos Denegados

```sql
SELECT 
  user_id,
  resource_type,
  action,
  COUNT(*) as denied_count
FROM audit_logs
WHERE event_type = 'AUTH_ACCESS_DENIED'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY user_id, resource_type, action
ORDER BY denied_count DESC;
```

### 6.3 Actividad por Usuario

```sql
SELECT 
  event_type,
  COUNT(*) as event_count
FROM audit_logs
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY event_type
ORDER BY event_count DESC;
```

## 7. Campos Sensibles a NO Loguear

❌ **NUNCA loguear**:
- Passwords (ni hasheados)
- Tokens completos (solo primeros 8 caracteres)
- Números de tarjeta de crédito
- Datos personales sensibles (DNI, etc.)
- Secretos de API

✅ **SÍ loguear**:
- IDs de recursos
- Emails (para identificación)
- IPs
- User agents
- Timestamps
- Resultados de operaciones

## 8. Alertas Automáticas

### 8.1 Múltiples Logins Fallidos

```typescript
async checkFailedLogins(email: string): Promise<void> {
  const count = await this.auditLogRepository.count({
    where: {
      eventType: 'AUTH_LOGIN_FAILED',
      metadata: { email },
      timestamp: MoreThan(new Date(Date.now() - 15 * 60 * 1000)) // 15 min
    }
  });

  if (count >= 5) {
    await this.alertService.send({
      type: 'SECURITY_ALERT',
      message: `Múltiples intentos de login fallidos para ${email}`,
      severity: 'HIGH'
    });
  }
}
```

### 8.2 Accesos desde IPs Sospechosas

```typescript
async checkSuspiciousIP(ip: string): Promise<void> {
  // Verificar si la IP está en lista negra
  const isBlacklisted = await this.ipBlacklistService.check(ip);
  
  if (isBlacklisted) {
    await this.alertService.send({
      type: 'SECURITY_ALERT',
      message: `Acceso desde IP en lista negra: ${ip}`,
      severity: 'CRITICAL'
    });
  }
}
```

## 9. Compliance y Regulaciones

### 9.1 GDPR (Europa)

- Loguear accesos a datos personales
- Permitir exportación de logs del usuario
- Eliminar logs al eliminar cuenta (derecho al olvido)

### 9.2 Retención Mínima

- Logs de seguridad: 1 año mínimo
- Logs de auditoría: Según regulación local
- Logs de debugging: 30-90 días

## 10. Dashboard de Auditoría

Métricas a mostrar:
- Logins exitosos/fallidos (últimas 24h)
- Accesos denegados por usuario
- Operaciones críticas (eliminaciones)
- IPs con más actividad
- Eventos de seguridad (rate limit, tokens inválidos)
