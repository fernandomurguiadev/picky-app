# Tasks — app-fase-2-catalogo-admin

## Fase de implementación: FASE 2 — Admin: Módulo Catálogo

**Prerequisito:** FASE 1 completada (autenticación + middleware).

---

## Tipos y hooks

### FE2.0 — Tipos TS y hooks TanStack Query

- [x] Crear `lib/types/catalog.ts`: `OptionGroupType`, `OptionItem`, `OptionGroup`, `Category`, `Product`, `PaginatedResponse<T>`, `ProductsQueryParams`, `ProductFormData`
- [x] Crear `lib/hooks/admin/use-categories.ts`: `categoryKeys`, `useCategories`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`, `useReorderCategories` (optimistic update con rollback)
- [x] Crear `lib/hooks/admin/use-products.ts`: `productKeys`, `useProducts(params)`, `useCreateProduct`, `useUpdateProduct`, `useToggleProductStatus` (optimistic), `useDeleteProduct`
- [x] `useProducts`: `placeholderData: (prev) => prev` para paginación suave

**Criterio de done:** Hooks exportados y tipados. `useToggleProductStatus` revierte si hay error.

---

## Admin layout

### FE2.1 — Admin layout + sidebar

- [x] Crear `app/(admin)/admin/layout.tsx` con `AdminSidebar` + `<main>`
- [x] Crear `components/admin/sidebar/index.tsx` con `navItems` array
- [x] Active state via `usePathname()`
- [x] Logout via `fetch("/api/auth/logout")` + `clearAuth()` + redirect
- [x] Crear `app/(admin)/admin/dashboard/page.tsx` como placeholder

**Criterio de done:** Sidebar visible en admin. Link activo resaltado.

---

## F2-A: Categorías

### FE2.2 — Página `/admin/catalog/categories`

- [x] Crear `app/(admin)/admin/catalog/categories/page.tsx` como Client Component
- [x] Grilla de cards con `@dnd-kit/sortable` (`DndContext`, `SortableContext`, `useSortable`)
- [x] `handleDragEnd` llama `arrayMove` + `reorderMutation.mutate(orderedIds)`
- [x] Indicador de cantidad de productos por categoría
- [x] `EmptyState` cuando no hay categorías

**Criterio de done:** Drag & drop reordena. Llama `PATCH /admin/categories/reorder`.

---

### FE2.3 — CategoryFormDialog

- [x] Crear `components/admin/category-form-dialog/index.tsx`
- [x] Formulario RHF + Zod: nombre (requerido), imageUrl, isActive
- [x] `ImageUploader` para imagen con preview
- [x] `useEffect` sincroniza form al abrir/cambiar categoría
- [x] Modo crear (sin `category` prop) y editar (con `category` prop)

**Criterio de done:** Validaciones inline. Upload de imagen con preview.

---

### FE2.4 — Eliminar categoría con ConfirmModal

- [x] Botón eliminar en cada card abre `ConfirmModal` con `variant="destructive"`
- [x] `useDeleteCategory` con `isPending` pasado a `ConfirmModal`
- [x] Si backend retorna error "tiene productos": toast de error descriptivo

**Criterio de done:** Botón eliminar muestra confirm. Error si tiene productos.

---

## F2-B: Productos

### FE2.5 — Página `/admin/catalog/products`

- [x] Crear `app/(admin)/admin/catalog/products/page.tsx` como Client Component
- [x] Estado local: `page`, `categoryId`, `search`, `filterActive`
- [x] `SearchBar` con debounce, `Select` por categoría, filtro por estado
- [x] Tabla con columnas: imagen, nombre, categoría, precio, estado, acciones
- [x] Toggle activo/inactivo inline con `useToggleProductStatus` (optimistic update)
- [x] Link editar → `/admin/catalog/products/[id]/edit`
- [x] `ConfirmModal` para eliminar
- [x] `Pagination` client-side via `onPageChange`

**Criterio de done:** Paginación server-side. Toggle revierte si hay error.

---

### FE2.6 — OptionGroupEditor (useFieldArray)

- [x] Crear `components/admin/option-group-editor/index.tsx`
- [x] `OptionGroupEditor`: `useFieldArray` en `optionGroups`, botón "Agregar grupo"
- [x] `OptionGroupCard`: `useFieldArray` anidado en `items`, selects tipo/requerido/min/max
- [x] `OptionItemRow`: nombre + priceModifier (pesos en UI, centavos guardados)
- [x] Requiere estar dentro de `<FormProvider>`

**Criterio de done:** Add/remove grupos e items dinámicamente. Precio adicional por item.

---

### FE2.7 — ProductFormPage

- [x] Crear `components/admin/product-form/index.tsx`
- [x] `useForm<ProductFormData>` con `zodResolver`, IIFE para defaultValues
- [x] Sección 1: nombre, descripción, categoría, isFeatured
- [x] Sección 2: imagen (ImageUploader)
- [x] Sección 3: precio en pesos (UI → `tosCents()` al enviar)
- [x] Sección 4: `OptionGroupEditor` dentro de `<FormProvider>`
- [x] Sección 5: toggle isActive
- [x] Autosave en localStorage cada 30s (solo productos nuevos), indicador visual
- [x] Sticky footer `fixed bottom-0` con Cancelar / Guardar
- [x] Submit: `useCreateProduct` o `useUpdateProduct` según `isEdit`

**Criterio de done:** 5 secciones funcionales. Draft recuperado al volver. Footer siempre visible.

---

### FE2.8 — Rutas new/edit

- [x] Crear `app/(admin)/admin/catalog/products/new/page.tsx` → `<ProductFormPage />`
- [x] Crear `app/(admin)/admin/catalog/products/[id]/edit/page.tsx` → Client Component con `use(params)`, fetch con TanStack Query, `<ProductFormPage product={product} />`

**Criterio de done:** `/new` crea. `/[id]/edit` pre-rellena el formulario con datos existentes.
