# Proposed Change: Experiencia de Marca Premium (Vista Previa Consistente, Tooltips y Paletas Elegantes)

**ID:** `app-premium-brand-experience`  
**Autor:** Senior Architect (Antigravity)  
**Estado:** FINISHED  
**Fecha:** 20 de mayo de 2026

---

## 📖 Contexto y Objetivo

El flujo de personalización de marca para nuevos tenants (Paso 1 del Onboarding) y la configuración del tema visual en el panel administrativo (`/admin/settings/theme`) presentaban inconsistencias de diseño y problemas de UX:
1. Las maquetas de previsualización no estaban sincronizadas. El Onboarding usaba un mockup de baja fidelidad (`MiniStorePreview`), mientras que el dashboard usaba una lógica paralela.
2. Los colores predefinidos (swatches) eran planos, altamente saturados y genéricos (azul, rojo, verde puros), lo que hacía que las tiendas se vieran poco profesionales por defecto.
3. Los selectores de color manuales carecían de explicaciones contextuales claras sobre dónde impactaría cada color en el catálogo real.
4. En dispositivos táctiles (móviles), los eventos de hover (tooltips) resultaban toscos y arruinaban la experiencia táctil.

### Solución Diseñada e Implementada:
1. **Unificación en Tiempo Real**: Creamos un componente de previsualización compartido de alta fidelidad (`<StorePreview />`) que simula la tienda en móvil (vista de catálogo y ficha de producto) con cálculo de contraste inteligente (YIQ).
2. **Paletas Curadas de Autor**: Diseñamos 6 combinaciones elegantes que sincronizan el color primario, secundario y de fondo automáticamente, logrando un catálogo visualmente coherente de un solo toque.
3. **Guía Contextual Inteligente y Responsiva**: Agregamos tooltips elegantes animados por CSS para desktop (`HelpCircle`), y los reemplazamos por textos inline estructurados y una tarjeta consolidada en mobile (`md:hidden`) para garantizar usabilidad táctil al 100%.

---

## 🎨 Las Nuevas Paletas Curadas (Branding de Autor)

| Paleta | Primario | Secundario (Botones) | Fondo Tienda | Vibración Visual |
| :--- | :--- | :--- | :--- | :--- |
| **Obsidiana** | `#18181B` | `#E4E4E7` | `#FFFFFF` | Minimalismo nórdico, sobrio y elegante. |
| **Burdeos** | `#6B1D2F` | `#F87171` | `#FDFBF7` | Borgoña clásico, ideal para gastronomía gourmet. |
| **Esmeralda** | `#1B4332` | `#34D399` | `#F2F5F1` | Orgánico natural, para locales saludables y ensaladas. |
| **Terracota** | `#C05C3E` | `#FB923C` | `#FDFBF7` | Cálido terroso, ideal para panaderías y pizzerías. |
| **Prusia** | `#0F3D59` | `#2DD4BF` | `#F8F9FA` | Azul prusiano moderno, corporativo y tecnológico. |
| **Cacao Artisan** | `#4A3728` | `#F59E0B` | `#FDFBF7` | Marrón café rústico, para cafeterías y chocolaterías. |

---

## 🛠️ Impacto Arquitectónico

### 1. 💼 Frontend Componentes (`app/src/components`)
*   **Creación de `<StorePreview />`**: Extraído de forma desacoplada en `app/src/components/admin/store-preview.tsx`. Expone el simulador interactivo de catálogo, cajón de producto detallado y el algoritmo matemático YIQ (`getContrastColor`) para texto autocompensado.
*   **Refactor de `ThemeEditor`**: Simplificación del componente en `app/src/components/admin/theme-editor/index.tsx`, eliminando maquetas duplicadas y acopladas, inyectando las **Paletas Recomendadas** y los tooltips responsivos.

### 2. ⚡ Flujo de Onboarding (`app/src/app/(admin)/admin/onboarding`)
*   Reemplazo de la maqueta vieja por el nuevo `<StorePreview />`.
*   Inserción de la tarjeta móvil consolidada de ayuda e integración de los swatches de paletas.

### 3. ⚙️ Página de Configuración (`app/src/app/(admin)/admin/settings/theme`)
*   Inyección dinámica del nombre real del tenant (`settings?.tenant?.name`) extraído de la consulta API hacia la maqueta reactiva.

---

## 🚦 Decisiones de Diseño (Architectural Decisions)

1.  **Abstracción de Mockup Compartido**: Garantiza que si la tienda pública cambia sus estilos o estructura visual de botones en el futuro, solo debamos actualizar `store-preview.tsx` para mantener Onboarding y Configuración sincronizados.
2.  **Responsividad Táctil Avanzada**: En móviles no usamos eventos de hover. Ocultamos el `HelpCircle` (`hidden md:inline-flex`) y mostramos la ayuda de forma inline estática, eliminando fallas y tapados de inputs nativos en pantallas táctiles.
3.  **Luminancia YIQ Nativa**: El cálculo `(r * 299 + g * 587 + b * 114) / 1000` garantiza legibilidad (blanco o negro) sobre cualquier color primario dinámico sin requerir cálculos en runtime en el servidor.
