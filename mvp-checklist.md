
🚀 Checklist de Validación — PickyApp MVP
Este listado prioriza los flujos que garantizan la promesa de valor: Mobile-first, Premium UX y Operación en Tiempo Real.

1. 🛒 El "Golden Path" (Conversión del Cliente)
Objetivo: Que el cliente pueda comprar sin fricción desde su celular.

 Home Tienda: Carga en < 2.5s (LCP) y muestra productos destacados.
 Mobile Layout: 0 scroll horizontal en 360px. Elementos táctiles ≥ 44px.
 Variantes de Producto: El Bottom Sheet (Vaul) abre fluido y permite seleccionar opciones (Radio/Checkbox).
 Carrito Reactivo: Se actualiza al instante (Zustand) y persiste si refrescás la página.
 Checkout Steps: Flujo de 2 pasos claro, con validaciones de campos (Zod).
 WhatsApp Dispatch: Al confirmar, abre WhatsApp con el mensaje estructurado y el link al pedido.
2. ⚡ Real-Time Ops (Panel Administrador)
Objetivo: Que el comerciante sienta que tiene el control total en vivo.

 Notificación Inmediata: Al hacer un pedido en la tienda, aparece en el Admin en < 500ms (WebSocket).
 Alerta Sonora: Se reproduce un sonido al recibir un pedido nuevo (crítico para el local).
 Gestión Kanban: Los pedidos se pueden mover entre columnas (Pendiente -> Preparando -> Enviado) y el estado se persiste.
 Detalle de Pedido: Se ve el desglose de productos, variantes y datos del cliente sin errores.
3. ✨ Experiencia Premium (Branding & UX)
Objetivo: Diferenciarse de la competencia con calidad técnica.

 Test Anti-FOUC: Al cargar la tienda, se aplican los colores del merchant antes del primer render (sin parpadeos de color).
 Skeleton Loaders: Las imágenes y listas muestran skeletons mientras cargan (chau pantallas blancas).
 Micro-animaciones: Transiciones suaves entre páginas y al abrir modales/drawers.
 Optimización de Imágenes: Las fotos de productos cargan optimizadas (Next/Image) y no rompen el Layout Shift (CLS).
4. 🔒 Seguridad y Multi-tenancy
Objetivo: Garantizar que la plataforma es profesional y segura.

 Storage Limpio: Ejecutar localStorage en consola y verificar que NO hay tokens JWT.
 Aislamiento de Datos: Verificar que el tenant_id filtra correctamente (un merchant no ve datos de otro).
 Auth Flow: El refresh token automático funciona y no te saca de la sesión a mitad de un proceso.
 Precios: Verificar en el Network Tab que los montos viajan como enteros (centavos) y no como floats.