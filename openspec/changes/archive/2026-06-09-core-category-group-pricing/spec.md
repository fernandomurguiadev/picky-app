# Specification: Precios Grupales por Categoría

## Requisitos

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

## Escenarios

### Escenario 1: Habilitar Precio Grupal en una Categoría Existente
**DADO** una categoría "Remeras" con 50 productos con distintos precios
**CUANDO** el administrador edita la categoría, habilita "Precio Grupal" y setea $10.000 (= 1000000 centavos)
**ENTONCES** el backend actualiza la categoría dentro de una transacción
**Y** actualiza `price = 1000000` en los 50 productos de esa categoría
**Y** el response incluye `updatedProductsCount: 50`

### Escenario 2: Cambiar el Precio Grupal de una Categoría Activa
**DADO** que la categoría "Remeras" ya tiene precio grupal de $10.000
**CUANDO** el administrador cambia el precio grupal a $12.000 (= 1200000 centavos)
**ENTONCES** el backend sincroniza los productos con el nuevo precio
**Y** el response incluye `updatedProductsCount: N`

### Escenario 3: Deshabilitar el Precio Grupal
**DADO** que la categoría "Remeras" tiene precio grupal de $10.000
**CUANDO** el administrador desactiva el toggle "Precio Grupal"
**ENTONCES** el backend guarda `isGroupPricingEnabled = false` conservando `groupPrice = 1000000` en DB
**Y** los productos conservan su precio actual (no se modifican)
**Y** el response incluye `updatedProductsCount: 0`

### Escenario 4: Crear Producto en Categoría Grupal
**DADO** que la categoría "Remeras" tiene precio grupal de $10.000
**CUANDO** el administrador crea un producto en esa categoría (con cualquier precio en el payload)
**ENTONCES** el frontend bloquea el campo de precio y muestra el precio de la categoría
**Y** el backend guarda el producto con `price = 1000000` ignorando el payload

### Escenario 5: Mover Producto a Categoría con Precio Grupal
**DADO** un producto "Remera Básica" con `price = 800000` en una categoría normal
**CUANDO** el administrador lo mueve a la categoría "Remeras" (precio grupal $10.000)
**ENTONCES** el backend guarda `price = 1000000` en el producto

### Escenario 6: Mover Producto a Categoría Normal
**DADO** un producto "Remera Básica" con `price = 1000000` heredado de precio grupal
**CUANDO** el administrador lo mueve a la categoría "Pantalones" (sin precio grupal)
**ENTONCES** el backend conserva `price = 1000000` en el producto
**Y** el response incluye `priceInherited: true`
**Y** el frontend muestra un Alert: *"Este producto conserva el precio de su categoría anterior. Revisá si debés actualizarlo."*

### Escenario 7: Modificador de Variante en Producto Grupal
**DADO** un producto en una categoría con precio grupal de $10.000
**CUANDO** un cliente agrega al carrito la variante "Talle XXL" con modificador +$2.000
**ENTONCES** el precio final guardado en `OrderItem.unitPrice` es $12.000 (= 1200000 centavos)
