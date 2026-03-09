# Implementation Audit Skill

Habilidad para auditar la implementación técnica y verificar su paridad con los documentos de diseño y requisitos.

## 📋 Requisitos Previos
- Acceso a los artefactos del cambio (`proposal.md`, `design.md`, `tasks.md`).
- Acceso al código fuente modificado en el cambio.
- Acceso al `ContextPacket`.

## 🚀 Flujo de Ejecución (Paso a Paso)

### Paso 1: Lectura de la Fuente de Verdad del Cambio
- Leer el `proposal.md` para extraer los Criterios de Aceptación.
- Leer el `design.md` para entender la arquitectura y componentes que debían crearse.

### Paso 2: Escaneo de Implementación
- Listar los archivos modificados o creados (usando el historial del cambio o un delta).
- Leer el contenido de los archivos implementados.

### Paso 3: Mapeo Diseño vs. Realidad
- **Verificación de Estructura**: ¿Se crearon los componentes/servicios definidos en el diseño?
- **Verificación de Lógica**: ¿Los métodos y flujos descritos en el diseño están presentes en el código?
- **Verificación de Criterios**: ¿Se cumple cada criterio de aceptación del `proposal.md`?

### Paso 4: Detección de "Scope Creep" o "Under-implementation"
- Identificar funcionalidades implementadas que no estaban en el diseño (Scope Creep).
- Identificar funcionalidades del diseño que no se implementaron (Under-implementation).

### Paso 5: Generación del Reporte de QA
- Crear `QA_VERIFICATION_REPORT.md`.
- Listar cada criterio de aceptación con estado: `PASSED`, `FAILED` o `PARTIAL`.
- Adjuntar comentarios técnicos sobre discrepancias encontradas.
- Crear `GateFeedback` si hay criterios `FAILED` o `PARTIAL` y adjuntarlo al `ContextPacket`.

## 🧪 Validación de Éxito
- El reporte de QA vincula directamente líneas de código o archivos con secciones del diseño técnico.
- El `ContextPacket` incluye `GateFeedback` cuando aplica.

---
*Skill generada para el QA / Verification Agent.*
