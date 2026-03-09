# Docker y Contenedores - PickyApp

## 1. Estrategia

Uso de contenedores Docker para garantizar paridad entre entornos (desarrollo, staging, producción) y simplificar el despliegue.

**Beneficios**:
- Mismo entorno en todos los stages
- Fácil escalabilidad horizontal
- Aislamiento de dependencias
- Despliegue reproducible

## 2. Servicios (docker-compose)

### 2.1 Desarrollo (docker-compose.yml)

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: pickyapp-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: pickyapp_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis (opcional para MVP)
  redis:
    image: redis:7-alpine
    container_name: pickyapp-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Backend API
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    container_name: pickyapp-api
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: postgres
      DATABASE_NAME: pickyapp_dev
      REDIS_HOST: redis
      REDIS_PORT: 6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npm run start:dev

volumes:
  postgres_data:
  redis_data:
```

### 2.2 Producción (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: pickyapp-postgres-prod
    environment:
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USERNAME}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: pickyapp-redis-prod
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  api:
    image: registry.example.com/pickyapp:latest
    container_name: pickyapp-api-prod
    environment:
      NODE_ENV: production
      DATABASE_HOST: postgres
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      REDIS_HOST: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: pickyapp-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## 3. Dockerfile

### 3.1 Multi-Stage Build

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Stage 2: Development
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copiar node_modules del builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar build del builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
```

### 3.2 .dockerignore

```
node_modules
npm-debug.log
dist
.git
.gitignore
.env
.env.*
README.md
.vscode
.idea
coverage
.nyc_output
*.log
```

## 4. Comandos Comunes

### 4.1 Desarrollo

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir imágenes
docker-compose build

# Ejecutar comando en contenedor
docker-compose exec api npm run migration:run

# Acceder a shell del contenedor
docker-compose exec api sh

# Ver estado de servicios
docker-compose ps
```

### 4.2 Producción

```bash
# Build de imagen
docker build -t pickyapp:latest --target production .

# Tag para registry
docker tag pickyapp:latest registry.example.com/pickyapp:latest

# Push a registry
docker push registry.example.com/pickyapp:latest

# Deploy con docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Ver logs de producción
docker-compose -f docker-compose.prod.yml logs -f

# Actualizar servicio
docker-compose -f docker-compose.prod.yml pull api
docker-compose -f docker-compose.prod.yml up -d --no-deps api
```

## 5. Nginx Configuration

### 5.1 nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    server {
        listen 80;
        server_name pickyapp.com www.pickyapp.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name pickyapp.com www.pickyapp.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API Proxy
        location /api {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket
        location /socket.io {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Health Check
        location /health {
            proxy_pass http://api/health;
            access_log off;
        }

        # Frontend (Angular)
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

## 6. Volúmenes y Persistencia

### 6.1 Backup de PostgreSQL

```bash
# Backup manual
docker-compose exec postgres pg_dump -U postgres pickyapp_dev > backup_$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U postgres pickyapp_dev < backup_20260223.sql

# Backup automático (cron)
0 2 * * * docker-compose exec postgres pg_dump -U postgres pickyapp_dev > /backups/backup_$(date +\%Y\%m\%d).sql
```

### 6.2 Volúmenes Nombrados

```yaml
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

## 7. Networking

### 7.1 Red Personalizada

```yaml
networks:
  pickyapp-network:
    driver: bridge

services:
  api:
    networks:
      - pickyapp-network
  postgres:
    networks:
      - pickyapp-network
```

## 8. Monitoreo y Logs

### 8.1 Logging Driver

```yaml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 8.2 Health Checks

```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## 9. Seguridad

### 9.1 Usuario No-Root

```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs
```

### 9.2 Secrets

```yaml
services:
  api:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

## 10. Troubleshooting

### 10.1 Ver Logs de Error

```bash
# Logs de todos los servicios
docker-compose logs

# Logs de un servicio con timestamp
docker-compose logs -f --timestamps api

# Últimas 100 líneas
docker-compose logs --tail=100 api
```

### 10.2 Inspeccionar Contenedor

```bash
# Ver detalles del contenedor
docker inspect pickyapp-api

# Ver procesos en el contenedor
docker-compose exec api ps aux

# Ver uso de recursos
docker stats
```

### 10.3 Limpiar Recursos

```bash
# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes sin usar
docker image prune

# Eliminar volúmenes sin usar
docker volume prune

# Limpiar todo
docker system prune -a --volumes
```
