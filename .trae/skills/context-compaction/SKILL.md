# Context Compaction Skill

Habilidad para mantener la ventana de contexto de la IA limpia y enfocada, resumiendo el estado del proyecto.

## 📋 Requisitos Previos
- Acceso a `openspec/changelog.md`.
- Acceso a `openspec/specs/`.
- Acceso al historial de handshakes.

## 🚀 Flujo de Ejecución (Paso a Paso)

### Paso 1: Recolección de Hitos Recientes
- Leer las últimas 10 entradas del `changelog.md`.
- Identificar los cambios más significativos en la arquitectura o el API.

### Paso 2: Evaluación de "Ruido" en Contexto
- Analizar si existen múltiples archivos de cambios (`openspec/changes/`) que ya han sido archivados pero que aún podrían estar ocupando espacio mental en la sesión.

### Paso 3: Generación del Resumen Ejecutivo
- Crear o actualizar `PROJECT_STATUS.md` en la raíz de `openspec/`.
- **Estructura del resumen**:
  - **Estado Actual**: ¿Qué estamos construyendo ahora mismo?
  - **Hitos Alcanzados**: Últimos 3 grandes cambios integrados.
  - **Deuda Técnica Identificada**: Puntos de fricción o refactorizaciones pendientes.
  - **Próximos Pasos**: Tareas inmediatas en el backlog.

### Paso 4: Compactación de Memoria
- Sugerir al usuario o al sistema el archivo de memorias obsoletas si es necesario.
- Recomendar el cierre de archivos que ya no son relevantes para la tarea actual.

## 🧪 Validación de Éxito
- El archivo `PROJECT_STATUS.md` existe y proporciona una visión clara y rápida del proyecto sin necesidad de leer múltiples documentos históricos.

---
*Skill generada para el Supervisor Agent.*
