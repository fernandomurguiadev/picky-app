# Módulo MOD-02: Tienda Pública

## 1. Visión General
El módulo de Tienda Pública es la interfaz que el cliente final utiliza para realizar pedidos. Debe ser mobile-first, rápida y con una experiencia de usuario superior.

## 2. Funcionalidades (Cliente Final)

| ID | Funcionalidad | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **T-001** | **Home de la tienda** | Header, categorías, productos destacados, banner. | Alta |
| **T-002** | **Indicador abierto/cerrado** | Badge dinámico basado en horarios configurados. | Alta |
| **T-003** | **Listado de categoría** | Lista de productos filtrada por categoría seleccionada. | Alta |
| **T-004** | **Card de producto** | Imagen, nombre, precio, botón de agregar rápido. | Alta |
| **T-005** | **Detalle de producto** | Modal/bottom-sheet con carrusel, variantes, notas. | Alta |
| **T-006** | **Selector de variantes** | Chips/checkboxes con precio adicional y validación. | Alta |
| **T-007** | **Carrito persistente** | Drawer/bottom-sheet con items y totales scrolleables. | Alta |
| **T-008** | **Badge de carrito** | Burbuja con cantidad de items y animación bump. | Alta |
| **T-009** | **Checkout (2 pasos)** | Formulario de datos cliente, entrega y método de pago. | Alta |
| **T-010** | **Dispatch por WhatsApp** | Generación de mensaje estructurado y apertura de wa.me. | Alta |
| **T-011** | **Confirmación de pedido** | Pantalla con número de orden y resumen final. | Alta |
| **T-012** | **Búsqueda en tienda** | Barra de búsqueda global con resultados en tiempo real. | Media |

## 3. Modelo de Datos (Dominio)

### CartItem
```typescript
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  options: SelectedOption[];
  note?: string;
  total: number;
}
```

## 4. Especificaciones Técnicas (Next.js 15)

### Arquitectura de Rutas (`app/`)
- `(store)/[slug]/page.tsx`: Página principal (Home) del tenant con inyección de tema dinámica (RSC).
- `(store)/[slug]/checkout/page.tsx`: Formulario de checkout multietapa en cliente (RCC).
- `(store)/[slug]/order-success/page.tsx`: Pantalla de éxito post-whatsapp.

### Componentes de Interfaz (RCC/RSC)
- `ProductCard`: Card del producto en Home (RSC para máxima velocidad SEO).
- `ProductDetailDrawer`: Implementado con **Vaul (Drawer)** para simular un Bottom Sheet nativo en móvil (RCC).
- `CartDrawer`: Drawer/Slide-over lateral persistido, con scrollable viewport y animación bump en badge (RCC).
- `CheckoutForm`: Formulario controlado con **React Hook Form + Zod** (RCC).

### Gestión de Estado (Zustand Store)
- `useCartStore`: Manejo interactivo del carrito (addItem, removeItem, updateQty, clearCart).
- Persistencia activa automática en LocalStorage configurada a través del middleware de Zustand `persist`.

### Servicios y Despacho
- `whatsapp-dispatch.ts`: Utility puro en cliente para construir la plantilla estructurada de texto y redirigir vía `window.open('https://wa.me/...')`.

## 5. Criterios de Aceptación
- CA-001: El cliente puede completar el flujo completo en un smartphone 360px sin errores.
- CA-002: El mensaje de WhatsApp contiene todos los ítems, precios y totales exactos.
- CA-003: El carrito persiste en localStorage usando Zustand y sobrevive al refresh del navegador.
- CA-004: El tiempo de carga inicial (LCP) es menor a 2.5s en 4G gracias a que los productos principales vienen pre-renderizados del servidor (RSC).

