# OpenSpec Validate Skill

Habilidad para validar una spec antes de aplicar cambios técnicos.

## 📋 Requisitos Previos
- Acceso al `ContextPacket` con `OpenSpec`.
- Acceso a specs relacionadas en `openspec/specs/`.

## 🚀 Flujo de Ejecución (Paso a Paso)

### Paso 1: Schema Validation
- Validar que `OpenSpec.design` cumpla el schema definido por el sistema.

### Paso 2: Criteria Validation
- Revisar cada elemento de `OpenSpec.acceptanceCriteria`.
- Rechazar criterios ambiguos (ej: "debería", "podría", "en general").

### Paso 3: Conflict Validation
- Verificar que no contradiga specs en `applied` o `archived` listadas en `relatedSpecIds`.

### Paso 4: Resultado
- Si todo pasa, marcar `spec.status` como `validated`.
- Si falla, retornar un error detallado y solicitar volver a `openspec-design`.

## 🧪 Validación de Éxito
- La spec no avanza a `openspec-apply` sin `validated`.

---
*Skill formalizada para el SDD Agent.*
