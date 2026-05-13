# Skill: Crear Nuevo Endpoint (BFF Route Handler)

## Descripción
Esta skill guía la creación de un nuevo endpoint en el Backend-for-Frontend (BFF) de Next.js para comunicar con la API de PickyApp o servicios externos.

## Prompt Template

Cuando necesites crear un nuevo endpoint de API, utiliza este contexto:

```markdown
Actúa como un Backend Architect experto en Next.js.
Tarea: Crear un nuevo Route Handler en `app/api/[RUTA]/route.ts`.

Requisitos:
1.  **Seguridad**:
    *   Validar la sesión del usuario (JWT en cookies).
    *   Verificar permisos/roles si es necesario.
    *   NUNCA exponer tokens privados al cliente.

2.  **Validación**:
    *   Usar `zod` para validar el cuerpo de la petición (Request Body) y los parámetros (Query Params).
    *   Devolver errores 400 con detalles claros si la validación falla.

3.  **Manejo de Errores**:
    *   Usar `try/catch`.
    *   Manejar errores de la API externa (upstream) y propagar el status code correcto (o adaptarlo).
    *   Loguear errores críticos en el servidor.

4.  **Tipado**:
    *   Usar `NextRequest` y `NextResponse`.
    *   Tipar la respuesta JSON.

Ejemplo de `route.ts`:

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { api } from '@/lib/api-client-server'; // Cliente http interno

const schema = z.object({
  amount: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount } = schema.parse(body);

    // Lógica de negocio o llamada a API externa
    const result = await api.post('transactions', { json: { amount } });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```
