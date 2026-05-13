---
name: openspec-archive-change
description: Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.1"
  generatedBy: "1.3.0"
---

Archive a completed change in the experimental workflow.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Assess delta spec sync state**

   Check for delta specs at `openspec/changes/<name>/specs/`. If none exist, proceed without sync prompt.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke openspec-sync-specs for change '<name>'. Delta spec analysis: <include the analyzed delta spec summary>"). Proceed to archive regardless of choice.

4.1 **Resolución Dinámica de Ruta (Monorepo Routing)**

   Determinar el destino del archivado de forma automática con soporte multi-proyecto:

   1. **Identificación**: Lee el `.openspec.yaml` del cambio para obtener el `project_id`.

   2. **Normalización a array**: El `project_id` puede llegar en tres formatos; normalizarlo siempre a lista:
      - String único → `["api"]`
      - String espacio-separado (legacy) → `"api app"` → `["api", "app"]`
      - Array YAML → `["api", "app"]`

      **Nota sobre IDs legacy**: Si el valor contiene rutas completas como `api` o `app`, mapear al ID corto (`api`, `app`) antes de consultar `config.yaml`. La tabla de mapeo es: `api` → `api`, `app` → `app`.

   3. **Resolución de rutas**: Para cada `project_id` en la lista:
      - Consultar `archive_path` de ese proyecto en `openspec/config.yaml`.
      - Fallback: si no existe configuración para ese ID, usar `openspec/changes/archive` y emitir advertencia visible al usuario.

   4. **Deduplicación de prefijo de fecha**: Si el nombre del cambio ya empieza con el patrón `YYYY-MM-DD-`, NO anteponer otra fecha. Usar el nombre tal cual como target folder name.

   *Variable de destino*: `<resolved_archive_paths>` (lista de una o más rutas absolutas o relativas a la raíz del monorepo).

5. **Perform the archive**

   Generate target name: `YYYY-MM-DD-<change-name>` (aplicando deduplicación del paso 4.1.4).

   **Check if any target already exists:**
   - Si algún destino ya existe: Fail con error, sugerir renombrar el archivo existente o usar fecha diferente.

   **Single-project** (lista con un solo destino):

   ```bash
   mkdir -p <resolved_archive_path>
   mv openspec/changes/<name> <resolved_archive_path>/YYYY-MM-DD-<name>
   ```

   **Multi-project** (lista con dos o más destinos):

   Usar **copia seguida de eliminación** (no `mv` directo) para garantizar que todos los destinos se archiven antes de eliminar la fuente:

   ```bash
   # Repetir para cada destino en resolved_archive_paths:
   mkdir -p <archive_path_N>
   cp -r openspec/changes/<name> <archive_path_N>/YYYY-MM-DD-<name>
   ```

   - Si **todas** las copias tienen éxito → eliminar la carpeta activa original:
     ```bash
     rm -rf openspec/changes/<name>
     ```
   - Si **alguna copia falla** → NO eliminar la carpeta activa. Reportar al usuario qué destinos se copiaron exitosamente y cuál falló. El usuario debe resolver el destino fallido antes de reintentar.

   **Nota de coordinación con ContextPacket**: Si el proyecto usa `.ai/scripts/packet-manager.js` para gestionar el ContextPacket, notificar al usuario que el estado del cambio debe actualizarse a `archived` en el packet correspondiente (solo el router-agent modifica campos CONTROL del packet).

6. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location(s) — listar todos los destinos si es multi-proyecto
   - Whether specs were synced (if applicable)
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:**
  - <archive_path_1>/YYYY-MM-DD-<name>/
  - <archive_path_2>/YYYY-MM-DD-<name>/   ← solo si multi-proyecto
**Specs:** ✓ Synced to main specs (or "No delta specs" or "Sync skipped")

All artifacts complete. All tasks complete.
```

**Guardrails**
- Always prompt for change selection if not provided
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, use openspec-sync-specs approach (agent-driven)
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
- Multi-project: never remove the source folder unless ALL copies succeeded
- Multi-project: normalize legacy space-separated project_id strings before resolving paths
