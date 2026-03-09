# WORKSPACE_GUIDE.md — Guía del Ecosistema PickyApp

Este documento detalla la función de cada archivo y carpeta que compone el flujo de trabajo de PickyApp (OpenSpec/SDD + Trae AI).

## 📂 Estructura de la Raíz

| Archivo / Carpeta | Función | Responsable |
| :--- | :--- | :--- |
| **[.trae/](.trae/)** | **Motor de Inteligencia**. Contiene las definiciones técnicas de los agentes y sus habilidades (skills). | Router + Supervisor |
| **[openspec/](openspec/)** | **Cerebro Metodológico**. Almacena toda la documentación viva del proyecto bajo la metodología SDD. | Orquestador |
| **[AGENTS.md](AGENTS.md)** | **Manual de Operaciones para IA**. El primer archivo que lee cualquier agente para saber cómo trabajar. | Router + Supervisor |
| **[WORKSPACE_GUIDE.md](WORKSPACE_GUIDE.md)** | **Este documento**. Mapa de referencia para humanos y agentes sobre la estructura del repositorio. | Router + Supervisor |
| **[.env](.env)** | **Configuración Sensible**. Variables de entorno para Jira, base de datos y servicios externos. | Humano / Jira Agent |

---

## 📂 Detalle de Carpeta: [.trae/](.trae/)
El corazón de la automatización en el IDE.
- **[agents/](.trae/agents/)**: Archivos `.md` que definen la "personalidad" y reglas de cada agente.
- **[AGENT_ROADMAP.md](.trae/agents/AGENT_ROADMAP.md)**: Roadmap de evolución y puntos de mejora del sistema de agentes.
- **[HANDSHAKE_PROTOCOL.md](.trae/agents/HANDSHAKE_PROTOCOL.md)**: Define los contratos de comunicación y el Context Packet entre agentes.
- **[skills/](.trae/skills/)**: Conocimiento procedimental. Pasos exactos que un agente debe seguir para una tarea.

---

## Fuente de verdad de skills

Las skills del sistema viven en: `.trae/`
El otro directorio es: legacy

Si una skill aparece en ambos directorios, la versión en `.trae/` tiene precedencia. Toda otra versión debe ser eliminada o marcada deprecated.

Decisión tomada el 2026-03-09 por Equipo de Arquitectura.

---

## 📂 Detalle de Carpeta: [openspec/](openspec/)
Donde vive el diseño del sistema.
- **[specs/](openspec/specs/)**: **Fuente de Verdad**. Documentos inmutables (Arquitectura, API, Datos) que describen el estado actual del sistema.
- **[changelog.md](openspec/changelog.md)**: Bitácora inmutable de todos los cambios arquitectónicos y de especificación.
- **[changes/](openspec/changes/)**: **Espacio de Trabajo**. Cada feature nueva crea una subcarpeta aquí con su propuesta y tareas.
- **[jira/](openspec/jira/)**: **Requerimientos de Negocio**. Copias locales de las historias de usuario sincronizadas desde la nube.
- **[plans/](openspec/plans/)**: **Diseño Técnico**. Master Plans generados por el Tech Agent antes de escribir una sola línea de código.
- **[handover-log.md](openspec/handover-log.md)**: Registro oficial de traspasos y flujo de trabajo entre agentes.
- **[config.yaml](openspec/config.yaml)**: Configuración técnica para la herramienta CLI de OpenSpec.

---

## Decisión: openspec-sync-specs

Se adopta **Opción A**: existe la skill `openspec-sync-specs` para verificación de conflictos contra specs aplicadas/archivadas. Esta verificación se ejecuta antes de archivar cambios.

---

## 🔄 Flujo de Trabajo Resumido

1.  **Sincronización**: El **Jira Reader Agent** trae la tarea a `openspec/jira/`.
2.  **Planificación**: El **Tech Agent** diseña la solución en `openspec/plans/`.
3.  **Registro**: El **Change Tracker Agent** documenta eventos en la bitácora.
4.  **Ejecución**: El **SDD Agent** sigue propose → design → validate → apply → archive.
5.  **Supervisión**: El **Supervisor Agent** maneja errores y gates de calidad.

---
*Este flujo garantiza que el código sea consecuencia directa del diseño, y no al revés.*
