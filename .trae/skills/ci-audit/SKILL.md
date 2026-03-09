# CI Audit Skill

Habilidad para analizar un conjunto de cambios en el código (`git diff`) y reportar problemas de calidad y consistencia.

## 📋 Requisitos Previos
- Un "delta" de código como entrada (texto plano).
- Acceso de lectura a los archivos de configuración y guías del proyecto (`AGENTS.md`, `WORKSPACE_GUIDE.md`, `openspec/changelog.md`).
- Acceso al `ContextPacket`.

## 🚀 Flujo de Ejecución (Paso a Paso)

### Paso 1: Ingesta del Delta de Código
- Recibir el `diff` como un bloque de texto.
- Parsear el `diff` para identificar los archivos modificados, añadidos y eliminados.

### Paso 2: Análisis de Estilo y Convenciones (Reglas en `.trae/project-config.json`)
- **Para archivos `.ts` de Frontend (según `frontend.framework`):**
  - Verificar los patrones definidos en `frontend.lint_rules.forbidden_patterns`. Si aparecen en cambios nuevos, marcar **Advertencia**.
  - Verificar los patrones definidos en `frontend.lint_rules.preferred_patterns`. Si están ausentes, marcar **Info**.
- **Para archivos `.ts` de Backend (según `backend.framework`):**
  - Si se modifica un DTO, verificar que se use `backend.lint_rules.dto_validation_library`. La ausencia es una **Advertencia**.
  - Revisar si los nuevos endpoints en controladores usan `backend.lint_rules.api_response_envelope_marker`. La ausencia es una **Advertencia**.

### Paso 3: Análisis de Trazabilidad y Documentación
- Si se detectan cambios en `openspec/specs/`, verificar si el archivo `openspec/changelog.md` también ha sido modificado en el mismo delta.
- Si `changelog.md` no fue modificado, marcar una **Advertencia** (Falta de trazabilidad).

### Paso 4: Detección de Código Duplicado (Conceptual)
- Analizar los bloques de código añadidos (líneas que empiezan con `+`).
- Buscar bloques idénticos o muy similares en diferentes archivos del delta.
- Si se encuentra duplicación, marcar una **Info** con la sugerencia de refactorizar a un servicio o función compartida.

### Paso 5: Generación del Reporte
- Consolidar todos los hallazgos en un único archivo de texto.
- Formatear el reporte en Markdown (`CI_AUDIT_REPORT.md`).
- Estructurar el reporte por severidad: Crítico, Advertencia, Info.
- Crear `GateFeedback` si existen hallazgos relevantes y adjuntarlo al `ContextPacket`.

## 🧪 Validación de Éxito
- El `CI_AUDIT_REPORT.md` se genera correctamente.
- El `ContextPacket` incluye `GateFeedback` cuando aplica.

---
*Skill generada para el CI Auditor Agent.*
