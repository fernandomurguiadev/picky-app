# Design: [KAN-15] Registro de Usuarios

**Estado**: En Diseño
**Relacionado con**: [proposal.md](proposal.md)

## 🛠️ Especificación Técnica

### 1. Modelos de Datos (Entities)

**Tenant Entity**
```typescript
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @CreateDateColumn()
  created_at: Date;
}
```

**User Entity**
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // No devolver password por defecto
  password: string;

  @Column({ default: 'admin' })
  role: string;
}
```

### 2. Contratos de API (Endpoints)

**POST `/api/v1/auth/register`**
- **Payload**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123",
    "storeName": "Mi Tienda",
    "storeSlug": "mi-tienda"
  }
  ```
- **Response (201)**:
  ```json
  {
    "data": {
      "accessToken": "eyJ...",
      "user": { "id": "uuid", "email": "..." }
    }
  }
  ```

### 3. Frontend (UI Components)

- **Component**: `RegisterComponent` (Standalone).
- **Route**: `/register`.
- **Logic**: 
  - Validaciones asíncronas para disponibilidad de `slug`.
  - Integración con `AuthService` para guardar el token en `localStorage`.

---
## 🧪 Plan de Pruebas
- **DB**: Verificar creación de registros en ambas tablas tras una petición exitosa.
- **Validación**: Comprobar que no se permiten duplicados de email ni de slug.
