# CI/CD (Integración y Despliegue Continuo) - PickyApp

## 1. Pipeline de Integración (CI)

Se ejecuta automáticamente en cada push a ramas de desarrollo/feature.

### 1.1 Stages del Pipeline CI

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [develop, 'feature/**']
  pull_request:
    branches: [develop, main]

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build --prod
      - uses: actions/upload-artifact@v3
        with:
          name: frontend-dist
          path: dist/

  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: backend-dist
          path: dist/

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
```

### 1.2 Checks Obligatorios

Antes de mergear a `develop` o `main`:
- ✅ Lint pasa sin errores
- ✅ Build exitoso (frontend + backend)
- ✅ Tests unitarios pasan
- ✅ Tests E2E pasan
- ✅ Cobertura mínima (opcional)

## 2. Pipeline de Despliegue (CD)

Se ejecuta automáticamente al mergear a `main` o `develop`.

### 2.1 Deploy a Staging (develop)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker Image
        run: |
          docker build -t pickyapp:staging .
          docker tag pickyapp:staging registry.example.com/pickyapp:staging
      
      - name: Push to Registry
        run: docker push registry.example.com/pickyapp:staging
      
      - name: Deploy to Staging Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /app/pickyapp
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T api npm run migration:run
      
      - name: Smoke Tests
        run: |
          curl -f https://staging.pickyapp.com/health || exit 1
          curl -f https://staging.pickyapp.com/health/db || exit 1
      
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deploy to Staging completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 2.2 Deploy a Producción (main)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Backup Database
        run: |
          ssh ${{ secrets.PROD_USER }}@${{ secrets.PROD_HOST }} \
            "pg_dump -U postgres pickyapp_prod > backup_$(date +%Y%m%d_%H%M%S).sql"
      
      - name: Build Docker Image
        run: |
          docker build -t pickyapp:${{ github.sha }} .
          docker tag pickyapp:${{ github.sha }} registry.example.com/pickyapp:latest
      
      - name: Push to Registry
        run: |
          docker push registry.example.com/pickyapp:${{ github.sha }}
          docker push registry.example.com/pickyapp:latest
      
      - name: Deploy with Zero Downtime
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /app/pickyapp
            docker-compose pull
            docker-compose up -d --no-deps --build api
            sleep 10
            docker-compose exec -T api npm run migration:run
            docker-compose restart nginx
      
      - name: Health Check
        run: |
          for i in {1..10}; do
            if curl -f https://pickyapp.com/health; then
              echo "Health check passed"
              exit 0
            fi
            echo "Attempt $i failed, retrying..."
            sleep 5
          done
          exit 1
      
      - name: Rollback on Failure
        if: failure()
        run: |
          ssh ${{ secrets.PROD_USER }}@${{ secrets.PROD_HOST }} \
            "cd /app/pickyapp && docker-compose down && docker-compose up -d"
      
      - name: Notify Team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 3. Herramientas

### 3.1 CI/CD Platform
- **GitHub Actions** (recomendado para MVP)
- Alternativas: GitLab CI, CircleCI, Jenkins

### 3.2 Container Registry
- **Docker Hub** (público/privado)
- **GitHub Container Registry** (integrado)
- **AWS ECR** (si se usa AWS)

### 3.3 Deployment
- **Docker Compose** (MVP/Staging)
- **Kubernetes** (escalabilidad futura)
- **Vercel/Netlify** (frontend estático)

## 4. Estrategias de Deployment

### 4.1 Blue-Green Deployment

```bash
# Mantener dos versiones: blue (actual) y green (nueva)
docker-compose -f docker-compose.blue.yml up -d
# Verificar green
docker-compose -f docker-compose.green.yml up -d
# Cambiar tráfico a green
# Si falla, volver a blue
```

### 4.2 Rolling Update

```bash
# Actualizar instancias una por una
docker-compose up -d --scale api=3 --no-recreate
```

### 4.3 Canary Deployment

```bash
# Enviar 10% del tráfico a nueva versión
# Si funciona bien, aumentar gradualmente
```

## 5. Secrets Management

### 5.1 GitHub Secrets

Configurar en: Settings → Secrets and variables → Actions

```
DATABASE_URL
JWT_SECRET
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY
PROD_HOST
PROD_USER
PROD_SSH_KEY
SLACK_WEBHOOK
```

### 5.2 Uso en Workflows

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## 6. Rollback Strategy

### 6.1 Rollback Automático

```yaml
- name: Rollback on Failure
  if: failure()
  run: |
    docker-compose down
    docker tag pickyapp:previous pickyapp:latest
    docker-compose up -d
```

### 6.2 Rollback Manual

```bash
# Ver versiones disponibles
docker images pickyapp

# Volver a versión anterior
docker tag pickyapp:sha-abc123 pickyapp:latest
docker-compose up -d
```

## 7. Monitoring Post-Deploy

### 7.1 Health Checks

```bash
# API Health
curl https://api.pickyapp.com/health

# Database Health
curl https://api.pickyapp.com/health/db

# WebSocket Health
curl https://api.pickyapp.com/health/ws
```

### 7.2 Smoke Tests

```bash
# Test crítico: Login
curl -X POST https://api.pickyapp.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Test crítico: Crear pedido
curl -X POST https://api.pickyapp.com/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[...]}'
```

## 8. Notificaciones

### 8.1 Slack

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    fields: repo,message,commit,author
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 8.2 Email

```yaml
- name: Send Email
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: Deploy to Production ${{ job.status }}
    body: Deployment completed with status ${{ job.status }}
    to: team@pickyapp.com
```

## 9. Checklist Pre-Deploy

Antes de cada deploy a producción:

- [ ] Backup de base de datos realizado
- [ ] Migraciones testeadas en staging
- [ ] Tests E2E pasando
- [ ] Health checks configurados
- [ ] Rollback plan documentado
- [ ] Equipo notificado
- [ ] Ventana de mantenimiento comunicada (si aplica)
- [ ] Monitoring activo

## 10. Métricas de CI/CD

Trackear:
- **Build time**: Tiempo de compilación
- **Test duration**: Duración de tests
- **Deploy frequency**: Frecuencia de deploys
- **Lead time**: Tiempo desde commit hasta producción
- **MTTR**: Mean Time To Recovery (tiempo de recuperación)
- **Change failure rate**: % de deploys que fallan
