# JWT Claims (Reclamaciones) - PickyApp

## 1. Estructura del Access Token

El access token contiene información mínima necesaria para autenticación y autorización.

### Payload del JWT

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "comercio@example.com",
  "tenantId": "tenant-uuid-here",
  "iat": 1709654400,
  "exp": 1709655300
}
```

### Claims Estándar (RFC 7519)

| Claim | Nombre | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| `sub` | Subject | string (UUID) | ID del usuario autenticado |
| `iat` | Issued At | number (timestamp) | Fecha de emisión del token |
| `exp` | Expiration | number (timestamp) | Fecha de expiración (15 min después de iat) |

### Claims Personalizados

| Claim | Tipo | Descripción | Uso |
| :--- | :--- | :--- | :--- |
| `email` | string | Email del usuario | Identificación, logs |
| `tenantId` | string (UUID) | ID del comercio | Multi-tenancy, filtrado de datos |

## 2. Generación del Token

```typescript
// auth.service.ts
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async generateAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId
    };

    return this.jwtService.sign(payload, {
      expiresIn: '15m' // 15 minutos
    });
  }
}
```

## 3. Validación del Token

### JWT Strategy (Passport)

```typescript
// strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET
    });
  }

  async validate(payload: any) {
    // Payload ya fue verificado por Passport
    // Retornar objeto que se adjuntará a request.user
    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId
    };
  }
}
```

### Validaciones Automáticas

El middleware de Passport verifica automáticamente:
- ✅ Firma del token (HMAC SHA256)
- ✅ Expiración (`exp` claim)
- ✅ Formato del token

### Validaciones Adicionales

```typescript
async validate(payload: any) {
  // Validar que el usuario aún existe y está activo
  const user = await this.usersService.findOne(payload.sub);
  
  if (!user || !user.isActive) {
    throw new UnauthorizedException('Usuario inválido o inactivo');
  }
  
  // Validar que el tenant está activo
  const tenant = await this.tenantsService.findOne(payload.tenantId);
  
  if (!tenant || !tenant.isActive) {
    throw new UnauthorizedException('Comercio inactivo');
  }
  
  return {
    userId: payload.sub,
    email: payload.email,
    tenantId: payload.tenantId
  };
}
```

## 4. Uso en Controllers

### Extraer Claims del Request

```typescript
// Decorador personalizado para extraer tenantId
// decorators/tenant-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.tenantId;
  }
);

// Decorador para extraer userId
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
```

### Uso en Endpoints

```typescript
@Controller('admin/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  @Get()
  async findAll(@TenantId() tenantId: string) {
    // tenantId extraído automáticamente del JWT
    return this.catalogService.findAll(tenantId);
  }

  @Post()
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateProductDto
  ) {
    this.logger.log(`User ${user.email} creating product for tenant ${tenantId}`);
    return this.catalogService.create(tenantId, dto);
  }
}
```

## 5. Refresh Token

El refresh token NO es un JWT. Es un token opaco (UUID) almacenado en base de datos.

### Estructura en Base de Datos

```typescript
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'token_hash' })
  tokenHash: string; // Hash del token (bcrypt)

  @Column({ name: 'expires_at' })
  expiresAt: Date; // 7 días desde creación

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### Generación y Almacenamiento

```typescript
async generateRefreshToken(user: User): Promise<string> {
  // Generar token aleatorio
  const token = randomBytes(32).toString('hex');
  
  // Hashear antes de guardar
  const tokenHash = await bcrypt.hash(token, 10);
  
  // Guardar en DB
  await this.refreshTokenRepository.save({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
  });
  
  // Retornar token sin hashear (se envía al cliente)
  return token;
}
```

### Renovación de Access Token

```typescript
@Post('refresh')
async refresh(@Req() request: Request) {
  // Extraer refresh token de cookie
  const refreshToken = request.cookies['refresh_token'];
  
  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token no encontrado');
  }
  
  // Buscar tokens en DB y verificar
  const tokens = await this.refreshTokenRepository.find({
    where: { expiresAt: MoreThan(new Date()) }
  });
  
  let validToken: RefreshToken | null = null;
  
  for (const token of tokens) {
    const isValid = await bcrypt.compare(refreshToken, token.tokenHash);
    if (isValid) {
      validToken = token;
      break;
    }
  }
  
  if (!validToken) {
    throw new UnauthorizedException('Refresh token inválido o expirado');
  }
  
  // Obtener usuario
  const user = await this.usersService.findOne(validToken.userId);
  
  // Generar nuevo access token
  const accessToken = await this.generateAccessToken(user);
  
  return { accessToken };
}
```

## 6. Seguridad de Claims

### NO Incluir en el JWT

❌ **Datos sensibles**:
- Passwords (ni hasheados)
- Números de tarjeta
- Información personal sensible

❌ **Datos que cambian frecuentemente**:
- Permisos detallados (usar DB)
- Configuración de usuario
- Estado de suscripción

❌ **Datos grandes**:
- Listas completas
- Objetos complejos

### SÍ Incluir en el JWT

✅ **Identificadores**:
- User ID
- Tenant ID
- Email (para logs)

✅ **Datos estáticos**:
- Rol básico (si aplica)
- Tipo de cuenta

## 7. Debugging de Tokens

### Decodificar JWT (sin verificar)

```typescript
import { JwtService } from '@nestjs/jwt';

const decoded = this.jwtService.decode(token);
console.log(decoded);
// { sub: '...', email: '...', tenantId: '...', iat: ..., exp: ... }
```

### Verificar y Decodificar

```typescript
try {
  const payload = await this.jwtService.verifyAsync(token, {
    secret: process.env.JWT_SECRET
  });
  console.log('Token válido:', payload);
} catch (error) {
  console.error('Token inválido:', error.message);
}
```

### Herramientas Online

- [jwt.io](https://jwt.io) - Decodificar y verificar JWTs
- [jwt-cli](https://github.com/mike-engel/jwt-cli) - CLI para trabajar con JWTs

## 8. Configuración de JWT Module

```typescript
// auth.module.ts
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '15m',
        algorithm: 'HS256'
      }
    })
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
```

### Variables de Entorno

```env
# .env
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

## 9. Testing

```typescript
describe('JWT Claims', () => {
  it('should include required claims', async () => {
    const user = { id: 'user-id', email: 'test@example.com', tenantId: 'tenant-id' };
    const token = await authService.generateAccessToken(user);
    
    const decoded = jwtService.decode(token) as any;
    
    expect(decoded.sub).toBe(user.id);
    expect(decoded.email).toBe(user.email);
    expect(decoded.tenantId).toBe(user.tenantId);
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  it('should expire after 15 minutes', async () => {
    const user = { id: 'user-id', email: 'test@example.com', tenantId: 'tenant-id' };
    const token = await authService.generateAccessToken(user);
    
    const decoded = jwtService.decode(token) as any;
    const expiresIn = decoded.exp - decoded.iat;
    
    expect(expiresIn).toBe(15 * 60); // 15 minutos en segundos
  });
});
```
