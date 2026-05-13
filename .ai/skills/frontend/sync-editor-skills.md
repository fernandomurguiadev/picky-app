# Skill: Sincronizar Skills de Editor

## Descripción

Esta skill permite sincronizar automáticamente los skills definidos en `openspec/skills` hacia los formatos de configuración de agentes de editores específicos (Trae, Cursor, Claude Code).

El objetivo es mantener una única fuente de verdad (`openspec/skills`) y distribuir estas capacidades a cualquier agente que trabaje en el repositorio.

## Prompt Template

Cuando necesites actualizar los skills en los editores, utiliza este contexto:

````markdown
Actúa como un **AI Tooling Expert**.
Tarea: Sincronizar los archivos de skills desde `openspec/skills/*.md` hacia las carpetas de configuración de los editores.

### Fuente de Verdad

- Directorio: `.ai/skills/`
- Archivos: Todos los archivos `.md` (excepto README.md).
- Subdirectorios: `frontend/`, `backend/`, `database/`, `openspec/`, `orchestrator/`.

### Destinos y Formatos

#### 1. Trae IDE

- **Destino**: `.trae/skills/[carpeta-existente-o-nueva]/SKILL.md`
- **Formato**:
  - **Lógica de Carpeta**:
    - Si YA existe una carpeta que coincide (case-insensitive) con el nombre del skill: **USAR esa carpeta intacta**. NO renombrar ni modificar la carpeta.
    - Si NO existe: Crear carpeta nueva con el nombre del archivo (sin extensión).
  - **Contenido**:
    - El archivo `SKILL.md` debe tener un frontmatter XML-style o YAML compatible con Trae, seguido del contenido original.
    - Usar la descripción del skill original para el metadato `description`.

#### 2. Cursor IDE

- **Destino**: `.cursor/rules/[nombre-skill].mdc`
- **Formato**:
  - Copiar el contenido del markdown original.
  - Añadir frontmatter YAML al inicio:
    ```yaml
    ---
    description: "Descripción corta extraída del skill"
    globs: "*.{ts,tsx,js,jsx}"
    ---
    ```

#### 3. Claude Code (Generic/Anthropic)

- **Destino**: `.claude/rules/[nombre-skill].md` (si existe la carpeta .claude)
- **Formato**: Markdown estándar.

### Procedimiento

1.  Leer todos los archivos `.md` en `openspec/skills`.
2.  Para cada archivo:
    a. Extraer el nombre (basename).
    b. Extraer la descripción (primer párrafo o sección "Descripción").
    c. **Sincronización Trae (.trae/skills/):**
    - Buscar si ya existe una carpeta con ese nombre (ignorando mayúsculas/minúsculas).
    - **Si existe**: Usar esa carpeta tal cual. Generar/Sobreescribir `SKILL.md` dentro.
    - **Si NO existe**: Crear carpeta nueva y generar `SKILL.md`.
      d. **Sincronización Cursor (.cursor/rules/):**
    - Generar/Sobreescribir el archivo `.mdc`.
3.  Confirmar qué skills se han sincronizado (indicando cuáles eran nuevos y cuáles se actualizaron).

### Reglas de Ejecución CRÍTICAS

- **Verificación de Existencia**: Antes de generar archivos para un editor, VERIFICA que la carpeta de configuración raíz exista (`.trae`, `.cursor`, `.claude`).
- **NO CREAR CARPETAS RAÍZ**: Si la carpeta raíz de configuración (ej. `.cursor`) NO existe, OMITIR la sincronización para ese editor. NO la crees.
- **RESPETAR CARPETAS EXISTENTES**: En Trae, si la carpeta del skill ya existe (ej. `myskill` vs `MySkill`), NO la renombres. Usa la existente.
- Solo si la carpeta raíz existe, entonces sí puedes crear subdirectorios necesarios para nuevos skills.
- No borres skills manuales que ya existan en los destinos.
````
