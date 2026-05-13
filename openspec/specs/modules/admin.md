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

## 4. Especificaciones Técnicas (Next.js 15)

### Arquitectura de Rutas y Layouts (`app/`)
- `(admin)/layout.tsx`: Valida autenticación del lado del servidor (RSC Middleware) y define la shell adaptativa.
- `(admin)/dashboard/page.tsx`: Dashboard principal con fetches en paralelo y fallback Suspense de React 19.

### Componentes de Interfaz (shadcn/ui + Lucide Icons)
- `AdminSidebar`: Sidebar expandible lateral en desktop que se oculta en móvil vía Sheet (RCC).
- `MobileBottomNav`: Sticky bottom bar optimizado con iconos táctiles grandes para móvil (RCC).
- `DashboardMetricsCards`: Grilla de KPIs con esqueletos de carga nativos (React Suspense).
- `SalesChart`: Gráfico de líneas interactivo implementado con **Recharts** (RCC).

### Lógica de Onboarding y Navegación
- `useOnboardingStore`: Zustand store persistido para recordar el progreso local del wizard si el usuario cierra la pestaña.
- `OnboardingStepper`: Flujo declarativo controlado que avanza con validaciones locales Zod por cada fase.


## 5. Criterios de Aceptación
- CA-001: El panel admin es completamente usable en un smartphone de 360px.
- CA-002: El dashboard carga las métricas del día en menos de 1.5s después de login.
- CA-003: El onboarding wizard se muestra correctamente a los usuarios nuevos.
- CA-004: El toggle de 'Tienda Abierta / Cerrada' sobreescribe los horarios configurados.
