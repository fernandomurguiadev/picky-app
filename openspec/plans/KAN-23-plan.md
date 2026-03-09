# Master Plan: [KAN-23] Dashboard Super Admin

**Estado**: Propuesto  
**ID Tarea Jira**: KAN-23  
**Responsable**: Tech Agent  
**Fecha**: 2026-03-09  

---

## 🛠️ 1. Resumen Técnico
Este requerimiento consiste en la creación de un panel de control para el administrador global de la plataforma PickyApp (Super Admin), permitiendo visualizar métricas de todos los tenants.

- **Impacto**:
    - **Backend**: Nuevos endpoints de agregación de datos (ventas totales, usuarios activos, tenants registrados).
    - **Frontend**: Nuevo módulo `SuperAdmin` en Angular con gráficos y tablas de resumen.
    - **Seguridad**: Restricción de acceso solo a usuarios con rol `super-admin`.
- **Dependencias**:
    - `chart.js` o `ng2-charts` para visualización de datos.
    - NestJS `QueryBuilder` para consultas complejas de agregación.

---

## 📐 2. Diseño de la Solución

### Agregación de Datos
Se implementarán consultas que no filtren por un único `tenant_id`, sino que agrupen resultados globales:
- **Total Ventas**: `SUM(amount)` de todos los pedidos.
- **Tenants Activos**: `COUNT(id)` de la tabla `tenants`.
- **Pedidos Recientes**: Listado de los últimos 10 pedidos de cualquier tienda.

### API Endpoints (Protegidos)
- **GET `/api/v1/super-admin/metrics`**
    - Retorna objeto con contadores globales.
- **GET `/api/v1/super-admin/tenants`**
    - Listado paginado de todas las tiendas registradas.

---

## 🚀 3. Plan de Ejecución (Paso a Paso)

### Fase 1: Backend (Super Admin API)
1. **Crear Guard**: `SuperAdminGuard` para validar el rol del usuario.
2. **Implementar Metrics Service**: Consultas de agregación global.
3. **Controller**: Exponer endpoints bajo el prefijo `/super-admin`.

### Fase 2: Frontend (Módulo Dashboard)
1. **Módulo SuperAdmin**: Definir rutas protegidas.
2. **Dashboard Component**: Layout con widgets de métricas.
3. **Integración Gráficos**: Implementar Chart.js para tendencias de ventas globales.
4. **Tenants List**: Tabla para visualizar y gestionar (activar/desactivar) tiendas.

---

## 🧪 4. Protocolo de Validación (QA)

### Unit Tests
- `super-admin.guard.spec.ts`: Validar que deniegue acceso a usuarios con rol `admin` normal.
- `metrics.service.spec.ts`: Verificar que las sumas globales sean correctas.

### Pasos Manuales
1. Loguear con cuenta de Super Admin.
2. Navegar a `/super-admin/dashboard`.
3. Verificar que las métricas coincidan con la sumatoria de datos de la DB.
4. Intentar acceder a la ruta con una cuenta de Comerciante (debe retornar 403).

---
*Plan generado por Tech Agent. Pendiente de aprobación por el Orquestador.*
