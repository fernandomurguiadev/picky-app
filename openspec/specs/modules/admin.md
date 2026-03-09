# Módulo MOD-05: Panel Administrador

## 1. Visión General
El módulo de Panel Administrador es la interfaz que el comerciante utiliza para gestionar su negocio. Debe ser intuitivo, rápido y perfectamente adaptable a dispositivos móviles.

## 2. Funcionalidades (Back-office)

| ID | Funcionalidad | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **A-001** | **Layout responsivo** | Móvil: bottom navigation bar con 4 tabs. Desktop: sidebar colapsable + topbar. | Alta |
| **A-002** | **Dashboard principal** | Métricas del día: pedidos totales, facturación, ticket promedio. | Alta |
| **A-003** | **Topbar del admin** | Logo, nombre, botón 'Ver tienda', notificaciones, menú usuario. | Alta |
| **A-004** | **Estadísticas básicas** | Ventas del día/semana/mes. Productos más pedidos (top 5). | Media |
| **A-005** | **Onboarding wizard** | Wizard de 5 pasos para nuevos comercios: info, logo, primera categoría, primer producto, configurar entrega. | Media |
| **A-006** | **Notificaciones in-app** | Centro de notificaciones para eventos importantes. | Media |

## 3. Modelo de Datos (Dominio)

### DashboardMetrics
```typescript
export interface DashboardMetrics {
  ordersToday: number;
  revenueToday: number;
  averageTicket: number;
  pendingOrders: number;
  hourlyOrders: number[];
  topProducts: TopProduct[];
}
```

## 4. Especificaciones Técnicas (Angular 19)

### Componentes Clave
- `AdminLayoutComponent`: Layout general del panel administrador.
- `BottomNavComponent`: Barra de navegación para móviles.
- `SidebarComponent`: Barra lateral para desktop.
- `DashboardComponent`: Resumen visual con métricas y gráficos.
- `OnboardingWizardComponent`: Wizard paso a paso para nuevos usuarios.

### Servicios
- `AnalyticsService`: Obtención de métricas y datos estadísticos.
- `OrdersService`: Obtención de pedidos activos para el dashboard.
- `OnboardingService`: Gestión del estado del proceso de onboarding.

## 5. Criterios de Aceptación
- CA-001: El panel admin es completamente usable en un smartphone de 360px.
- CA-002: El dashboard carga las métricas del día en menos de 1.5s después de login.
- CA-003: El onboarding wizard se muestra correctamente a los usuarios nuevos.
- CA-004: El toggle de 'Tienda Abierta / Cerrada' sobreescribe los horarios configurados.
