# Visión General de Seguridad - PickyApp

## 1. Principios de Seguridad

-   **Zero Trust**: Verificar siempre, nunca confiar implícitamente
-   **Least Privilege**: Mínimos permisos necesarios para cada operación
-   **Defense in Depth**: Múltiples capas de seguridad
-   **Secure by Default**: Configuración segura por defecto
-   **Fail Securely**: En caso de error, denegar acceso

## 2. Mitigaciones de Amenazas Comunes

### 2.1 XSS (Cross-Site Scripting)

**Riesgo**: Inyección de scripts maliciosos en la aplicación.

**Mitigaciones**:
-   **Angular**: Escapado automático de templates (DomSanitizer)
-   **CSP Headers**: Content Security Policy restrictivo
-   **Validación de inputs**: Sanitizar datos de usuario
-   **HttpOnly cookies**: Tokens no accesibles desde JavaScript

```typescript
// Angular escapa automáticamente
<div>{{ userInput }}</div>  // ✅ Seguro

// Para HTML confiable, usar DomSanitizer
constructor(private sanitizer: DomSanitizer) {}
safeHtml = this.sanitizer.bypassSecurityTrustHtml(trustedHtml);
```

**CSP Header (NestJS)**:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Solo para Angular
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", 'wss://api.pickyapp.com']
    }
  }
}));
```

### 2.2 CSRF (Cross-Site Request Forgery)

**Riesgo**: Requests no autorizados desde sitios maliciosos.

**Mitigaciones**:
-   **SameSite Cookies**: `SameSite=Strict` en refresh tokens
-   **CORS restrictivo**: Solo dominios permitidos
-   **Custom headers**: Verificar `X-Requested-With`

```typescript
// NestJS CORS configuration
app.enableCors({
  origin: [
    'https://pickyapp.com',
    'https://admin.pickyapp.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:4200' : ''
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

**SameSite Cookie**:
```typescript
response.cookie('refresh_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
});
```

### 2.3 SQL Injection

**Riesgo**: Inyección de código SQL malicioso.

**Mitigaciones**:
-   **TypeORM**: Usa prepared statements automáticamente
-   **Validación de inputs**: class-validator en DTOs
-   **Nunca concatenar SQL**: Usar query builder o repositories

```typescript
// ✅ SEGURO: TypeORM usa prepared statements
await productRepository.find({
  where: { name: userInput }
});

// ✅ SEGURO: Query builder con parámetros
await productRepository
  .createQueryBuilder('product')
  .where('product.name = :name', { name: userInput })
  .getMany();

// ❌ INSEGURO: Concatenación directa
await queryRunner.query(
  `SELECT * FROM products WHERE name = '${userInput}'`
);
```

### 2.4 Injection Attacks (NoSQL, Command, etc.)

**Mitigaciones**:
-   **Validación estricta**: class-validator con whitelist
-   **Sanitización**: Remover caracteres especiales
-   **Tipos fuertes**: TypeScript previene muchos errores

```typescript
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ]+$/) // Solo caracteres permitidos
  name: string;
  
  @IsNumber()
  @Min(0)
  @Max(1000000)
  price: number;
}
```

### 2.5 Broken Authentication

**Mitigaciones**:
-   **JWT con expiración corta**: 15 minutos
-   **Refresh tokens**: Rotación automática
-   **Bcrypt para passwords**: Salt rounds 10
-   **Rate limiting**: Máximo 5 intentos de login por IP

```typescript
// Hash de password con bcrypt
import * as bcrypt from 'bcrypt';

async hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 2.6 Sensitive Data Exposure

**Mitigaciones**:
-   **HTTPS obligatorio**: TLS 1.2+ en producción
-   **Passwords nunca en logs**: Filtrar campos sensibles
-   **Tokens en httpOnly cookies**: No accesibles desde JS
-   **Secrets en variables de entorno**: Nunca en código

```typescript
// Excluir password de responses
@Entity('users')
export class User {
  @Column({ select: false }) // ❌ No incluir en queries por defecto
  passwordHash: string;
  
  toJSON() {
    const { passwordHash, ...user } = this;
    return user; // ✅ Excluir password de JSON
  }
}
```

### 2.7 Broken Access Control

**Mitigaciones**:
-   **Multi-tenancy estricto**: Filtrar por tenant_id siempre
-   **Guards en todos los endpoints**: JwtAuthGuard + TenantGuard
-   **Validación de ownership**: Verificar que el recurso pertenece al tenant

```typescript
@Controller('admin/products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductsController {
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string
  ) {
    // ✅ Verificar que el producto pertenece al tenant
    const product = await this.catalogService.findOne(id, tenantId);
    if (!product) {
      throw new NotFoundException();
    }
    return product;
  }
}
```

## 3. Cifrado

### 3.1 En Tránsito (TLS/HTTPS)

**Producción**:
-   HTTPS obligatorio (TLS 1.2+)
-   Certificados SSL válidos (Let's Encrypt)
-   HSTS header: `Strict-Transport-Security`
-   Redirect HTTP → HTTPS automático

```typescript
// NestJS con Helmet
app.use(helmet({
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  }
}));
```

### 3.2 En Reposo

**Base de Datos**:
-   PostgreSQL con cifrado de disco (LUKS/dm-crypt)
-   Backups cifrados (GPG o AES-256)
-   Passwords hasheados con bcrypt (nunca plaintext)

**Archivos**:
-   Cloudinary/S3 con cifrado server-side
-   Imágenes públicas (no sensibles)

### 3.3 Contraseñas

**Hashing con Bcrypt**:
```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Hashear password
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// Verificar password
const isValid = await bcrypt.compare(password, hash);
```

**Requisitos de contraseña**:
-   Mínimo 8 caracteres
-   Al menos 1 mayúscula
-   Al menos 1 minúscula
-   Al menos 1 número

```typescript
@IsString()
@MinLength(8)
@Matches(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  { message: 'Password debe tener mayúscula, minúscula y número' }
)
password: string;
```

## 4. Secrets Management

### 4.1 Variables de Entorno

**Nunca commitear secrets**:
```bash
# .gitignore
.env
.env.local
.env.production
```

**Validación de secrets al inicio**:
```typescript
// config/env.validation.ts
import { plainToClass } from 'class-transformer';
import { IsString, IsNumber, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  CLOUDINARY_API_KEY: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true
  });
  
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
```

### 4.2 Rotación de Secrets

**JWT Secret**:
-   Rotar cada 90 días
-   Mantener secret anterior por 24h para tokens en tránsito

**API Keys**:
-   Rotar cada 6 meses
-   Usar múltiples keys con versionado

## 5. Logging de Seguridad

**Eventos a loguear**:
-   ✅ Login exitoso/fallido
-   ✅ Cambios de password
-   ✅ Accesos denegados (403)
-   ✅ Errores de autenticación (401)
-   ✅ Operaciones críticas (eliminar datos)

**NO loguear**:
-   ❌ Passwords (ni hasheados)
-   ❌ Tokens completos
-   ❌ Datos de tarjetas de crédito
-   ❌ PII sensible

```typescript
// Logger con filtrado de campos sensibles
this.logger.log({
  event: 'user_login',
  userId: user.id,
  email: user.email,
  ip: request.ip,
  // ❌ NO incluir: password, token
});
```

## 6. Dependencias y Vulnerabilidades

### 6.1 Auditoría de Dependencias

```bash
# Auditar vulnerabilidades
npm audit

# Actualizar dependencias con vulnerabilidades
npm audit fix

# Ver reporte detallado
npm audit --json
```

### 6.2 Dependabot / Renovate

Configurar actualizaciones automáticas de dependencias:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

## 7. Checklist de Seguridad

### Desarrollo
- [ ] Validación de inputs con class-validator
- [ ] Sanitización de outputs
- [ ] Secrets en .env (no en código)
- [ ] .env en .gitignore
- [ ] TypeORM con prepared statements
- [ ] Passwords hasheados con bcrypt

### Producción
- [ ] HTTPS obligatorio (TLS 1.2+)
- [ ] CORS restrictivo
- [ ] Rate limiting configurado
- [ ] Helmet headers aplicados
- [ ] Logs de seguridad activos
- [ ] Backups cifrados
- [ ] Secrets rotados regularmente
- [ ] Dependencias actualizadas
- [ ] Auditoría de seguridad realizada
