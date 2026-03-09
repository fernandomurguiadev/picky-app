# Error Recovery Skill

Habilidad para gestionar errores de agentes y aplicar reintentos controlados.

## 📋 Requisitos Previos
- Acceso al `ContextPacket` con `AgentError`.
- Acceso a `AgentOutput` previo para diagnóstico.

## 🚀 Flujo de Ejecución (Paso a Paso)

### Paso 1: Clasificación del Error
- Leer `AgentError.recoverable` y `retryCount`.
- Registrar el error en `ContextPacket.errors`.

### Paso 2: Reintento Controlado
- Si `recoverable = true` y `retryCount < 3`, reintentar el agente con el mismo `ContextPacket` y el error adjunto.
- Si `recoverable = true` y `retryCount >= 3`, marcar `stage = recovering` y escalar al Router con diagnóstico.

### Paso 3: Error Irrecuperable
- Si `recoverable = false`, marcar `stage = error`.
- Emitir `WorkflowEvent` tipo `workflow_aborted`.
- Notificar al Router para finalizar o degradar el workflow.

## 🧪 Validación de Éxito
- El workflow reintenta sin exceder 3 intentos.
- Los errores quedan registrados en `ContextPacket.errors`.

---
*Skill formalizada para el Supervisor Agent.*
