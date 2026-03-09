# Proposal: [KAN-15] Registro de Usuarios

**Estado**: Propuesto
**ID Tarea Jira**: KAN-15
**Autor**: SDD Agent
**Fecha**: 2026-03-09

## 📝 Resumen
Esta propuesta formaliza la implementación del flujo de registro para nuevos comerciantes (tenants) en PickyApp, permitiendo la creación de una cuenta de usuario administrador y el alta de su tienda correspondiente.

## 🎯 Objetivos
- Implementar el proceso de registro multi-tenant.
- Asegurar el hashing seguro de contraseñas.
- Proveer una interfaz de usuario mobile-first para el registro.
- Generar un token JWT válido tras el registro exitoso para el login automático.

## 🏗️ Impacto en Multi-tenancy
Este cambio es fundamental para el aislamiento de datos:
- Cada registro crea un nuevo `tenant_id` único en la tabla `tenants`.
- El usuario administrador se vincula permanentemente a dicho `tenant_id`.
- Se debe validar que el `slug` de la tienda sea único a nivel global.

## 📐 Diseño Conceptual (High Level)
- **Backend**: Módulos `AuthModule` y `UsersModule` en NestJS.
- **Frontend**: Componente Standalone `RegisterComponent` en Angular 19 con formularios reactivos.
- **Seguridad**: Uso de `bcrypt` y `passport-jwt`.

---
*Propuesta iniciada por el SDD Agent siguiendo el Master Plan del Tech Agent.*
