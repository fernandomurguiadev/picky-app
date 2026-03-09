# Entornos de Ejecución - PickyApp

## 1. Entornos Definidos

| Entorno | Propósito | URL | Datos | Deploy |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | Desarrollo individual | localhost:4200 | DB Local/Docker | Manual |
| **Staging** | QA y pruebas pre-producción | staging.pickyapp.com | Datos de prueba/Seeders | Automático (develop) |
| **Production** | Uso real de clientes | pickyapp.com | Datos reales | Automático (main) |

## 2. Configuración por Entorno

### 2.1 Local (Development)

**Características**:
- Hot reload habilitado
- Source maps completos
- Logging verbose (DEBUG level)
- CORS permisivo
- Sin SSL (HTTP)
- Datos de prueba con seeders

**Variables de Entorno**:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pickyapp_dev
JWT_SECRET=local-dev-secret-key-not-for-production
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:4200
```

**Comandos**:
```bash
# Backend
npm run start:dev

# Frontend
ng serve

# Docker
docker-compose up -d
```

### 2.2 Staging

**Características**:
- Build optimizado pero con source maps
- Logging INFO level
- CORS restrictivo
- SSL/TLS habilitado
- Datos de prueba realistas
- Migraciones automáticas

**Variables de Entorno**:
```env
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://user:pass@staging-db:5432/pickyapp_staging
JWT_SECRET=staging-secret-key-different-from-prod
LOG_LEVEL=info
CORS_ORIGINS=https://staging.pickyapp.com
ENABLE_RATE_LIMITING=true
```

**Deploy**:
```bash
# Automático al mergear a develop
git push origin develop

# Manual
docker-compose -f docker-compose.staging.yml up -d
```

### 2.3 Production

**Características**:
- Build optimizado sin source maps
- Logging WARN/ERROR level
- CORS muy restrictivo
- SSL/TLS obligatorio
- Datos reales de clientes
- Migraciones manuales
- Backups automáticos
- Monitoring activo

**Variables de Entorno**:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@prod-db:5432/pickyapp_prod
JWT_SECRET=production-secret-key-rotated-quarterly
LOG_LEVEL=warn
CORS_ORIGINS=https://pickyapp.com,https://www.pickyapp.com
ENABLE_RATE_LIMITING=true
ENABLE_AUDIT_LOGS=true
```

**Deploy**:
```bash
# Automático al mergear a main (con aprobación)
git push origin main

# Manual con backup
./scripts/deploy-production.sh
```

## 3. Diferencias de Configuración

### 3.1 Logging

| Entorno | Nivel | Formato | Destino |
| :--- | :--- | :--- | :--- |
| Local | DEBUG | Pretty (colores) | Console |
| Staging | INFO | JSON | Console + File |
| Production | WARN | JSON | File + External Service |

**Implementación**:
```typescript
// logger.config.ts
const loggerConfig = {
  development: {
    level: 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    transports: [new winston.transports.Console()]
  },
  staging: {
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/app.log' })
    ]
  },
  production: {
    level: 'warn',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    ]
  }
};
```

### 3.2 Seguridad

| Feature | Local | Staging | Production |
| :--- | :--- | :--- | :--- |
| HTTPS | ❌ | ✅ | ✅ |
| CORS | Permisivo | Restrictivo | Muy Restrictivo |
| Rate Limiting | ❌ | ✅ | ✅ |
| Helmet Headers | ❌ | ✅ | ✅ |
| HSTS | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ✅ | ✅ |

### 3.3 Base de Datos

| Feature | Local | Staging | Production |
| :--- | :--- | :--- | :--- |
| Synchronize | ❌ | ❌ | ❌ |
| Logging | ✅ | ✅ | ❌ |
| SSL | ❌ | ✅ | ✅ |
| Backups | Manual | Diario | Cada 6 horas |
| Connection Pool | 5 | 10 | 20 |

### 3.4 Caching

| Feature | Local | Staging | Production |
| :--- | :--- | :--- | :--- |
| Redis | Opcional | ✅ | ✅ |
| TTL | 60s | 300s | 600s |
| Max Memory | 100MB | 512MB | 2GB |

## 4. Variables de Entorno por Stage

### 4.1 Archivo .env por Entorno

```bash
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pickyapp_dev
JWT_SECRET=dev-secret
CLOUDINARY_CLOUD_NAME=pickyapp-dev

# .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/pickyapp_staging
JWT_SECRET=staging-secret-different
CLOUDINARY_CLOUD_NAME=pickyapp-staging

# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/pickyapp_prod
JWT_SECRET=prod-secret-rotated-quarterly
CLOUDINARY_CLOUD_NAME=pickyapp-prod
```

### 4.2 Cargar Configuración

```typescript
// main.ts
import { config } from 'dotenv';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
config({ path: envFile });

console.log(`🚀 Starting in ${process.env.NODE_ENV} mode`);
```

## 5. Seeders y Datos de Prueba

### 5.1 Seeders para Development/Staging

```typescript
// seeds/demo-data.seed.ts
export class DemoDataSeed {
  async run() {
    // Crear tenant demo
    const tenant = await this.createTenant({
      slug: 'demo-pizzeria',
      name: 'Demo Pizzería',
      email: 'demo@pickyapp.com'
    });

    // Crear categorías
    const categories = await this.createCategories(tenant.id, [
      { name: 'Pizzas', order: 1 },
      { name: 'Empanadas', order: 2 },
      { name: 'Bebidas', order: 3 }
    ]);

    // Crear productos
    await this.createProducts(tenant.id, categories);

    // Crear pedidos de ejemplo
    await this.createOrders(tenant.id);
  }
}
```

### 5.2 Ejecutar Seeders

```bash
# Development
npm run seed:dev

# Staging
npm run seed:staging

# Production (NUNCA ejecutar seeders)
# Los datos reales vienen de usuarios
```

## 6. Migraciones por Entorno

### 6.1 Estrategia

| Entorno | Ejecución | Rollback | Validación |
| :--- | :--- | :--- | :--- |
| Local | Automática al inicio | Manual | Opcional |
| Staging | Automática en deploy | Manual | Obligatoria |
| Production | Manual con backup | Manual con plan | Obligatoria |

### 6.2 Comandos

```bash
# Local: Ejecutar migraciones
npm run migration:run

# Staging: Automático en CI/CD
docker-compose exec api npm run migration:run

# Production: Manual con backup
./scripts/migrate-production.sh
```

## 7. Monitoreo por Entorno

### 7.1 Health Checks

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  @Get('db')
  async checkDatabase() {
    try {
      await this.connection.query('SELECT 1');
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      return { status: 'error', database: 'disconnected' };
    }
  }
}
```

### 7.2 Alertas

| Entorno | Alertas | Destino |
| :--- | :--- | :--- |
| Local | ❌ | — |
| Staging | ✅ | Slack #staging-alerts |
| Production | ✅ | Slack #prod-alerts + Email + PagerDuty |

## 8. Acceso y Permisos

### 8.1 SSH Access

| Entorno | Acceso | Usuarios |
| :--- | :--- | :--- |
| Local | N/A | Todos los devs |
| Staging | SSH con key | Devs + QA |
| Production | SSH con key + 2FA | Solo DevOps |

### 8.2 Database Access

| Entorno | Acceso | Restricción |
| :--- | :--- | :--- |
| Local | Directo | Sin restricción |
| Staging | VPN + Whitelist IP | Solo equipo técnico |
| Production | VPN + Whitelist IP + Audit | Solo con aprobación |

## 9. Checklist de Deploy

### Staging
- [ ] Tests pasan en CI
- [ ] Build exitoso
- [ ] Migraciones aplicadas
- [ ] Seeders ejecutados (si aplica)
- [ ] Health checks OK
- [ ] Smoke tests OK

### Production
- [ ] Aprobación de stakeholders
- [ ] Backup de DB realizado
- [ ] Ventana de mantenimiento comunicada
- [ ] Rollback plan documentado
- [ ] Migraciones testeadas en staging
- [ ] Monitoring activo
- [ ] Equipo en standby
- [ ] Health checks OK
- [ ] Smoke tests OK
- [ ] Notificación de deploy exitoso

## 10. Troubleshooting

### Ver Logs por Entorno

```bash
# Local
npm run start:dev

# Staging
ssh staging-server
docker-compose logs -f api

# Production
ssh prod-server
tail -f /var/log/pickyapp/app.log
```

### Conectar a DB por Entorno

```bash
# Local
psql -U postgres -d pickyapp_dev

# Staging (con túnel SSH)
ssh -L 5433:localhost:5432 staging-server
psql -h localhost -p 5433 -U user -d pickyapp_staging

# Production (con VPN + túnel)
# Requiere aprobación y auditoría
```
