# Spec: Precios en Centavos Enteros

## 1. Requisitos Funcionales
* **RF-2.01 (Almacenamiento de Precios):** Todo precio de producto ingresado en el Admin debe multiplicarse por 100 antes de enviarse a la API y guardarse en base de datos.
* **RF-2.02 (Cálculo de Totales):** Las sumas de subtotal, impuestos y totales de las órdenes en el backend deben realizarse sobre valores enteros.
* **RF-2.03 (Visualización Formateada):** El frontend debe mostrar los precios convertidos en valor flotante dividido 100 y formateado con el símbolo de moneda local (por ejemplo, `$ 1.250,00` usando `es-AR` o el localizador configurado).
* **RF-2.04 (Pasarelas de Pago):** Los payloads para procesar pagos deben enviar el entero directo al procesador (Stripe / MercadoPago).

## 2. Criterios de Aceptación (CA)
* **CA-1:** Los precios en base de datos no deben contener decimales (`integer` o `bigint` en Postgres).
* **CA-2:** La consola de red (Network Tab) del cliente debe mostrar llamadas a API con valores enteros en campos como `price`, `total`, `discount`.
* **CA-3:** Las operaciones matemáticas del carrito de compras deben ser exactas. Por ejemplo, agregar 3 items de `10.33` debe dar exactamente `3099` centavos en la petición a la API.
