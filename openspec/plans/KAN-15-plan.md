# Master Plan: [KAN-15] Registro de Usuarios

**Estado**: Propuesto  
**ID Tarea Jira**: KAN-15  
**Responsable**: Tech Agent  
**Fecha**: 2026-03-09  

---

## 🛠️ 1. Resumen Técnico
Este requerimiento consiste en la implementación del flujo de registro de nuevos comerciantes (tenants) en PickyApp.

- **Impacto**:
    - **Backend**: Nuevo módulo `Users` y `Auth`. Creación de la entidad `User` y `Tenant`.
    - **Frontend**: Formulario de registro responsivo en Angular 19.
    - **Base de Datos**: Tablas `users` y `tenants`.
- **Dependencias**:
    - `bcrypt` (Hashing de contraseñas)
    - `@nestjs/jwt` (Generación de tokens)
    - `class-validator` (Validación de DTOs)

---

## 📐 2. Diseño de la Solución

### DB Schema (PostgreSQL)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- URL de la tienda
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT now()
);
```

### API Endpoints
- **POST `/api/v1/auth/register`**
    - Body: `{ email, password, storeName }`
    - Response: `201 Created` + JWT Access Token.

---

## 🚀 3. Plan de Ejecución (Paso a Paso)

### Fase 1: Backend (NestJS)
1. **Crear Entidades**: `User` y `Tenant` con TypeORM.
2. **Implementar Auth Service**: Lógica de registro y generación de JWT.
3. **Crear Auth Controller**: Exponer el endpoint `/register`.
4. **Validaciones**: Agregar DTOs con `class-validator`.

### Fase 2: Frontend (Angular 19)
1. **Crear Componente Standalone**: `RegisterComponent`.
2. **Formulario Reactivo**: Validaciones de email, password y nombre de tienda.
3. **Servicio de Auth**: Integración con la API.
4. **Redirección**: Al panel admin (`/admin/dashboard`) tras registro exitoso.

---

## 🧪 4. Protocolo de Validación (QA)

### Unit Tests
- `auth.service.spec.ts`: Verificar que el password se hashee correctamente.
- `register.component.spec.ts`: Validar que el botón se deshabilite si el formulario es inválido.

### Pasos Manuales
1. Abrir `/register` en el navegador.
2. Completar con datos válidos.
3. Verificar que se cree el registro en la DB.
4. Confirmar que el usuario es redirigido al dashboard con el token guardado.

---
*Plan generado por Tech Agent. Pendiente de aprobación por el Orquestador.*
