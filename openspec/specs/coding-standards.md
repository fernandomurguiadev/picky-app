# Estándares de Código - PickyApp

Este documento define las normas técnicas para el desarrollo del proyecto PickyApp, asegurando consistencia, mantenibilidad y calidad en el código base.

## 1. Principios Generales

-   **KISS (Keep It Simple, Stupid)**: Evitar sobreingeniería. El código más simple es el más mantenible.
-   **DRY (Don't Repeat Yourself)**: Abstraer lógica repetida en funciones/componentes reutilizables.
-   **SOLID**: Aplicar principios de diseño orientado a objetos y funcional.
-   **Clean Code**: Código legible y auto-documentado. Los nombres deben explicar la intención.
-   **Mobile-First**: Todo código de UI debe funcionar primero en móvil 360px.

## 2. Convenciones de Nombres

| Elemento | Convención | Ejemplo | Contexto |
| :--- | :--- | :--- | :--- |
| Archivos | `kebab-case` o `camelCase` | `product-card.tsx`, `use-cart.ts` | Todos |
| Directorios | `kebab-case` | `product-list/` | Todos |
| Componentes React | `PascalCase` | `ProductCard` | TypeScript (React) |
| Hooks React | `camelCase` con prefijo `use` | `useCartStore` | TypeScript (React) |
| Tipos / Interfaces | `PascalCase` | `Product`, `Order` | TypeScript |
| Variables/Métodos | `camelCase` | `getUserData()`, `isActive` | TypeScript |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` | TypeScript |
| Tablas DB | `snake_case` plural | `products`, `order_items` | PostgreSQL |
| Columnas DB | `snake_case` | `tenant_id`, `created_at` | PostgreSQL |
| CSS Classes | Tailwind CSS utilities | `flex justify-between items-center` | HTML / JSX |

## 3. Frontend (Next.js 15 + React 19)

### 3.1 Paradigma Server vs Client Components (RSC / RCC)

**Reglas obligatorias**:
-   **Server Components (RSC)** por defecto: Todas las páginas, layouts y componentes estáticos deben ser RSC.
-   **Client Components (RCC)** mínimos: Usar `"use client"` únicamente si se necesita interacción, hooks de estado (`useState`, `useEffect`), Zustand o APIs del browser.
-   Mantener el cliente en las **hojas** del árbol de componentes para maximizar el SSR.

**Ejemplo de RSC (Contenedor de datos)**:
```tsx
// app/(store)/[slug]/page.tsx
import { getProductsByTenant } from '@/lib/api/catalog';
import { ProductGrid } from '@/components/store/product-grid';

export default async function StorePage({ params }: { params: { slug: string } }) {
  // Data Fetching directo en el servidor
  const products = await getProductsByTenant(params.slug);
  
  return (
    <main className="container px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Nuestro Menú</h1>
      <ProductGrid products={products} />
    </main>
  );
}
```

**Ejemplo de RCC (Interactividad pura)**:
```tsx
"use client";

import { useCartStore } from '@/lib/stores/cart-store';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs flex flex-col">
      <h3 className="font-semibold leading-none">{product.name}</h3>
      <Button 
        className="mt-auto w-full bg-primary text-primary-foreground"
        onClick={() => addItem(product)}
      >
        Agregar al Carrito
      </Button>
    </div>
  );
}
```

### 3.2 Gestión de Estado con Zustand

**Usar Zustand para estado del cliente global persistente**:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => 
        set((state) => ({ items: [...state.items, item] })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'pickyapp-cart-storage', // Persistido en localStorage
    }
  )
);
```

### 3.3 Estado del Servidor con TanStack Query

Usar React Query para caching, mutaciones y actualización reactiva de endpoints REST/WS en Client Components:

```tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '@/lib/api/orders';

export function OrdersList() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div>Cargando...</div>;
  
  return (
    <ul className="divide-y">
      {orders?.map(order => (
        <li key={order.id}>{order.orderNumber}</li>
      ))}
    </ul>
  );
}
```

### 3.4 Estilos (Tailwind CSS v4)

**Reglas de Maquetación**:
-   Usar clases utilitarias nativas de Tailwind v4 en línea.
-   No crear hojas CSS por componente ni abusar de `@apply` en `globals.css`.
-   Uso mandatorio de la utilidad `cn` (clsx + tailwind-merge) para unión condicional de clases:

```tsx
import { cn } from '@/lib/utils';

export function Badge({ status }: { status: 'pending' | 'done' }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      status === 'pending' ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
    )}>
      {status}
    </span>
  );
}
```

### 3.5 Formularios (React Hook Form + Zod)

Combinación declarativa para robustez de tipados:
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  name: z.string().min(3, "El nombre es requerido"),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
});

type FormData = z.infer<typeof schema>;

export function ProductForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data: FormData) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input {...register("name")} className="border p-2 w-full" />
      {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
      <button type="submit">Guardar</button>
    </form>
  );
}
```

---

## 4. Backend (NestJS)

### 4.1 Estructura de Módulos

**Cada módulo debe ser independiente**:
```
catalog/
├── catalog.module.ts
├── categories.controller.ts
├── products.controller.ts
├── catalog.service.ts
├── dto/
│   ├── create-product.dto.ts
│   └── update-product.dto.ts
└── entities/
    ├── category.entity.ts
    ├── product.entity.ts
    └── option-group.entity.ts
```

### 4.2 Controllers

**Usar decoradores de NestJS**:
```typescript
@Controller('admin/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly catalogService: CatalogService) {}
  
  @Get()
  async findAll(@TenantId() tenantId: string) {
    return this.catalogService.findAll(tenantId);
  }
  
  @Post()
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateProductDto
  ) {
    return this.catalogService.create(tenantId, dto);
  }
}
```

### 4.3 DTOs y Validación

**Usar class-validator**:
```typescript
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;
  
  @IsNumber()
  @Min(0)
  price: number;
  
  @IsUUID()
  categoryId: string;
  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionGroupDto)
  optionGroups: OptionGroupDto[];
}
```

### 4.4 Entities (TypeORM)

**Convenciones de entidades**:
```typescript
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;
  
  @Column({ length: 100 })
  name: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;
  
  @Column({ name: 'is_active', default: true })
  isActive: boolean;
  
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  
  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
```

### 4.5 Base de Datos

**Convenciones**:
-   Tablas en plural: `products`, `categories`, `orders`
-   Columnas en snake_case: `tenant_id`, `created_at`, `is_active`
-   PKs siempre UUID: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
-   Timestamps obligatorios: `created_at`, `updated_at`
-   Soft deletes con: `deleted_at`
-   Índices en FKs y columnas de filtrado frecuente

---

## 5. Git y Control de Versiones

### 5.1 Conventional Commits

**Formato**: `<type>(<scope>): <description>`

**Tipos**:
-   `feat`: Nueva funcionalidad
-   `fix`: Corrección de bug
-   `refactor`: Refactorización sin cambio de funcionalidad
-   `style`: Cambios de formato (no afectan lógica)
-   `docs`: Documentación
-   `test`: Tests
-   `chore`: Tareas de mantenimiento

**Ejemplos**:
```
feat(catalog): add product variant selector
fix(orders): resolve websocket reconnection issue
refactor(auth): simplify token refresh logic
style(ui): update tailwind classes on buttons
test(catalog): add integration tests for react queries
chore(deps): update next to 15.1
```

### 5.2 Pull Requests

**Checklist antes de PR**:
- [ ] Código compila sin errores en local
- [ ] Ejecución correcta de `npm run lint`
- [ ] Todos los tests unitarios y e2e pasan
- [ ] Captura visual / grabación para cambios complejos de UI
- [ ] Respetar convenciones RLS (Filtro `tenant_id` explícito en todas las consultas de dominio)

-   Usar etiquetas semánticas HTML
-   ARIA labels en iconos
-   Contraste mínimo 4.5:1
-   Navegación por teclado
-   Focus visible
-   Alt text en imágenes
