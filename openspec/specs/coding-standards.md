# Estándares de Código - PickyApp

Este documento define las normas técnicas para el desarrollo del proyecto PickyApp, asegurando consistencia, mantenibilidad y calidad en el código base.

## 1. Principios Generales

-   **KISS (Keep It Simple, Stupid)**: Evitar sobreingeniería. El código más simple es el más mantenible.
-   **DRY (Don't Repeat Yourself)**: Abstraer lógica repetida en funciones/componentes reutilizables.
-   **SOLID**: Aplicar principios de diseño orientado a objetos.
-   **Clean Code**: Código legible y auto-documentado. Los nombres deben explicar la intención.
-   **Mobile-First**: Todo código de UI debe funcionar primero en móvil 360px.

## 2. Convenciones de Nombres

| Elemento | Convención | Ejemplo | Contexto |
| :--- | :--- | :--- | :--- |
| Archivos | `kebab-case` | `product-card.component.ts` | Todos |
| Clases | `PascalCase` | `ProductCardComponent` | TypeScript |
| Interfaces | `PascalCase` | `Product`, `Order` | TypeScript |
| Variables/Métodos | `camelCase` | `getUserData()`, `isActive` | TypeScript |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` | TypeScript |
| Signals | `camelCase` | `products()`, `isLoading()` | Angular |
| Observables | `camelCase$` | `products$`, `user$` | RxJS |
| Tablas DB | `snake_case` plural | `products`, `order_items` | PostgreSQL |
| Columnas DB | `snake_case` | `tenant_id`, `created_at` | PostgreSQL |
| CSS Classes | `kebab-case` | `.product-card`, `.btn-primary` | SCSS |
| CSS Variables | `--kebab-case` | `--color-primary`, `--spacing-md` | CSS |

## 3. Frontend (Angular 19)

### 3.1 Componentes

**Reglas obligatorias**:
-   TODOS los componentes deben ser `standalone: true`
-   Usar `ChangeDetectionStrategy.OnPush` siempre
-   Imports explícitos en cada componente
-   `@Input({ required: true })` para props obligatorios
-   Usar control flow moderno: `@if`, `@for`, `@switch` (NO `*ngIf`, `*ngFor`)

```typescript
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyFormatPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() addToCart = new EventEmitter<Product>();
  
  protected readonly isLoading = signal(false);
}
```

**Estructura de archivos**:
```
product-card/
├── product-card.component.ts
├── product-card.component.html
├── product-card.component.scss
└── product-card.component.spec.ts
```

### 3.2 Gestión de Estado

**Usar Signals para estado reactivo**:
```typescript
// ✅ CORRECTO
export class CartService {
  private _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();
  readonly total = computed(() => 
    this._items().reduce((sum, i) => sum + i.price * i.qty, 0)
  );
  
  addItem(item: CartItem) {
    this._items.update(items => [...items, item]);
  }
}

// ❌ INCORRECTO (no usar BehaviorSubject en código nuevo)
export class CartService {
  private items$ = new BehaviorSubject<CartItem[]>([]);
}
```

**Persistencia en localStorage**:
```typescript
effect(() => {
  localStorage.setItem('cart', JSON.stringify(this._items()));
});
```

### 3.3 Estilos (SCSS)

**Usar variables CSS**:
```scss
.product-card {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  box-shadow: var(--shadow-sm);
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    transition: var(--transition-normal);
  }
}
```

**Mobile-first con mixins**:
```scss
.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;  // móvil: 2 columnas
  gap: var(--spacing-md);
  
  @include respond-to('md') {
    grid-template-columns: repeat(3, 1fr);  // tablet: 3
  }
  
  @include respond-to('lg') {
    grid-template-columns: repeat(4, 1fr);  // desktop: 4
  }
}
```

**NO usar estilos globales** excepto en `styles.scss`. Cada componente tiene sus estilos encapsulados.

### 3.4 Formularios

**Usar Reactive Forms**:
```typescript
export class ProductFormComponent {
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    price: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', Validators.required],
    optionGroups: this.fb.array([])
  });
  
  constructor(private fb: FormBuilder) {}
  
  get optionGroups() {
    return this.form.get('optionGroups') as FormArray;
  }
}
```

**Validación inline en template**:
```html
<input formControlName="name" />
@if (form.controls.name.invalid && form.controls.name.touched) {
  <span class="error">El nombre es requerido</span>
}
```

### 3.5 Servicios

**Injectable con providedIn**:
```typescript
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly apiUrl = inject(environment).apiUrl;
  private readonly http = inject(HttpClient);
  
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }
}
```

**Usar inject() en lugar de constructor injection** (Angular 14+):
```typescript
// ✅ CORRECTO (moderno)
export class MyComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
}

// ❌ EVITAR (antiguo, pero aceptable)
export class MyComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
}
```

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
  
  @Column({ name: 'tenant_id' })
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

### 4.5 Services

**Inyección de repositorios**:
```typescript
@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>
  ) {}
  
  async findAll(tenantId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { tenantId, isActive: true },
      relations: ['category'],
      order: { order: 'ASC' }
    });
  }
}
```

### 4.6 Base de Datos

**Convenciones**:
-   Tablas en plural: `products`, `categories`, `orders`
-   Columnas en snake_case: `tenant_id`, `created_at`, `is_active`
-   PKs siempre UUID: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
-   Timestamps obligatorios: `created_at`, `updated_at`
-   Soft deletes con: `deleted_at`
-   Índices en FKs y columnas de filtrado frecuente

**Migraciones**:
```typescript
// Nombre: 1234567890-CreateProductsTable.ts
export class CreateProductsTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'products',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
        { name: 'tenant_id', type: 'uuid', isNullable: false },
        { name: 'name', type: 'varchar', length: '100' },
        { name: 'price', type: 'decimal', precision: 10, scale: 2 },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' }
      ]
    }));
    
    await queryRunner.createIndex('products', new TableIndex({
      name: 'IDX_products_tenant_id',
      columnNames: ['tenant_id']
    }));
  }
  
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('products');
  }
}
```

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
style(ui): update button hover states
docs(api): add authentication flow diagram
test(catalog): add unit tests for product service
chore(deps): update angular to 19.1
```

### 5.2 Estrategia de Ramas

```
main (producción)
  ↑
develop (integración)
  ↑
feature/catalog-management
feature/order-kanban
feature/checkout-flow
hotfix/critical-bug
```

**Reglas**:
-   `main`: Solo código en producción, protegida
-   `develop`: Integración continua, base para features
-   `feature/*`: Nuevas funcionalidades, se mergean a develop
-   `hotfix/*`: Fixes urgentes, se mergean a main y develop
-   Nunca commit directo a `main` o `develop`

### 5.3 Pull Requests

**Checklist antes de PR**:
- [ ] Código compila sin errores
- [ ] Tests pasan
- [ ] Lint pasa sin warnings
- [ ] Código revisado por el autor
- [ ] Descripción clara del cambio
- [ ] Screenshots si hay cambios visuales

## 6. Comentarios y Documentación

### 6.1 Cuándo Comentar

**SÍ comentar**:
-   Lógica de negocio compleja
-   Workarounds temporales
-   Decisiones no obvias
-   APIs públicas (JSDoc)

**NO comentar**:
-   Código auto-explicativo
-   Obviedades
-   Código comentado (eliminarlo)

### 6.2 JSDoc para APIs Públicas

```typescript
/**
 * Calcula el precio total del pedido incluyendo modificadores de opciones
 * @param items - Items del pedido con opciones seleccionadas
 * @param deliveryCost - Costo de envío (0 si no aplica)
 * @returns Precio total en centavos
 */
export function calculateOrderTotal(
  items: OrderItem[],
  deliveryCost: number
): number {
  // implementación
}
```

## 7. Testing

### 7.1 Nombres de Tests

```typescript
describe('ProductCardComponent', () => {
  it('should display product name and price', () => {});
  it('should emit addToCart event when button clicked', () => {});
  it('should show "Agotado" badge when product is out of stock', () => {});
});
```

### 7.2 Arrange-Act-Assert

```typescript
it('should calculate total with option modifiers', () => {
  // Arrange
  const items = [
    { price: 1000, qty: 2, options: [{ priceModifier: 200 }] }
  ];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(2400); // (1000 + 200) * 2
});
```

## 8. Performance

### 8.1 Frontend

-   Lazy loading de rutas
-   OnPush change detection
-   TrackBy en @for loops
-   Debounce en búsquedas (300ms)
-   Skeleton loaders en lugar de spinners
-   Imágenes lazy con directive

### 8.2 Backend

-   Índices en columnas de filtrado
-   Eager loading de relaciones necesarias
-   Paginación en listados grandes
-   Cache de datos estáticos (Redis)
-   Compresión de responses (gzip)

## 9. Seguridad

-   NUNCA commitear secrets (.env en .gitignore)
-   Validar TODOS los inputs (DTOs)
-   Sanitizar outputs (Angular lo hace automáticamente)
-   Usar prepared statements (TypeORM lo hace)
-   HTTPS obligatorio en producción
-   Tokens en httpOnly cookies
-   Rate limiting en endpoints públicos

## 10. Accesibilidad (A11y)

-   Usar etiquetas semánticas HTML
-   ARIA labels en iconos
-   Contraste mínimo 4.5:1
-   Navegación por teclado
-   Focus visible
-   Alt text en imágenes
