# Security Audit Skill

Habilidad para auditar diseños técnicos y detectar vulnerabilidades de seguridad antes de la implementación.

## 📋 Requisitos Previos
- Acceso a `openspec/specs/security/`.
- Acceso al `design.md` de la tarea en curso.
- Acceso al `ContextPacket`.

## 🚀 Flujo de Ejecución (Paso a Paso)

### Paso 1: Análisis de Aislamiento Multi-tenant
- Verificar que toda nueva entidad de base de datos tenga un campo `tenant_id`.
- Asegurar que los nuevos endpoints validen el `tenant_id` del JWT contra los recursos solicitados.

### Paso 2: Detección de Vulnerabilidades OWASP Top 10
- **Inyección**: Revisar que se usen consultas parametrizadas y no concatenación de strings.
- **Autenticación Rota**: Validar que se use `bcrypt` y que los tokens JWT tengan expiración corta.
- **Control de Acceso Roto**: Asegurar que existan Guards de Rol (`RolesGuard`) en los endpoints críticos.

### Paso 3: Reporte de Hallazgos
- Generar un `SECURITY_AUDIT.md` en la carpeta del cambio con los hallazgos y el nivel de riesgo.
- Crear `GateFeedback` con severidad `blocking` para riesgos altos o `warning` para riesgos mitigables.
- Insertar el `GateFeedback` en `ContextPacket.gateFeedback`.

## 🧪 Validación de Éxito
- El archivo de auditoría existe.
- El `ContextPacket` contiene `GateFeedback` estructurado.

---
*Skill generada para el Security Auditor Agent.*
