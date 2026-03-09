# Estándares UX/UI - PickyApp

## 1. Filosofía de Diseño

### Principios Fundamentales

1. **Mobile-First**: Diseñar primero para móvil 360px, luego escalar a desktop
2. **Claridad sobre Complejidad**: Interfaces simples y directas
3. **Feedback Inmediato**: El usuario siempre sabe qué está pasando
4. **Accesibilidad**: Usable para todos, incluyendo personas con discapacidades
5. **Performance**: Carga rápida, animaciones fluidas (60fps)
6. **Consistencia**: Mismos patrones en toda la aplicación

### Objetivos UX

- **Tienda Pública**: Cliente puede hacer un pedido en menos de 2 minutos
- **Panel Admin**: Comerciante puede gestionar pedido en menos de 30 segundos
- **Onboarding**: Nuevo comerciante configura tienda en menos de 10 minutos

## 2. Sistema de Diseño (Design Tokens)

### 2.1 Colores

Definidos como variables CSS para permitir temas dinámicos por tenant.

```scss
:root {
  // Colores primarios (configurables por tenant)
  --color-primary:       #1565C0;  // Azul principal
  --color-primary-dark:  #0D47A1;  // Hover/Active
  --color-primary-light: #BBDEFB;  // Backgrounds sutiles
  --color-accent:        #FF6F00;  // Naranja para CTAs

  // Superficies
  --surface-bg:          #FFFFFF;  // Fondo principal
  --surface-card:        #F8FAFC;  // Cards y contenedores
  --surface-input:       #F1F5F9;  // Inputs
  --border-color:        #E2E8F0;  // Bordes

  // Texto
  --text-primary:        #0F172A;  // Texto principal
  --text-secondary:      #475569;  // Texto secundario
  --text-disabled:       #94A3B8;  // Texto deshabilitado
  --text-on-primary:     #FFFFFF;  // Texto sobre color primario

  // Estados
  --color-success:       #10B981;  // Verde
  --color-warning:       #F59E0B;  // Amarillo
  --color-error:         #EF4444;  // Rojo
  --color-info:          #3B82F6;  // Azul

  // Overlay
  --overlay-bg:          rgba(0, 0, 0, 0.5);
}
```

### 2.2 Tipografía

```scss
:root {
  // Familia
  --font-family:         'Inter', 'Roboto', -apple-system, sans-serif;
  --font-family-mono:    'Fira Code', 'Courier New', monospace;

  // Tamaños
  --text-xs:   0.75rem;   // 12px
  --text-sm:   0.875rem;  // 14px
  --text-base: 1rem;      // 16px
  --text-lg:   1.125rem;  // 18px
  --text-xl:   1.25rem;   // 20px
  --text-2xl:  1.5rem;    // 24px
  --text-3xl:  1.875rem;  // 30px
  --text-4xl:  2.25rem;   // 36px

  // Pesos
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  // Line Heights
  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### 2.3 Espaciado

Sistema de grilla de 4px (múltiplos de 4).

```scss
:root {
  --spacing-xs:  4px;   // 0.25rem
  --spacing-sm:  8px;   // 0.5rem
  --spacing-md:  16px;  // 1rem
  --spacing-lg:  24px;  // 1.5rem
  --spacing-xl:  32px;  // 2rem
  --spacing-2xl: 48px;  // 3rem
  --spacing-3xl: 64px;  // 4rem
}
```

### 2.4 Bordes y Sombras

```scss
:root {
  // Radios
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-full: 9999px;

  // Sombras
  --shadow-sm:  0 1px 3px rgba(0,0,0,.08);
  --shadow-md:  0 4px 12px rgba(0,0,0,.10);
  --shadow-lg:  0 8px 24px rgba(0,0,0,.12);
  --shadow-xl:  0 16px 48px rgba(0,0,0,.15);

  // Elevaciones (Material Design)
  --elevation-1: 0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.24);
  --elevation-2: 0 3px 6px rgba(0,0,0,.15), 0 2px 4px rgba(0,0,0,.12);
  --elevation-3: 0 10px 20px rgba(0,0,0,.15), 0 3px 6px rgba(0,0,0,.10);
}
```

### 2.5 Transiciones

```scss
:root {
  --transition-fast:   150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow:   400ms ease;

  // Easing curves
  --ease-in:     cubic-bezier(0.4, 0, 1, 1);
  --ease-out:    cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 3. Componentes Comunes

### 3.1 Botones

**Variantes**:
- **Primary**: Acción principal (ej. "Agregar al carrito", "Guardar")
- **Secondary**: Acción alternativa (ej. "Cancelar", "Volver")
- **Ghost**: Acción terciaria (ej. "Ver más", "Editar")
- **Danger**: Acción destructiva (ej. "Eliminar", "Cancelar pedido")

```scss
.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  transition: var(--transition-fast);
  cursor: pointer;

  &-primary {
    background: var(--color-primary);
    color: var(--text-on-primary);
    &:hover { background: var(--color-primary-dark); }
  }

  &-secondary {
    background: var(--surface-card);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    &:hover { background: var(--surface-input); }
  }

  &-ghost {
    background: transparent;
    color: var(--color-primary);
    &:hover { background: var(--color-primary-light); }
  }

  &-danger {
    background: var(--color-error);
    color: white;
    &:hover { background: #DC2626; }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

### 3.2 Formularios

**Reglas**:
- Labels siempre visibles (no usar placeholder como label)
- Validación inline al blur
- Errores en rojo debajo del campo
- Estados: default, focus, error, disabled

```scss
.form-field {
  margin-bottom: var(--spacing-md);

  label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  input, textarea, select {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--surface-input);
    font-size: var(--text-base);
    transition: var(--transition-fast);

    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }

    &.error {
      border-color: var(--color-error);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .error-message {
    margin-top: var(--spacing-xs);
    font-size: var(--text-sm);
    color: var(--color-error);
  }
}
```

### 3.3 Cards

```scss
.card {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-normal);

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  &-clickable {
    cursor: pointer;
  }
}
```

### 3.4 Badges

```scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);

  &-success {
    background: #D1FAE5;
    color: #065F46;
  }

  &-warning {
    background: #FEF3C7;
    color: #92400E;
  }

  &-error {
    background: #FEE2E2;
    color: #991B1B;
  }

  &-info {
    background: #DBEAFE;
    color: #1E40AF;
  }
}
```

## 4. Patrones de Interacción

### 4.1 Navegación

**Tienda Pública (Móvil)**:
- Header sticky con logo, nombre y carrito
- Navegación por categorías (scroll horizontal)
- Botón flotante de carrito (bottom-right)

**Panel Admin (Móvil)**:
- Bottom navigation bar con 4 tabs:
  - Dashboard
  - Pedidos
  - Catálogo
  - Configuración

**Panel Admin (Desktop)**:
- Sidebar colapsable a la izquierda
- Topbar con logo, búsqueda y usuario

### 4.2 Modales y Dialogs

**Cuándo usar**:
- Confirmaciones destructivas (eliminar)
- Formularios cortos (agregar categoría)
- Detalle de producto (tienda pública)

**Implementación**:
```scss
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;

  &-backdrop {
    position: absolute;
    inset: 0;
    background: var(--overlay-bg);
    animation: fadeIn var(--transition-fast);
  }

  &-content {
    position: relative;
    background: white;
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp var(--transition-normal);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### 4.3 Feedback

**Loading States**:
- Skeleton loaders (preferido sobre spinners)
- Spinners solo para acciones puntuales
- Progress bars para uploads

**Toasts/Snackbars**:
- Posición: top-center (móvil), bottom-right (desktop)
- Duración: 3 segundos (éxito), 5 segundos (error)
- Auto-dismiss con opción de cerrar manual

```scss
.toast {
  position: fixed;
  top: var(--spacing-md);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  animation: slideDown var(--transition-normal);

  &-success { border-left: 4px solid var(--color-success); }
  &-error { border-left: 4px solid var(--color-error); }
  &-info { border-left: 4px solid var(--color-info); }
}
```

### 4.4 Empty States

Siempre mostrar:
- Ilustración o ícono
- Título descriptivo
- Mensaje explicativo
- CTA para acción (si aplica)

```html
<div class="empty-state">
  <img src="empty-products.svg" alt="Sin productos" />
  <h3>No hay productos aún</h3>
  <p>Comienza agregando tu primer producto al catálogo</p>
  <button class="btn-primary">Agregar producto</button>
</div>
```

## 5. Responsive Design

### 5.1 Breakpoints

```scss
$breakpoints: (
  'xs': 360px,   // Móvil pequeño (base)
  'sm': 480px,   // Móvil estándar
  'md': 768px,   // Tablet
  'lg': 1024px,  // Desktop pequeño
  'xl': 1280px   // Desktop estándar
);

@mixin respond-to($breakpoint) {
  @if map-has-key($breakpoints, $breakpoint) {
    @media (min-width: map-get($breakpoints, $breakpoint)) {
      @content;
    }
  }
}
```

### 5.2 Grids Responsivas

```scss
.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;  // Móvil: 2 columnas
  gap: var(--spacing-md);

  @include respond-to('md') {
    grid-template-columns: repeat(3, 1fr);  // Tablet: 3
  }

  @include respond-to('lg') {
    grid-template-columns: repeat(4, 1fr);  // Desktop: 4
  }
}
```

## 6. Animaciones y Micro-interacciones

### 6.1 Principios

- **Propósito**: Cada animación debe tener un propósito (feedback, guía, deleite)
- **Duración**: 150-400ms (más rápido = mejor)
- **Easing**: ease-out para entradas, ease-in para salidas
- **Performance**: Animar solo transform y opacity (GPU-accelerated)

### 6.2 Ejemplos

**Hover en Cards**:
```scss
.card {
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }
}
```

**Agregar al Carrito**:
```scss
@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.cart-badge {
  animation: bounce 300ms ease;
}
```

**Loading Skeleton**:
```scss
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

## 7. Accesibilidad (A11y)

### 7.1 Contraste

- **Texto normal**: Mínimo 4.5:1
- **Texto grande** (18px+): Mínimo 3:1
- **Elementos interactivos**: Mínimo 3:1

### 7.2 Navegación por Teclado

- Todos los elementos interactivos accesibles con Tab
- Focus visible con outline
- Escape cierra modales
- Enter/Space activa botones

```scss
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### 7.3 ARIA Labels

```html
<!-- Botón con solo ícono -->
<button aria-label="Agregar al carrito">
  <svg>...</svg>
</button>

<!-- Estado de carga -->
<button aria-busy="true" aria-label="Guardando...">
  Guardar
</button>

<!-- Modal -->
<div role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">Confirmar eliminación</h2>
</div>
```

### 7.4 Semántica HTML

```html
<!-- ✅ CORRECTO -->
<nav>
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

<!-- ❌ INCORRECTO -->
<div class="nav">
  <div class="link" onclick="navigate()">Dashboard</div>
</div>
```

## 8. Performance UX

### 8.1 Perceived Performance

- Skeleton loaders en lugar de spinners
- Optimistic UI updates (actualizar UI antes de confirmar con servidor)
- Lazy loading de imágenes
- Prefetch de rutas probables

### 8.2 Métricas Objetivo

- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

## 9. Checklist de Calidad UX

Antes de considerar una vista completa:

- [ ] Funciona en móvil 360px sin scroll horizontal
- [ ] Todos los estados tienen feedback visual
- [ ] Loading states implementados
- [ ] Empty states implementados
- [ ] Error states implementados
- [ ] Navegación por teclado funciona
- [ ] Contraste de colores cumple WCAG AA
- [ ] Animaciones fluidas (60fps)
- [ ] Textos legibles (mínimo 14px en móvil)
- [ ] Touch targets mínimo 44x44px
