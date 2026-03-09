---
name: change-tracking
description: Procedural knowledge for tracking and documenting changes in PickyApp OpenSpec/SDD.
license: MIT
metadata:
  author: PickyApp Architect
  version: "1.0.0"
---

# Skill: Relevamiento de Cambios (Change Tracking)

## 1. Visión General
Esta skill habilita al agente para realizar un seguimiento detallado y descriptivo de las modificaciones en las especificaciones (OpenSpec/SDD).

## 2. Capacidades
1. **Identificación de cambios**: Detecta modificaciones en archivos Markdown de la carpeta `specs/`.
2. **Documentación descriptiva**: Genera entradas estructuradas para la bitácora de cambios.
3. **Análisis de impacto**: Identifica cómo un cambio en un spec afecta a otros (ej. cambio en API afecta a UI).
4. **Registro temporal**: Captura la fecha y hora de cada modificación de forma precisa.

## 3. Pasos (Procedural Knowledge)

1. **Analizar la petición de cambio**
   - Identificar qué documento de especificación debe ser modificado.
   - Determinar si el cambio es una Adición, Modificación, Eliminación o Corrección.

2. **Realizar la modificación en el spec**
   - Editar el archivo correspondiente en `openspec/specs/`.
   - Asegurar que el cambio sea consistente con el análisis funcional y técnico.

3. **Generar la entrada en la bitácora**
   - Formatear la entrada según el estándar definido en `change-tracker-agent.md`.
   - Incluir la justificación técnica o funcional (el "por qué").
   - Evaluar el impacto en otros specs o módulos del sistema.

4. **Registrar la fecha y hora**
   - Utilizar el formato YYYY-MM-DD HH:MM para el registro.

## 4. Ejemplo de Registro
- **Fecha y Hora**: 2026-03-08 20:50
- **Documento Modificado**: [architecture.md](../../../openspec/specs/architecture.md)
- **Tipo de Cambio**: Modificación
- **Descripción**: Actualización de la estructura de agentes para usar la carpeta `.trae/`.
- **Motivo**: Alineación con el estándar de Trae IDE y mejora de la capacidad de descubrimiento de agentes y skills.
- **Impacto**: Afecta la organización de la documentación del proyecto y la forma en que los agentes interactúan con el sistema.
- **Autor/Agente**: Router Agent.
