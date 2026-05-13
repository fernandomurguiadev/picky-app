# MOD-01 — Gestión del Catálogo

> Origen: Frontend Admin + Backend API
> Rutas: `/admin/catalog/categories`, `/admin/catalog/products`

---

## 3.1 Tabla de funcionalidades

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| C-001 | Listado de categorías | Vista grilla con cards. Drag & drop para reordenar con @dnd-kit/core. Indicador de cantidad de productos. | /admin/catalog/categories — CategoriesListPage | 🔴 |
| C-002 | Crear / editar categoría | Formulario RHF+Zod: nombre (req), imagen (upload con preview), estado activo/inactivo. Validación inline. | CategoryFormDialog (shadcn Dialog) | 🔴 |
| C-003 | Eliminar categoría | Confirmar con ConfirmModal. Bloquear si tiene productos activos. | ConfirmModal component | 🔴 |
| C-004 | Listado de productos | Tabla con filtro por categoría, estado y búsqueda. **Paginación server-side con PaginationComponent.** | /admin/catalog/products — ProductsListPage | 🔴 |
| C-005 | Crear / editar producto | Form multi-sección: info básica, imágenes (hasta 5, upload múltiple, reordenable), precio, variantes, estado. **Autoguardado en localStorage cada 30s.** | /admin/catalog/products/new — ProductFormPage | 🔴 |
| C-006 | Variantes y opciones | Grupos de opciones en el form del producto: tipo radio/checkbox, items con nombre y precio adicional. Add/remove dinámico con useFieldArray (RHF). | OptionGroupEditor (embebido en ProductForm) | 🔴 |
| C-007 | Activar / desactivar producto | Toggle rápido en la lista sin abrir el form. Optimistic update. | ProductsListPage — inline toggle | 🔴 |
| C-008 | Upload de imágenes | Drag & drop o click. Preview inmediato. Compresión client-side con browser-image-compression antes de enviar. Progress indicator. | ImageUploaderComponent (shared) | 🔴 |
| C-009 | Buscador de productos (admin) | Input con debounce 300ms via useDebounce hook. Búsqueda por nombre contra API. | SearchBarComponent | 🔴 |
| C-010 | Productos destacados | Checkbox 'Destacado' en el form. Sección en home de la tienda con productos marcados. | ProductFormPage — campo isFeatured | 🟡 |

---

## 3.2 Interfaces TypeScript

```typescript
// lib/types/catalog.types.ts

export interface Category {
  id: string
  tenantId: string
  name: string
  imageUrl: string
  order: number
  isActive: boolean
  productCount?: number
  createdAt: string
  updatedAt: string
}

export interface OptionItem {
  id: string
  name: string
  priceModifier: number   // 0 si no tiene precio adicional
  isDefault: boolean
}

export interface OptionGroup {
  id: string
  name: string                 // ej: 'Tamaño', 'Extras', 'Cocción'
  type: 'radio' | 'checkbox'  // radio = selección única, checkbox = múltiple
  isRequired: boolean
  minSelections: number        // para checkbox: mínimo a seleccionar
  maxSelections: number        // para checkbox: máximo
  items: OptionItem[]
}

export interface Product {
  id: string
  tenantId: string
  categoryId: string
  name: string
  description: string
  price: number
  images: ProductImage[]
  optionGroups: OptionGroup[]
  isActive: boolean
  isFeatured: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: string
  url: string
  order: number
  isMain: boolean
}
```

---

## 3.3 Especificación del ProductFormPage (EXPANDIDA — era gap crítico de v1)

El formulario de producto es el componente más complejo de todo el sistema.

**Estructura del formulario (5 secciones colapsables en móvil, todas visibles en desktop):**

```tsx
// Sección 1: Información básica
// Campos: name (req, min 2), description (textarea, max 500), categoryId (req, Select)

// Sección 2: Imágenes
// - ImageUploader múltiple, hasta 5 imágenes
// - Lista reordenable con @dnd-kit/sortable
// - Primera imagen = principal (badge visual)
// - Preview inmediato con URL.createObjectURL

// Sección 3: Precio
// - price: input numérico con formateo de moneda en blur
// - Mínimo: 0, no negativo

// Sección 4: Variantes (OptionGroupEditor)
// - useFieldArray para grupos dinámicos
// - Dentro de cada grupo: otro useFieldArray para items
// - Tipo radio/checkbox como Switch
// - isRequired toggle
// - minSelections/maxSelections solo visible cuando type === 'checkbox'
// - Validar: minSelections <= maxSelections <= items.length

// Sección 5: Configuración
// - isActive: Switch (default: true)
// - isFeatured: Switch (default: false)
```

**Autoguardado en localStorage:**

```tsx
// components/admin/product-form/use-product-autosave.ts
'use client'
import { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'

const DRAFT_KEY = (id?: string) => `product_draft_${id ?? 'new'}`

export function useProductAutosave(form: UseFormReturn<ProductFormData>, productId?: string) {
  // Cargar borrador al montar
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY(productId))
    if (draft) {
      const parsed = JSON.parse(draft)
      form.reset(parsed)
    }
  }, [])

  // Guardar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const values = form.getValues()
      localStorage.setItem(DRAFT_KEY(productId), JSON.stringify(values))
    }, 30_000)
    return () => clearInterval(interval)
  }, [form, productId])

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY(productId))
  return { clearDraft }
}
```

**Sticky footer con botones Guardar/Cancelar en móvil:**

```tsx
<div className="
  sticky bottom-0 left-0 right-0
  bg-white border-t border-border
  px-4 py-3 flex gap-3
  md:static md:border-0 md:px-0 md:pt-6
">
  <Button variant="outline" onClick={handleCancel} className="flex-1 md:flex-none">
    Cancelar
  </Button>
  <Button type="submit" loading={isSubmitting} className="flex-1 md:flex-none">
    Guardar producto
  </Button>
</div>
```
