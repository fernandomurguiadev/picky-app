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
  isGroupPricingEnabled: boolean;
  groupPrice: number | null;
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

## 6. Precios Grupales por Categoría

### Requisitos
- El sistema DEBE permitir habilitar o deshabilitar precios grupales a nivel categoría (`isGroupPricingEnabled`).
- El sistema DEBE requerir un `groupPrice` >= 0 (en centavos) si `isGroupPricingEnabled` es `true`.
- El sistema DEBE conservar el valor de `groupPrice` en DB cuando `isGroupPricingEnabled` se pone en `false` (sin modificar precios de productos).
- El sistema DEBE sincronizar físicamente el precio de todos los productos de una categoría dentro de la misma transacción cada vez que el precio grupal se habilita o cambia.
- El response de `updateCategory` DEBE incluir `updatedProductsCount` indicando cuántos productos fueron sincronizados.
- Al crear o actualizar un producto, si su categoría tiene precios grupales habilitados, el sistema DEBE ignorar el precio del payload e inyectar `category.groupPrice`.
- Al mover un producto a una categoría con precio grupal, el sistema DEBE aplicar automáticamente ese precio grupal.
- Al mover un producto a una categoría sin precio grupal, el sistema DEBE conservar el precio actual del producto y devolver `priceInherited: true` en el response.
- En el panel de administración, el formulario de producto DEBE bloquear el input de precio si la categoría seleccionada tiene precios grupales activos.
- En el panel de administración, el formulario de producto DEBE mostrar un warning si el producto viene de una categoría grupal y fue movido a una normal (`priceInherited: true`).

### Escenarios
**Escenario 1: Habilitar Precio Grupal en una Categoría Existente**
DADO una categoría "Remeras" con 50 productos con distintos precios
CUANDO el administrador edita la categoría, habilita "Precio Grupal" y setea $10.000
ENTONCES el backend actualiza la categoría dentro de una transacción
Y actualiza `price = 1000000` en los 50 productos de esa categoría
Y el response incluye `updatedProductsCount: 50`

**Escenario 2: Cambiar el Precio Grupal de una Categoría Activa**
DADO que la categoría "Remeras" ya tiene precio grupal de $10.000
CUANDO el administrador cambia el precio grupal a $12.000
ENTONCES el backend sincroniza los productos con el nuevo precio
Y el response incluye `updatedProductsCount: N`

**Escenario 3: Deshabilitar el Precio Grupal**
DADO que la categoría "Remeras" tiene precio grupal de $10.000
CUANDO el administrador desactiva el toggle "Precio Grupal"
ENTONCES el backend guarda `isGroupPricingEnabled = false` conservando `groupPrice = 1000000` en DB
Y los productos conservan su precio actual (no se modifican)
Y el response incluye `updatedProductsCount: 0`

**Escenario 4: Crear Producto en Categoría Grupal**
DADO que la categoría "Remeras" tiene precio grupal de $10.000
CUANDO el administrador crea un producto en esa categoría
ENTONCES el frontend bloquea el campo de precio y muestra el precio de la categoría
Y el backend guarda el producto con `price = 1000000` ignorando el payload

**Escenario 5: Mover Producto a Categoría con Precio Grupal**
DADO un producto "Remera Básica" con `price = 800000` en una categoría normal
CUANDO el administrador lo mueve a la categoría "Remeras" (precio grupal $10.000)
ENTONCES el backend guarda `price = 1000000` en el producto

**Escenario 6: Mover Producto a Categoría Normal**
DADO un producto "Remera Básica" con `price = 1000000` heredado de precio grupal
CUANDO el administrador lo mueve a la categoría "Pantalones" (sin precio grupal)
ENTONCES el backend conserva `price = 1000000` en el producto
Y el response incluye `priceInherited: true`
Y el frontend muestra un Alert: "Este producto conserva el precio de su categoría anterior. Revisá si debés actualizarlo."

**Escenario 7: Modificador de Variante en Producto Grupal**
DADO un producto en una categoría con precio grupal de $10.000
CUANDO un cliente agrega al carrito la variante "Talle XXL" con modificador +$2.000
ENTONCES el precio final guardado en `OrderItem.unitPrice` es $12.000
