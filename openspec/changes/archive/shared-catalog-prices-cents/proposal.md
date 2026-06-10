# Proposal: Precios en Centavos Enteros

## 1. Contexto y Problema
El uso de números de punto flotante (`float`, `double` o `number` en JS) para modelar dinero genera problemas de redondeo binario. Por ejemplo, la suma de centavos o porcentajes de impuestos puede dar decimales interminables que causan inconsistencias entre el carrito del frontend, los cobros por pasarelas de pago y los montos almacenados en la base de datos de órdenes.

## 2. Solución Propuesta
Refactorizar el catálogo de productos y el sistema de órdenes para que todos los montos de precios, descuentos y totales se almacenen y procesen como números enteros que representan centavos (por ejemplo, `$10.50` se procesará y almacenará como `1050`).
* En la DB, el tipo de dato pasará de `numeric`/`float` a `integer` o `bigint`.
* En la API, el tipo de dato será `number` entero.
* En el Frontend, los componentes de UI formatearán el entero a string legible utilizando `Intl.NumberFormat`.

## 3. Impacto en Multi-tenancy
Los precios de productos y órdenes pertenecen a un tenant específico (`tenant_id`). La migración de base de datos debe contemplar la conversión de los registros existentes multiplicando los valores flotantes por 100 y casteándolos a enteros de forma segura bajo el scope de cada tenant.

## 4. Alternativas y Tradeoffs
* **Alternativa A (Tipo Decimal exacto en Postgres):** Funciona bien en base de datos, pero requiere transformaciones pesadas de strings o librerías especiales (como `decimal.js`) en JS/TS para evitar que al deserializar se conviertan de nuevo en floats.
* **Alternativa B (Enteros / Centavos - Elegida):** Es la convención estándar de la industria (utilizada por pasarelas como Stripe). Es súper rápida, no requiere librerías adicionales y garantiza que la suma matemática sea 100% exacta con simples enteros de JS.
