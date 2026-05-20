# Checklist de Tareas: Experiencia de Marca Premium

**ID:** `app-premium-brand-experience`

---

## 🚀 Fases de Implementación

### Fase 1: Abstracción de Maqueta de Catálogo
*   [x] Crear `app/src/components/admin/store-preview.tsx`.
*   [x] Implementar la función `getContrastColor` usando el algoritmo YIQ de luminancia.
*   [x] Diseñar la vista de Catálogo interactiva con cabeceras, categorías activas y carrito flotante.
*   [x] Diseñar la vista de Ficha de Producto con un drawer detallado deslizante y botón de compra.
*   [x] Asegurar la alternabilidad de vistas mediante pestañas interactivas animadas.

### Fase 2: Integración en Editor de Temas (Dashboard)
*   [x] Limpiar `app/src/components/admin/theme-editor/index.tsx`, eliminando la maqueta local anterior.
*   [x] Importar el componente `<StorePreview />` compartido.
*   [x] Diseñar e implementar los tooltips flotantes en CSS puro para los tres selectores de color.
*   [x] Habilitar la responsividad ocultando los tooltips flotantes en mobile (`hidden md:inline-flex`) y agregando leyendas inline (`md:hidden`).
*   [x] Implementar e inyectar el set de 6 paletas de colores elegantes predefinidas al inicio del panel.

### Fase 3: Integración en Paso 1 de Onboarding (Nuevos Tenants)
*   [x] Importar el componente `<StorePreview />` en `app/src/app/(admin)/admin/onboarding/page.tsx` para reemplazar el mockup simplificado anterior.
*   [x] Inyectar los selectores de colores manuales y los íconos de tooltips (`HelpCircle`) ocultos en mobile.
*   [x] Diseñar e insertar la tarjeta consolidada móvil informativa de colores de marca (`md:hidden`) justo antes del grid de inputs.
*   [x] Reemplazar los swatches planos por los botones de tipo cápsula con indicador bicolor circular de las 6 paletas premium curadas.

### Fase 4: Enlace dinámico de Datos de Negocio
*   [x] Modificar la página de configuración del tema (`app/src/app/(admin)/admin/settings/theme/page.tsx`).
*   [x] Reemplazar la propiedad de nombre estático por la propiedad dinámica del tenant (`settings?.tenant?.name || "Tu tienda"`).
*   [x] Verificar la hidratación de datos y el flujo de guardado contra la API del BFF.
