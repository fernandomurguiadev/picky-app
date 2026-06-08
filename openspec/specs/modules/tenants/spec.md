# Delta para modules/tenants

## Requisitos AGREGADOS

### Requisito: Configuración de Modelo de Negocio

El sistema DEBE persistir `storeType` y `customCtaText` en la entidad StoreSettings.

#### Escenario: Actualizar Configuración de Tienda
- DADO un usuario administrador en la página de Configuración de Tienda
- CUANDO cambia el modelo de negocio a "Servicios" y configura el CTA a "Consultar"
- ENTONCES los cambios DEBEN ser guardados en la tabla `store_settings`.
