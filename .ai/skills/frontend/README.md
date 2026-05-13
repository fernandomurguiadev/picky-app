# OpenSpec Skills

Este directorio contiene "skills" o guías de prompts diseñadas para ser utilizadas por agentes de IA (como Trae) para estandarizar la creación de código en el proyecto PickyApp.

## ¿Cómo usar estas Skills?

Estas skills están diseñadas para ser copiadas en tu configuración de Trae (`.trae/skills`) o utilizadas como contexto al solicitar tareas a la IA.

### Skills Disponibles

1.  **Crear Página (`create-page.md`)**: Guía para crear nuevas rutas y páginas en Next.js 15 (App Router) siguiendo las convenciones del proyecto.
2.  **Crear Endpoint (`create-endpoint.md`)**: Guía para crear Route Handlers seguros y tipados en el BFF.
3.  **Crear Componente (`create-component.md`)**: Guía para crear componentes de UI reutilizables con Tailwind y shadcn/ui.
4.  **Crear Hook (`create-hook.md`)**: Guía para crear hooks de TanStack Query (queries y mutations) con polling, invalidation y tipado `DepositError`.
5.  **Crear Formulario (`create-form.md`)**: Guía para crear formularios con React Hook Form + Zod, traducciones, y manejo de errores del backend por código.

## Integración con Trae

Para que estas skills estén disponibles como comandos directos en Trae (ej. `/create-page`), debes mover el contenido o los archivos a la carpeta `.trae/skills` y seguir la estructura de definición de skills de Trae (XML tags).

Aquí, se mantienen como documentación de referencia y templates de prompts.
