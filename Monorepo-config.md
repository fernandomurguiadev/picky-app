# Setup OpenSpec Monorepo Scope Support (Versión Profesional & Abstracta)

> Pegá este prompt completo en cualquier proyecto que use OpenSpec.
> Esta versión garantiza la **abstracción total**: ruteo dinámico basado en configuración y detección de carpetas sin supuestos hardcodeados.

---

## Instrucciones para el AI (Protocolo de Ejecución)

> [!IMPORTANT]
> **REGLA DE ORO**: Tu misión es **AUMENTAR** la funcionalidad de las skills existentes, **NO REEMPLAZARLAS**.
> El soporte de monorepo debe ser DINÁMICO. No asumas nombres de carpetas ni rutas si no están definidos en `config.yaml`.

---

### PASO 1 — Explorar y Detectar Configuración
1. Detectar si el proyecto es Monorepo buscando el bloque `monorepo` en `openspec/config.yaml`.
2. Leer la lista de `projects` disponibles. Cada proyecto debe tener metadatos como `id`, `path`, `label`, y opcionalmente `archive_path`.

---

### PASO 2 — Skill "openspec-propose" (Identificación de Scope)
Actualizar la skill siguiendo este protocolo:

1. **Detección Dinámica**: Leer `config.yaml` para identificar los IDs de proyectos configurados.
2. **Pregunta de Selección**: Si existe más de un proyecto, es OBLIGATORIO preguntar: "¿Para cuál de estos proyectos es el cambio? [<IDs detectados>]".
3. **Persistencia de Metadatos**: Al crear el cambio (`openspec new change`), inyectar el ID seleccionado en el archivo `.openspec.yaml` de la carpeta del cambio como `project_id: <id>`.

---

### PASO 3 — Skill "openspec-archive-change" (Protocolo de Ruteo y Sharding)
Implementar la resolución de la ruta de archivado siguiendo este orden estricto de prioridad:

1. **Análisis de Scope (Sharding)**:
   - Detectar si el cambio es transversal (afecta a múltiples proyectos o tiene `project_id: shared`).
   - **PREGUNTAR obligatoriamente**: "¿Deseas dividir (shard) este cambio en archivos independientes por proyecto o archivarlo como una sola pieza?".
   - Si se elige **Dividir (Shard)**:
     - Filtrar el contenido de `tasks.md` y `design.md` basándose en el campo `focus` y `label` de cada proyecto (ej: "Backend" -> api).
     - Duplicar `proposal.md` en cada destino para mantener el contexto macro.
     - Generar un `.openspec.yaml` específico para cada shard con su `project_id` correspondiente.

2. **Resolución de Ruta (3 Niveles)**:
   - **Nivel 1 (Configuración Explícita)**: Consultar el campo `archive_path` dentro del bloque del proyecto en `config.yaml`. Si existe, usarlo como destino.
   - **Nivel 2 (Inferencia de Carpeta)**: Si no hay `archive_path`, pero existe un `path` para el proyecto, verificar si existe una subcarpeta `openspec/changes/archive` dentro de ese `path`. Si existe, usarla.
   - **Nivel 3 (Consulta al Usuario)**: Si ninguno de los anteriores resuelve una ruta clara, **PREGUNTAR obligatoriamente** al usuario: "¿Dónde querés archivar este cambio?".

---

### PASO 4 — Cláusula de Inmutabilidad Técnica
Prohibido eliminar o simplificar los pasos de:
1. `openspec status --json` para determinar dependencias.
2. `openspec instructions --json` para obtener templates, context y rules.
3. El loop de generación de artefactos basado en el estado del CLI.
La inteligencia de monorepo debe ser **ADITIVA**, nunca sustractiva.

---

### PASO 5 — Persistencia de Reglas (Skill Registry / Project Rules)
Para asegurar que estas reglas se mantengan activas en cualquier entorno (VS Code, Cursor, Windsurf, etc.), es **CRUCIAL** registrarlas como una ley del proyecto.

1. **Si usás Agent Teams Lite (Antigravity)**: Actualizá `.atl/skill-registry.md` agregando estas reglas a la sección `## Compact Rules`. El orquestador las inyectará automáticamente.
2. **Si usás Cursor/Windsurf**: Agregá estas reglas a tu archivo `.cursorrules` o `.windsurfrules`.
3. **Cualquier otro entorno**: Creá un archivo `openspec/project-rules.md` y referencialo en tu System Prompt.

**Beneficio**: Esto garantiza que la IA no "olvide" el protocolo de monorepo tras una compactación de contexto, asegurando que el ruteo y el sharding sean comportamientos por defecto y no ocasionales.

> [!TIP]
> Esta capa de persistencia convierte una "instrucción de chat" en una **convención de proyecto inmutable** que trasciende al modelo o IDE que estés usando.
