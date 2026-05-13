# Skill: Crear Nueva Página (Next.js App Router)

## Descripción
Esta skill guía la creación de una nueva página en la aplicación PickyApp siguiendo las convenciones de Next.js 15 App Router y el diseño del sistema.

## Prompt Template

Cuando necesites crear una nueva página, utiliza este contexto:

```markdown
Actúa como un Frontend Architect experto en Next.js 15.
Tarea: Crear una nueva página en la ruta: `[RUTA_DESEADA]` (ej: `/dashboard/wallet`).

Requisitos:
1.  **Separación obligatoria `page.tsx` / `*-view.tsx`**:
    *   El `page.tsx` es un **Server Component**. Su única responsabilidad es hacer data fetching y pasarle los datos como props al View Component.
    *   El componente de vista (`*-view.tsx` o `*-container.tsx`) vive en `src/components/[dominio]/`. **NUNCA dentro de la carpeta de ruta** (`src/app/...`).
    *   Nombres de archivo SIEMPRE en **kebab-case** (ej: `mi-feature-view.tsx`).
    *   El `page.tsx` importa el View Component usando el alias `@/components/[dominio]/mi-feature-view`.
    *   Si encontrás un componente de vista dentro de `src/app/`, movélo a `src/components/` y actualizá el import. En Windows/PowerShell usar `-LiteralPath` en `Copy-Item` / `Remove-Item` para rutas con corchetes como `[id]`.

2.  **Estructura de Archivos**:
    *   Crear la carpeta en `app/[locale]/[RUTA]`.
    *   `page.tsx`: Server Component — solo fetching + render del View Component.
    *   `src/components/[dominio]/[nombre-del-view].tsx`: Client Component con toda la lógica interactiva.
    *   `layout.tsx`: Si la sección requiere un layout específico (opcional).
    *   `loading.tsx`: Para estados de carga con Skeleton.
    *   `error.tsx`: Para manejo de errores (debe ser 'use client').

3.  **Convenciones de Código**:
    *   Usar TypeScript estricto.
    *   El View Component usa `'use client'` y maneja hooks, eventos, estado local.
    *   El `page.tsx` NO usa `'use client'`, NO usa hooks, NO usa `useTranslations`.
    *   Utilizar `next-intl` para todas las traducciones (`useTranslations`) **dentro del View Component**, no en el `page.tsx`.
    *   Definir metadatos con `generateMetadata` en el `page.tsx` si es necesario.

4.  **Estilos**:
    *   Usar Tailwind CSS.
    *   Seguir el sistema de diseño (tokens de colores, espaciado).
    *   Usar componentes de `shadcn/ui` para botones, inputs, cards, etc.

5.  **Data Fetching**:
    *   En `page.tsx` (Server Component): **NUNCA** llamar a Route Handlers locales (`/api/...`) vía `fetch`. Usar directamente los servicios del servidor (`src/services/backend`) o helpers de sesión (`getServerSession`).
    *   En el View Component (Client): Usar TanStack Query (`useQuery`) apuntando a los Route Handlers del BFF. **NUNCA** usar `getServerSession` — es server-only y rompe en Client Components. Los datos de sesión se reciben como props desde el `page.tsx` o se leen con el hook `useSessionData`.

Ejemplo de `page.tsx` (Server Component):

```tsx
// src/app/backoffice/(main)/mi-feature/page.tsx
import { getServerSession } from "@/lib/session-manager";
import { beGetMiData } from "@/services/backend/mi-servicio";
import { MiFeatureView } from "@/components/mi-feature/mi-feature-view";

export default async function MiFeaturePage() {
  const session = await getServerSession("backoffice");
  const data = await beGetMiData(session?.accessToken);

  return (
    <MiFeatureView
      data={data}
      session={session}
    />
  );
}
```

Ejemplo de `mi-feature-view.tsx` (Client Component en `src/components/`):

```tsx
// src/components/mi-feature/mi-feature-view.tsx
"use client";

import { useTranslations } from "next-intl";
import { Metadata } from 'next';

interface MiFeatureViewProps {
  data: MiData[];
  session: MiSession;
}

export function MiFeatureView({ data, session }: MiFeatureViewProps) {
  const t = useTranslations("miFeature");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      {/* Contenido interactivo con hooks, estado, etc. */}
    </div>
  );
}
```
