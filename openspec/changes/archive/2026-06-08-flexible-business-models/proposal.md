# Propuesta: Modelos de Negocio Flexibles (Simplificado)

## Intención
Desacoplar el flujo de comercio electrónico para soportar operaciones basadas en servicios. En lugar de complicar el catálogo producto por producto, la plataforma permitirá configurar la tienda entera en modo "Retail" o modo "Servicios". El modo Servicios usará CTAs personalizados (ej: "Consultar", "Pedir Turno") y derivará los clientes a WhatsApp en lugar de usar un carrito de compras.

## Alcance

### Dentro del Alcance
- Definir `storeType` (`retail` | `services`) y `customCtaText` a nivel de `StoreSettings`.
- Actualizar el Frontend Admin (Onboarding y Configuración) para elegir el tipo de tienda y cambiar la terminología de la UI ("Tus Productos" vs "Tus Servicios").
- Actualizar el Frontend Store (Vista del Cliente) para renderizar el CTA global basado en `storeType`.
- Ocultar el carrito de compras por completo si la tienda es de servicios.
- Ocultar visualmente el precio si la tienda es de servicios y el precio es `0`.
- Redirección directa a WhatsApp para interacciones en modo servicios.

### Fuera del Alcance
- Carritos mixtos (productos y servicios a la vez). Se descartó por complejidad.
- Cambios a la entidad `Product`.

## Capacidades

### Nuevas Capacidades
- `store-business-models`: Define los modos operativos de la tienda a nivel global.

### Capacidades Modificadas
- `modules/tenants`: La entidad `StoreSettings` necesita `storeType` y `customCtaText`.

## Enfoque
Extenderemos `StoreSettings` con los nuevos campos, asegurando el valor por defecto (`retail`). El Frontend Admin expondrá un selector en la Configuración/Onboarding. Si es "Servicios", el frontend cliente omitirá el carrito, mostrará el `customCtaText` en todas las tarjetas de ítems, y ocultará el precio si este es `0`.

## Áreas Afectadas
| Área | Impacto | Descripción |
|------|---------|-------------|
| `api/src/modules/tenants/entities/store-settings.entity.ts` | Modificado | Agregar `storeType`, `customCtaText` |
| `app/src/app/(admin)/` | Modificado | Selector en Onboarding/Config y terminología dinámica |
| `app/src/components/store/` | Modificado | Renderizado del CTA y ocultamiento global del carrito |

## Riesgos
| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Tiendas retail se rompen | Baja | `storeType` por defecto en `'retail'`. |

## Plan de Reversión (Rollback)
Revertir cambios de UI en frontend.

## Criterios de Éxito
- [ ] Admin configura su tienda como "Servicios" con CTA "Pedir Turno".
- [ ] El carrito de compras desaparece de su tienda.
- [ ] Los clicks en los servicios abren WhatsApp.
