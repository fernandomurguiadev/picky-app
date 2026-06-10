# Spec: Prevención de FOUC en Merchant Themes

## 1. Requisitos Funcionales
* **RF-3.01 (Theme Resolution):** Al resolver la URL con el slug del merchant, Next.js debe recuperar el modelo del tenant (que incluye los campos `primaryColor`, `secondaryColor`, etc.) del backend en el lado del servidor.
* **RF-3.02 (CSS Variable Injection):** Inyectar en el layout un bloque de estilos inline en el root (`:root` o `.merchant-theme`) con los valores correspondientes.
* **RF-3.03 (Tailwind Integration):** Configurar Tailwind para mapear colores semánticos como `primary`, `secondary` y `accent` a las variables CSS inyectadas.

## 2. Criterios de Aceptación (CA)
* **CA-1:** Al cargar la página de un comercio con red lenta, la pantalla no debe mostrar colores por defecto (como el azul o negro estándar de Tailwind) antes de renderizar los colores propios del comercio.
* **CA-2:** Las variables CSS deben estar presentes dentro del HTML retornado en la primera respuesta del servidor (Server-Side Rendered).
