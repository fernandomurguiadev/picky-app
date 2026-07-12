# Proposal: WhatsApp por Tenant y Número de Orden Correlativo

## Intent

Corregir dos problemas de diseño en el sistema de pedidos: el número de WhatsApp del negocio
se configuraba como variable de entorno global (incorrecta para multi-tenant), y el número de
orden se generaba con aleatoriedad (riesgo de colisión, no correlativo). Ambos deben ser
configurables por tenant y predecibles.

## Problema Actual

### 1. WHATSAPP_BUSINESS_NUMBER como env var global
`WHATSAPP_BUSINESS_NUMBER` es una variable de entorno definida en `api/src/config/env.config.ts`
y consumida en `orders.service.ts` para construir el link `wa.me`. En un sistema multi-tenant,
cada negocio tiene su propio número de WhatsApp. La columna `whatsapp` ya existe en
`store_settings` pero no se usa para este propósito.

### 2. Número de orden no correlativo
`generateOrderNumber()` produce `ORD-YYYYMMDD-RAND4` (4 dígitos aleatorios). Esto tiene riesgo
de colisión y no permite saber cuántos pedidos tuvo un tenant. Los negocios necesitan un número
legible y secuencial como `#0001`, `#0002`.

## Solución

### 1. WhatsApp por tenant
Usar `settings.whatsapp` (ya cargado en `createOrder`) para construir el link `wa.me`. Si el
tenant no configuró su WhatsApp, retornar `whatsappConfirmationUrl: null`. Eliminar
`WHATSAPP_BUSINESS_NUMBER` del schema de Zod y de `.env.example.prod`.

### 2. Tabla `tenant_order_sequences`
Nueva tabla con `tenant_id` (PK) y `last_order_number` (integer). El incremento se hace con
una query atómica dentro de la transacción existente de `createOrder`:

```sql
INSERT INTO tenant_order_sequences (tenant_id, last_order_number)
VALUES ($1, 1)
ON CONFLICT (tenant_id) DO UPDATE
  SET last_order_number = tenant_order_sequences.last_order_number + 1
RETURNING last_order_number;
```

El número de orden pasa a ser `#NNNN` (ej: `#0001`, `#0042`). Sin colisiones, correlativo por
tenant, legible en pantalla.

**Impacto en N8N:** El workflow `n8n-webhook-whatsapp.json` usa la regex `/(ORD-\d{8}-\d{4})/`
para extraer el número de orden del mensaje de WhatsApp. Al cambiar el formato, el mensaje y la
regex deben actualizarse a `/(#\d{4,})/`.

## Out of Scope
- Migración de números de orden existentes (los pedidos históricos mantienen su formato `ORD-*`)
- Reset de secuencia por fecha o período
- Formato configurable del número de orden

## Target Area
- `api/` — orders service, nueva entidad, env config
- `n8n-webhook-whatsapp.json` — actualizar regex y mensaje de confirmación
