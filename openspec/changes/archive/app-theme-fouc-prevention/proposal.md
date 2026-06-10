# Proposal: Prevención de FOUC en Merchant Themes

## 1. Contexto y Problema
PickyApp es una plataforma multi-tenant donde cada comercio (merchant) tiene su propia paleta de colores. Actualmente, cuando un cliente ingresa a la tienda de un comercio, la app carga el template básico y luego aplica los colores desde el frontend (hidratación o useEffect). Esto genera un FOUC (Flash of Unstyled Content) donde la pantalla parpadea de blanco/gris a los colores reales del merchant durante unos milisegundos, rompiendo la UX Premium.

## 2. Solución Propuesta
Inyectar las variables de color del merchant en forma de estilos CSS embebidos en el servidor (SSR / RSC) en el `<head>` del layout principal de la tienda.
* Next.js leerá el tenant/merchant desde el backend en el Server Component del layout.
* Renderizará una etiqueta `<style>` con las variables CSS de Tailwind configuradas según los colores de dicho merchant.
* El navegador procesará el HTML ya con las variables del tema cargadas desde la primera lectura del DOM, previniendo cualquier parpadeo de color.

## 3. Impacto en Multi-tenancy
Cada ruta bajo `[slug]` representa un merchant único. El layout de la ruta dinámica `/app/src/app/(store)/[slug]/layout.tsx` será el encargado de resolver el theme y pintar los estilos correctos de forma aislada.

## 4. Alternativas y Tradeoffs
* **Alternativa A (Clases dinámicas de Tailwind):** Requiere compilar clases dinámicas o cargarlas al vuelo en el cliente, lo que genera retraso y FOUC.
* **Alternativa B (Variables CSS inyectadas por SSR - Elegida):** Súper limpio. Permite que las clases de Tailwind apunten a variables como `var(--primary)` y que el color real se defina dinámicamente en el servidor en base al merchant activo.
