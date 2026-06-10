# Design: Prevención de FOUC en Merchant Themes

## 1. Configuración de Tailwind CSS (Tailwind v4)
* En el archivo global de estilos (`app/src/app/globals.css` o `index.css`), definir las variables mapeadas:
  ```css
  @theme {
    --color-merchant-primary: var(--merchant-primary, #000000);
    --color-merchant-secondary: var(--merchant-secondary, #ffffff);
  }
  ```

## 2. Inyección de Estilos en Layout de Storefront
* En `app/src/app/(store)/[slug]/layout.tsx`:
  * Hacer un fetch del tenant por su `slug` desde Next.js Server Component.
  * Renderizar los estilos dinámicos:
    ```tsx
    const tenant = await getTenantBySlug(slug);
    
    return (
      <html lang="es">
        <head>
          <style dangerouslySetInnerHTML={{ __html: `
            :root {
              --merchant-primary: ${tenant.primaryColor || '#000000'};
              --merchant-secondary: ${tenant.secondaryColor || '#ffffff'};
            }
          `}} />
        </head>
        <body>
          {children}
        </body>
      </html>
    );
    ```
