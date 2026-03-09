# Changelog - PickyApp

Este documento es la bitácora inmutable de todos los cambios arquitectónicos y de especificación realizados en el proyecto. Es gestionado por el **Change Tracker Agent Agent**.

### 2026-03-09 03:15

- **Agente**: [Jira Agent](../../.trae/agents/jira-agent.md)
- **Tipo de Cambio**: Actualización Tecnológica (MCP Integration)
- **Descripción**: Migración del Jira Agent para utilizar el servidor MCP (`@nexus2520/jira-mcp-server`) configurado en el IDE.
- **Motivo**: Eliminar la dependencia de scripts manuales y variables de entorno locales, delegando la gestión de API y ADF al protocolo nativo del IDE.
- **Impacto**: Simplificación de las reglas de operación y mejora en la fiabilidad de la sincronización.
- **Autor/Agente**: Gemini (actuando como Change Tracker Agent).

### 2026-03-09 02:05

- **Tarea**: [KAN-15] Registro de Usuarios
- **Tipo de Cambio**: Inicio de Ciclo SDD
- **Descripción**: Creación de los artefactos de OpenSpec (`proposal`, `design`, `tasks`) para la implementación del registro.
- **Motivo**: Formalizar el diseño y el plan de ejecución atómico para el flujo de registro multi-tenant.
- **Impacto**: Nueva subcarpeta en `openspec/changes/KAN-15/`.
- **Autor/Agente**: Gemini (actuando como SDD Agent).

### 2026-03-09 03:00

- **Tarea**: [KAN-28] Permisos por Rol y Casino
- **Tipo de Cambio**: Sincronización y Planificación
- **Descripción**: Obtención de la tarea KAN-28 desde Jira Cloud y generación del Master Plan técnico para el sistema de RBAC y aislamiento de casinos.
- **Motivo**: Establecer las bases de seguridad multi-tenant para prevenir la escalada de privilegios horizontal y vertical.
- **Impacto**: Se crean archivos en `openspec/jira/` y `openspec/plans/`.
- **Autor/Agente**: Gemini (actuando como Jira Agent & Tech Agent).

### 2026-03-09 02:45

- **Tarea**: [KAN-23] Dashboard Super Admin
- **Tipo de Cambio**: Sincronización y Planificación
- **Descripción**: Obtención de la tarea KAN-23 desde Jira Cloud y generación del Master Plan técnico para el panel global de administración.
- **Motivo**: Definir la infraestructura para métricas globales y gestión multi-tenant de alto nivel.
- **Impacto**: Se crean archivos en `openspec/jira/` y `openspec/plans/`.
- **Autor/Agente**: Gemini (actuando como Jira Agent & Tech Agent).

### 2026-03-09 01:45

- **Tarea**: [KAN-30] Recuperación de Contraseña
- **Tipo de Cambio**: Sincronización y Planificación
- **Descripción**: Obtención de la tarea KAN-30 desde Jira Cloud y generación del Master Plan técnico correspondiente.
- **Motivo**: Iniciar el flujo de trabajo SDD para la funcionalidad de autogestión de credenciales.
- **Impacto**: Se crean archivos en `openspec/jira/` y `openspec/plans/`.
- **Autor/Agente**: Gemini (actuando como Jira Agent & Tech Agent).

### 2026-03-09 01:15

- **Documento Modificado**: `[.trae/agents/sdd-agent.md](../../.trae/agents/sdd-agent.md)`
- **Tipo de Cambio**: Adición
- **Descripción**: Creación del `SDD Agent` como especialista en el protocolo OpenSpec.
- **Motivo**: Separar la responsabilidad de la gestión del ciclo de vida SDD del Orquestador para mejorar la modularidad y el encapsulamiento.
- **Impacto**: Afecta al `Orquestador` (que ahora delega la táctica SDD) y a `AGENTS.md` (que debe registrar al nuevo agente).
- **Autor/Agente**: Gemini (actuando como Change Tracker Agent).
