# Estándares de Base de Datos - PickyApp

Este documento define las reglas, convenciones y formatos arquitectónicos que debe seguir el modelo relacional del proyecto. **La forma física final de cada tabla está gobernada y declarada directamente por las Entidades de TypeORM en el código fuente** (Fuente Única de la Verdad), por lo que este pliego especifica únicamente los estándares de diseño técnico.

---

## 1. Motor y ORM
*   **Motor**: PostgreSQL 15+
*   **ORM**: TypeORM 0.3+
*   **Acceso**: Repository Pattern con inyección de dependencias en NestJS.

---

## 2. Convenciones de Nomenclatura

### 2.1 Tablas
*   **Formato**: `snake_case` en **plural**.
*   **Ejemplos**: `tenants`, `products`, `orders`, `order_items`.
*   **Tablas Intermedias (N:M)**: `{tabla1_singular}_{tabla2_singular}` en orden alfabético si no tienen peso conceptual propio.

### 2.2 Columnas
*   **Formato**: `snake_case` en **singular**.
*   **Identificador Único (PK)**: Siempre debe llamarse `id` (nunca `{tabla}_id`).
*   **Foreign Keys (FK)**: Siempre `{tabla_relacionada_singular}_id`.
    *   *Ejemplo*: En la tabla `products`, la FK a `categories` es `category_id`.
*   **Booleanos**: Prefijos verbales claros como `is_`, `has_`, `can_`.
    *   *Ejemplos*: `is_active`, `has_stock`, `is_featured`.
*   **Fechas**: Sufijo `_at` para timestamps de sistema, `_date` para fechas de negocio (sin hora).
    *   *Ejemplos*: `created_at`, `updated_at`, `delivery_date`.

---

## 3. Tipos de Datos Estándar

Para garantizar la consistencia y evitar discrepancias entre entornos, se imponen los siguientes tipos de PostgreSQL:

| Concepto | Tipo SQL recomendado | Tipo TypeScript / NestJS | Nota técnica |
| :--- | :--- | :--- | :--- |
| **IDs Primarios / Foráneos** | `UUID` | `string` | Generación por servidor (`uuid_generate_v4()`). |
| **Monedas y Precios** | `DECIMAL(10,2)` | `number` (con transform) | Evita errores de redondeo de coma flotante (`float`). |
| **Booleanos** | `BOOLEAN` | `boolean` | Usar default `false` o `true` explícito. |
| **Texto Largo / Rich Text** | `TEXT` | `string` | Para descripciones, URLs de imágenes largas y notas. |
| **Texto Corto / Códigos** | `VARCHAR(n)` | `string` | Usar solo cuando hay un límite físico estricto (slugs, emails). |
| **Fechas y Timestamps** | `TIMESTAMP WITH TIME ZONE` | `Date` | Almacenamiento nativo estricto en UTC. |
| **Estructuras Variables** | `JSONB` | `Record<string, any>` | Solo para configuraciones del Tenant, arrays de horarios o metadatos de auditoría. |

---

## 4. Aislamiento Multi-Tenant (Crítico)
PickyApp es una plataforma SaaS Multi-Tenant. El aislamiento de datos es absoluto y se rige por las siguientes directrices:

1.  **Columna Discriminadora**: Toda entidad de negocio que pertenezca directa o indirectamente a un comercio **DEBE** incluir la columna `tenant_id UUID`.
2.  **Indexación Obligatoria**: Cada tabla con `tenant_id` debe contar con un índice que incluya esta columna.
    *   *Ejemplo*: Índices compuestos `{tenant_id, is_active}` o `{tenant_id, order}` para evitar escaneos de tabla cruzados.
3.  **Validación en Aplicación**: El framework NestJS (vía Guards/Interceptors) debe inyectar automáticamente el `tenant_id` extraído del JWT en cada operación de lectura o escritura sobre la base de datos.

---

## 5. Columnas de Auditoría y Sistema
Toda tabla (a excepción de tablas de unión puras sin metadata) debe incluir de manera obligatoria el siguiente bloque de auditoría básica:

```typescript
// Bloque estándar en Entidades
@CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
createdAt: Date;

@UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone', nullable: true })
updatedAt: Date;
```

---

## 6. Constraints, Cascadas e Índices

### 6.1 Integrity Constraints
*   **Check Constraints**: Se deben aplicar a nivel de base de datos para reglas de negocio inviolables (ej. `price >= 0`, `total >= 0`).
*   **Foreign Keys**: Siempre deben estar explícitamente definidas (nunca confiar solo en la lógica de aplicación).
*   **On Delete Cascade**: Permitido únicamente para entidades de detalle que no tengan vida propia sin su padre.
    *   *Ejemplo*: Eliminar un `product` dispara cascada sobre sus `product_images` y sus `option_groups`.
    *   *Ejemplo (PROHIBIDO)*: Eliminar un `tenant` **NUNCA** debe disparar cascada sobre `orders` directamente sin revisión de auditoría o borrado lógico previo.

### 6.2 Estrategia de Índices
1.  **Búsqueda de Texto**: Usar la extensión `pg_trgm` y un índice `GIN` para búsquedas en storefront (`name`, `description`) para soportar búsquedas parciales eficientes (`ILIKE %termino%`).
2.  **Unique Constraints**: Aplicar en combinaciones lógicas únicas por tenant.
    *   *Ejemplo*: `UNIQUE(tenant_id, order_number)` garantiza que los números correlativos de pedido no choquen entre distintos comercios.
3.  **Ordenamiento**: Indexar columnas que rijan el orden manual visual en listas (`order`, `created_at DESC`).

---

## 7. Mantenimiento y Versionado
*   **Migraciones**: Se prohíbe el uso de `synchronize: true` en entornos de staging o producción. Todo cambio estructural se maneja vía archivos de migración TypeORM deterministas (métodos `up` y `down` balanceados).
*   **Datos Estáticos (Seeds)**: Los datos iniciales requeridos para operar (ej. categorías por defecto del sistema) deben estar aislados en scripts de seeding independientes del ciclo de vida del esquema relacional.
