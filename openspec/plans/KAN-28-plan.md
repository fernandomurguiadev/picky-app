# Master Plan: [KAN-28] Permisos por Rol y Casino

**Estado**: Propuesto  
**ID Tarea Jira**: KAN-28  
**Responsable**: Tech Agent  
**Fecha**: 2026-03-09  

---

## 🛠️ 1. Resumen Técnico
Implementación de un sistema de control de acceso basado en roles (RBAC) y atributos (ABAC) para garantizar el aislamiento multi-tenant y la jerarquía de permisos.

- **Impacto**:
    - **Backend**: Creación de `CasinosGuard` y `RolesGuard` en NestJS.
    - **Base de Datos**: Posible adición de tabla `permissions` o matriz ACL en configuración.
    - **Seguridad**: Validación estricta de `casino_id` (o `tenant_id`) en cada petición.

---

## 📐 2. Diseño de la Solución

### Arquitectura de Seguridad
1.  **JWT Payload**: Debe incluir `role` y `casino_id`.
2.  **Guards de NestJS**:
    -   `CasinoIdGuard`: Compara el `casino_id` del token con el de los parámetros de la ruta o el body.
    -   `RoleGuard`: Verifica que el rol del usuario tenga permiso para la acción.

### ACL Matrix (Propuesta)
| Rol | Ver Usuarios | Crear Admin | Ver Reportes |
| :--- | :---: | :---: | :---: |
| Super Admin | ✅ | ✅ | ✅ |
| Admin Casino | ✅ (Propios) | ❌ | ✅ (Propios) |
| Agente | ❌ | ❌ | ✅ (Propios) |

---

## 🚀 3. Plan de Ejecución (Paso a Paso)

### Fase 1: Backend (Core Security)
1.  **Definir Decoradores**: Crear `@Roles()` y `@CasinoCheck()`.
2.  **Implementar Guards**: Desarrollar la lógica de comparación de IDs y roles.
3.  **Integrar en Controladores**: Aplicar los guards globalmente o por endpoint.

---

## 🧪 4. Protocolo de Validación (QA)

### Unit Tests
- `guards.spec.ts`: Testear que un usuario de Casino A no pueda acceder a recursos de Casino B.

### Pasos Manuales
1. Intentar acceder a `/casinos/1/users` con un token de `casino_id = 2`.
2. Verificar respuesta `403 Forbidden`.

---
*Plan generado por Tech Agent siguiendo la skill [master-planning].*

> ### 📎 Context Packet [KAN-28]
> - **Decisión Crítica**: Se optará por Guards de NestJS en lugar de filtros a nivel de base de datos para centralizar la lógica de seguridad y facilitar el testing unitario.
> - **Bloqueo Detectado**: Ninguno. El plan está listo para ser transformado en diseño detallado.
> - **Siguiente Acción Sugerida**: @SDDAgent, inicia el ciclo de vida SDD (`propose` y `design`) basándote en este Master Plan.
