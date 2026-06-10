# Tasks: Prevención de FOUC en Merchant Themes

## Phase 1: Tailwind CSS setup
- [ ] 1.1 Configurar el archivo global de estilos (`app/src/app/globals.css` o equivalente) para mapear colores primarios y secundarios a las variables CSS `--merchant-primary` y `--merchant-secondary`.

## Phase 2: SSR Variable Injection
- [ ] 2.1 En el Server Component de `app/src/app/(store)/[slug]/layout.tsx`, recuperar la información del comerciante y sus colores desde la base de datos o API interna.
- [ ] 2.2 Renderizar una etiqueta `<style>` con la declaración de variables inyectadas en el `:root` o un wrapper específico para el theme.
- [ ] 2.3 Quitar cualquier lógica de inyección de color basada en hooks de cliente (`useEffect` o inicializadores de Zustand que generaban FOUC).

## Phase 3: Verificación
- [ ] 3.1 Cargar la tienda con throttling de red (por ejemplo, 3G lenta) y validar visualmente que el fondo y botones principales se pinten del color del comercio desde el primer instante.
