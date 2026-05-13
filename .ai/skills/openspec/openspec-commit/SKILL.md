---
name: openspec-commit
description: Stage, commit, and push only the files modified during an OpenSpec change implementation. Prevents mixing changes from parallel sessions. Use after /opsx:apply.
version: "1.0"
source: openspec/skills/ (versioned, IDE-agnostic)
when: After completing tasks with /opsx:apply, when the user wants to commit only the current session's work
---

# openspec-commit

Stagea, commitea y pushea **solo los archivos modificados en la sesión actual** de un change OpenSpec.

Diseñado para entornos con múltiples instancias o desarrolladores trabajando en paralelo, donde `git add -A` mezclaría cambios de otras sesiones.

---

## Comportamiento esperado

1. **Detecta el repo** — `git rev-parse --show-toplevel`. Si no está en un repo git, prueba `api` y `app` como sibling dirs.
2. **Selecciona el change** — del argumento, del contexto de conversación, o corre `openspec list --json` y pregunta.
3. **Lee el contexto del change** — `openspec instructions apply --change "<name>" --json`, luego lee `tasks.md` (ítems `[x]`) y `proposal.md` para saber qué se implementó.
4. **Identifica archivos a stagear** — Solo archivos que:
   - Están mencionados explícitamente en tareas completadas (`[x]`) por path
   - Pertenecen al módulo/área del proposal
   - Son artefactos OpenSpec del change (`openspec/changes/<name>/tasks.md`)
5. **Nunca stagea** archivos de otras áreas, otras sesiones, ni usa `git add -A` / `git add .`
6. **Ante archivos ambiguos** — los lista y pregunta al usuario antes de incluirlos
7. **Construye el commit message** con tipo/scope del change, bullet points de cambios clave, ticket refs (ej. `LIN-167`)
8. **Commit + push** explícito. Si no hay upstream: `git push -u origin <branch>`
9. **Muestra resumen** con hash, archivos commiteados y archivos omitidos

## Guardrails

- Nunca `git add -A` / `git add .` — siempre paths explícitos
- Nunca stagear archivos de otros changes o sesiones
- Nunca `--no-verify` ni `--amend` (crear commit nuevo siempre)
- Preguntar antes de stagear archivos ambiguos
- Detener y avisar si el push sería a `main`/`master` directamente

---

## Instalación por IDE

### Claude Code (`.claude/`)

Crear el archivo en:
```
.claude/skills/openspec-commit/SKILL.md
```

Contenido del frontmatter:
```yaml
---
name: openspec-commit
description: Stage, commit, and push only the files modified during an OpenSpec change implementation. Works for both api and app. Use when the user wants to commit the work done in the current session for a specific change.
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep
---
```

Luego pegar el cuerpo de este archivo a continuación del frontmatter.

Opcionalmente, crear el comando slash en:
```
.claude/commands/opsx/commit.md
```
(mismo contenido, con frontmatter `name: "OPSX: Commit"` y `category: Workflow`)

> **Nota**: Si `.claude` está en `.gitignore`, cada desarrollador debe crear el archivo localmente.
> Para versionarlo: eliminar `.claude` de `.gitignore` o moverlo a `.claude/skills/` solo si el equipo lo acuerda.

---

### Trae IDE (`.trae/`)

Crear el archivo en:
```
.trae/skills/openspec-commit/SKILL.md
```

Trae usa el mismo formato SKILL.md que Claude Code. El frontmatter puede incluir campos adicionales de Trae:
```yaml
---
name: openspec-commit
description: Stage, commit, and push only the files modified during an OpenSpec change implementation. Use after /opsx:apply.
---
```

Pegar el cuerpo del comportamiento a continuación.

Para sincronización automática desde `openspec/skills/`, usar el skill `sync-editor-skills`.

---

### Cursor IDE (`.cursor/`)

Crear el archivo en:
```
.cursor/rules/openspec-commit.mdc
```

Frontmatter requerido por Cursor:
```yaml
---
description: "Stage, commit, and push only the files from the current OpenSpec session. Use after applying a change."
globs: "openspec/**/*.md, src/**/*.ts"
alwaysApply: false
---
```

Pegar el cuerpo del comportamiento a continuación.

---

### Windsurf / Cascade (`.windsurfrules`)

Agregar al archivo `.windsurfrules` en la raíz del proyecto como una regla con trigger manual:

```markdown
## Rule: openspec-commit

**Trigger**: Cuando el usuario pide hacer commit de un change OpenSpec o menciona `/opsx:commit`

**Behavior**:
[Pegar el cuerpo del comportamiento aquí]
```

---

### Copilot / VS Code Copilot Chat (`.github/`)

Agregar a `.github/copilot-instructions.md`:

```markdown
## Skill: openspec-commit

Cuando el usuario pida hacer commit de un change OpenSpec:
[Pegar el cuerpo del comportamiento aquí]
```

---

### Cualquier AI CLI / API genérica

Usar este archivo como **system prompt** o **contexto de sesión** al iniciar una tarea de commit post-apply. El comportamiento es auto-contenido y no depende de APIs propietarias.

---

## Verificación post-instalación

Después de instalar en tu IDE, verificar que:

1. El skill aparece en la lista de comandos disponibles del IDE
2. Se puede invocar con `/openspec-commit <change-name>` o `/opsx:commit <change-name>`
3. Al correrlo sin argumento, infiere el change del contexto de conversación
4. Nunca hace `git add -A` (verificable con `git status` antes del commit)

---

## Historial de cambios

| Versión | Fecha      | Descripción                        |
|---------|------------|------------------------------------|
| 1.0     | 2026-04-22 | Versión inicial. Claude Code + Trae. |
