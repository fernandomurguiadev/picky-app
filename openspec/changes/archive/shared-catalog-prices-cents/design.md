# Design: Precios en Centavos Enteros

## 1. Cambios en Backend (API)
* **Entidades:**
  * Modificar `api/src/modules/catalog/entities/product.entity.ts` cambiando la columna `price` de tipo `numeric` o `float` a `integer`.
  * Modificar `api/src/modules/orders/entities/order-item.entity.ts` y `order.entity.ts` cambiando `price`, `subtotal`, `total` a `integer`.
* **DTOs & Validación:**
  * Asegurar que `@IsInt()` sea usado en lugar de `@IsNumber()` para campos monetarios en DTOs.
* **Migración de DB:**
  * Generar migración que altere el tipo de columna.
  * Escribir un script SQL temporal de migración que convierta los valores viejos: `price = price * 100` antes del casteo a `integer`.

## 2. Cambios en Frontend (App)
* **Formateador de Moneda:**
  * Crear un helper en `app/src/lib/utils/format.ts` para renderizar precios:
    ```typescript
    export const formatPrice = (cents: number, locale = 'es-AR') => {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'ARS' }).format(cents / 100);
    };
    ```
* **Formulario de Carga (Admin):**
  * Modificar el componente `ProductForm` para multiplicar por 100 el valor ingresado por el usuario antes de mandarlo a la API.
* **Estado de Carrito:**
  * El estado de Zustand para el carrito de compras debe almacenar los precios en centavos enteros y realizar las sumas multiplicando/sumando enteros.
