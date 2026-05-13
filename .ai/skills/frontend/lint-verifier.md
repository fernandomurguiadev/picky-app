---
name: lint-verifier
description: Ejecuta ESLint sobre archivos o directorios y analiza los errores para proponer correcciones automáticas o manuales siguiendo los estándares de PickyApp.
mode: subagent
tools:
  write: true
  edit: true
  bash: true
---

# Skill: Lint Verifier Workflow

## Descripción
Esta skill automatiza la verificación de calidad de código usando ESLint y asegura que las reglas de estilo y arquitectura de PickyApp se cumplan antes de dar por finalizada una tarea.

## Pasos de Ejecución

### 1. Ejecución de Lint
Correr el comando sobre el archivo o carpeta específica:
```bash
npm run lint -- <path_al_archivo>
```

### 2. Análisis de Resultados
- **Errores de Estilo**: Si hay errores que ESLint puede arreglar solo, sugerir ejecutar:
  ```bash
  npm run lint -- --fix <path_al_archivo>
  ```
- **Errores de Arquitectura**: Identificar issues como:
  - Uso de `any` (reemplazar por interfaces).
  - Imports no utilizados.
  - Violaciones de reglas de React Hooks.
  - Uso de patrones no permitidos en PickyApp (ej: localStorage en lugar de cookies).

### 3. Reporte y Acción
- Si los errores son simples, el agente debe aplicar el `--fix`.
- Si los errores requieren refactor, el agente debe presentarlos usando el formato de `code-reviewer` (:red_circle: Issues Críticos).

## Restricciones
- No ignorar errores con `eslint-disable` a menos que sea estrictamente necesario y justificado.
- Priorizar siempre la corrección del tipo (`any` -> `interface`) sobre el bypass del linter.

---
*Garante de la limpieza del código en el frontend.*
