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

## 4. Especificaciones Técnicas (Angular 19)

### Componentes Clave
- `CategoriesListComponent`: Gestión visual de categorías.
- `ProductFormComponent`: Formulario reactivo completo para productos.
- `OptionGroupEditorComponent`: Editor dinámico de variantes.

### Servicios
- `CatalogService`: CRUD de categorías y productos.
- `UploadService`: Gestión de subida de imágenes a Cloudinary/S3.

## 5. Criterios de Aceptación
- CA-001: El administrador puede crear una categoría con imagen.
- CA-002: El reordenamiento de categorías persiste en la base de datos.
- CA-003: Al desactivar un producto, este desaparece de la tienda pública inmediatamente.
