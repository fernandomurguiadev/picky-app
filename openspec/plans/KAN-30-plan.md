# Master Plan: [KAN-30] Recuperación de Contraseña

**Estado**: Propuesto  
**ID Tarea Jira**: KAN-30  
**Responsable**: Tech Agent  
**Fecha**: 2026-03-09  

---

## 🛠️ 1. Resumen Técnico
Este requerimiento implementa el flujo de recuperación de contraseña ("olvidé mi contraseña") para los administradores de tienda.

- **Impacto**:
    - **Backend**: Nuevo módulo de `Mail` (o integración con servicio), extensión del módulo `Auth` con endpoints de reset.
    - **Frontend**: Nuevas vistas standalone para solicitud de reset y formulario de nueva contraseña.
    - **Seguridad**: Generación de tokens temporales firmados (JWT o tokens aleatorios con expiración en DB).
- **Dependencias**:
    - `nodemailer` o servicio externo (SendGrid/AWS SES).
    - `crypto` (para generación de tokens seguros).

---

## 📐 2. Diseño de la Solución

### DB Schema (Ampliación)
Se requiere una tabla o campos en `users` para gestionar el reset:
```sql
ALTER TABLE users 
ADD COLUMN reset_password_token VARCHAR(255),
ADD COLUMN reset_password_expires TIMESTAMP;
```

### API Endpoints
- **POST `/api/v1/auth/forgot-password`**
    - Body: `{ email }`
    - Acción: Genera token, guarda en DB con expiración (1 hora) y envía mail.
- **POST `/api/v1/auth/reset-password`**
    - Body: `{ token, newPassword }`
    - Acción: Valida token, actualiza password y limpia campos de reset.

---

## 🚀 3. Plan de Ejecución (Paso a Paso)

### Fase 1: Backend (Infra & Logic)
1. **Configurar Mailer**: Setup de servicio de envío de correos.
2. **Lógica de Token**: Generar token seguro y guardar expiración.
3. **Endpoint Forgot**: Implementar envío de mail con link dinámico.
4. **Endpoint Reset**: Validar token y hashear nueva contraseña.

### Fase 2: Frontend (UI/UX)
1. **Forgot View**: Pantalla simple para ingresar email.
2. **Reset View**: Pantalla (con token en URL) para ingresar nueva contraseña.
3. **Validaciones**: Fortalecer validación de complejidad de contraseña.
4. **Feedback**: Toast de éxito y manejo de errores (token expirado).

---

## 🧪 4. Protocolo de Validación (QA)

### Unit Tests
- `auth.service.spec.ts`: Testear expiración de token.
- `mail.service.spec.ts`: Simular envío exitoso.

### Pasos Manuales
1. Solicitar reset desde la UI.
2. Verificar recepción de mail (simulado en dev).
3. Acceder al link y cambiar contraseña.
4. Intentar loguear con la nueva contraseña.
5. Intentar usar el mismo link de reset por segunda vez (debe fallar).

---
*Plan generado por Tech Agent. Pendiente de aprobación por el Orquestador.*
