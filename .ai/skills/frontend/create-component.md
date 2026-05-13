# Skill: Crear Nuevo Componente UI

## Descripción
Esta skill guía la creación de componentes de interfaz de usuario reutilizables, accesibles y estéticamente coherentes con el diseño de PickyApp.

## Prompt Template

Cuando necesites crear un nuevo componente visual, utiliza este contexto:

```markdown
Actúa como un UI Designer y Frontend Developer experto.
Tarea: Crear un componente de UI en `components/[CATEGORIA]/[NOMBRE].tsx`.

Categorías:
- `ui`: Componentes base (botones, inputs) - generalmente de shadcn/ui.
- `shared`: Componentes reutilizables de negocio (ej: `CurrencyDisplay`, `StatusBadge`).
- `features/[feature]`: Componentes específicos de una funcionalidad (ej: `dashboard/transaction-list.tsx`).

**IMPORTANTE — Dónde vive un componente de vista:**
- Los archivos `*-view.tsx` deben vivir en `src/components/[dominio]/`, NUNCA dentro de carpetas de rutas (`src/app/...`).
- El `page.tsx` solo hace data fetching (Server Component) y renderiza el View Component pasando datos como props.
- Si encontrás un componente de vista dentro de `src/app/`, movelo a `src/components/` y actualizá el import en el `page.tsx` correspondiente.
- **Recordar**: Nombres de archivos SIEMPRE en kebab-case (todo en minúsculas con guión medio). El componente React interno mantiene PascalCase.

Requisitos:
1.  **Props vs Tipos de Dominio**:
    *   Las interfaces de **props** del componente se declaran en el **mismo archivo** del componente.
    *   **Cualquier otra interfaz** (modelos de dominio, respuestas de API, enums, shapes compartidos) debe vivir en `src/types/[modulo].types.ts`. Nunca declarar tipos de dominio inline en un componente.
    *   Ejemplo: `WithdrawalsViewProps` → en el archivo del componente. `WithdrawalResponse`, `OrderIntentType` → en `src/types/withdrawal.types.ts`.
    *   Extender `React.HTMLAttributes<HTMLElement>` si es un wrapper.
    *   Usar `className` como prop opcional para permitir sobreescritura.

2.  **Traducciones (i18n)**:
    *   **NUNCA hardcodear strings visibles al usuario**. Usar siempre `useTranslations(namespace)`.
    *   Agregar todas las claves en `src/messages/es.json` antes (o junto) con el componente.
    *   El namespace debe reflejar el dominio del componente: si es del módulo `withdrawals`, usar `useTranslations("withdrawals.miSeccion")`.
    *   Verificar que la clave en `es.json` sea un **objeto** `{}` y no un string cuando se usa como namespace. Un string leaf causa `MISSING_MESSAGE` en runtime.
    *   Usar PowerShell para validar la estructura: `$json = Get-Content "src/messages/es.json" -Raw | ConvertFrom-Json; $json.miNamespace.PSObject.Properties.Name`

3.  **Enums sobre strings literales**:
    *   Nunca pasar strings literales a props que esperan un enum. Esto aplica a **cualquier enum del proyecto** (`OrderIntentType`, `WithdrawalStatus`, `ApprovalMode`, etc.).
    *   Usar siempre los valores del enum. Ej: `OrderIntentType.WITHDRAWAL` en vez de `"retiro"` o `"withdrawal"`.
    *   Si el dato viene de mock data con tipo string, hacer cast explícito: `tipo as MiEnum`.

2.  **Estilos**:
    *   Usar `clsx` o `cn` (utility en `lib/utils.ts`) para combinar clases condicionales y permitir merge de Tailwind.
    *   Diseño Mobile-First.

3.  **Accesibilidad**:
    *   Usar etiquetas HTML semánticas (`button`, `article`, `section`).
    *   Incluir atributos ARIA si es un componente interactivo complejo.

Ejemplo de Componente (`components/shared/status-badge.tsx`):

```tsx
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'pending' | 'completed' | 'failed';
  className?: string;
}

const styles = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      styles[status],
      className
    )}>
      {status}
    </span>
  );
}
```
