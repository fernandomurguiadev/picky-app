# Tasks: Precios en Centavos Enteros

## Phase 1: Backend Database & Entities
- [ ] 1.1 Modificar tipo de dato a `integer` en entidades de `Product`, `OrderItem` y `Order`.
- [ ] 1.2 Generar migración manual que multiplique por 100 el valor existente de `price`, `subtotal`, `total` y los casteé a `integer` en PostgreSQL.
- [ ] 1.3 Modificar DTOs de creación y actualización para validar precios como enteros (`@IsInt()`).

## Phase 2: Frontend Client & Admin UI
- [ ] 2.1 Crear el helper `formatPrice` en `app/src/lib/utils/format.ts`.
- [ ] 2.2 Reemplazar todas las impresiones directas de precios en el Storefront y Admin con `formatPrice(product.price)`.
- [ ] 2.3 Modificar `ProductForm` en el panel de administración para mapear el input decimal del usuario a entero (multiplicar por 100 y redondear) en el payload enviado.
- [ ] 2.4 Ajustar el store de Zustand del carrito para realizar cálculos matemáticos en centavos.

## Phase 3: Verificación
- [ ] 3.1 Probar que al agregar un producto de $10.50 y otro de $20.30 el total del carrito mande a la API `3080` (centavos) en la petición HTTP.
- [ ] 3.2 Asegurar que no aparezcan floats en la base de datos tras nuevas compras.
