# Idempotencia

## Concepto
La idempotencia garantiza que realizar una operación múltiples veces tenga el mismo efecto que ejecutarla una sola vez. Esto es crítico para operaciones sensibles donde la duplicación podría causar problemas (ej. crear pedidos, procesar pagos).

## Métodos HTTP Idempotentes

| Método | Idempotente | Descripción |
| :--- | :--- | :--- |
| GET | Sí | Múltiples lecturas no cambian el estado |
| PUT | Sí | Reemplazar un recurso N veces = mismo resultado |
| DELETE | Sí | Eliminar N veces = recurso eliminado |
| POST | No | Crear N veces = N recursos nuevos |
| PATCH | No | Actualización parcial puede tener efectos acumulativos |

## Implementación con Idempotency Keys

Para operaciones críticas no idempotentes (principalmente POST), se utiliza el header `Idempotency-Key`.

### Flujo de Idempotencia

1.  **Cliente genera una clave única** (UUID v4) para la operación
2.  **Cliente envía el request** con header `Idempotency-Key`
3.  **Servidor verifica** si ya procesó esa clave
4.  **Si existe**: Retorna la respuesta guardada (sin re-ejecutar)
5.  **Si no existe**: Procesa la operación y guarda el resultado

### Header de Idempotencia

**Formato**: `Idempotency-Key: <uuid>`

**Ejemplo**:
```http
POST /orders
Content-Type: application/json
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "items": [...],
  "customer": {...}
}
```

## Endpoints que Requieren Idempotencia

### Creación de Pedidos (Crítico)
```http
POST /orders
Idempotency-Key: <uuid>
```

**Escenario**: Cliente envía pedido, hay timeout de red, reintenta. Sin idempotencia = 2 pedidos duplicados.

**Con idempotencia**: El segundo request retorna el pedido ya creado.

### Creación de Recursos Administrativos (Opcional)
```http
POST /admin/products
Idempotency-Key: <uuid>
```

**Uso**: Prevenir duplicados si el admin hace doble-click en "Guardar".

## Respuestas con Idempotencia

### Primera Ejecución (Procesada)
```http
HTTP/1.1 201 Created
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-20260223-001",
    "status": "new"
  }
}
```

### Ejecución Repetida (Cacheada)
```http
HTTP/1.1 200 OK
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
X-Idempotency-Replay: true

{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-20260223-001",
    "status": "new"
  }
}
```

**Diferencias**:
-   Status code: `200 OK` en lugar de `201 Created`
-   Header adicional: `X-Idempotency-Replay: true`
-   Mismo payload que la respuesta original

## Tiempo de Vida de las Keys

-   **Duración**: 24 horas desde la primera ejecución
-   **Después de 24h**: La key expira y se puede reutilizar
-   **Almacenamiento**: Redis (rápido) o tabla en PostgreSQL

## Validaciones

### Key Inválida
Si el formato de la key no es UUID v4:
```json
{
  "success": false,
  "message": "Idempotency-Key inválida",
  "error": {
    "code": "INVALID_IDEMPOTENCY_KEY",
    "details": "La clave debe ser un UUID v4 válido"
  }
}
```

### Key Reutilizada con Payload Diferente
Si se envía la misma key con datos diferentes:
```json
{
  "success": false,
  "message": "Conflicto de idempotencia",
  "error": {
    "code": "IDEMPOTENCY_CONFLICT",
    "details": "La clave ya fue usada con un payload diferente"
  }
}
```

## Implementación en NestJS

### Decorator de Idempotencia
```typescript
@Post('orders')
@UseIdempotency() // Decorator personalizado
async createOrder(
  @Body() createOrderDto: CreateOrderDto,
  @IdempotencyKey() key: string
) {
  return this.ordersService.createOrder(createOrderDto, key);
}
```

### Servicio de Idempotencia
```typescript
@Injectable()
export class IdempotencyService {
  constructor(private redis: RedisService) {}

  async execute<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<{ data: T; isReplay: boolean }> {
    // Verificar si existe en cache
    const cached = await this.redis.get(`idempotency:${key}`);
    if (cached) {
      return { data: JSON.parse(cached), isReplay: true };
    }

    // Ejecutar operación
    const result = await operation();

    // Guardar resultado por 24h
    await this.redis.setex(
      `idempotency:${key}`,
      86400,
      JSON.stringify(result)
    );

    return { data: result, isReplay: false };
  }
}
```

## Manejo en el Cliente (Angular)

### Generar Idempotency Key
```typescript
import { v4 as uuidv4 } from 'uuid';

export class OrderService {
  createOrder(orderData: CreateOrderDto): Observable<Order> {
    const idempotencyKey = uuidv4();
    
    return this.http.post<Order>('/orders', orderData, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    });
  }
}
```

### Reintentos Automáticos
```typescript
createOrder(orderData: CreateOrderDto): Observable<Order> {
  const idempotencyKey = uuidv4();
  
  return this.http.post<Order>('/orders', orderData, {
    headers: { 'Idempotency-Key': idempotencyKey }
  }).pipe(
    retry({
      count: 3,
      delay: 1000,
      // Mismo idempotency key en todos los reintentos
    })
  );
}
```

## Consideraciones

-   **No usar para GET**: Los GET ya son idempotentes por naturaleza
-   **Obligatorio en producción**: Para `/orders` es crítico
-   **Opcional en desarrollo**: Puede deshabilitarse para simplificar testing
-   **Logging**: Registrar cuando se usa una key repetida para monitoreo
-   **Limpieza**: Las keys expiradas se eliminan automáticamente (TTL en Redis)
