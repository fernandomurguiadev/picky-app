# Delta para Catálogo (Catalog)

## Funcionalidades Modificadas / Añadidas

| ID | Funcionalidad | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **C-014** | **Precio de Compra Opcional** | Permite cargar el costo de un producto, sin ser obligatorio, para habilitar cálculo de margen. | Alta |
| **C-015** | **Ocultamiento de Costo en Storefront** | El costo nunca debe exponerse en los endpoints públicos de la tienda. | Alta |

## MODIFIED Requirements

### Requirement: Modelo de Datos del Producto (Product)

La entidad `Product` debe soportar un precio de compra opcional, en la misma unidad monetaria que `price` (centavos enteros).

```typescript
export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number; // precio de venta, centavos
  costPrice: number | null; // NUEVO — precio de compra, centavos. Opcional.
  imageUrl: string | null;
  imagePublicId: string | null;
  isFeatured: boolean;
  isActive: boolean;
  inStock: boolean;
  stockQuantity: number | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
```
*(Previously: `Product` no contenía ningún campo de costo).*

#### Scenario: Comerciante carga el precio de compra de un producto

- GIVEN un administrador (`UserRole.ADMIN`) editando un producto en el panel admin
- WHEN completa el campo opcional "Precio de compra (en pesos)" tipeando un valor entero de pesos (reutilizando el componente `PriceInput` ya usado por `price`)
- AND guarda el producto
- THEN el frontend MUST convertir el valor a centavos con `toCents` antes de enviarlo, y `costPrice` MUST persistirse en la base de datos
- AND el campo NO es requerido — un producto sin `costPrice` sigue siendo válido.

#### Scenario: El usuario nunca ve la palabra "centavos"

- GIVEN el campo "Precio de compra" en el form de producto, o cualquier vista que muestre `costPrice`/margen (incluida la sección de rentabilidad)
- WHEN se renderiza cualquier label, placeholder, tooltip, mensaje de error o texto de ayuda
- THEN ese texto MUST NOT mencionar "centavos" ni "cents" — el valor SIEMPRE se muestra formateado en pesos vía `formatCurrency`, igual que ya ocurre con `price`.

#### Scenario: El costo nunca llega a la tienda pública

- GIVEN un producto con `costPrice` cargado
- WHEN un cliente final consulta `GET /api/v1/stores/:slug/products` (endpoint de storefront)
- THEN la respuesta MUST NOT incluir el campo `costPrice` bajo ninguna circunstancia.

#### Scenario: El costo es independiente del precio grupal de categoría

- GIVEN una categoría con `groupPrice` fijo, que hoy deshabilita el input de `price` a nivel producto (`isGroupPriced` → `PriceInput` con `disabled={isGroupPriced}`)
- WHEN un administrador edita un producto de esa categoría
- THEN el campo "Precio de compra" MUST permanecer editable — `costPrice` no tiene relación con el mecanismo de precio grupal de venta y no debe heredar ese `disabled`.

## Criterios de Aceptación Modificados / Añadidos

- CA-007: `costPrice` MUST ser nullable en la base de datos y opcional en `CreateProductDto` / `UpdateProductDto`.
- CA-008: El DTO/serializer de storefront público debe excluir explícitamente `costPrice` (whitelist de campos, no blacklist), para que un campo nuevo agregado a futuro no se filtre por omisión.
- CA-009: Requiere ejecutar `npm run migration:generate` para la nueva columna — no se escribe la migración a mano.
- CA-010: El campo "Precio de compra" reutiliza el componente `PriceInput` de `product-form/index.tsx` (pesos enteros, sin decimales) — no se introduce un input de moneda nuevo ni distinto al de `price`.
- CA-011: Ningún texto user-facing relacionado a `costPrice` o a márgenes (labels, placeholders, tooltips, errores, ayuda) menciona "centavos"/"cents".
- CA-012: El `disabled` de `PriceInput` ligado a `isGroupPriced` se aplica únicamente al input de `price`, nunca al de `costPrice`.
