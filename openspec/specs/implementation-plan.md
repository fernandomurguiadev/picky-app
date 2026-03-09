# Plan de Implementación Detallado

Este documento desglosa la estrategia de ejecución secuencial para el desarrollo del MVP. El orden está diseñado para respetar las dependencias lógicas: primero los cimientos, luego los datos maestros, seguido por la experiencia del cliente y finalmente la operación.

## 🟢 Fase 0: Cimientos Técnicos (Setup)
**Objetivo:** Establecer la infraestructura base del proyecto.

- [ ] **F0.1**: Inicializar repositorio Monorepo (Nx o Turborepo) o estructura base NestJS + Angular.
- [ ] **F0.2**: Configurar Docker Compose (PostgreSQL, Backend, Frontend opcional).
- [ ] **F0.3**: Configurar Estilos Globales (SCSS, Variables CSS, Breakpoints).
- [ ] **F0.4**: Implementar componentes UI base (Button, Card, Input, Modal).

---

## 🟢 Fase 1: Identidad y Acceso (MOD-06)
**Objetivo:** Habilitar la creación de tiendas y el acceso seguro.
**Dependencia:** F0

- [ ] **F1.1**: Backend - Entidades Base (`Tenant`, `User`) y Migraciones.
- [ ] **F1.2**: Backend - Auth Module (JWT, Login, Register, Refresh Token).
- [ ] **F1.3**: Frontend - Vistas de Login y Registro.
- [ ] **F1.4**: Frontend - Lógica de Auth (Guard, Interceptor, Service).
- [ ] **Hito**: Un usuario puede registrarse, creando automáticamente su Tenant, y loguearse.

---

## 🟢 Fase 2: Gestión de Catálogo (MOD-01)
**Objetivo:** Permitir al comerciante cargar el inventario que se venderá.
**Dependencia:** F1 (Requiere usuario autenticado)

- [ ] **F2.1**: Backend - Entidades de Catálogo (`Category`, `Product`, `OptionGroup`).
- [ ] **F2.2**: Backend - Upload de Imágenes (Cloudinary/S3).
- [ ] **F2.3**: Frontend Admin - ABM de Categorías.
- [ ] **F2.4**: Frontend Admin - ABM de Productos (con variantes e imágenes).
- [ ] **Hito**: El administrador puede crear su catálogo completo con fotos y precios.

---

## 🟢 Fase 3: Configuración de Tienda (MOD-04)
**Objetivo:** Definir la identidad y reglas de negocio del comercio.
**Dependencia:** F1

- [ ] **F3.1**: Backend - Entidad `StoreSettings` y endpoints.
- [ ] **F3.2**: Frontend Admin - Panel de Configuración (Info, Horarios, Tema).
- [ ] **F3.3**: Frontend - Servicio de Tema Dinámico (aplicar colores).
- [ ] **Hito**: La tienda tiene nombre, logo, horarios y colores definidos.

---

## 🟢 Fase 4: Tienda Pública - Navegación (MOD-02 Parte I)
**Objetivo:** Que el cliente final pueda ver los productos.
**Dependencia:** F2 (Productos), F3 (Configuración)

- [ ] **F4.1**: Backend - Endpoints públicos (`GET /stores/:slug`, `GET /products`).
- [ ] **F4.2**: Frontend Store - Layout Público y Home.
- [ ] **F4.3**: Frontend Store - Listado de Categorías y Productos.
- [ ] **F4.4**: Frontend Store - Detalle de Producto con selector de variantes.
- [ ] **Hito**: Un cliente puede navegar el catálogo visualmente (sin comprar aún).

---

## 🟢 Fase 5: Tienda Pública - Compra (MOD-02 Parte II)
**Objetivo:** Cerrar la venta.
**Dependencia:** F4

- [ ] **F5.1**: Frontend Store - Carrito de Compras (Persistencia local).
- [ ] **F5.2**: Frontend Store - Checkout (Datos cliente, Entrega, Pago).
- [ ] **F5.3**: Backend - Endpoint `POST /orders` (Creación básica).
- [ ] **F5.4**: Frontend Store - Integración WhatsApp y Pantalla Confirmación.
- [ ] **Hito**: Un cliente puede realizar un pedido real que se guarda en BD y dispara WhatsApp.

---

## 🟢 Fase 6: Operación y Pedidos (MOD-03)
**Objetivo:** Que el comerciante gestione las ventas.
**Dependencia:** F5 (Necesita pedidos creados)

- [ ] **F6.1**: Backend - WebSocket Gateway para eventos en tiempo real.
- [ ] **F6.2**: Frontend Admin - Tablero Kanban de Pedidos.
- [ ] **F6.3**: Frontend Admin - Detalle de Pedido y cambio de estados.
- [ ] **F6.4**: Frontend Admin - Notificaciones sonoras/visuales.
- [ ] **Hito**: El ciclo completo funciona: Cliente pide -> Admin recibe alerta -> Admin prepara -> Admin entrega.

---

## 🟢 Fase 7: Gestión y Dashboard (MOD-05)
**Objetivo:** Visibilidad macro del negocio.
**Dependencia:** F6 (Datos de pedidos)

- [ ] **F7.1**: Backend - Endpoints de Analytics (totales, gráficos).
- [ ] **F7.2**: Frontend Admin - Dashboard Principal.
- [ ] **F7.3**: Frontend Admin - Mejoras de navegación móvil (Sidebar/BottomNav).
- [ ] **Hito**: El sistema se siente completo y profesional para el administrador.

---

## 🟢 Fase 8: Pulido y QA
**Objetivo:** Calidad final para MVP.

- [ ] **F8.1**: Auditoría de Performance (LCP, CLS).
- [ ] **F8.2**: Testing exhaustivo en dispositivos móviles reales (360px).
- [ ] **F8.3**: Corrección de bugs y detalles visuales.
- [ ] **Hito**: MVP listo para demo ("Demo-Ready").
