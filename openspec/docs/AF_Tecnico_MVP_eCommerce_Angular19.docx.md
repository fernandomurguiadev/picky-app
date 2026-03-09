

| ANÁLISIS FUNCIONAL & TÉCNICO MVP — Plataforma E-Commerce de Proximidad Para desarrollo por agente IA · Angular 19 · Mobile-First · Latam v1.0Versión MVP Feb 2026Fecha Angular 19Frontend Demo-ReadyObjetivo  |
| ----- |

|  | ⚠️ INSTRUCCIÓN PARA EL AGENTE DE DESARROLLO:  Este documento es el contrato técnico completo del MVP. Cada módulo, vista, componente y funcionalidad debe implementarse exactamente como se especifica. Las secciones de arquitectura técnica son de cumplimiento obligatorio. No omitir ningún criterio de aceptación. Mobile-first es un requerimiento no negociable. |
| :---- | :---- |

| SECCIÓN 1 CONTEXTO, ALCANCE Y OBJETIVOS DEL MVP Definición del producto mínimo viable para demo y validación |
| :---- |

# **1.1 Objetivos del MVP**

El MVP tiene como objetivo construir una plataforma de e-commerce de proximidad funcional, que permita hacer una demostración completa del ciclo de vida de un comercio digital: desde que el administrador crea su tienda hasta que un cliente final realiza un pedido. El MVP debe superar o igualar las funcionalidades de Pedix en los módulos incluidos, aplicando un diseño visual y una experiencia de usuario superiores.

| Objetivo | Descripción | Criterio de éxito |
| :---- | :---- | :---- |
| Demo funcional completa | Todo el flujo cliente-final y admin debe funcionar sin errores en una demo en vivo | Zero errores bloqueantes en demo de 20 minutos |
| Superar experiencia de Pedix | UX/UI notablemente superior en mobile, con animaciones, feedback visual y diseño premium | Evaluación subjetiva positiva vs Pedix en primera impresión |
| Arquitectura escalable | El código generado debe ser extensible para sumar módulos futuros sin refactoring mayor | Estructura de módulos Angular independientes, servicios desacoplados |
| Mobile-first completo | Toda vista debe ser perfectamente usable en móvil 360px antes de adaptarse a desktop | Prueba en viewport 360×640 sin scroll horizontal ni elementos rotos |
| Panel administrador operativo | El administrador puede gestionar su tienda sin asistencia técnica | Onboarding completo sin documentación adicional |

# **1.2 Módulos incluidos en el MVP**

|  | ✅ Módulos MVP (incluidos):  MOD-01 Catálogo Digital · MOD-02 Tienda Pública · MOD-03 Gestión de Pedidos · MOD-04 Configuración de Tienda · MOD-05 Panel Administrador · MOD-06 Autenticación y Seguridad |
| :---- | :---- |

|  | ❌ Módulos EXCLUIDOS del MVP:  Pagos online y pasarelas · Facturación electrónica · Integraciones logísticas externas · CRM avanzado y fidelización · Módulo de marketing / Meta Ads · Multi-sucursal · Analytics avanzado |
| :---- | :---- |

# **1.3 Stack tecnológico definido**

| Capa | Tecnología | Versión | Justificación |
| :---- | :---- | :---- | :---- |
| Frontend | Angular | 19.x | Requerimiento del cliente. Standalone components, signals, control flow @if/@for |
| Estado global | NgRx Signals Store o Injectable Services con Signals | Angular 19 | Signals API nativa, sin overhead de Redux clásico para MVP |
| Estilos | SCSS \+ Angular CDK | — | Variables CSS, breakpoints, utilidades. Sin framework externo (máximo control) |
| Componentes UI | Angular Material 3 (MDC) | 17+ | Componentes accesibles, tema personalizable, consistent con Material You |
| HTTP Client | Angular HttpClient \+ interceptors | Nativa | Manejo centralizado de auth headers y errores |
| Formularios | Angular Reactive Forms | Nativa | Validaciones complejas, UX de errores inline |
| Routing | Angular Router con lazy loading | Nativa | Lazy load por módulo. Guards de autenticación. Resolvers |
| Backend / API | Node.js \+ NestJS | ^10 | REST API. Módulos desacoplados. DTO \+ class-validator |
| Base de datos | PostgreSQL \+ TypeORM | — | Multi-tenant por tenant\_id. Migraciones versionadas |
| Almacenamiento | Cloudinary o S3 compatible | — | Imágenes con transformación on-the-fly (resize, webp) |
| Autenticación | JWT \+ Refresh Tokens | — | Access token 15min, refresh 7d. Almacenamiento en httpOnly cookie |
| WebSocket | Socket.io (backend) \+ ngx-socket-io | — | Pedidos en tiempo real en el panel admin |
| Contenedores | Docker \+ docker-compose | — | Dev y producción unificados. Variables de entorno por stage |

| SECCIÓN 2 ARQUITECTURA ANGULAR 19 Estructura de proyecto, patrones y convenciones obligatorias |
| :---- |

# **2.1 Estructura de carpetas del proyecto**

La estructura sigue el patrón de Arquitectura por Features (Feature-Sliced Design adaptado a Angular). Cada módulo funcional es una carpeta independiente bajo /features/. Los componentes compartidos viven en /shared/. Los servicios de dominio en /core/.

src/  
├── app/  
│   ├── core/                          \# Servicios singleton, guards, interceptors  
│   │   ├── auth/  
│   │   │   ├── auth.service.ts  
│   │   │   ├── auth.guard.ts  
│   │   │   └── auth.interceptor.ts  
│   │   ├── services/  
│   │   │   ├── api.service.ts         \# HTTP base con error handling  
│   │   │   ├── store.service.ts       \# Estado global con signals  
│   │   │   └── websocket.service.ts   \# Socket.io client  
│   │   └── models/                    \# Interfaces TypeScript globales  
│   ├── shared/                        \# Componentes y pipes reutilizables  
│   │   ├── components/  
│   │   │   ├── button/  
│   │   │   ├── card/  
│   │   │   ├── modal/  
│   │   │   ├── badge/  
│   │   │   ├── skeleton-loader/  
│   │   │   ├── empty-state/  
│   │   │   ├── image-upload/  
│   │   │   ├── quantity-selector/  
│   │   │   ├── toast/  
│   │   │   └── topbar/  
│   │   ├── pipes/  
│   │   │   ├── currency-format.pipe.ts  
│   │   │   └── time-ago.pipe.ts  
│   │   └── directives/  
│   │       ├── lazy-image.directive.ts  
│   │       └── ripple.directive.ts  
│   ├── features/  
│   │   ├── store-front/               \# MOD-02: Tienda pública  
│   │   │   ├── store-front.routes.ts  
│   │   │   ├── pages/  
│   │   │   │   ├── home/  
│   │   │   │   ├── category/  
│   │   │   │   ├── product-detail/  
│   │   │   │   ├── cart/  
│   │   │   │   ├── checkout/  
│   │   │   │   └── order-confirmation/  
│   │   │   ├── components/  
│   │   │   └── services/  
│   │   ├── admin/                     \# MOD-05: Panel administrador  
│   │   │   ├── admin.routes.ts  
│   │   │   ├── layout/  
│   │   │   ├── pages/  
│   │   │   │   ├── dashboard/  
│   │   │   │   ├── catalog/  
│   │   │   │   ├── orders/  
│   │   │   │   ├── settings/  
│   │   │   │   └── store-settings/  
│   │   │   └── components/  
│   │   └── auth/                      \# MOD-06: Autenticación  
│   │       ├── login/  
│   │       └── register/  
│   ├── app.routes.ts  
│   └── app.config.ts  
├── styles/  
│   ├── \_variables.scss                \# Design tokens  
│   ├── \_breakpoints.scss              \# Media queries  
│   ├── \_typography.scss  
│   ├── \_animations.scss  
│   └── \_utilities.scss  
└── environments/  
    ├── environment.ts  
    └── environment.prod.ts

# **2.2 Patrones obligatorios Angular 19**

## **2.2.1 Standalone Components (obligatorio en todo el proyecto)**

TODOS los componentes deben ser standalone: true. No usar NgModules. Importar dependencias directamente en el componente.

@Component({  
  selector: 'app-product-card',  
  standalone: true,  
  imports: \[CommonModule, RouterLink, CurrencyFormatPipe, LazyImageDirective\],  
  templateUrl: './product-card.component.html',  
  changeDetection: ChangeDetectionStrategy.OnPush  
})  
export class ProductCardComponent {  
  @Input({ required: true }) product\!: Product;  
  @Output() addToCart \= new EventEmitter\<Product\>();  
}

## **2.2.2 Signals para estado reactivo**

Usar Angular Signals (signal(), computed(), effect()) para estado local y global. No usar BehaviorSubject en componentes nuevos.

// En servicio de carrito:  
export class CartService {  
  private \_items \= signal\<CartItem\[\]\>(\[\]);  
  readonly items \= this.\_items.asReadonly();  
  readonly total \= computed(() \=\>  
    this.\_items().reduce((sum, i) \=\> sum \+ i.price \* i.qty, 0\)  
  );  
  readonly count \= computed(() \=\> this.\_items().length);

  addItem(product: Product, options: SelectedOption\[\]) {  
    this.\_items.update(items \=\> \[...items, { ...product, options, qty: 1 }\]);  
  }  
}

## **2.2.3 Control flow moderno (@if, @for, @switch)**

Usar la sintaxis de control flow nativa de Angular 17+. No usar \*ngIf, \*ngFor ni \*ngSwitch.

@for (category of categories(); track category.id) {  
  \<app-category-card \[category\]="category" /\>  
} @empty {  
  \<app-empty-state message="No hay categorías aún" /\>  
}

@if (isLoading()) {  
  \<app-skeleton-loader \[rows\]="6" /\>  
} @else if (error()) {  
  \<app-error-state \[message\]="error()" /\>  
} @else {  
  \<app-product-grid \[products\]="products()" /\>  
}

## **2.2.4 Lazy Loading obligatorio por feature**

// app.routes.ts  
export const routes: Routes \= \[  
  {  
    path: ':slug',  
    loadChildren: () \=\> import('./features/store-front/store-front.routes')  
      .then(m \=\> m.STORE\_FRONT\_ROUTES)  
  },  
  {  
    path: 'admin',  
    canActivate: \[authGuard\],  
    loadChildren: () \=\> import('./features/admin/admin.routes')  
      .then(m \=\> m.ADMIN\_ROUTES)  
  },  
  { path: '', redirectTo: '/admin', pathMatch: 'full' }  
\];

# **2.3 Sistema de diseño — Mobile First**

## **2.3.1 Breakpoints obligatorios**

| Breakpoint | Valor | Descripción | Uso |
| :---- | :---- | :---- | :---- |
| xs | 360px | Móvil pequeño (base) | Diseño base. TODO debe funcionar aquí primero |
| sm | 480px | Móvil estándar | Ajustes menores de spacing |
| md | 768px | Tablet / phablet | Layout de 2 columnas donde aplique |
| lg | 1024px | Desktop pequeño | Sidebar visible, grid 3 columnas |
| xl | 1280px | Desktop estándar | Máximo ancho de contenido: 1200px |

## **2.3.2 Variables SCSS globales (\_variables.scss)**

:root {  
  // Colores primarios (configurables por tenant)  
  \--color-primary:       \#1565C0;  
  \--color-primary-dark:  \#0D47A1;  
  \--color-primary-light: \#BBDEFB;  
  \--color-accent:        \#FF6F00;

  // Superficies  
  \--surface-bg:          \#FFFFFF;  
  \--surface-card:        \#F8FAFC;  
  \--surface-input:       \#F1F5F9;  
  \--border-color:        \#E2E8F0;

  // Tipografía  
  \--font-family:         'Inter', 'Roboto', sans-serif;  
  \--text-primary:        \#0F172A;  
  \--text-secondary:      \#475569;  
  \--text-disabled:       \#94A3B8;

  // Espaciado  
  \--spacing-xs:  4px;  
  \--spacing-sm:  8px;  
  \--spacing-md:  16px;  
  \--spacing-lg:  24px;  
  \--spacing-xl:  32px;  
  \--spacing-2xl: 48px;

  // Bordes  
  \--radius-sm:   6px;  
  \--radius-md:   12px;  
  \--radius-lg:   16px;  
  \--radius-full: 9999px;

  // Sombras  
  \--shadow-sm:  0 1px 3px rgba(0,0,0,.08);  
  \--shadow-md:  0 4px 12px rgba(0,0,0,.10);  
  \--shadow-lg:  0 8px 24px rgba(0,0,0,.12);

  // Transiciones  
  \--transition-fast:   150ms ease;  
  \--transition-normal: 250ms ease;  
  \--transition-slow:   400ms ease;  
}

## **2.3.3 Mixin de breakpoints (\_breakpoints.scss)**

@mixin respond-to($breakpoint) {  
  @if $breakpoint \== 'sm'  { @media (min-width: 480px)  { @content; } }  
  @if $breakpoint \== 'md'  { @media (min-width: 768px)  { @content; } }  
  @if $breakpoint \== 'lg'  { @media (min-width: 1024px) { @content; } }  
  @if $breakpoint \== 'xl'  { @media (min-width: 1280px) { @content; } }  
}

// Uso en componente:  
.product-grid {  
  display: grid;  
  grid-template-columns: 1fr 1fr;      // móvil: 2 columnas  
  gap: var(--spacing-md);  
  @include respond-to('md') {  
    grid-template-columns: repeat(3, 1fr);  // tablet: 3 columnas  
  }  
  @include respond-to('lg') {  
    grid-template-columns: repeat(4, 1fr);  // desktop: 4 columnas  
  }  
}

| SECCIÓN 3 MÓDULOS FUNCIONALES DEL MVP Especificación técnica completa por módulo |
| :---- |

| MOD-01 | GESTIÓN DEL CATÁLOGO CRUD completo de categorías y productos con variantes. Back-office del administrador. |
| :---: | :---- |

## **3.1 Tabla de funcionalidades — MOD-01**

| ID | Funcionalidad | Descripción técnica | Vista / Componente Angular | Prio |
| :---- | :---- | :---- | :---- | ----- |
| **C-001** | **Listado de categorías** | Vista grilla con cards de categorías. Drag & drop para reordenar. Indicador de cantidad de productos. | admin/catalog/categories — CategoriesListComponent |  |
| **C-002** | **Crear / editar categoría** | Formulario reactive: nombre (req), imagen (upload con preview), estado activo/inactivo. Validación inline. | CategoryFormComponent (modal) |  |
| **C-003** | **Eliminar categoría** | Confirmar con modal. Bloquear si tiene productos activos (mostrar cuántos). | ConfirmModalComponent |  |
| **C-004** | **Listado de productos** | Tabla con filtro por categoría, estado y búsqueda por nombre. Paginación server-side. | admin/catalog/products — ProductsListComponent |  |
| **C-005** | **Crear / editar producto** | Form multi-sección: info básica, imágenes (hasta 5, upload múltiple, reordenable), precio, variantes, estado. | ProductFormComponent (página completa) |  |
| **C-006** | **Variantes y opciones** | Grupos de opciones en el form del producto: tipo radio/checkbox, items con nombre y precio adicional. Add/remove dinámico. | OptionGroupEditorComponent (embebido en form) |  |
| **C-007** | **Activar / desactivar producto** | Toggle rápido en la lista sin abrir el form. Feedback visual inmediato. | ProductsListComponent — inline toggle |  |
| **C-008** | **Upload de imágenes** | Drag & drop o click para upload. Preview inmediato. Compresión client-side antes de enviar. Progress indicator. | ImageUploaderComponent (shared) |  |
| **C-009** | **Buscador de productos (admin)** | Input con debounce 300ms. Búsqueda por nombre en tiempo real contra API. | ProductsListComponent — SearchBarComponent |  |
| **C-010** | **Productos destacados** | Checkbox 'Destacado' en el form. Sección en home de la tienda con productos marcados. | ProductFormComponent — campo destacado |  |

## **3.2 Interfaces TypeScript — MOD-01**

// core/models/catalog.models.ts

export interface Category {  
  id: string;  
  tenantId: string;  
  name: string;  
  imageUrl: string;  
  order: number;  
  isActive: boolean;  
  productCount?: number;  
  createdAt: Date;  
  updatedAt: Date;  
}

export interface OptionItem {  
  id: string;  
  name: string;  
  priceModifier: number;  // 0 si no tiene precio adicional  
  isDefault: boolean;  
}

export interface OptionGroup {  
  id: string;  
  name: string;                // ej: 'Tamaño', 'Extras', 'Cocción'  
  type: 'radio' | 'checkbox';  // radio \= selección única, checkbox \= múltiple  
  isRequired: boolean;  
  minSelections: number;       // para checkbox: mínimo a seleccionar  
  maxSelections: number;       // para checkbox: máximo  
  items: OptionItem\[\];  
}

export interface Product {  
  id: string;  
  tenantId: string;  
  categoryId: string;  
  name: string;  
  description: string;  
  price: number;  
  images: ProductImage\[\];  
  optionGroups: OptionGroup\[\];  
  isActive: boolean;  
  isFeatured: boolean;  
  order: number;  
  createdAt: Date;  
  updatedAt: Date;  
}

export interface ProductImage {  
  id: string;  
  url: string;  
  order: number;  
  isMain: boolean;  
}

## **3.3 Especificación de vistas — MOD-01**

| VISTA: Listado de Categorías | Ruta: admin/catalog/categories |
| :---- | :---- |
| **Descripción** | Vista principal del catálogo en el admin. Muestra todas las categorías como cards en grilla. Permite reordenar con drag & drop. Acceso a crear/editar/eliminar cada categoría. |
| **Componentes** | CategoriesListComponent, CategoryCardComponent, DragDropListDirective, EmptyStateComponent, SkeletonLoaderComponent, ConfirmModalComponent |
| **@Input / Props** | — |
| **@Output / Events** | categoryReordered: EventEmitter\<string\[\]\> |
| **Services** | CatalogService.getCategories(), CatalogService.reorderCategories() |
| **Notas UX** | Mobile: 2 columnas de cards. Desktop: 3-4 columnas. Card muestra: imagen, nombre, cantidad de productos, estado activo (chip), botones editar/eliminar. Botón flotante '+' para crear nueva. Loading state con skeleton de 6 cards. Empty state con ilustración y CTA 'Crear primera categoría'. |

| VISTA: Formulario de Producto | Ruta: admin/catalog/products/new | /edit/:id |
| :---- | :---- |
| **Descripción** | Formulario completo de alta/edición de producto. Dividido en secciones colapsables. Guarda borrador automáticamente en localStorage cada 30 segundos. |
| **Componentes** | ProductFormComponent, ImageUploaderComponent, OptionGroupEditorComponent, PriceInputComponent, CategorySelectorComponent |
| **@Input / Props** | productId?: string (para edición) |
| **@Output / Events** | productSaved: EventEmitter\<Product\> |
| **Services** | CatalogService.getProduct(), CatalogService.createProduct(), CatalogService.updateProduct(), UploadService.uploadImage() |
| **Notas UX** | Sección 1: Información básica (nombre req, descripción, categoría req). Sección 2: Imágenes (hasta 5, drag reorder, primera \= principal). Sección 3: Precio (input numérico con formateo). Sección 4: Variantes (OptionGroupEditor). Sección 5: Configuración (activo toggle, destacado toggle). Sticky footer con botones Guardar/Cancelar. En móvil las secciones son acordeones. |

| MOD-02 | TIENDA PÚBLICA Front-end del cliente final. Zero login. Responsive, animada, superando la experiencia de Pedix. |
| :---: | :---- |

## **3.4 Tabla de funcionalidades — MOD-02**

| ID | Funcionalidad | Descripción técnica | Vista / Componente Angular | Prio |
| :---- | :---- | :---- | :---- | ----- |
| **T-001** | **Home de la tienda** | Header con logo, nombre del comercio y estado abierto/cerrado. Grilla de categorías con imágenes. Sección de productos destacados. Banner de anuncios deslizable. | store/:slug — StoreHomeComponent |  |
| **T-002** | **Indicador abierto/cerrado** | Badge dinámico en el header basado en los horarios configurados. Si cerrado: muestra próxima apertura. | StoreStatusBadgeComponent |  |
| **T-003** | **Listado de categoría** | Lista de productos de la categoría seleccionada. Filtros por etiqueta. Barra de búsqueda. | store/:slug/category/:id — CategoryPageComponent |  |
| **T-004** | **Card de producto** | Imagen principal, nombre, precio, badge 'Agotado' si sin stock. Botón \+ para agregar rápido. Animación de feedback al agregar. | ProductCardComponent |  |
| **T-005** | **Detalle de producto** | Modal o página con carrusel de imágenes, descripción completa, selector de variantes con validación, campo de notas, selector de cantidad, botón Agregar. | ProductDetailComponent (bottom sheet en móvil, modal en desktop) |  |
| **T-006** | **Selector de variantes** | Por cada OptionGroup: chips para radio (selección única), checkboxes para múltiple. Precio adicional visible. Validación de grupos requeridos al agregar. | VariantSelectorComponent |  |
| **T-007** | **Carrito persistente** | Drawer lateral (desktop) o bottom sheet (móvil) con items, variantes seleccionadas, cantidades ajustables, subtotal por item y total general. Persiste en localStorage. | CartDrawerComponent |  |
| **T-008** | **Badge de carrito** | Burbuja con cantidad de items en el ícono del carrito. Animación bump al agregar. | CartBadgeComponent |  |
| **T-009** | **Checkout — Datos cliente** | Form: nombre (req), teléfono (req, formato internacional), dirección (req si delivery), notas opcionales. | CheckoutPageComponent — StepCustomerFormComponent |  |
| **T-010** | **Checkout — Entrega y pago** | Selección de forma de entrega disponible. Selección de método de pago habilitado. Monto mínimo validado. | CheckoutPageComponent — StepDeliveryComponent |  |
| **T-011** | **Dispatch por WhatsApp** | Generar mensaje estructurado con orden completa y abrir wa.me con el número del comercio. Resumen previo al envío. | WhatsappDispatchService |  |
| **T-012** | **Pantalla confirmación de pedido** | Número de orden generado, resumen de la compra, instrucciones de seguimiento, botón para nuevo pedido. | OrderConfirmationComponent |  |
| **T-013** | **Búsqueda en tienda** | Barra de búsqueda global en la tienda. Resultados en tiempo real contra catálogo. Sin resultados con sugerencias. | StoreSearchComponent |  |
| **T-014** | **Animaciones y micro-interacciones** | Transición entre páginas (slide), skeleton loading, bounce al agregar al carrito, toast de confirmación. | AnimationsService, ToastComponent |  |
| **T-015** | **Información y ubicación** | Página con datos del negocio, horarios de atención, dirección con mapa embebido (Google Maps o Leaflet), links de redes sociales. | StoreInfoPageComponent |  |
| **T-016** | **Tema dinámico por tenant** | Los colores \--color-primary y \--color-accent del comercio se aplican como CSS variables al cargar la tienda. | TenantThemeService |  |

## **3.5 Detalle de vistas críticas — MOD-02**

| VISTA: Home de la Tienda | Ruta: /:slug |
| :---- | :---- |
| **Descripción** | Página principal del comercio. Primera impresión del cliente. Debe cargar en menos de 2 segundos en 4G. Diseño premium que supere visualmente a Pedix. |
| **Componentes** | StoreHomeComponent, StoreBannerComponent, CategoryGridComponent, FeaturedProductsComponent, StoreStatusBadgeComponent, AnnouncementBannerComponent |
| **@Input / Props** | slug: string (route param) |
| **@Output / Events** | — |
| **Services** | StoreService.getStoreBySlug(), CategoryService.getCategories(), ProductService.getFeaturedProducts() |
| **Notas UX** | HEADER: logo del comercio (64px height en móvil), nombre, badge de estado abierto/cerrado con color dinámico, ícono de carrito con badge de cantidad, ícono de búsqueda. ANUNCIO: si existe, banner deslizable con fondo color primario del comercio. CATEGORÍAS: grilla 2 cols (móvil) → 3 cols (tablet) → 4 cols (desktop). Card: imagen cuadrada con object-fit cover, esquinas redondeadas (12px), nombre superpuesto en overlay gradiente, efecto hover scale(1.02) en desktop. DESTACADOS: carrusel horizontal con scroll snap. Sección solo visible si hay productos destacados. LOADING: skeleton con animación shimmer en lugar de spinner. |

| VISTA: Detalle de Producto | Ruta: /:slug/product/:id (o como bottom-sheet) |
| :---- | :---- |
| **Descripción** | Experiencia de selección de producto. En móvil se presenta como bottom sheet deslizable desde abajo. En desktop como modal centrado. Crítico para conversión. |
| **Componentes** | ProductDetailComponent, ImageCarouselComponent, VariantSelectorComponent, QuantitySelectorComponent, StickyAddButtonComponent |
| **@Input / Props** | productId: string |
| **@Output / Events** | productAdded: EventEmitter\<CartItem\> |
| **Services** | ProductService.getProductDetail() |
| **Notas UX** | IMÁGENES: carrusel con dots indicadores. Swipe gesture en móvil. Imagen principal 4:3 ratio. NOMBRE Y PRECIO: heading bold, precio en color primario. VARIANTES: por cada OptionGroup, renderizar según tipo: chips horizontales scrolleables para radio, lista de checkboxes para múltiple. Precio adicional en verde junto a cada opción. Si el grupo es requerido, mostrar asterisco y error al intentar agregar sin seleccionar. NOTAS: textarea colapsado, expandible con tap. CANTIDAD: selector \+/- con límite mínimo 1\. BOTÓN AGREGAR: sticky en el bottom del sheet/modal. Muestra precio total \= (precio base \+ modificadores) × cantidad. Al agregar: animación de ítem volando hacia el ícono del carrito (opcional), toast 'Agregado al carrito', cierre del sheet. |

| VISTA: Checkout | Ruta: /:slug/checkout |
| :---- | :---- |
| **Descripción** | Proceso de compra en 2 pasos lineales. Wizard con stepper visual. Preservar datos si el usuario regresa. No requerir registro. |
| **Componentes** | CheckoutPageComponent, StepperComponent, CustomerFormComponent, DeliveryMethodComponent, PaymentMethodComponent, OrderSummaryComponent |
| **@Input / Props** | — |
| **@Output / Events** | — |
| **Services** | CartService, CheckoutService, StoreService, OrderService |
| **Notas UX** | PASO 1 — Tus datos: nombre (req), teléfono con prefijo de país (req), email (opcional), dirección completa si delivery (calle, número, piso/depto, localidad), notas (textarea). Validación inline al blur. PASO 2 — Entrega y pago: radio buttons de formas de entrega disponibles (delivery/take away/presencial). Si delivery: mostrar costo de envío y tiempo estimado. Radio buttons de métodos de pago. RESUMEN FINAL: antes de enviar, pantalla de confirmación con todos los datos y total. Botón 'Enviar pedido por WhatsApp' con ícono de WhatsApp verde. Al confirmar: se abre WhatsApp y se redirige a la pantalla de confirmación. |

## **3.6 Formato del mensaje WhatsApp**

El mensaje generado debe ser claro, estructurado y parseable por el comerciante. Usar emojis como separadores visuales para mejor legibilidad en WhatsApp.

🛒 \*NUEVO PEDIDO\* \#ORD-20240223-001  
──────────────────────  
👤 \*Cliente:\* Juan García  
📱 \*Teléfono:\* \+54 9 11 1234-5678  
📍 \*Entrega:\* Delivery  
    Av. Corrientes 1234, 3°B, CABA

🛍️ \*ITEMS:\*  
• Milanesa napolitana x1 — $2.500  
  ↳ Tamaño: Grande (+$300)  
  ↳ Extras: Jamón, Queso (+$200)  
• Coca-Cola 500ml x2 — $1.200  
  Nota: bien fría por favor

──────────────────────  
💰 \*Subtotal:\* $3.700  
🚚 \*Envío:\* $500  
💵 \*TOTAL: $4.200\*  
──────────────────────  
💳 \*Pago:\* Efectivo  
📝 \*Notas:\* Sin cebolla en la milanesa  
──────────────────────  
⏰ Pedido realizado: 23/02/2026 14:35

| MOD-03 | GESTIÓN DE PEDIDOS Centro de pedidos en tiempo real del administrador. WebSocket para actualizaciones instantáneas. |
| :---: | :---- |

## **3.7 Tabla de funcionalidades — MOD-03**

| ID | Funcionalidad | Descripción técnica | Vista / Componente Angular | Prio |
| :---- | :---- | :---- | :---- | ----- |
| **P-001** | **Centro de pedidos — Vista Kanban** | Columnas por estado: Nuevo / En preparación / En camino / Entregado / Cancelado. Cards arrastrables entre columnas. Auto-actualización por WebSocket. | admin/orders — OrdersKanbanComponent |  |
| **P-002** | **Vista lista de pedidos** | Alternativa al kanban: tabla con filtros por fecha, estado, forma de entrega. Paginación. Exportar a CSV. | admin/orders/list — OrdersListComponent |  |
| **P-003** | **Detalle de pedido** | Modal con detalle completo: items con variantes, datos del cliente, forma de entrega, método de pago, historial de cambios de estado. | OrderDetailModalComponent |  |
| **P-004** | **Cambio de estado manual** | Botones de acción en el detalle para mover al siguiente estado. Con confirmación para cancelar. | OrderStatusActionsComponent |  |
| **P-005** | **Notificación sonora y visual** | Al llegar un pedido nuevo por WebSocket: sonido configurable \+ badge parpadeante en la tab del navegador \+ toast de alta prominencia. | OrderNotificationService |  |
| **P-006** | **Pedido manual (admin)** | Formulario para crear un pedido desde el panel: buscador de productos, selección de variantes, datos del cliente. | CreateOrderModalComponent |  |
| **P-007** | **Imprimir pedido** | Generar vista de impresión optimizada para papel carta y ticket 80mm. Trigger desde el detalle del pedido. | PrintOrderService, OrderPrintTemplate |  |
| **P-008** | **Notas internas** | Campo de nota privada en el detalle del pedido. Solo visible para el administrador. Indicador visual si tiene nota. | OrderDetailModalComponent — notes field |  |

## **3.8 Modelo de datos — Pedido**

// core/models/order.models.ts

export type OrderStatus \= 'new' | 'confirmed' | 'preparing' | 'on\_way' | 'delivered' | 'cancelled';  
export type DeliveryMethod \= 'delivery' | 'takeaway' | 'in\_store';  
export type PaymentMethod \= 'cash' | 'transfer' | 'card' | 'other';

export interface OrderItem {  
  productId: string;  
  productName: string;  
  unitPrice: number;  
  quantity: number;  
  selectedOptions: SelectedOption\[\];  
  itemNote?: string;  
  subtotal: number;  
}

export interface SelectedOption {  
  groupId: string;  
  groupName: string;  
  items: { itemId: string; itemName: string; priceModifier: number }\[\];  
}

export interface CustomerInfo {  
  name: string;  
  phone: string;  
  email?: string;  
  address?: DeliveryAddress;  
}

export interface DeliveryAddress {  
  street: string;  
  number: string;  
  apartment?: string;  
  city: string;  
  references?: string;  
}

export interface Order {  
  id: string;  
  orderNumber: string;        // ORD-YYYYMMDD-XXX legible  
  tenantId: string;  
  status: OrderStatus;  
  items: OrderItem\[\];  
  customer: CustomerInfo;  
  deliveryMethod: DeliveryMethod;  
  deliveryCost: number;  
  paymentMethod: PaymentMethod;  
  subtotal: number;  
  total: number;  
  notes?: string;  
  internalNotes?: string;  
  statusHistory: StatusChange\[\];  
  createdAt: Date;  
  updatedAt: Date;  
}

export interface StatusChange {  
  status: OrderStatus;  
  changedAt: Date;  
  changedBy: string;  
}

| VISTA: Centro de Pedidos (Kanban) | Ruta: admin/orders |
| :---- | :---- |
| **Descripción** | Vista principal de operación del comercio. En producción esta pantalla está abierta todo el día. Debe ser eficiente, clara y responder en tiempo real. |
| **Componentes** | OrdersKanbanComponent, KanbanColumnComponent, OrderCardComponent, OrderDetailModalComponent, OrderNotificationService |
| **@Input / Props** | — |
| **@Output / Events** | — |
| **Services** | OrdersService (WebSocket \+ REST), WebSocketService |
| **Notas UX** | LAYOUT KANBAN: en móvil las columnas son pestañas scrolleables horizontalmente con un badge de cantidad por estado. En desktop: columnas en flex horizontal con scroll vertical independiente por columna. CARD DE PEDIDO: número de orden (bold), nombre cliente, total, tiempo transcurrido desde que llegó (ej: 'hace 5 min' actualizable), badge de estado, ícono de método de pago. NUEVO PEDIDO: la columna 'Nuevo' muestra el badge parpadeante en rojo. El card nuevo tiene borde izquierdo rojo y animación de entrada. ACCIONES RÁPIDAS: swipe izquierda en móvil para 'Confirmar' o 'Cancelar'. FILTRO RÁPIDO: chips de filtro por forma de entrega (Delivery / Take Away / Presencial) arriba del kanban. ESTADÍSTICAS DEL DÍA: barra superior con: pedidos hoy, total facturado hoy, promedio. |

| MOD-04 | CONFIGURACIÓN DE LA TIENDA Toda la personalización del comercio: identidad, horarios, entrega, pagos y tema visual. |
| :---: | :---- |

## **3.9 Tabla de funcionalidades — MOD-04**

| ID | Funcionalidad | Descripción técnica | Vista / Componente Angular | Prio |
| :---- | :---- | :---- | :---- | ----- |
| **S-001** | **Información básica del negocio** | Nombre del comercio (req), descripción, logo (upload), número de WhatsApp (req, validado), teléfono adicional, email, dirección del local. | admin/settings/info — StoreInfoFormComponent |  |
| **S-002** | **Redes sociales** | Links a Instagram, Facebook, TikTok. Validación de formato de URL. Se muestran como iconos en la tienda. | admin/settings/info — SocialLinksFormComponent |  |
| **S-003** | **Horarios de atención** | Configuración por día de la semana: activo/inactivo, hora apertura y cierre. Soporte a 2 turnos por día. El badge de estado en la tienda se calcula con esto. | admin/settings/hours — HoursEditorComponent |  |
| **S-004** | **Formas de entrega** | Activar/desactivar: Delivery, Take Away, Consumir en el local. Por cada activa: configurar descripción, tiempo estimado, costo fijo de envío. | admin/settings/delivery — DeliverySettingsComponent |  |
| **S-005** | **Métodos de pago** | Activar/desactivar: Efectivo, Transferencia bancaria (con datos de CBU/alias), Otro (texto libre). Recargo/descuento porcentual por método. | admin/settings/payments — PaymentMethodsComponent |  |
| **S-006** | **Monto mínimo de pedido** | Input numérico de monto mínimo. Aplicable globalmente o por forma de entrega. Validado en el checkout. | admin/settings/delivery |  |
| **S-007** | **Tema visual** | Selector de color primario y acento. Preview en tiempo real de cómo se verá la tienda. El color se aplica como CSS custom property al cargar el tenant. | admin/settings/theme — ThemeEditorComponent |  |
| **S-008** | **Anuncios en tienda** | Crear/editar/eliminar anuncios tipo banner. Texto, fondo configurable, activo/inactivo. Se muestra en el home de la tienda. | admin/settings/announcements |  |
| **S-009** | **URL de la tienda** | Mostrar la URL pública. Botón copiar. Botón generar QR (PNG descargable). Botón compartir en redes. | admin/settings/store — StoreLinkComponent |  |
| **S-010** | **Vista previa de la tienda** | Botón 'Ver mi tienda' que abre la URL pública en nueva pestaña. Disponible desde cualquier sección del admin. | Topbar del admin |  |

| VISTA: Panel de Configuración | Ruta: admin/settings |
| :---- | :---- |
| **Descripción** | Panel de ajustes organizado en pestañas o menú lateral. Cada sección es un formulario reactivo con autoguardado (debounce 1s) o botón Guardar explícito. |
| **Componentes** | SettingsLayoutComponent, StoreInfoFormComponent, HoursEditorComponent, DeliverySettingsComponent, PaymentMethodsComponent, ThemeEditorComponent |
| **@Input / Props** | — |
| **@Output / Events** | — |
| **Services** | StoreSettingsService, UploadService |
| **Notas UX** | LAYOUT: en móvil, menú de secciones tipo lista con iconos (Info, Horarios, Entrega, Pagos, Tema, Anuncios). Tap para navegar a cada sección. En desktop: panel dividido con menú lateral sticky y contenido a la derecha. AUTOGUARDADO: indicador 'Guardado' junto al título de cada sección con timestamp. HORARIOS EDITOR: tabla de días con toggle activo, dos rangos de horario por día. Al deshabilitar un día se colapsa la fila. TEMA: color picker nativo \+ preview lateral de cómo queda el botón primario, los chips de categoría y el header de la tienda con los colores elegidos. |

| MOD-05 | PANEL ADMINISTRADOR Layout, navegación, dashboard y UX del back-office del comerciante. |
| :---: | :---- |

## **3.10 Layout del panel administrador**

El panel admin debe ser completamente usable desde un smartphone. El comerciante gestiona pedidos en tiempo real desde el celular mientras atiende el local. Este es un requerimiento crítico que Pedix no cumple bien en su versión actual.

| ID | Funcionalidad | Descripción técnica | Vista / Componente Angular | Prio |
| :---- | :---- | :---- | :---- | ----- |
| **A-001** | **Layout responsivo del admin** | Móvil: bottom navigation bar con 4 tabs (Dashboard, Pedidos, Catálogo, Config). Desktop: sidebar colapsable \+ topbar. | AdminLayoutComponent, BottomNavComponent, SidebarComponent |  |
| **A-002** | **Dashboard principal** | Métricas del día: pedidos totales, facturación, ticket promedio. Gráfico de barras de pedidos por hora. Últimos 5 pedidos. Acceso rápido a acciones frecuentes. | admin/dashboard — DashboardComponent |  |
| **A-003** | **Topbar del admin** | Logo del comercio, nombre, botón 'Ver tienda', notificaciones, menú de usuario. | AdminTopbarComponent |  |
| **A-004** | **Estadísticas básicas** | Ventas del día/semana/mes. Productos más pedidos (top 5). Comparativa vs período anterior. | admin/analytics — AnalyticsComponent |  |
| **A-005** | **Onboarding wizard** | Wizard de 5 pasos para nuevos comercios: info, logo, primera categoría, primer producto, configurar entrega. Con barra de progreso y posibilidad de completar luego. | OnboardingWizardComponent |  |
| **A-006** | **Notificaciones in-app** | Centro de notificaciones para eventos importantes: pedido nuevo, stock bajo (futuro), configuración pendiente. | NotificationCenterComponent |  |

## **3.11 Estructura de navegación del admin**

| Ruta | Componente | Descripción | Guard |
| :---- | :---- | :---- | :---- |
| /admin | /admin/dashboard | Redirect a dashboard | authGuard |
| /admin/dashboard | DashboardComponent | Métricas y resumen del día | authGuard |
| /admin/orders | OrdersKanbanComponent | Centro de pedidos Kanban | authGuard |
| /admin/orders/list | OrdersListComponent | Vista tabla de pedidos | authGuard |
| /admin/catalog/categories | CategoriesListComponent | Gestión de categorías | authGuard |
| /admin/catalog/products | ProductsListComponent | Listado de productos | authGuard |
| /admin/catalog/products/new | ProductFormComponent | Crear producto | authGuard |
| /admin/catalog/products/:id/edit | ProductFormComponent | Editar producto | authGuard |
| /admin/settings | SettingsLayoutComponent | Panel de configuración | authGuard |
| /admin/settings/info | StoreInfoFormComponent | Información del negocio | authGuard |
| /admin/settings/hours | HoursEditorComponent | Horarios de atención | authGuard |
| /admin/settings/delivery | DeliverySettingsComponent | Formas de entrega | authGuard |
| /admin/settings/payments | PaymentMethodsComponent | Métodos de pago | authGuard |
| /admin/settings/theme | ThemeEditorComponent | Tema visual | authGuard |

| VISTA: Dashboard | Ruta: admin/dashboard |
| :---- | :---- |
| **Descripción** | Página de inicio del admin. Primera vista al entrar. Debe comunicar el estado del negocio de un vistazo. |
| **Componentes** | DashboardComponent, MetricCardComponent, OrderMiniListComponent, HourlyChartComponent, QuickActionsComponent |
| **@Input / Props** | — |
| **@Output / Events** | — |
| **Services** | OrdersService, AnalyticsService |
| **Notas UX** | MÉTRICAS DEL DÍA (4 cards en grid 2x2 en móvil, 4x1 en desktop): Pedidos hoy (número grande \+ delta vs ayer), Facturación hoy ($), Ticket promedio ($), Pedidos pendientes (en rojo si \> 0). PEDIDOS ACTIVOS: lista de los últimos pedidos con estado, hace cuánto tiempo llegaron. Si hay pedidos 'Nuevo' sin confirmar, mostrar alerta naranja. ACCIONES RÁPIDAS: botón flotante con 3 opciones: Nuevo pedido manual, Ver tienda, Agregar producto. GRÁFICO: barras de pedidos por hora del día (últimas 12hs). Generado con Chart.js o Recharts. ESTADO DE LA TIENDA: toggle grande de 'Tienda Abierta / Tienda Cerrada' que sobreescribe los horarios configurados. |

| MOD-06 | AUTENTICACIÓN Y SEGURIDAD Login, registro, protección de rutas y gestión de sesión. |
| :---: | :---- |

| ID | Funcionalidad | Descripción técnica | Vista / Componente Angular | Prio |
| :---- | :---- | :---- | :---- | ----- |
| **AU-001** | **Registro de comerciante** | Formulario: email, contraseña (req, mín 8 chars, indicador de fortaleza), nombre del negocio, teléfono. Email de confirmación. | auth/register — RegisterComponent |  |
| **AU-002** | **Login** | Email \+ contraseña. Remember me. Manejo de errores inline. Redirect a /admin/dashboard al autenticar. | auth/login — LoginComponent |  |
| **AU-003** | **Auth Guard** | Proteger todas las rutas /admin. Redirect a /auth/login si no autenticado. Guardar URL de retorno. | authGuard (functional guard) |  |
| **AU-004** | **JWT \+ Refresh Token** | Access token 15min en memoria, refresh token 7d en httpOnly cookie. Interceptor para renovar automáticamente. | AuthInterceptor, AuthService |  |
| **AU-005** | **Logout** | Limpiar tokens, estado de la app y redirigir a login. Invalidar refresh token en el servidor. | AuthService.logout() |  |
| **AU-006** | **Recuperar contraseña** | Formulario de email para solicitar reset. Página de nueva contraseña desde el link del email. | auth/forgot-password, auth/reset-password |  |

| SECCIÓN 4 COMPONENTES COMPARTIDOS (SHARED) Catálogo de componentes reutilizables. Deben construirse antes que los módulos. |
| :---- |

# **4.1 Componentes shared obligatorios**

Todos los componentes shared deben ser standalone, genéricos (no atados a ningún dominio de negocio), documentados con @Input/@Output explícitos, y accesibles (ARIA labels donde corresponda).

| Componente | Selector | @Input | @Output | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| ButtonComponent | app-button | label, variant (primary/secondary/ghost/danger), size (sm/md/lg), loading, disabled, icon | click | Botón base del sistema. Maneja estado de carga con spinner inline. Nunca usar \<button\> nativo sin este componente. |
| CardComponent | app-card | elevation (0-3), padding, clickable | cardClick | Contenedor con sombra y bordes redondeados. Base para product-card, category-card, metric-card. |
| ModalComponent | app-modal | title, size (sm/md/lg/full), showClose, persistent | closed | Overlay modal con trampa de foco (a11y). Animación slide-up en móvil, fade+scale en desktop. |
| BottomSheetComponent | app-bottom-sheet | title, height (auto/half/full) | closed | Componente nativo para móvil. Handle drag para cerrar. Backdrop con blur. |
| SkeletonLoaderComponent | app-skeleton | type (text/card/list/grid), count | — | Placeholder animado con shimmer. Usar SIEMPRE en lugar de spinner mientras carga contenido. |
| EmptyStateComponent | app-empty-state | icon, title, message, actionLabel | actionClick | Estado vacío estándar con ilustración SVG, título, mensaje y CTA opcional. |
| ToastComponent | app-toast (service) | message, type (success/error/info/warning), duration | — | Notificaciones temporales. Posición: top-center móvil, bottom-right desktop. |
| ImageUploaderComponent | app-image-uploader | maxFiles, maxSizeMb, accept | filesChanged, uploadError | Drag & drop \+ click. Preview con miniatura. Compresión con browser-image-compression antes de enviar. |
| QuantitySelectorComponent | app-quantity-selector | value, min, max | valueChange | Selector \+/- con input numérico editable. Animación bounce al cambiar. |
| BadgeComponent | app-badge | label, color, size | — | Chips/etiquetas de estado. Colores semánticos: success/warning/error/info/neutral. |
| SearchBarComponent | app-search-bar | placeholder, debounceMs | searchChange | Input con ícono lupa, botón clear, debounce configurable. |
| ConfirmModalComponent | app-confirm-modal | title, message, confirmLabel, confirmColor | confirmed, cancelled | Modal de confirmación destructiva. Botón confirm deshabilitado 1s para evitar clics accidentales. |

# **4.2 Servicios core obligatorios**

| Servicio | Responsabilidad | Métodos clave |
| :---- | :---- | :---- |
| ApiService | Wrapper de HttpClient. Base URL, headers, error handling centralizado. | get\<T\>(), post\<T\>(), put\<T\>(), patch\<T\>(), delete\<T\>(). Todos retornan Observable\<T\>. Intercepta 401 para refresh. |
| AuthService | Estado de autenticación. JWT management. Signals para isAuthenticated, currentUser. | login(), logout(), register(), refreshToken(), getUser() — signal readonly. |
| CartService | Estado del carrito con Signals. Persistencia en localStorage. | addItem(), removeItem(), updateQty(), clear(), items signal, total computed, count computed. |
| StoreService | Datos del tenant activo. Cacheado para la sesión. | getStoreBySlug(slug): Observable\<Store\>. Expone store signal con datos del comercio activo. |
| TenantThemeService | Aplicar CSS variables del tenant al documento. | applyTheme(colors: ThemeConfig): void. Lee la config del StoreService y hace setProperty en :root. |
| OrdersService | CRUD de pedidos \+ WebSocket para tiempo real. | getOrders(), updateStatus(), createOrder(), onNewOrder(): Observable\<Order\> (WebSocket). |
| WebSocketService | Abstracción de Socket.io. Reconexión automática. | connect(tenantId), on\<T\>(event): Observable\<T\>, emit(event, data), disconnect(). |
| ToastService | Mostrar notificaciones de feedback. | success(msg), error(msg), info(msg), warning(msg). Duración configurable. |
| PrintService | Generar y disparar impresión de pedidos. | printOrder(order: Order, format: 'a4' | 'ticket'): void. Genera iframe oculto con estilos de impresión. |

| SECCIÓN 5 ESPECIFICACIÓN DEL BACKEND API NestJS · PostgreSQL · WebSocket · Multi-tenant |
| :---- |

# **5.1 Estructura de módulos NestJS**

src/  
├── main.ts  
├── app.module.ts  
├── modules/  
│   ├── auth/  
│   │   ├── auth.module.ts  
│   │   ├── auth.controller.ts  
│   │   ├── auth.service.ts  
│   │   ├── strategies/ (jwt.strategy.ts, local.strategy.ts)  
│   │   └── dto/ (login.dto.ts, register.dto.ts)  
│   ├── tenants/  
│   │   ├── tenants.module.ts  
│   │   ├── tenants.controller.ts  
│   │   ├── tenants.service.ts  
│   │   └── entities/ (tenant.entity.ts, store-settings.entity.ts)  
│   ├── catalog/  
│   │   ├── catalog.module.ts  
│   │   ├── categories.controller.ts  
│   │   ├── products.controller.ts  
│   │   ├── catalog.service.ts  
│   │   └── entities/ (category.entity.ts, product.entity.ts, option-group.entity.ts)  
│   ├── orders/  
│   │   ├── orders.module.ts  
│   │   ├── orders.controller.ts  
│   │   ├── orders.service.ts  
│   │   ├── orders.gateway.ts   (WebSocket)  
│   │   └── entities/ (order.entity.ts, order-item.entity.ts)  
│   └── upload/  
│       ├── upload.module.ts  
│       └── upload.service.ts   (Cloudinary / S3)  
├── common/  
│   ├── decorators/ (tenant-id.decorator.ts, current-user.decorator.ts)  
│   ├── guards/ (jwt-auth.guard.ts, tenant.guard.ts)  
│   ├── interceptors/ (tenant-context.interceptor.ts)  
│   └── filters/ (http-exception.filter.ts)  
└── config/ (database.config.ts, jwt.config.ts)

# **5.2 Endpoints REST del MVP**

| Método | Endpoint | Auth | Descripción |
| :---- | :---- | :---- | :---- |
| POST | /auth/register | — | Registro de nuevo comerciante. Crea tenant \+ usuario admin. |
| POST | /auth/login | — | Login. Retorna access\_token \+ seta refresh\_token en httpOnly cookie. |
| POST | /auth/refresh | Cookie | Renueva access\_token usando refresh\_token. |
| POST | /auth/logout | JWT | Invalida refresh\_token en BD. |
| GET | /stores/:slug | — | Datos públicos del comercio (para tienda pública). Sin auth. |
| GET | /stores/:slug/status | — | Estado abierto/cerrado calculado por horarios. Sin auth. |
| PATCH | /stores/me | JWT | Actualizar configuración del comercio propio. |
| GET | /stores/me/settings | JWT | Obtener toda la configuración del comercio. |
| GET | /:slug/categories | — | Listado de categorías activas (tienda pública). |
| GET | /admin/categories | JWT | Listado de categorías (admin, incluye inactivas). |
| POST | /admin/categories | JWT | Crear categoría. |
| PUT | /admin/categories/:id | JWT | Editar categoría. |
| DELETE | /admin/categories/:id | JWT | Eliminar categoría (validar sin productos). |
| PATCH | /admin/categories/reorder | JWT | Reordenar categorías. Body: { ids: string\[\] } |
| GET | /:slug/categories/:id/products | — | Productos activos de una categoría (tienda pública). |
| GET | /:slug/products/featured | — | Productos destacados (tienda pública). |
| GET | /:slug/products/search | — | Búsqueda de productos. Query: q=string. |
| GET | /admin/products | JWT | Listado de productos (admin). Filtros por categoría, estado. |
| GET | /admin/products/:id | JWT | Detalle de producto (admin). |
| POST | /admin/products | JWT | Crear producto con opciones. |
| PUT | /admin/products/:id | JWT | Editar producto completo. |
| PATCH | /admin/products/:id/status | JWT | Toggle activo/inactivo. |
| DELETE | /admin/products/:id | JWT | Eliminar producto. |
| POST | /upload/image | JWT | Upload de imagen. Retorna { url, publicId } |
| POST | /orders | — | Crear pedido (desde tienda pública). Sin auth requerida. |
| GET | /admin/orders | JWT | Listado de pedidos del comercio. Filtros y paginación. |
| GET | /admin/orders/:id | JWT | Detalle de pedido. |
| PATCH | /admin/orders/:id/status | JWT | Cambiar estado del pedido. |
| POST | /admin/orders | JWT | Crear pedido manual desde el admin. |
| PATCH | /admin/orders/:id/notes | JWT | Actualizar notas internas del pedido. |
| GET | /admin/analytics/summary | JWT | Métricas del día/semana/mes. |
| GET | /admin/analytics/hourly | JWT | Pedidos por hora del día. |

# **5.3 WebSocket — Eventos de pedidos en tiempo real**

| Evento | Dirección | Payload | Descripción |
| :---- | :---- | :---- | :---- |
| join-tenant | Client → Server | { tenantId: string } | El admin se une a la sala del tenant al abrir el panel. |
| order:new | Server → Client | Order (completo) | Nuevo pedido recibido. Trigger notificación sonora. |
| order:status-changed | Server → Client | { orderId, newStatus, changedAt } | El estado de un pedido cambió (puede ser desde otro dispositivo). |
| order:cancelled | Server → Client | { orderId, reason? } | Pedido cancelado. |
| tenant:store-status | Server → Client | { isOpen: boolean } | Cambio de estado de la tienda (abierto/cerrado). |

# **5.4 Estrategia multi-tenant**

El aislamiento de datos entre comercios se implementa mediante tenant\_id en cada tabla de la base de datos. El tenant\_id se extrae del JWT en cada request autenticado y se inyecta automáticamente en todas las queries mediante el TenantContextInterceptor.

// common/interceptors/tenant-context.interceptor.ts  
// El interceptor extrae el tenantId del JWT y lo adjunta al request.  
// El TenantService luego usa este contexto en todos los repositorios.

// Todos los entities tienen:  
@Column({ name: 'tenant\_id' })  
tenantId: string;

// Todos los servicios filtran por tenantId:  
async getCategories(tenantId: string): Promise\<Category\[\]\> {  
  return this.categoryRepo.find({  
    where: { tenantId, isActive: true },  
    order: { order: 'ASC' }  
  });  
}

| SECCIÓN 6 GUÍAS DE UX/UI Y DISEÑO Patrones de interacción, animaciones y principios de diseño obligatorios |
| :---- |

# **6.1 Principios de diseño no negociables**

|  | 1️⃣ Mobile-first absoluto:  Diseñar y codificar siempre para 360px primero. Agregar adaptaciones para pantallas más grandes con @include respond-to(). NUNCA diseñar desktop y luego 'hacer que funcione' en móvil. |
| :---- | :---- |

|  | 2️⃣ Feedback inmediato:  Cada acción del usuario debe tener respuesta visual en menos de 100ms. Usar optimistic updates donde sea posible: mostrar el resultado antes de la confirmación del servidor. |
| :---- | :---- |

|  | 3️⃣ Estados de carga explícitos:  NUNCA mostrar una pantalla vacía mientras carga. Siempre usar SkeletonLoaderComponent. NUNCA usar el spinner de Angular Material solo (es confuso sin contexto). |
| :---- | :---- |

|  | 4️⃣ Errores accionables:  Los mensajes de error deben decirle al usuario qué hacer, no solo qué salió mal. Incluir siempre una acción de recuperación (reintentar, volver, contactar soporte). |
| :---- | :---- |

|  | 5️⃣ Reutilización estricta:  Nunca duplicar HTML de un componente. Si algo se repite más de una vez, crear un componente shared. Los colores NUNCA hardcodeados: siempre usar variables CSS. |
| :---- | :---- |

# **6.2 Animaciones y micro-interacciones**

| Interacción | Tipo de animación | Duración | Implementación |
| :---- | :---- | :---- | :---- |
| Navegar entre páginas | Slide horizontal o fade | 300ms | Router Animation con @angular/animations. Left→Right para avanzar, Right→Left para retroceder. |
| Abrir bottom sheet | Slide desde abajo | 250ms ease-out | Transform translateY(100%) → translateY(0). Backdrop opacity 0 → 0.5. |
| Cerrar bottom sheet | Slide hacia abajo | 200ms ease-in | Inverso al abrir. Al backdrop click. |
| Agregar al carrito | Scale bounce en el badge | 400ms spring | badge: scale(1) → scale(1.4) → scale(1). keyframes CSS. |
| Toast aparece | Fade \+ slide desde arriba | 200ms | Opacity \+ translateY. Auto-cierre a los 3s con fade-out. |
| Hover en cards (desktop) | Elevación \+ scale leve | 200ms | box-shadow upgrade \+ transform: scale(1.02). |
| Loading de página | Shimmer de derecha a izquierda | 1.5s loop | background-position animation. Usar en SkeletonLoader. |
| Toggle activo/inactivo | Slide del thumb | 200ms | Material toggle personalizado con colores del tema. |
| Confirmación de pedido | Checkmark animado \+ confetti | 600ms | SVG stroke-dashoffset animation. Confetti con canvas-confetti. |

# **6.3 Tipografía y espaciado**

| Elemento | Tamaño | Peso | Uso |
| :---- | :---- | :---- | :---- |
| Display / Precio grande | 32-40px | 700 Bold | Precio destacado en detalle de producto, total en carrito. |
| H1 — Título de página | 24-28px | 700 Bold | Nombre del comercio en header, título de secciones principales. |
| H2 — Subtítulo de sección | 20-22px | 600 Semibold | Nombre de categoría, título de card de pedido. |
| H3 — Nombre de ítem | 16-18px | 600 Semibold | Nombre de producto, nombre de pedido. |
| Body — Descripción | 14-16px | 400 Regular | Descripción de productos, textos de ayuda. |
| Caption — Metadatos | 12-13px | 400 Regular | Timestamps, 'hace X min', precio adicional de opciones. |
| Label — Botones y chips | 13-14px | 500 Medium | Texto en botones, badges de estado, chips de filtro. |

# **6.4 Patrones de formularios**

Todos los formularios del sistema deben seguir estos estándares sin excepción:

* Validación en tiempo real al blur (perder foco), no al submit. El usuario no debe llegar al submit para descubrir errores.

* Mensajes de error descriptivos debajo del campo: 'El teléfono debe tener al menos 10 dígitos' en lugar de 'Formato inválido'.

* Campos requeridos marcados con asterisco (\*) y texto auxiliar 'Campos obligatorios' al inicio del formulario.

* Estado de loading en el botón de submit mientras procesa: deshabilitar \+ spinner inline.

* Éxito: toast de confirmación \+ redirect o cierre del formulario. No mostrar el formulario vacío después de guardar.

* Para formularios largos (\>5 campos): secciones colapsables o stepper. Guardar progreso en localStorage.

| SECCIÓN 7 CRITERIOS DE ACEPTACIÓN DEL MVP Checklist técnico y funcional para aprobar el desarrollo |
| :---- |

# **7.1 Criterios de aceptación por módulo**

| ID | Criterio | Módulo | Tipo |
| :---- | :---- | :---- | :---- |
| CA-001 | El cliente puede completar el flujo completo (home → categoría → detalle → carrito → checkout → WhatsApp) en un smartphone 360px sin errores. | MOD-02 | Funcional |
| CA-002 | El mensaje de WhatsApp generado contiene todos los ítems con variantes, precio correcto, datos del cliente y total exacto. | MOD-02 | Funcional |
| CA-003 | Al llegar un pedido nuevo al admin, aparece una notificación sonora y visual en menos de 2 segundos sin recargar la página. | MOD-03 | Rendimiento |
| CA-004 | El administrador puede cambiar el estado de un pedido y el cambio se refleja inmediatamente en el kanban (sin reload). | MOD-03 | Funcional |
| CA-005 | Al crear un producto con variantes requeridas, el cliente NO puede agregar al carrito sin seleccionarlas. Muestra error inline. | MOD-01/02 | Validación |
| CA-006 | Los colores del tema configurados por el comercio se aplican correctamente en la tienda pública al cargar. | MOD-04/02 | Visual |
| CA-007 | El indicador de abierto/cerrado en la tienda es correcto al comparar la hora actual con los horarios configurados, incluyendo cortes de turno. | MOD-04/02 | Lógica |
| CA-008 | Todas las vistas cuentan con skeleton loader durante la carga. No hay pantallas en blanco. | Todos | UX |
| CA-009 | Todos los formularios validan correctamente y muestran errores descriptivos inline. No se puede enviar un formulario inválido. | Todos | Validación |
| CA-010 | La aplicación funciona correctamente en Chrome/Safari/Firefox mobile y desktop (últimas 2 versiones). | Todos | Compatibilidad |
| CA-011 | El carrito persiste en localStorage. Si el usuario cierra y reabre el browser, los ítems siguen ahí. | MOD-02 | Funcional |
| CA-012 | El panel admin es completamente usable en viewport 375px (iPhone SE). Bottom nav visible y funcional. | MOD-05 | Responsive |
| CA-013 | El tiempo de carga inicial de la tienda pública (LCP) es menor a 2.5s en conexión 4G simulada. | MOD-02 | Rendimiento |
| CA-014 | Todas las imágenes tienen lazy loading. Se usa el formato WebP cuando el navegador lo soporta. | Todos | Rendimiento |
| CA-015 | Las rutas del admin están protegidas. Acceder sin token redirige a /auth/login y guarda la URL de retorno. | MOD-06 | Seguridad |

# **7.2 Métricas de performance objetivo**

| Métrica | Objetivo | Herramienta de medición |
| :---- | :---- | :---- |
| Largest Contentful Paint (LCP) | \< 2.5s (conexión 4G) | Lighthouse, WebPageTest |
| First Input Delay (FID) | \< 100ms | Lighthouse |
| Cumulative Layout Shift (CLS) | \< 0.1 | Lighthouse |
| Bundle size inicial (lazy) | \< 200KB gzipped por módulo | webpack-bundle-analyzer |
| Tiempo hasta primer pedido visible (admin) | \< 1.5s después de login | Performance DevTools |
| Latencia WebSocket (nuevo pedido) | \< 500ms desde creación en BD | Network DevTools |

| SECCIÓN 8 PLAN DE IMPLEMENTACIÓN Orden recomendado de desarrollo para el agente IA |
| :---- |

# **8.1 Orden de implementación recomendado**

|  | 🤖 Instrucción para el agente de desarrollo:  Seguir este orden estrictamente. Cada fase debe estar completa y sin errores antes de avanzar a la siguiente. Ejecutar prueba funcional al finalizar cada fase. |
| :---- | :---- |

| Fase | Orden | Tarea | Dependencias | Entregable de validación |
| :---- | :---- | :---- | :---- | :---- |
| F0 | 1 | Setup del proyecto Angular 19 \+ NestJS con Docker | — | docker-compose up levanta ambos servicios sin errores |
| F0 | 2 | Configurar SCSS variables, breakpoints y tipografía global | — | Storybook o página de muestra con tokens visuales |
| F0 | 3 | Implementar todos los componentes shared (Button, Card, Modal, Skeleton, Toast, etc.) | F0-2 | Render correcto de cada componente en todas las variantes |
| F1 | 4 | Backend: entidades TypeORM \+ migraciones (Tenant, User, Category, Product, Order) | F0 | Migraciones ejecutan sin errores. Tablas creadas en BD. |
| F1 | 5 | Backend: módulo auth (register, login, JWT, refresh token) | F1-4 | POST /auth/register y /auth/login funcionan. JWT válido retornado. |
| F1 | 6 | Frontend: módulo auth (login, registro, guard, interceptor) | F1-5 | Login funciona. /admin redirige a login si no autenticado. |
| F2 | 7 | Backend: CRUD categorías \+ CRUD productos con opciones | F1-4 | Todos los endpoints de catálogo responden correctamente con Postman. |
| F2 | 8 | Frontend admin: gestión de categorías (listado, form, eliminar) | F1-6, F2-7 | CRUD completo de categorías en el panel admin. |
| F2 | 9 | Frontend admin: gestión de productos (listado, form completo con variantes, upload imágenes) | F2-8 | CRUD completo de productos con imágenes y variantes. |
| F3 | 10 | Backend: módulo configuración de tienda (info, horarios, entrega, pagos, tema) | F1-4 | GET y PATCH /stores/me retornan y actualizan correctamente. |
| F3 | 11 | Frontend admin: panel de configuración completo (todas las secciones) | F3-10 | Guardar cualquier configuración persiste y se refleja. |
| F3 | 12 | Frontend: servicio TenantThemeService — aplicar colores CSS al cargar | F3-11 | Cambiar color en config → recarga tienda → color aplicado. |
| F4 | 13 | Frontend tienda: home, grilla de categorías, listado de productos | F2-7, F3-10 | Tienda pública renderiza correctamente para el slug configurado. |
| F4 | 14 | Frontend tienda: detalle de producto con variantes, selector de cantidad | F4-13 | Selección de variantes funciona. Validación de grupos requeridos. |
| F4 | 15 | Frontend tienda: carrito (drawer/sheet), persistencia en localStorage | F4-14 | Agregar/quitar ítems. Carrito persiste al recargar página. |
| F5 | 16 | Frontend tienda: checkout (2 pasos), validaciones, WhatsApp dispatch | F4-15 | Flujo completo funciona. Mensaje WhatsApp correcto. |
| F5 | 17 | Frontend tienda: pantalla de confirmación de pedido | F5-16 | POST /orders crea el pedido en BD. Pantalla de confirmación con número. |
| F6 | 18 | Backend: WebSocket gateway para pedidos en tiempo real | F1-4 | Nuevo pedido emitido por WebSocket al room del tenant. |
| F6 | 19 | Frontend admin: kanban de pedidos \+ WebSocket listener | F6-18 | Nuevo pedido aparece en kanban en tiempo real. Notificación sonora. |
| F6 | 20 | Frontend admin: detalle de pedido, cambio de estado | F6-19 | Cambiar estado en un pedido. Kanban actualiza sin reload. |
| F7 | 21 | Frontend admin: dashboard con métricas y gráfico | F6-20 | Dashboard carga métricas del día y gráfico de pedidos por hora. |
| F7 | 22 | Búsqueda en tienda (barclient-side \+ backend) | F2-7 | Buscar 'mila' retorna todos los productos con 'mila' en nombre/descripción. |
| F7 | 23 | Onboarding wizard para nuevos comercios | F3-11 | Nuevo usuario ve el wizard. Completarlo configura la tienda básica. |
| F8 | 24 | QA integral: prueba del flujo completo en móvil 360px | Todas | Sin errores. LCP \< 2.5s. Kanban en tiempo real funciona. |
| F8 | 25 | Optimización de performance: lazy loading, WebP, bundle splitting | F8-24 | Lighthouse score \> 80 en Performance para tienda pública. |

| RESUMEN EJECUTIVO DEL MVP Este documento especifica un MVP de 8 módulos, 25 fases de desarrollo y 65+ funcionalidades específicas. La implementación en Angular 19 con standalone components, signals y mobile-first garantiza una base técnica moderna y escalable. El panel administrador con kanban en tiempo real y la tienda pública con experiencia premium superan las capacidades actuales de Pedix en diseño, UX y funcionalidades de gestión. La arquitectura multi-tenant sobre PostgreSQL \+ NestJS permite escalar a cientos de comercios sin cambios estructurales. 95 funcionalidades documentadas  ·  6 módulos frontend  ·  1 backend NestJS  ·  25 fases de desarrollo |
| :---- |

