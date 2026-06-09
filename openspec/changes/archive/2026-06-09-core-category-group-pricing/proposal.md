# Proposal: Precios Grupales por Categoría

## Intent
Permitir a los vendedores definir un "Precio Grupal" a nivel de Categoría, bloqueando la asignación de precios a nivel de producto individual dentro de esa categoría. Ideal para tiendas de "Todo a $X" o catálogos de servicios estandarizados.

## Problem Context
Actualmente, si un vendedor tiene una promoción de "Todas las remeras a $10.000" o vende servicios estandarizados, tiene que tipear "$10.000" en cada producto que crea. Si quiere actualizar el precio a $12.000, tiene que editar todos los productos uno por uno. Esto genera fricción y errores humanos (precios desactualizados).

## Proposed Solution (Hard Constraint)
Implementar una restricción dura a nivel de base de datos y UI. 
En lugar de crear tablas separadas, extenderemos la entidad `Category` con dos campos:
- `isGroupPricingEnabled` (boolean)
- `groupPrice` (decimal)

Cuando un producto pertenece a una categoría con `isGroupPricingEnabled = true`:
1. El frontend del Admin deshabilita el campo `price` al crear/editar el producto y muestra un mensaje explicativo.
2. El Storefront (tienda del cliente) oculta los precios repetitivos de las tarjetas y lo destaca a nivel categoría.
3. El Backend asume el precio de la categoría al momento de agregar al carrito.

## Scope
- **API (DB)**: Agregar columnas a `Category`. Modificar endpoints de lectura de productos para resolver el `computedPrice`.
- **API (Cart/Checkout)**: Al agregar un ítem al carrito (`OrderItem`), el sistema guardará el precio resuelto de forma estática (snapshot), sumando los modificadores de variantes si existen.
- **App (Admin)**: UI en configuración de categoría para activar el toggle y definir el precio. UI en formulario de producto para bloquear (disable) el campo de precio.
- **App (Storefront)**: UI limpia para categorías con precio grupal.

## User Review Required
> [!IMPORTANT]
> **Manejo de Variantes**: Se asume que si un producto en una categoría grupal ($10.000) tiene una variante "Talle XXL (+$2.000)", el precio final será $12.000. ¿Confirmás que los modificadores de precio de variantes aplican sobre el precio grupal?

> [!WARNING]
> **Cambio de Categoría**: ¿Qué pasa si el vendedor mueve un producto de una categoría "Grupal" a una "Normal"? El producto quedará con precio $0 (nulo) hasta que el vendedor se lo asigne a mano. Hay que validarlo en el formulario.
