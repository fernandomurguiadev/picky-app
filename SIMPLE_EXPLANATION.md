# Explicación Simple del Sistema OpenSpec
**Como si se lo explicaras a un desarrollador nuevo**

---

## B1 — ¿Qué es esto en una oración?

Este sistema toma tu descripción de un cambio de software y te devuelve automáticamente una **especificación completa y verificada** que puedes entregarle a cualquier desarrollador del equipo para que implemente, asegurando que sea **segura, testeable y coherente** con el resto del proyecto.

---

## B2 — El Problema que Resuelve

**Antes (sin este sistema):**
- Los desarrolladores recibían una descripción vaga de Jira: "agregar login"
- Cada uno interpretaba diferente: ¿JWT o sesiones? ¿2FA? ¿Rate limiting?
- Se hacía código, se revisaba, "pero eso no es lo que pediste"
- Vuelta a diseñar. Pérdida de tiempo y dinero.
- Los cambios a menudo eran inseguros (SQL injection, CORS mal configurado)
- Nadie sabía bien por qué se decidió hacerlo así

**Ahora (con este sistema):**
- Escribes "agregar login con 2FA, Redis y email recovery"
- El sistema genera un **contrato técnico completo**: qué endpoints, qué campos, qué seguridad
- Un revisor de seguridad verifica "¿hay riesgo de token leak?" Automáticamente.
- Un revisor de calidad verifica "¿se puede probar esto?" Automáticamente.
- El desarrollador implementa exactamente eso, sin sorpresas
- Tiempo desde requisito hasta código: mucho más predecible

---

## B3 — Cómo Funciona (Flujo Visual)

```
Tu solicitud en Jira ("Agregar validación de email duplicado")
                ↓
         [ENRUTADOR]
    ¿Tarea simple o compleja?
         ↓
    (simple) ↙        ↘ (compleja)
         ↓              ↓
    [PLANIFICADOR SIMPLE]  [PLANIFICADOR COMPLETO]
    (solo SDD)          (Jira + Arquitectura + SDD)
         ↓              ↓
    [DISEÑADOR ESPECIALISTA]
    (propone estructura)
         ↓
    [VALIDADOR DE ESTRUCTURA]
    (verifica que sea lógico)
         ↓
    [REVISOR DE SEGURIDAD] ← ¿Hay auth/encryption?
    ¿Hay riesgos de seguridad?
         ↓
    [REVISOR DE CALIDAD]
    ¿Se puede probar esto?
         ↓
    [GENERADOR DE TAREAS]
    Aquí están los pasos para implementar
         ↓
    [HISTORIADOR]
    Registra qué se cambió y por qué
         ↓
    Resultado: Especificación lista para desarrollar
```

---

## B4 — Los Dos Niveles de Uso

### Nivel Básico (Automático para Tareas Simples)

**Cuándo lo usas:**
- Agregar un campo a una tabla
- Crear un endpoint de lectura
- Actualizar validación de formulario
- Cambios pequeños sin impacto de seguridad

**Qué incluye:**
- Diseñador especialista (propone cómo hacerlo)
- Validador de estructura (verifica lógica)
- Revisor de calidad (verifica que sea testeable)
- **NO incluye:** Revisor de seguridad, planeador técnico extenso

**Cuánto tarda:** ~6 segundos
**Qué obtenés:** Especificación de 2-3 páginas, lista para codificar

**Ejemplo:**
```
Input: "Agregar campo 'nickname' al usuario. Max 30 caracteres.
         Exponerlo en GET /users/:id y PATCH /users/:id"

Output:
  - Cambios a la base de datos (SQL migration)
  - Cambios al API (qué campos retorn GET/PATCH)
  - Validaciones (qué hace si nickname > 30 caracteres)
  - Tests a escribir (que nickname solo acepte 30 chars)
  - 5 tareas atómicas para el desarrollador
```

---

### Nivel Completo (Para Tareas Complejas)

**Cuándo lo usas:**
- Autenticación (login, 2FA, magic links)
- Cambios de seguridad (rate limiting, CORS, encryption)
- Refactoring grande (cambiar cómo funciona un área entera)
- Integración con servicio externo (Stripe, AWS, etc.)
- Migración de base de datos

**Qué agrega respecto al básico:**
- Lector de requisitos: va a Jira, trae contexto de epics relacionados
- Planeador técnico: diseña la arquitectura (cuántas capas, qué bases de datos, etc)
- Revisor de seguridad: busca activamente vulnerabilidades OWASP
- Todo es más riguroso

**Cuánto tarda:** ~16 segundos
**Qué obtenés:** Especificación de 8-15 páginas con arquitectura completa

**Ejemplo:**
```
Input: "Implementar login por magic link. Email único, token de 15 min,
         sin passwords. Persistir sesiones en Redis."

Output:
  - Arquitectura email: async job queue o synchronous?
  - Tokens: Redis key format, expiration strategy
  - Rate limiting: máx 5 intentos/min por IP
  - Seguridad: cómo se genera el token (crypto)
  - Testing: 200+ test cases para cobertura
  - 25 tareas atómicas, priorización clara
  - Nota de seguridad: "Cuidado con race conditions en Redis"
```

---

## B5 — Las 3 Garantías del Sistema

### 1. **La Especificación es Coherente**
El sistema verifica que:
- No haya contradicciones lógicas en el diseño
- Todos los campos que promete estén presentes
- El flujo sea completable (no faltan pasos)

Si algo no es coherente, el sistema lo devuelve y dice "arreglá esto en la propuesta original".

### 2. **La Seguridad fue Revisada**
Para tareas con palabras clave de seguridad (login, "auth", token, password):
- Un revisor especializado verifica manualmente: ¿hay riesgo de token leak? ¿CORS está bien? ¿Input validation?
- Si hay riesgo ALTO, bloquea el cambio hasta que se arregle

### 3. **Se Puede Probar Completamente**
El revisor de calidad verifica que:
- Cada feature tiene criterio de aceptación mensurable ("debe retornar 200")
- No hay "lo testearemos después" nebuloso
- Hay casos de error documentados (¿qué pasa si email existe?)

---

## B6 — Lo que el Sistema NO Hace

### 1. **No Escribe el Código**
El sistema **especifica** qué código escribir, pero **no lo escribe**. Un desarrollador debe implementarlo. Si el código se desvía de la especificación, eso es un problema del desarrollador, no del sistema.

**Por qué:** Alguien tiene que entender el código escrito. El sistema no puede garantizar que sea legible o mantenible. Solo que cumpla el contrato.

### 2. **No Hace Decisiones de UI/UX**
El sistema diseña **qué datos y lógica**, pero no **cómo se ve en pantalla**. Si dices "agregar campo nickname", el sistema sabe qué validación poner, pero no sabe si debe ser un textbox o un modal.

**Por qué:** UI/UX es un arte. No es lógico. El sistema está optimizado para lógica.

### 3. **No Maneja Errores Finales del Desarrollador**
Si el desarrollador:
- Agrega SQL injection (aunque el spec no lo pida)
- Comete un error de implementación
- Copia código de Stack Overflow sin revisar

El sistema no lo va a atrapar. Solo verifica el diseño, no el código final.

**Por qué:** Necesitamos revisores de código humanos. El sistema aporta rigor a la especificación, no a la implementación.

---

## B7 — Cómo Empezar a Usarlo

### Primer uso: 4 pasos

**Paso 1: Escribe tu requisito**
```
"Agregar campo 'phone' al usuario.
 Formato internacional.
 Exponerlo en GET /users/:id y permitir editarlo en PATCH /users/:id."
```

**Paso 2: El sistema decide automáticamente**
- El sistema lee: 140 caracteres, 2 endpoints, sin keywords de seguridad
- Decisión: "Tarea simple → NIVEL BÁSICO"

**Paso 3: Espera ~6 segundos**
- El diseñador genera: tabla SQL, API contract, validaciones
- El validador revisa: ¿tiene sentido? ✓
- El revisor de calidad revisa: ¿se puede probar? ✓
- El historiador registra: "KAN-5000 agregado el 2026-03-09"

**Paso 4: Recibes una especificación**
```
# Especificación: Agregar campo phone a Usuario

## Cambios a Base de Datos
- ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL
- Agregar índice: CREATE INDEX idx_users_phone ON users(phone)

## API Changes
GET /users/:id → incluye "phone" en la respuesta
PATCH /users/:id → acepta "phone" en el body

## Validación
- Format: +[país][número]
- Máximo 15 dígitos
- Si no es válido, retornar 400 con "Invalid phone format"

## Tests a Escribir
1. POST /users con phone válido → 201
2. POST /users con phone inválido → 400
3. GET /users/:id retorna phone
4. PATCH /users/:id actualiza phone

## Tareas para el desarrollador
1. Escribir migration SQL
2. Actualizar schema TypeORM
3. Actualizar DTO update-user
4. Agregar validación @IsPhoneNumber()
5. Escribir 4 tests
```

Tomas eso, lo implementas tal cual, y listo.

---

## B8 — Glosario Mínimo

### **OpenSpec**
Metodología que dice: "primero escribimos qué va a hacer el código (especificación), luego escribimos el código". El sistema automatiza la parte de "escribir la especificación".

### **Spec (o Especificación)**
Un contrato que dice exactamente:
- Qué cambios hace (qué tablas, qué API)
- Cómo se comporta (qué valida, qué retorna)
- Cuándo está "hecho" (qué tests deben pasar)

### **Gate (Puerta)**
Un filtro de calidad. Ejemplo: "la puerta de seguridad" pregunta "¿hay vulnerabilidades?" antes de permitir que el cambio continúe.

### **Modo LITE / Modo FULL**
- **LITE:** Para tareas simples (sin seguridad = rápido, ~6 segundos, 8,000 tokens)
- **FULL:** Para tareas complejas (con seguridad = riguroso, ~16 segundos, 25,000 tokens)

El sistema elige automáticamente basado en tu requisito.

### **ContextPacket**
El "documento de estado" que se pasa de un revisor al siguiente. Cada revisor lee el ContextPacket, agrega su análisis, y lo pasa al siguiente. Es como un combo que va acumulando feedback.

---

## Resumen en Viñetas

```
✓ Tomas un requisito vago de Jira
✓ El sistema lo convierte en un contrato técnico detallado
✓ 2-3 revisores automáticos verifican seguridad y testabilidad
✓ Recibís especificación lista para codificar
✓ Desarrollador implementa exactamente eso
✓ Menos sorpresas, más predictibilidad, mejor calidad

Cuándo esperar cada modo:
  - Tareas pequeñas (1-2 campos, sin seguridad): LITE ~6s
  - Tareas grandes (auth, refactor, arquitectura): FULL ~16s
```

---

## Cómo Contar a un Stakeholder (no-técnico)

"Imagina que cada cambio es un acuerdo entre el equipo. Antes, el acuerdo era vago: 'agrega login'. El desarrollador adivinaba qué significaba. Ahora, un sistema de IA genera un contrato específico: '2FA, Redis, rate limiting, estos 25 pasos exactos'. El desarrollador sabe qué hacer. El gerente sabe cuánto va a costar. El revisor de seguridad verifica riesgos automáticamente. Menos renegociación, menos deuda técnica, más velocidad."

---

*Sistema listo para que lo use el equipo. Explicación simple completa.*
