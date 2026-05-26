# Proposed Change: Personalización de Fondo del Catálogo (Presets Premium)

**ID:** `app-store-bg-theming`  
**Autor:** Senior Architect (Antigravity)  
**Estado:** PROPOSED  
**Fecha:** 14 de mayo de 2026

---

## 📖 Contexto y Objetivo

El comercio actual puede personalizar su color primario y de acento, pero el fondo general de la tienda pública está forzado a blanco puro (`#FFFFFF`). El usuario solicita la capacidad de elegir el fondo del catálogo digital para adaptarlo a la identidad del local (por ejemplo, fondos oscuros para hamburgueserías nocturnas, o cremas suaves para cafeterías). 

Para evitar que los usuarios elijan colores nocivos que destruyan la legibilidad o el diseño minimalista de la app, implementaremos un **Selector Guiado de Presets**. El administrador no usará un input hexadecimal libre para el fondo, sino una galería de 5 presets sofisticados elaborados por diseño.

---

## 🎨 La Colección de Fondos (Presets Curados)

| Nombre del Preset | Color Hex | Ideal Para | Comportamiento Visual (Luz/Oscuridad) |
| :--- | :--- | :--- | :--- |
| **Modern Light** | `#FFFFFF` | Todo rubro | Claro (Fondo por defecto, limpio, minimalista) |
| **Minimal Cream** | `#FDFBF7` | Cafeterías, panaderías, locales orgánicos | Cálido suave (Estilo gastronómico artesanal) |
| **Soft Gray** | `#F8F9FA` | Tecnología, indumentaria, minimalismo nórdico | Gris frío sutil y moderno |
| **Sage Green** | `#F2F5F1` | Locales saludables, ensaladas, sushi | Orgánico natural muy relajante |
| **Dark Charcoal** | `#111827` | Hamburgueserías, bares, pizzerías nocturnas | **Dark Mode** elegante y de alto contraste |

---

## 🛠️ Impacto Arquitectónico

### 1. 🗄️ Backend (Base de Datos y Entidades)
*   **Tabla `store_settings`**: Agregar una nueva columna no nula con valor por defecto: `backgroundColor VARCHAR(7) DEFAULT '#ffffff'`.
*   **Migración**: Crear el script SQL de TypeORM para inyectar la columna de forma segura sin romper instalaciones existentes.
*   **Entidad**: Expandir `StoreSettings` entity con el mapeo TypeORM.
*   **DTO**: Modificar `UpdateStoreSettingsDto` en NestJS para recibir y validar `backgroundColor` con Regex hexadecimal opcional (o limitarlo estrictamente a uno de los 5 presets en el validador Class-Validator). *Recomendación: Validarlo contra la lista enum de presets para seguridad absoluta.*

### 2. 🔌 Backend (Endpoints de API)
*   **`GET /stores/me/settings`**: Devolver `backgroundColor` para el hidratado del formulario.
*   **`PATCH /stores/me`**: Aceptar la propiedad en el payload y actualizar en DB.
*   **`GET /stores/:slug`**: Mapear la nueva columna en el objeto `theme` de la respuesta pública (junto a `primaryColor` y `accentColor`).

### 3. 💼 Frontend Admin (Panel de Control)
*   **Pantalla `/admin/settings/theme`**: Rediseñar el formulario. Agregar una nueva sección debajo de los inputs de color llamada "Fondo de la Tienda".
*   **Selector**: Renderizar un grid de 5 tarjetas interactivas previsualizando cada color de fondo. Al hacer clic, se actualiza el valor reactivo en Hook Form.
*   **Mockup**: El simulador del celular en tiempo real (`StorePreview`) consumirá este nuevo valor pintando su contenedor `bg-background` con el preset seleccionado, permitiendo al dueño ver el impacto exacto del fondo antes de guardar.

### 4. 🛒 Frontend Storefront (Tienda Pública)
*   **`layout.tsx`**: Consumir `store.theme.backgroundColor` e inyectar la variable CSS `--color-background` en el bloque `:root { ... !important }`.
*   **Mapeo de Clase CSS**: Asignar la clase global en el body del storefront para que tome `bg-[var(--color-background)]`.
*   **Contraste Dinámico (Crucial 💡)**: Si el color elegido es `Dark Charcoal` (`#111827`), el storefront debe mutar a modo oscuro de Tailwind (`dark`) o sus textos base y bordes deben recalcularse automáticamente (pasando de gris oscuro a blanco marfil) para garantizar legibilidad 100%.

---

## 🚦 Decisiones de Diseño (Architectural Decisions)

1.  **Validación en Backend**: Validaremos la columna `backgroundColor` estrictamente contra el set de 5 cadenas HEX permitidas usando `@IsIn` de class-validator. Esto blinda el backend ante manipulaciones de API directas y protege la estética del ecosistema.
2.  **Detección de Brillo**: Implementaremos una función helper matemática en el `Storefront` que calcule la luminiscencia del color de fondo (Fórmula YIQ). Si la luminiscencia es baja (< 128), inyectaremos una variable CSS de contraste `--color-text-base` o activaremos el selector `.dark` en el wrapper de la página, logrando que todos los componentes de Shadcn se vuelvan blancos por contraste nativo.

---

## 📝 Plan de Tareas (Propuesto)

1.  **Fase 1**: Backend DB Column + TypeORM Migration.
2.  **Fase 2**: DTO validation rules + Controller map expansion.
3.  **Fase 3**: Admin ThemeEditor UI (Tarjetas de Presets + RHF watch state + Mockup integration).
4.  **Fase 4**: Storefront layout consumption + Body Background injector + Font contrast validation.

---

¿Damos luz verde a este diseño estructural y avanzamos a la creación de la Especificación y Código, loco? 🚀🎉
