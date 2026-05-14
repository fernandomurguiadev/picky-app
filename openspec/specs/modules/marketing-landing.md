# Módulo: Marketing Landing Page

## 1. Visión General
La Marketing Landing Page es el portal de acceso principal para usuarios que no están navegando una tienda en particular. Su misión es presentar los beneficios competitivos de PickyApp, canalizar nuevos registros de comercios (`/auth/register`) y proveer acceso a los comercios existentes (`/auth/login`). Debe ser ultra-veloz, responsiva, y visualmente premium.

## 2. Funcionalidades

| ID | Funcionalidad | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **M-001** | **Hero Banner Principal** | Sección introductoria con propuesta de valor y botones de conversión claros. | Alta |
| **M-002** | **Navegación Global Simplificada** | Header con logotipo y accesos directos a autenticación. | Alta |
| **M-003** | **Grilla de Beneficios** | Malla visual mostrando ventajas: Mobile-first, Pedidos WhatsApp, Panel real-time. | Alta |
| **M-004** | **Pie de Página (Footer)** | Enlaces legales básicos, copy y redes sociales institucionales. | Media |
| **M-005** | **Soporte Multilenguaje (i18n)** | Renderizado total de contenido dinámico según el motor next-intl. | Alta |

## 3. Modelo de Datos (Dominio)
*No aplica almacenamiento persistente ni entidades de dominio específicas para esta página.*

## 4. Especificaciones Técnicas (Next.js 15)

### Arquitectura de Rutas (`app/`)
- `app/src/app/page.tsx`: Página estática con generación dinámica en servidor (RSC). Consolidada como el punto de entrada de la aplicación en `/`.

### Componentes de Interfaz (RSC)
- `HeroSection`: Sección principal en el servidor. Usa mallas de gradientes CSS nativos y botones reusables de `shadcn/ui`.
- `FeatureGrid`: Grilla de beneficios. Utiliza componentes tipo Card con efecto glassmorphism sutil (`bg-background/60 backdrop-blur`).
- `Header`: Barra superior pegajosa (`sticky`) con soporte para cambio de tema cromático automático.

### Estilos e Internacionalización
- **Estilos**: Integración total con Tailwind CSS v4, aplicando las variables OKLCH nativas (`--color-primary`, `--radius`).
- **next-intl**: Recuperación de mensajes mediante `useTranslations("landing")` inyectados en el Layout.

## 5. Criterios de Aceptación
- CA-001: El sitio debe renderizarse perfectamente en smartphones de 360px sin scroll horizontal.
- CA-002: Todos los links a `/auth/login` y `/auth/register` deben ser funcionales.
- CA-003: No se permiten cadenas de texto (strings) hardcodeadas directas en el JSX; todo debe ser leído desde `es.json`.
- CA-004: El primer despliegue de contenido (LCP) en móviles 4G simulados debe ser inferior a 1.5 segundos debido al renderizado estricto del lado del servidor (RSC).
