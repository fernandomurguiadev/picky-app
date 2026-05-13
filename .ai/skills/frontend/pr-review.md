---
name: pr-review
description: Review de Pull Request comparando con develop/main, verificando cumplimiento de specs y sin regressions. Invoke cuando el usuario pide review de PR o cambios de compañero.
---

# Skill: PR Review Workflow

## Descripción

Este skill guía la revisión estructurada de Pull Requests comparando la rama actual con develop/main, verificando que el código cumpla con las specs archivadas y no rompa otras partes del proyecto.

## Restricciones

- Responder siempre en español.
- NO modificar archivos directamente.
- Verificar todo contra las specs y reglas del proyecto antes de sugerir.

## Pasos de Ejecución

### 1. Obtener Información de Rama

1. **Identificar rama base**: Preguntar al usuario si es `develop` o `main` (o especificar).
2. **Obtener lista de archivos cambiados**:
```bash
git diff --name-only <rama-base>...HEAD
```
3. **Obtener diff resumido**:
```bash
git diff <rama-base>...HEAD --stat
```

### 2. Identificar Changes Relacionados

1. **Leer archivos en `openspec/changes/`** para identificar cuáles changes están relacionados con los archivos modificados.
2. **Para cada archivo cambiado**, verificar si existe un change asociado.
3. **Si hay change asociado**: cargar el tasks.md y verificar que las tareas cumplidas correspondan a los cambios.

### 3. Review por Archivo

Para cada archivo modificado:
1. **Invocar `@code-reviewer`** para análisis detallado de ese archivo.
2. **Verificar impacto en otros archivos** - buscar usages del código modificado.
3. **Verificar que no rompa patterns existentes**.

### 4. Checklist de Compliance

- [ ] **Specs compliance**: Los cambios cumplen con lo definido en `openspec/changes/`
- [ ] **Arquitectura**: Respeta la estructura de `src/` y patrones definidos en `openspec/specs/architecture.md`
- [ ] **UI/UX standards**: Cumple con `openspec/specs/ui-ux-standards.md`
- [ ] **No Breaking Changes**: imports/exports/API contracts no rompidos
- [ ] **Tests**: Archivos de test actualizados si corresponde
- [ ] **Lint passes**: `npm run lint` no falla

### 5. Output Estructurado

Generar el reporte de PR Review siguiendo el formato de Issues Críticos, Menores y Comentarios Positivos.

---
*Veredicto: Aprobado / Cambios requeridos / Bloqueado*
