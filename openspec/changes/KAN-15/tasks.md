# Tasks: [KAN-15] Registro de Usuarios

**Estado**: Pendiente
**Contexto**: Implementación del flujo de registro inicial.

---

## 🏗️ Fase 1: Backend (Infraestructura de Datos y Auth)

- [ ] **TSK-1.1**: Crear entidades `Tenant` y `User` con TypeORM en el módulo de persistencia.
- [ ] **TSK-1.2**: Implementar `AuthService` con método `register()` que maneje hashing de contraseñas.
- [ ] **TSK-1.3**: Crear `RegisterDto` con validaciones de `class-validator`.
- [ ] **TSK-1.4**: Implementar `AuthController` y exponer el endpoint `POST /auth/register`.
- [ ] **TSK-1.5**: Configurar `JwtModule` para emitir tokens tras el registro.

## 🎨 Fase 2: Frontend (UI y Servicios)

- [ ] **TSK-2.1**: Crear el componente standalone `RegisterComponent` con Angular Material 3.
- [ ] **TSK-2.2**: Implementar formulario reactivo con validaciones de email y password.
- [ ] **TSK-2.3**: Crear `AuthService` en Angular para consumir el endpoint de registro.
- [ ] **TSK-2.4**: Configurar navegación y redirección al dashboard tras éxito.

## 🧪 Fase 3: Validación y QA

- [ ] **TSK-3.1**: Escribir test unitario para el servicio de registro (backend).
- [ ] **TSK-3.2**: Verificar flujo de registro completo mobile-first (360px).
