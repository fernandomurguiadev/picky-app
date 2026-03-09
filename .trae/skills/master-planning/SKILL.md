# Master Planning Skill

Esta skill permite transformar un requerimiento de negocio (Jira) en una estrategia técnica ejecutable (Master Plan).

## 📋 Requisitos Previos
- Tener el archivo del requerimiento en `openspec/jira/`.
- Comprensión de la arquitectura multi-tenant de PickyApp.

## 🚀 Flujo de Ejecución (Paso a Paso)

### Paso 1: Análisis de Impacto
- Identificar qué módulos de Backend y Frontend serán afectados según `.trae/project-config.json`.
- Evaluar cambios necesarios en el esquema de base de datos.

### Paso 2: Creación del Master Plan
- Crear un archivo `openspec/plans/KAN-XXX-plan.md`.
- Incluir secciones: Resumen Técnico, Diseño de la Solución (DB/API), Plan de Ejecución por Fases y Protocolo de Validación.

## 🧪 Validación de Éxito
- El archivo del plan existe y es aprobado por el Supervisor.
- Las dependencias técnicas están claramente identificadas.

---
*Skill formalizada para el Tech Agent.*
