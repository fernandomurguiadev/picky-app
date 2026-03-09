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

## 📉 Deuda Técnica Documentada

Las siguientes decisiones de diseño se han tomado conscientemente para simplificar la implementación actual, pero representan límites conocidos que deben abordarse al escalar:

1.  **Lock de Archivo Local**: El mecanismo de concurrencia usa `.contextpacket.lock`, que es local al proceso. No funcionará en despliegues distribuidos o multi-nodo.
2.  **Polling Router ↔ Supervisor**: El Router usa polling con backoff para detectar recuperación. En escenarios de alta concurrencia, esto debe reemplazarse por un sistema de eventos (Pub/Sub).

---

## 🎯 Modos de Ejecución

El sistema ejecuta en dos modos con diferente complexidad y costo de tokens.
La selección es automática basada en heurística de strings (sin LLM).

### MODO LITE (Default)

**Cuándo se activa:**
- proposal.length ≤ 500 caracteres
- proposal menciona ≤ 2 componentes del sistema
- proposal NO contiene keywords: auth, security, permission, crypto, token, migration, refactor, architecture, oauth, jwt, encrypt, role, credential, certificate, sensitive, private, password
- NO hay Epic de Jira asociado
- team_config.alwaysFull ≠ true

**Pipeline:**
```
Router → SDD Agent → [Security Auditor CONDICIONAL] → QA Agent → [Change Tracker CONDICIONAL]
```

**Agentes activos:**
| Agente | Skills | Condición |
|--------|--------|-----------|
| Router | agent-factory, skill-factory | siempre |
| Jira Reader | - | ❌ DESACTIVADO |
| Tech Agent | - | ❌ DESACTIVADO |
| SDD Agent | propose, design, validate, apply, archive | ✅ siempre |
| Security Auditor | security-audit | ⚠️ si proposal contiene keyword seguridad |
| QA Agent | implementation-audit | ✅ siempre |
| Change Tracker | change-tracking, changelog-management | ⚠️ config-dependent |

**Tokens estimados:**
- Tarea pequeña: 8,000 - 10,000 tokens
- Tarea mediana: 10,000 - 13,000 tokens

**Cuándo es apropiado:**
- Agregar campo a modelo
- Crear endpoint CRUD simple
- Actualizar validación de DTO
- Cambios de UI acotados
- Bug fixes sin cross-sistem impact

---

### MODO FULL

**Cuándo se activa:**
- proposal.length > 500 caracteres, O
- proposal menciona > 2 componentes, O
- proposal contiene keyword de seguridad/arquitectura, O
- Hay Epic de Jira asociado, O
- team_config.alwaysFull = true

**Pipeline:**
```
Router → Jira Reader → Tech Agent → SDD Agent → Security Auditor → QA Agent → Change Tracker
```

**Agentes activos:**
| Agente | Skills | Condición |
|--------|--------|-----------|
| Router | agent-factory, skill-factory | siempre |
| Jira Reader | requirement-sync | ✅ siempre |
| Tech Agent | architecture-design, technical-slicing, master-planning | ✅ siempre |
| SDD Agent | propose, design, validate, apply, archive | ✅ siempre |
| Security Auditor | security-audit | ✅ siempre |
| QA Agent | implementation-audit | ✅ siempre |
| Change Tracker | change-tracking, changelog-management | ✅ siempre |

**Tokens estimados:**
- Tarea mediana compleja: 16,000 - 20,000 tokens
- Tarea grande: 22,000 - 35,000 tokens

**Cuándo es apropiado:**
- Implementar autenticación/autorización
- Migración de base de datos
- Refactor de componente crítico
- Integración con servicio externo
- Cambios de arquitectura multi-componente
- Rate limiting, caching, seguridad de datos

---

### Overhead: FULL vs LITE

| Dimensión | LITE | FULL | Diferencia |
|-----------|------|------|-----------|
| Agentes | 3-4 | 7 | +75% |
| Skills | 6-7 | 12-14 | +85% |
| Contexto Jira | ❌ | ✅ | +1,850 tok |
| Diseño técnico | ❌ | ✅ Tech Agent | +3,370 tok |
| Gates condicionales | ⚠️ | ✅ | +1,870 tok |
| Tokens total promedio | 9,500 | 18,000 | +89% |
| Tiempo estimado | 8-12s | 15-25s | +100% |

**Decisión de modo es DETERMINÍSTICA basada en heurística de strings:**
```typescript
function selectMode(proposal: string): 'LITE' | 'FULL' {
  const keywords = /auth|security|permission|crypto|token|migration|refactor|architecture/i;
  const components = proposal.split(/[,;]/).length;

  if (proposal.length > 500 || components > 2 || keywords.test(proposal)) {
    return 'FULL';
  }
  return 'LITE'; // default
}
```

No hay "auto-upgrade" a FULL basado en complejidad LLM-detectada.
La decisión ocurre en el Paso 0 del Router SIN llamada LLM adicional.

---

## 🔄 Flujo de Trabajo Resumido

1.  **Sincronización**: El **Jira Reader Agent** trae la tarea a `openspec/jira/`.
2.  **Planificación**: El **Tech Agent** diseña la solución en `openspec/plans/`.
3.  **Registro**: El **Change Tracker Agent** documenta eventos en la bitácora.
4.  **Ejecución**: El **SDD Agent** sigue propose → design → validate → apply → archive.
5.  **Supervisión**: El **Supervisor Agent** maneja errores y gates de calidad.

---
*Este flujo garantiza que el código sea consecuencia directa del diseño, y no al revés.*
