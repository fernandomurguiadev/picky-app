# Proposal: Módulo Core de Administración de Plataforma (SuperAdmin)

## Intent
Implementar el núcleo del portal de administración de la plataforma en `admin.pickyapp.com`, permitiendo al equipo de operaciones de PickyApp gestionar comercios (tenants), planes, registrar auditorías y realizar impersonación de merchants para soporte técnico.

## Context
Actualmente, PickyApp es una aplicación multi-tenant en la que solo existen los roles del lado del comercio (merchants y sus clientes). No existe un panel de control global ni un rol de administración de plataforma para dar de alta o baja tiendas, suspenderlas por falta de pago o darles soporte directo.

## Proposed Approach
- **Subdominio Aislado**: Configurar el ruteo a través de middleware en Next.js para responder al host `admin.pickyapp.com` mapeando las páginas internas de administración de plataforma.
- **Autenticación e Impersonación Segura**: Crear endpoints en el backend específicos para administradores globales, emitiendo cookies de sesión exclusivas para `admin.pickyapp.com`. La impersonación generará un token de corta duración con el `tenantId` del comercio al que se desea dar soporte, inyectando la bandera `isImpersonated`.
- **Límites de Planes**: Crear un mecanismo de verificación (Guard/Interceptor) en el backend que compare el número actual de productos/categorías del tenant con los límites de su plan asignado antes de permitir la creación de nuevos recursos.
- **Auditoría Global**: Implementar una tabla de logs de auditoría global libre del filtro RLS para auditar las acciones del SuperAdmin.

## Scope
- **Afecta**: Backend (`api`) y Frontend (`app`).
- **Impacto en Multi-tenancy**: Alto. El SuperAdmin tiene acceso global a todos los tenants y puede evadir el filtrado lógico de RLS usando decoradores específicos (`@SkipRls`). La impersonación debe forzar temporalmente el contexto del tenant seleccionado.

## Alternatives Considered
- **Ruta `/platform-admin` en el dominio principal**: Descartada por seguridad. Compartir el mismo dominio principal facilita ataques de fijación de sesión y fuga de cookies del SuperAdmin si el panel de merchants sufriera un XSS. El aislamiento por subdominio (`admin.pickyapp.com`) mitiga este riesgo de raíz.
