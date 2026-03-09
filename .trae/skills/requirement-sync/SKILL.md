# Requirement Sync Skill

Habilidad para mantener la paridad entre los requerimientos en Jira Cloud y la documentación local en `openspec/jira/`.

## 📋 Requisitos Previos
- Acceso a Jira vía MCP.
- Estructura de carpetas `openspec/jira/` existente.

## 🚀 Flujo de Ejecución (Paso a Paso)

### Paso 1: Extracción
- Obtener el contenido del ticket en Jira.
- Identificar Historias de Usuario, Criterios de Aceptación y Desglose Técnico.

### Paso 2: Serialización Local
- Crear o actualizar el archivo `openspec/jira/KAN-XXX.md`.
- Transformar el formato ADF a un Markdown limpio y estructurado siguiendo el estándar del proyecto.

## 🧪 Validación de Éxito
- El archivo local existe y contiene toda la información crítica del ticket de Jira.
- El Router Agent puede leer el archivo y delegar al Tech Agent.

---
*Skill formalizada para el Jira Agent.*
