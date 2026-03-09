# MCP Jira Management Skill

Esta skill permite interactuar con Jira Cloud utilizando las herramientas nativas del servidor MCP.

## 📋 Requisitos Previos
- Servidor MCP `@nexus2520/jira-mcp-server` en estado Running.

## 🚀 Flujo de Ejecución (Paso a Paso)

### Paso 1: Interacción con Issues
- Usar `mcp_jira_jira_issues(action='get', issueKey='...')` para obtener detalles.
- Usar `mcp_jira_jira_issues(action='update', ...)` para modificar estados o descripciones.

### Paso 2: Búsqueda y Filtros
- Usar `mcp_jira_jira_search(action='issues', jql='...')` para consultas complejas (ej: sprint actual).

## 🧪 Validación de Éxito
- La operación en Jira se refleja correctamente en la consola del IDE y en la interfaz web de Atlassian.

---
*Skill formalizada para el Jira Agent.*
