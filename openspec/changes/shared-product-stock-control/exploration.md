## Exploration: Control Rápido de Stock / Disponibilidad (Opción D)

### Current State
- Actualmente, la entidad `Product` en la base de datos ([product.entity.ts](file:///c:/Users/ferna/Documents/Repositorios/picky-app/api/src/modules/catalog/entities/product.entity.ts)) cuenta con un campo boolean `isActive`. 
- El frontend en el panel de administración ([products/page.tsx](file:///c:/Users/ferna/Documents/Repositorios/picky-app/app/src/app/(admin)/admin/catalog/products/page.tsx)) provee un switch rápido que edita `isActive` mediante la mutation `useToggleProductStatus`.
- Si `isActive` se pone en `false`, el producto desaparece por completo de la tienda del cliente (ya que el storefront filtra y solo muestra productos activos).
- No existe el concepto de "Agotado" (sin stock temporal) donde el cliente pueda ver el producto en la carta, pero no pueda comprarlo. Tampoco existe un campo en base de datos como `inStock` o `isAvailable`.

### Affected Areas
- `api/src/modules/catalog/entities/product.entity.ts` — Requiere agregar la columna `inStock` (boolean, default: true).
- `api/src/modules/catalog/dto/create-product.dto.ts` y `update-product.dto.ts` — Deben validar e incluir `inStock` en los payloads aceptados.
- `app/src/lib/types/catalog.ts` — Debe actualizar el tipo `Product` y `ProductFormData` para reflejar el campo `inStock`.
- `app/src/lib/hooks/admin/use-products.ts` — Añadir la mutación de actualización rápida de stock (`useToggleProductStock`).
- `app/src/app/(admin)/admin/catalog/products/page.tsx` — Añadir un switch "Stock" al lado del de "Activo" en la grilla.
- `app/src/components/admin/product-form/index.tsx` — Añadir la opción "Producto en stock" en el formulario de creación/edición.
- `app/src/app/(store)/[slug]/page.tsx` (y modales de variantes) — Renderizar el badge "Sin stock" y deshabilitar la compra si `inStock === false`.

### Approaches
1. **Crear columna `inStock` dedicada en base de datos**
   - Pros: Control independiente (un producto puede estar activo pero sin stock; o inactivo y sin stock). El cliente puede ver el producto pero no comprarlo, lo que mantiene el catálogo completo.
   - Cons: Requiere cambios en base de datos (migración) y DTOs del backend.
   - Effort: Medium

2. **Reutilizar `isActive` para "Sin stock" en la UI pero ocultarlo**
   - Pros: Cero cambios en base de datos o DTOs.
   - Cons: No cumple con la especificación de mantener el producto visible pero deshabilitar la compra; ocultaría el producto del catálogo, lo cual limita la experiencia visual (el cliente no sabría que el local suele vender ese ítem).
   - Effort: Low

### Recommendation
Recomendamos la **Opción 1**. Introducir el campo `inStock: boolean` (default: true). Es la única alternativa arquitectónica que soporta el comportamiento correcto del storefront (mostrar el producto pero impedir su compra con un badge claro de "Sin stock").

### Risks
- **Migración de Base de Datos**: Agregar la columna `inStock` en PostgreSQL. Se debe inicializar por defecto en `true` para no romper los productos existentes de los tenants.

### Ready for Proposal
Sí. Procedemos a crear la propuesta de cambio (Proposal).
