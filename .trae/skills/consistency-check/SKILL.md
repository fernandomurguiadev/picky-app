# Consistency Check Skill

Habilidad para validar que un nuevo diseño o plan no entre en conflicto con la Fuente de Verdad (specs) o con cambios activos.

## 📋 Requisitos Previos
- Acceso a `openspec/specs/`.
- Acceso a `openspec/changes/`.

## 🚀 Flujo de Ejecución (Paso a Paso)

### Paso 1: Escaneo de Colisiones
- Comparar los nuevos esquemas de base de datos contra `openspec/specs/data/database.md`.
- Verificar que los nuevos endpoints no dupliquen rutas existentes en `specs/api/`.

### Paso 2: Validación de Reglas de Negocio
- Asegurar que el cambio respeta el aislamiento multi-tenant definido en `project.md`.

### Paso 3: Reporte de Inconsistencias
- Si se detecta un conflicto, bloquear el avance y solicitar al Tech Agent una refactorización del plan.

## 🧪 Validación de Éxito
- No hay solapamiento de responsabilidades entre módulos.
- La Fuente de Verdad se mantiene coherente.

---
*Skill generada para el Supervisor Agent.*
