# OpenSpec Skills — PickyApp API

Este directorio contiene las **definiciones IDE-agnósticas** de todas las skills disponibles en el proyecto.
Cada archivo `.md` es la fuente de verdad: incluye el comportamiento de la skill y las instrucciones de instalación para cada entorno de IA.

## ¿Por qué está aquí y no en `.claude/` o `.trae/`?

Los directorios `.claude/` y `.trae/` están en `.gitignore` — sus archivos son locales a cada máquina.
`openspec/skills/` está **versionado en git**: cualquier desarrollador que clone el repo puede ver las skills disponibles e instalarlas en su IDE.

## Cómo instalar una skill en tu IDE

1. Abrir el `.md` de la skill
2. Ir a la sección **"Instalación por IDE"** y seguir las instrucciones de tu entorno
3. Verificar que el comando aparece en tu IDE
4. Para sincronización masiva (Trae + Cursor): usar `/sync-editor-skills` si está disponible

---

## Skills Disponibles

### Workflow OpenSpec

| Skill | Invoke | Descripción |
|-------|--------|-------------|
| `openspec-commit.md` | `/opsx:commit` | Commitea **solo** los archivos de la sesión actual después de `/opsx:apply`. Evita mezclar cambios de sesiones paralelas. |
| `openspec-archive-change.md` | `/opsx:archive` | Archiva un change completado. Opcional: postea evidencia a Jira. |
| `openspec-propose.md` | `/opsx:propose` | Crea un nuevo change con todos los artefactos en un paso. |

### Patrones de Código

| Skill | Invoke | Descripción |
|-------|--------|-------------|
| `dto-patterns/SKILL.md` | referencia | Patrones para crear DTOs: `@ApiProperty`, `class-validator`, `class-transformer` y reglas financieras. |
| `code-review/SKILL.md` | `/backend:review` | Code review exhaustivo: arquitectura hexagonal, DTOs, auth, RLS, errores, tests y performance. |

### Instalación rápida por IDE

| IDE | Destino del archivo SKILL.md |
|-----|------------------------------|
| **Claude Code** | `.claude/skills/<nombre>/SKILL.md` |
| **Trae** | `.trae/skills/<nombre>/SKILL.md` |
| **Cursor** | `.cursor/rules/<nombre>.mdc` |
| **Windsurf** | `.windsurfrules` (como sección) |
| **Copilot** | `.github/copilot-instructions.md` (como sección) |
| **Genérico** | Usar como system prompt / contexto de sesión |

Ver cada `.md` para el formato exacto y frontmatter requerido por cada IDE.
