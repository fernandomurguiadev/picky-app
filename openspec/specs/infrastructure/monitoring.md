# Monitoreo y Observabilidad - PickyApp

## 1. Objetivos

- **Disponibilidad**: Detectar cuando el sistema está caído
- **Performance**: Identificar cuellos de botella
- **Errores**: Alertar sobre problemas antes que afecten usuarios
- **Capacidad**: Planificar escalamiento basado en métricas

## 2. Health Checks

### 2.1 Endpoints de Salud

```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database')
    ]);
  }

  @Get('db')
  @HealthCheck()
  checkDatabase() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1000 })
    ]);
  }

  @Get('redis')
  @HealthCheck()
  async checkRedis() {
    // Implementar check de Redis
    return { status: 'ok', redis: 'connected' };
  }
}
```

### 2.2 Respuestas de Health Check

**Healthy**:
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

**Unhealthy**:
```json
{
  "status": "error",
  "info": {},
  "error": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  }
}
```

## 3. Métricas Clave (KPIs)

### 3.1 Métricas de Aplicación

| Métrica | Descripción | Objetivo | Alerta |
| :--- | :--- | :--- | :--- |
| **Request Rate** | Requests por segundo | — | — |
| **Error Rate** | % de requests con error | < 1% | > 5% |
| **Latency (p50)** | Mediana de tiempo de respuesta | < 200ms | > 500ms |
| **Latency (p95)** | 95% de requests | < 500ms | > 1000ms |
| **Latency (p99)** | 99% de requests | < 1000ms | > 2000ms |

### 3.2 Métricas de Infraestructura

| Métrica | Descripción | Objetivo | Alerta |
| :--- | :--- | :--- | :--- |
| **CPU Usage** | % de CPU utilizado | < 70% | > 85% |
| **Memory Usage** | % de RAM utilizada | < 80% | > 90% |
| **Disk Usage** | % de disco utilizado | < 80% | > 90% |
| **Network I/O** | Tráfico de red | — | Anomalías |

### 3.3 Métricas de Negocio

| Métrica | Descripción | Objetivo |
| :--- | :--- | :--- |
| **Active Users** | Usuarios activos en tiempo real | — |
| **Orders per Hour** | Pedidos creados por hora | — |
| **Conversion Rate** | % de visitas que generan pedido | > 5% |
| **Average Order Value** | Valor promedio de pedido | — |

## 4. Implementación de Métricas

### 4.1 Prometheus + Grafana

**Instalación**:
```bash
npm install @willsoto/nestjs-prometheus prom-client
```

**Configuración**:
```typescript
// app.module.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true
      }
    })
  ]
})
export class AppModule {}
```

**Métricas Personalizadas**:
```typescript
// metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private requestCounter: Counter<string>,
    
    @InjectMetric('http_request_duration_seconds')
    private requestDuration: Histogram<string>
  ) {}

  incrementRequestCount(method: string, route: string, statusCode: number) {
    this.requestCounter.inc({
      method,
      route,
      status_code: statusCode
    });
  }

  recordRequestDuration(method: string, route: string, duration: number) {
    this.requestDuration.observe(
      { method, route },
      duration / 1000 // Convertir a segundos
    );
  }
}
```

### 4.2 Interceptor de Métricas

```typescript
// metrics.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, route } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const duration = Date.now() - startTime;

        this.metricsService.incrementRequestCount(
          method,
          route.path,
          response.statusCode
        );

        this.metricsService.recordRequestDuration(
          method,
          route.path,
          duration
        );
      })
    );
  }
}
```

## 5. Alertas

### 5.1 Reglas de Alertas

**Alta Tasa de Errores**:
```yaml
# prometheus/alerts.yml
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} (threshold: 0.05)"
```

**Latencia Alta**:
```yaml
- alert: HighLatency
  expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High latency detected"
    description: "P95 latency is {{ $value }}s (threshold: 1s)"
```

**Servicio Caído**:
```yaml
- alert: ServiceDown
  expr: up{job="pickyapp-api"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Service is down"
    description: "API service has been down for more than 1 minute"
```

### 5.2 Canales de Notificación

**Slack**:
```yaml
# alertmanager.yml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#prod-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

**Email**:
```yaml
receivers:
  - name: 'email'
    email_configs:
      - to: 'team@pickyapp.com'
        from: 'alerts@pickyapp.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@pickyapp.com'
        auth_password: 'password'
```

## 6. Dashboard de Monitoreo

### 6.1 Grafana Dashboard

**Paneles Principales**:

1. **Overview**
   - Requests por minuto
   - Tasa de errores
   - Latencia (p50, p95, p99)
   - Usuarios activos

2. **Performance**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network I/O

3. **Errors**
   - Errores por endpoint
   - Errores por tipo
   - Stack traces recientes

4. **Business Metrics**
   - Pedidos por hora
   - Valor promedio de pedido
   - Conversión
   - Productos más vendidos

### 6.2 Queries de Ejemplo

**Requests por Minuto**:
```promql
rate(http_requests_total[1m])
```

**Tasa de Errores**:
```promql
rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])
```

**Latencia P95**:
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**CPU Usage**:
```promql
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

## 7. Uptime Monitoring

### 7.1 Servicios Externos

- **UptimeRobot** (gratuito hasta 50 monitores)
- **Pingdom**
- **StatusCake**
- **Better Uptime**

### 7.2 Configuración

```yaml
# Monitorear cada 1 minuto
monitors:
  - name: "PickyApp API"
    url: "https://api.pickyapp.com/health"
    interval: 60
    timeout: 30
    expected_status: 200
    
  - name: "PickyApp Frontend"
    url: "https://pickyapp.com"
    interval: 60
    timeout: 30
    expected_status: 200
```

## 8. APM (Application Performance Monitoring)

### 8.1 Opciones

- **New Relic**
- **Datadog APM**
- **Elastic APM**
- **Sentry Performance**

### 8.2 Integración con Sentry

```typescript
// main.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% de transacciones
    profilesSampleRate: 0.1,
    integrations: [
      new ProfilingIntegration()
    ]
  });
}
```

## 9. Logs Aggregation

### 9.1 ELK Stack

**Docker Compose**:
```yaml
services:
  elasticsearch:
    image: elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

## 10. Status Page

### 10.1 Página Pública de Estado

Mostrar estado de servicios a usuarios:

```html
<!-- status.pickyapp.com -->
<div class="status-page">
  <h1>PickyApp Status</h1>
  
  <div class="service">
    <span class="name">API</span>
    <span class="status operational">Operational</span>
  </div>
  
  <div class="service">
    <span class="name">Database</span>
    <span class="status operational">Operational</span>
  </div>
  
  <div class="service">
    <span class="name">WebSocket</span>
    <span class="status degraded">Degraded Performance</span>
  </div>
</div>
```

### 10.2 Servicios de Status Page

- **Statuspage.io** (Atlassian)
- **Status.io**
- **Cachet** (self-hosted)

## 11. Incident Response

### 11.1 Runbook

**Servicio Caído**:
1. Verificar health checks
2. Revisar logs de errores
3. Verificar recursos (CPU, memoria, disco)
4. Reiniciar servicio si es necesario
5. Escalar a equipo si persiste

**Alta Latencia**:
1. Identificar endpoint lento
2. Revisar queries de base de datos
3. Verificar conexiones externas
4. Escalar recursos si es necesario

**Alta Tasa de Errores**:
1. Identificar tipo de error
2. Revisar logs y stack traces
3. Verificar cambios recientes
4. Rollback si es necesario

### 11.2 Escalamiento

```
Nivel 1: Alertas automáticas → Slack
Nivel 2: Persistencia > 5 min → Email a on-call
Nivel 3: Crítico > 15 min → PagerDuty + llamada telefónica
```

## 12. Métricas de SLA

### 12.1 Objetivos

| Métrica | Objetivo | Medición |
| :--- | :--- | :--- |
| **Uptime** | 99.9% | Mensual |
| **Response Time** | < 500ms (p95) | Diario |
| **Error Rate** | < 0.1% | Diario |
| **MTTR** | < 1 hora | Por incidente |

### 12.2 Cálculo de Uptime

```
Uptime % = (Total Time - Downtime) / Total Time * 100

99.9% uptime = 43.2 minutos de downtime por mes
99.99% uptime = 4.32 minutos de downtime por mes
```

## 13. Checklist de Monitoreo

### Setup Inicial
- [ ] Health checks implementados
- [ ] Métricas de Prometheus configuradas
- [ ] Grafana dashboard creado
- [ ] Alertas configuradas
- [ ] Uptime monitoring activo
- [ ] Logs aggregation configurado

### Producción
- [ ] Alertas funcionando correctamente
- [ ] Dashboard accesible para el equipo
- [ ] Status page pública (opcional)
- [ ] Runbooks documentados
- [ ] On-call rotation definida
- [ ] Incident response plan documentado
- [ ] SLA objectives definidos
- [ ] Métricas de negocio trackeadas
