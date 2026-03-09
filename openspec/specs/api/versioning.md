# Versionado de API

## Estrategia
En el MVP no se implementa versionado explícito de la API. Todos los endpoints están en la raíz sin prefijo de versión.

**Razón**: El MVP es la primera versión del sistema. Implementar versionado desde el inicio agrega complejidad innecesaria.

## Formato Futuro
Cuando sea necesario introducir cambios disruptivos, se implementará versionado en URL:

-   **Formato**: `/api/v<numero>/...`
-   **Ejemplo**: `GET /api/v2/products`

## Rutas Actuales (MVP)

### Sin Prefijo de Versión
-   `GET /:slug/categories` (tienda pública)
-   `GET /admin/products` (panel admin)
-   `POST /auth/login` (autenticación)

### Futuro con Versionado
-   `GET /api/v1/:slug/categories`
-   `GET /api/v1/admin/products`
-   `POST /api/v1/auth/login`

## Reglas de Versionado (Futuro)

### 1. Cambios No Disruptivos (Misma Versión)
Se mantienen en la versión actual sin incrementar:

-   **Agregar campos opcionales** a requests
-   **Agregar campos nuevos** a responses
-   **Agregar endpoints nuevos**
-   **Agregar valores a enums** (si son opcionales)
-   **Deprecar campos** (mantenerlos pero marcarlos como deprecated)

**Ejemplo**:
```typescript
// Versión actual: v1
interface Product {
  id: string;
  name: string;
  price: number;
  // Nuevo campo agregado (no disruptivo)
  tags?: string[];
}
```

### 2. Cambios Disruptivos (Nueva Versión Mayor)
Requieren incrementar la versión mayor (v1 → v2):

-   **Eliminar campos** de requests o responses
-   **Renombrar campos** existentes
-   **Cambiar tipos de datos** (string → number)
-   **Cambiar estructura** de objetos anidados
-   **Modificar comportamiento** de endpoints existentes
-   **Cambiar códigos de error** o status codes

**Ejemplo**:
```typescript
// v1
interface Order {
  deliveryType: 'delivery' | 'takeaway';
}

// v2 (cambio disruptivo: renombrado)
interface Order {
  deliveryMethod: 'delivery' | 'takeaway' | 'in_store';
}
```

## Estrategia de Migración

### Fase 1: Introducir v1 Explícito
Cuando se necesite la primera versión nueva:

1.  Mantener rutas actuales sin cambios (compatibilidad)
2.  Agregar rutas `/api/v1/...` como alias
3.  Documentar que las rutas sin prefijo son v1

### Fase 2: Lanzar v2
1.  Crear endpoints `/api/v2/...` con cambios disruptivos
2.  Mantener `/api/v1/...` funcionando (deprecated)
3.  Agregar header `X-API-Version: 1` en respuestas v1
4.  Documentar plan de deprecación de v1

### Fase 3: Deprecar v1
1.  Anunciar fecha de fin de soporte de v1
2.  Agregar header `X-API-Deprecated: true` en v1
3.  Retornar warning en responses de v1
4.  Migrar clientes a v2

### Fase 4: Eliminar v1
1.  Después de período de gracia (ej. 6 meses)
2.  Eliminar endpoints v1
3.  Retornar 410 Gone en rutas v1

## Headers de Versionado

### Request (Opcional)
```http
Accept: application/vnd.pickyapp.v2+json
```

### Response
```http
X-API-Version: 2
X-API-Deprecated: false
```

## Documentación de Versiones

Cada versión tendrá su propia documentación:
-   `/docs/v1` - Documentación de API v1
-   `/docs/v2` - Documentación de API v2

## Compatibilidad con Clientes

### Angular (Frontend)
```typescript
// Configuración de versión en environment
export const environment = {
  apiVersion: 'v1',
  apiUrl: `/api/${apiVersion}`
};

// Interceptor para agregar versión
export class VersionInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const versionedReq = req.clone({
      url: `/api/${environment.apiVersion}${req.url}`
    });
    return next.handle(versionedReq);
  }
}
```

### Versionado por Cliente
Permitir que diferentes clientes usen diferentes versiones:
-   **Web App**: v2 (última versión)
-   **Mobile App**: v1 (aún no actualizada)
-   **Integraciones**: v1 (migración planificada)

## Changelog de Versiones

### v1 (MVP - Actual)
-   Endpoints de catálogo (categorías, productos)
-   Endpoints de pedidos
-   Endpoints de configuración de tienda
-   Autenticación JWT
-   WebSocket para pedidos en tiempo real

### v2 (Futuro - Ejemplo)
-   **Breaking**: `deliveryType` renombrado a `deliveryMethod`
-   **Breaking**: Estructura de `OptionGroup` modificada
-   **Nuevo**: Endpoints de pagos online
-   **Nuevo**: Endpoints de facturación
-   **Deprecated**: Campo `phone` en favor de `phoneNumber`

## Consideraciones

-   **Mantener máximo 2 versiones activas** simultáneamente
-   **Período de deprecación mínimo**: 6 meses
-   **Comunicación clara**: Notificar cambios con anticipación
-   **Testing**: Mantener tests para todas las versiones activas
-   **Monitoreo**: Trackear uso de versiones deprecated
