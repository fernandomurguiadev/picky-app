# Estándares de Testing - PickyApp

## 1. Estrategia General

El objetivo es tener cobertura de pruebas que garantice la estabilidad de los flujos críticos del negocio. Se priorizan **tests de integración** para flujos completos y **tests unitarios** para lógica de negocio compleja.

**Pirámide de Testing**:
```
        /\
       /E2\     ← Pocos tests E2E (flujos críticos)
      /____\
     /      \
    / Integr \  ← Mayoría de tests (API endpoints)
   /__________\
  /            \
 /   Unitarios  \ ← Tests de lógica aislada
/________________\
```

## 2. Backend (NestJS)

### 2.1 Tests Unitarios

**Objetivo**: Probar lógica de negocio aislada (servicios, utilidades).

**Herramienta**: Jest (incluido en NestJS)

**Alcance**:
- Servicios con lógica compleja
- Utilidades y helpers
- Guards y pipes personalizados
- Transformaciones de datos

**Ejemplo**:
```typescript
// catalog.service.spec.ts
describe('CatalogService', () => {
  let service: CatalogService;
  let mockRepository: MockType<Repository<Product>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: getRepositoryToken(Product),
          useFactory: repositoryMockFactory
        }
      ]
    }).compile();

    service = module.get(CatalogService);
    mockRepository = module.get(getRepositoryToken(Product));
  });

  describe('calculateProductPrice', () => {
    it('should calculate price with option modifiers', () => {
      const product = { price: 1000 };
      const options = [{ priceModifier: 200 }, { priceModifier: 300 }];
      
      const total = service.calculateProductPrice(product, options);
      
      expect(total).toBe(1500); // 1000 + 200 + 300
    });

    it('should handle negative modifiers (discounts)', () => {
      const product = { price: 1000 };
      const options = [{ priceModifier: -100 }];
      
      const total = service.calculateProductPrice(product, options);
      
      expect(total).toBe(900);
    });
  });
});
```

### 2.2 Tests de Integración

**Objetivo**: Probar la API completa o interacción entre componentes.

**Herramienta**: Jest + Supertest

**Alcance**:
- Endpoints de API (controllers)
- Flujos con base de datos
- Autenticación y autorización
- Validación de DTOs

**Ejemplo**:
```typescript
// products.e2e-spec.ts
describe('Products API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login para obtener token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /admin/products', () => {
    it('should create a product', async () => {
      const dto = {
        name: 'Pizza Napolitana',
        price: 2500,
        categoryId: 'category-uuid',
        optionGroups: []
      };

      const response = await request(app.getHttpServer())
        .post('/admin/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(dto.name);
      expect(response.body.data.price).toBe(dto.price);
    });

    it('should return 400 for invalid data', async () => {
      const dto = {
        name: '', // Inválido
        price: -100 // Inválido
      };

      const response = await request(app.getHttpServer())
        .post('/admin/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/admin/products')
        .send({})
        .expect(401);
    });
  });

  describe('GET /admin/products', () => {
    it('should return products for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/products?categoryId=category-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every(p => p.categoryId === 'category-uuid')).toBe(true);
    });
  });
});
```

### 2.3 Comandos de Testing

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.## 3. Frontend (Next.js 15 + React 19)

### 3.1 Tests Unitarios y de Componentes

**Objetivo**: Validar la renderización y la lógica interactiva aislada de componentes RCC y funciones helper.

**Herramientas**: Vitest + React Testing Library (RTL) + Happy Dom

**Alcance**:
- Hooks personalizados (Zustand selectors)
- Utilidades y formateadores
- Componentes visuales de cliente (RCC)
- Interacciones de usuario (clicks, input typing)

**Ejemplo de Hook (Zustand)**:
```typescript
// lib/stores/use-cart-store.spec.ts
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from './cart-store';

describe('useCartStore', () => {
  beforeEach(() => {
    act(() => useCartStore.getState().clearCart());
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCartStore());
    const mockProduct = { id: '1', name: 'Pizza', price: 1000 };

    act(() => {
      result.current.addItem(mockProduct);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].name).toBe('Pizza');
  });
});
```

**Ejemplo de Componente Client (RCC)**:
```tsx
// components/store/product-card.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './product-card';
import { vi } from 'vitest';

// Mock de Zustand store para aislar el componente
vi.mock('@/lib/stores/cart-store', () => ({
  useCartStore: () => ({
    addItem: vi.fn(),
  }),
}));

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    name: 'Pizza Margarita',
    price: 1200,
  };

  it('should display product details', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Pizza Margarita')).toBeInTheDocument();
  });

  it('should call tracking/interaction when button clicked', () => {
    render(<ProductCard product={mockProduct} />);
    
    const button = screen.getByRole('button', { name: /agregar/i });
    fireEvent.click(button);
    
    // Assertions correspondientes
  });
});
```

### 3.2 Tests de Integración y E2E

**Objetivo**: Probar flujos end-to-end reales en el navegador simulado.

**Herramienta**: Playwright (Recomendado para Next.js 15)

**Alcance**:
- Flujo completo de Checkout y redirección
- Tablero Kanban de Pedidos en tiempo real (WebSocket)
- Acceso restringido a rutas de Admin (Middleware)

**Ejemplo con Playwright**:
```typescript
// tests/e2e/order-flow.spec.ts
import { test, expect } from '@playwright/test';

test('debe completar un pedido completo en la tienda', async ({ page }) => {
  // 1. Ir a la tienda del tenant
  await page.goto('/pizzeria-don-pepe');

  // 2. Seleccionar una categoría y un producto
  await page.getByRole('link', { name: 'Pizzas' }).click();
  await page.getByText('Pizza Margarita').click();

  // 3. Interactuar con el Bottom Sheet (Vaul) y agregar al carrito
  await page.getByRole('button', { name: 'Agregar al Carrito' }).click();

  // 4. Abrir carrito e ir a checkout
  await page.getByTestId('cart-trigger').click();
  await page.getByRole('button', { name: 'Continuar Pedido' }).click();

  // 5. Completar formulario de entrega
  await page.fill('[name="name"]', 'Juan Pérez');
  await page.fill('[name="phone"]', '1122334455');
  
  // 6. Confirmar
  await page.getByRole('button', { name: 'Confirmar y Enviar' }).click();

  // 7. Validar pantalla de éxito
  await expect(page.getByText('Pedido Recibido')).toBeVisible();
});
```

### 3.3 Comandos de Testing

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## 4. Criterios de Calidad

### 4.1 Cobertura de Código

**Objetivo** (opcional para MVP):
- Backend: 70% en servicios críticos
- Frontend: 60% en hooks y componentes RCC críticos

**Flujos Críticos** (cobertura obligatoria):
- ✅ Autenticación (cookies HttpOnly)
- ✅ Creación de pedidos y dispatch
- ✅ Carga dinámica del catálogo
- ✅ Multi-tenancy (aislamiento en consultas SQL)

### 4.2 Datos de Prueba

**Factories** (Backend - faker.js):
```typescript
// test/factories/product.factory.ts
export const createProduct = (overrides?: Partial<Product>): Product => ({
  id: faker.string.uuid(),
  tenantId: faker.string.uuid(),
  name: faker.commerce.productName(),
  price: Number(faker.commerce.price()),
  isActive: true,
  ...overrides
});
```

**Fixtures** (Frontend):
```typescript
// lib/testing/fixtures.ts
export const mockStoreSettings = {
  slug: 'don-pepe',
  name: 'Pizzeria Don Pepe',
  primaryColor: '#e11d48',
};
```

## 5. Buenas Prácticas

### ✅ DO

1. **Arrange-Act-Assert**: Estructura limpia y legible.
2. **Query by Role**: En RTL, buscar elementos por rol accesible (`getByRole`) antes que clases CSS.
3. **Mocks Explícitos**: Limpiar mocks entre tests (`vi.clearAllMocks()`).
4. **Tests de Middleware**: Validar el routing de Next.js en tests E2E.

### ❌ DON'T

1. **Testear Detalles de Implementación**: Testear comportamiento de cara al usuario, no variables de estado internas.
2. **Ignorar Accesibilidad**: Si un botón no se encuentra con `getByRole`, tiene problemas de A11y.
3. **Hacer queries reales a BD en Unitarios**.

## 6. CI/CD Integration (Github Actions)

```yaml
name: Pull Request Validation
on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## 7. Comandos Útiles

```bash
# Frontend (Vitest / Playwright)
npm run test                    # Correr unitarios/componentes
npm run test:watch              # Modo interactivo
npx playwright test             # Correr E2E headless
npx playwright show-report      # Ver reporte interactivo de errores
```

