# Módulo MOD-01: Gestión del Catálogo

## 1. Visión General
El módulo de Gestión del Catálogo permite a los administradores del comercio gestionar la oferta de productos y categorías. Es el núcleo de la información que se muestra en la tienda pública.

## 2. Funcionalidades (Back-office)

| ID | Funcionalidad | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **C-001** | **Listado de categorías** | Vista grilla con cards. Drag & drop para reordenar. | Alta |
| **C-002** | **Crear / editar categoría** | Formulario con nombre, imagen y estado activo/inactivo. | Alta |
| **C-003** | **Eliminar categoría** | Modal de confirmación. Validación de productos vinculados. | Media |
| **C-004** | **Listado de productos** | Tabla con filtros por categoría, estado y búsqueda. | Alta |
| **C-005** | **Crear / editar producto** | Formulario multi-sección: info, imágenes, precio, variantes. | Alta |
| **C-006** | **Variantes y opciones** | Grupos de opciones (radio/checkbox) con precios adicionales. | Alta |
| **C-007** | **Toggle de estado** | Activación/desactivación rápida desde el listado. | Alta |
| **C-008** | **Upload de imágenes** | Drag & drop con preview y compresión client-side. | Media |

## 3. Modelo de Datos (Dominio)

### Category
```typescript
export interface Category {
  id: string;
  tenantId: string;
  name: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  productCount?: number;
}
```

### Product
```typescript
export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  images: ProductImage[];
  optionGroups: OptionGroup[];
  isActive: boolean;
  isFeatured: boolean;
  order: number;
}
```

## 4. Especificaciones Técnicas (Next.js 15)

### Arquitectura de Rutas (`app/`)
- `(admin)/dashboard/categories/page.tsx`: Listado visual interactivo de categorías con dnd-kit (RCC).
- `(admin)/dashboard/products/page.tsx`: Datatable avanzado de shadcn/ui con server filtering (RSC/RCC).
- `(admin)/dashboard/products/new/page.tsx`: Formulario de creación con React Hook Form + Zod.

### Componentes de Interfaz (shadcn/ui)
- `CategoryGrid`: Reordenamiento mediante arrastre usando **dnd-kit** (RCC).
- `ProductForm`: Formulario persistido localmente ante pérdida de conexión usando Zod y control de inputs del UI kit (RCC).
- `VariantEditor`: Editor de fields dinámicos (`useFieldArray` de React Hook Form).

### Data Fetching y Mutaciones (TanStack Query)
- `useCategories()`: Hook para query con refetch automático en mutaciones.
- `useUpsertProduct()`: Hook de mutación que invalida `['products']` al completar el guardado de manera exitosa.
- `UploadWidget`: Integración cliente/servidor para upload directo firmado a S3/Cloudinary.


## 5. Criterios de Aceptación
- CA-001: El administrador puede crear una categoría con imagen.
- CA-002: El reordenamiento de categorías persiste en la base de datos.
- CA-003: Al desactivar un producto, este desaparece de la tienda pública inmediatamente.
