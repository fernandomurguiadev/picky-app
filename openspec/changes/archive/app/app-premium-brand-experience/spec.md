# Specification: Experiencia de Marca Premium

**ID:** `app-premium-brand-experience`

---

## 🎯 Propósito

Asegurar una experiencia de personalización de marca consistente, premium y completamente responsiva en pantallas táctiles y de escritorio, tanto para nuevos usuarios durante el registro de su comercio como para administradores activos desde el panel de control.

---

## 📋 Requisitos de Negocio y Funcionales

### 1. Sincronización de Vista Previa
*   **REQ-PREV-001**: La vista previa de la tienda debe ser idéntica en el Paso 1 de Onboarding y en la página de Configuración de Tema.
*   **REQ-PREV-002**: La vista previa debe reaccionar en tiempo real ante cambios de color primario, secundario y fondo.
*   **REQ-PREV-003**: La vista previa debe soportar pestañas interactivas para alternar entre la vista de catálogo general y la vista detallada de un producto.
*   **REQ-PREV-004**: Los textos sobre colores personalizados deben recalcular su color de contraste (blanco o negro) utilizando la fórmula matemática YIQ de luminancia para asegurar accesibilidad y lectura.

### 2. Paletas de Colores de Autor
*   **REQ-PALE-001**: El sistema debe ofrecer al menos 6 paletas de colores curadas y elegantes que combinen de forma automática los tres parámetros visuales (Primario, Secundario y Fondo).
*   **REQ-PALE-002**: Al seleccionar una paleta predefinida, el formulario debe actualizar todos los selectores de color manuales instantáneamente.

### 3. Usabilidad Responsiva de Ayuda (Tooltips & Mobile)
*   **REQ-HELP-001**: En dispositivos de escritorio, los selectores manuales deben incluir un ícono de ayuda interactivo con tooltips detallados en hover.
*   **REQ-HELP-002**: En dispositivos táctiles (móviles), los íconos de hover deben ocultarse para evitar interacciones toscas.
*   **REQ-HELP-003**: En dispositivos móviles, la ayuda contextual debe mostrarse inline de forma estática o a través de un bloque explicativo consolidado para no romper el grid en pantallas pequeñas.

---

## 🎬 Escenarios de Aceptación (Gherkin format)

### Escenario 1: Selección de Paleta Curada en Onboarding
*   **Dado** que el nuevo comerciante se encuentra en el Paso 1 de Onboarding ("Configurá tu comercio")
*   **Cuando** selecciona la paleta predefinida "Esmeralda"
*   **Entonces** el color primario se establece en `#1B4332`
*   **Y** el color secundario se establece en `#34D399`
*   **Y** el color de fondo se establece en `#F2F5F1`
*   **Y** la maqueta de vista previa se actualiza inmediatamente mostrando la tienda con los nuevos tonos armoniosos.

### Escenario 2: Contraste de Texto Inteligente YIQ
*   **Dado** que el administrador está modificando el tema visual de su tienda
*   **Cuando** ingresa un color primario muy claro (ej: `#FFFFFF`)
*   **Entonces** el texto que se superpone a las áreas primarias en la maqueta (como categorías activas y encabezados) se vuelve negro (`#000000`) para garantizar la lectura.
*   **Cuando** ingresa un color primario muy oscuro (ej: `#000000`)
*   **Entonces** el texto superpuesto en esas áreas se vuelve blanco (`#FFFFFF`).

### Escenario 3: Comportamiento Responsivo de Ayuda
*   **Dado** que el usuario accede desde una pantalla con ancho de viewport de escritorio (`>= 768px`)
*   **Entonces** visualiza los íconos `HelpCircle` al lado de las etiquetas de color
*   **Y** al pasar el mouse por encima de los íconos, se despliega el tooltip flotante animado.
*   **Dado** que el usuario accede desde un celular (`< 768px`)
*   **Entonces** los íconos `HelpCircle` están ocultos (`hidden`)
*   **Y** se visualiza la tarjeta de ayuda consolidada con las explicaciones inline de cada color.
