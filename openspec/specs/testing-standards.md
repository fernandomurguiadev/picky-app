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
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

## 3. Frontend (Angular)

### 3.1 Tests Unitarios

**Objetivo**: Probar lógica de componentes y servicios aislados.

**Herramienta**: Jasmine + Karma (default de Angular)

**Alcance**:
- Servicios con lógica compleja
- Componentes con lógica de negocio
- Pipes y directivas
- Guards y interceptors

**Ejemplo**:
```typescript
// cart.service.spec.ts
describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('should add item to cart', () => {
    const product = { id: '1', name: 'Pizza', price: 1000 };
    
    service.addItem(product, [], 1);
    
    expect(service.items().length).toBe(1);
    expect(service.items()[0].product.id).toBe('1');
  });

  it('should calculate total correctly', () => {
    service.addItem({ id: '1', price: 1000 }, [], 2);
    service.addItem({ id: '2', price: 500 }, [], 1);
    
    expect(service.total()).toBe(2500); // (1000 * 2) + (500 * 1)
  });

  it('should remove item from cart', () => {
    service.addItem({ id: '1', price: 1000 }, [], 1);
    service.addItem({ id: '2', price: 500 }, [], 1);
    
    service.removeItem('1');
    
    expect(service.items().length).toBe(1);
    expect(service.items()[0].product.id).toBe('2');
  });
});
```

**Componente**:
```typescript
// product-card.component.spec.ts
describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = {
      id: '1',
      name: 'Pizza',
      price: 1000,
      images: []
    };
    fixture.detectChanges();
  });

  it('should display product name', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.product-name').textContent).toContain('Pizza');
  });

  it('should emit addToCart event when button clicked', () => {
    spyOn(component.addToCart, 'emit');
    
    const button = fixture.nativeElement.querySelector('.add-button');
    button.click();
    
    expect(component.addToCart.emit).toHaveBeenCalledWith(component.product);
  });

  it('should show "Agotado" badge when product is inactive', () => {
    component.product.isActive = false;
    fixture.detectChanges();
    
    const badge = fixture.nativeElement.querySelector('.badge-agotado');
    expect(badge).toBeTruthy();
  });
});
```

### 3.2 Tests E2E (End-to-End)

**Objetivo**: Probar flujos completos de usuario.

**Herramienta**: Cypress o Playwright

**Alcance**:
- Login y autenticación
- Flujo de pedido completo
- Gestión de catálogo (admin)
- Flujos críticos de negocio

**Ejemplo con Cypress**:
```typescript
// e2e/order-flow.cy.ts
describe('Order Flow', () => {
  beforeEach(() => {
    cy.visit('/demo-pizzeria');
  });

  it('should complete full order flow', () => {
    // 1. Navegar a categoría
    cy.contains('Pizzas').click();
    
    // 2. Seleccionar producto
    cy.contains('Pizza Napolitana').click();
    
    // 3. Seleccionar opciones
    cy.contains('Grande').click();
    cy.contains('Extra queso').click();
    
    // 4. Agregar al carrito
    cy.contains('Agregar al carrito').click();
    cy.contains('Agregado al carrito').should('be.visible');
    
    // 5. Ir al carrito
    cy.get('[data-testid="cart-button"]').click();
    cy.contains('Pizza Napolitana').should('be.visible');
    
    // 6. Ir a checkout
    cy.contains('Continuar').click();
    
    // 7. Completar datos
    cy.get('[name="name"]').type('Juan García');
    cy.get('[name="phone"]').type('+54 9 11 1234-5678');
    cy.get('[name="address"]').type('Av. Corrientes 1234');
    
    // 8. Seleccionar entrega y pago
    cy.contains('Delivery').click();
    cy.contains('Efectivo').click();
    
    // 9. Confirmar pedido
    cy.contains('Enviar pedido').click();
    
    // 10. Verificar confirmación
    cy.contains('Pedido confirmado').should('be.visible');
    cy.contains('ORD-').should('be.visible'); // Número de orden
  });

  it('should validate required fields', () => {
    cy.contains('Pizzas').click();
    cy.contains('Pizza Napolitana').click();
    cy.contains('Agregar al carrito').click();
    cy.get('[data-testid="cart-button"]').click();
    cy.contains('Continuar').click();
    
    // Intentar enviar sin completar datos
    cy.contains('Enviar pedido').click();
    
    // Verificar errores de validación
    cy.contains('El nombre es requerido').should('be.visible');
    cy.contains('El teléfono es requerido').should('be.visible');
  });
});
```

### 3.3 Comandos de Testing

```json
{
  "scripts": {
    "test": "ng test",
    "test:ci": "ng test --watch=false --browsers=ChromeHeadless",
    "test:coverage": "ng test --code-coverage",
    "e2e": "cypress open",
    "e2e:ci": "cypress run"
  }
}
```

## 4. Criterios de Calidad

### 4.1 Cobertura de Código

**Objetivo** (opcional para MVP):
- Backend: 70% en servicios críticos
- Frontend: 60% en componentes con lógica

**Flujos Críticos** (cobertura obligatoria):
- ✅ Autenticación (login, register, refresh)
- ✅ Creación de pedidos
- ✅ Gestión de catálogo (CRUD)
- ✅ Cálculo de precios con opciones
- ✅ Multi-tenancy (aislamiento de datos)

### 4.2 Datos de Prueba

**Factories** (Backend):
```typescript
// test/factories/product.factory.ts
export const createProduct = (overrides?: Partial<Product>): Product => ({
  id: faker.string.uuid(),
  tenantId: faker.string.uuid(),
  name: faker.commerce.productName(),
  price: faker.number.int({ min: 100, max: 10000 }),
  isActive: true,
  ...overrides
});
```

**Fixtures** (Frontend):
```typescript
// src/testing/fixtures/product.fixture.ts
export const mockProduct: Product = {
  id: '1',
  name: 'Pizza Napolitana',
  price: 2500,
  images: [{ url: 'https://example.com/pizza.jpg', order: 0 }],
  isActive: true
};
```

## 5. Buenas Prácticas

### ✅ DO

1. **Arrange-Act-Assert**: Estructura clara de tests
2. **Tests independientes**: No depender de orden de ejecución
3. **Nombres descriptivos**: `should calculate total with option modifiers`
4. **Mock de dependencias externas**: APIs, base de datos en unitarios
5. **Limpiar después de cada test**: `afterEach(() => cleanup())`

### ❌ DON'T

1. **Tests frágiles**: No depender de datos específicos de DB
2. **Tests lentos**: Evitar sleeps innecesarios
3. **Tests que fallan aleatoriamente**: Race conditions
4. **Múltiples asserts no relacionados**: Un concepto por test
5. **Ignorar tests fallidos**: Arreglar o eliminar

## 6. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
      - run: npm run e2e:ci
```

## 7. Comandos Útiles

```bash
# Backend
npm run test                    # Todos los tests
npm run test:watch              # Watch mode
npm run test -- catalog.service # Test específico
npm run test:cov                # Con cobertura
npm run test:e2e                # Tests E2E

# Frontend
ng test                         # Todos los tests
ng test --include='**/*.spec.ts' --watch=false  # Sin watch
ng test --code-coverage         # Con cobertura
npm run e2e                     # Cypress interactivo
npm run e2e:ci                  # Cypress headless
```
