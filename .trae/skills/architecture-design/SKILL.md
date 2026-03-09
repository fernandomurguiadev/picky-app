# Architecture Design Skill

Habilidad para proponer cambios en la estructura central del sistema sin comprometer los principios de diseño (SOLID, DRY, Multi-tenancy).

## 📋 Requisitos Previos
- Acceso a `openspec/specs/architecture.md`.
- Validación de impacto funcional.

## 🚀 Flujo de Ejecución (Paso a Paso)

### Paso 1: Evaluación de Consistencia
- Verificar que el cambio no rompa el aislamiento definido en `backend.multi_tenancy_field`.
- Asegurar que se respeten los estándares definidos en `frontend.conventions`.

### Paso 2: Actualización de Specs
- Modificar los archivos en `openspec/specs/` correspondientes.
- Notificar al Change Tracker para documentar la evolución arquitectónica.

## 🧪 Validación de Éxito
- No hay conflictos de integración detectados por el Supervisor.
- Los diagramas o esquemas de datos son coherentes con el código existente.

---
*Skill formalizada para el Tech Agent.*
