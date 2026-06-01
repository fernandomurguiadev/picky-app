-- ============================================================================
-- SEED DE COMIDA ARGENTINA / BODEGÓN CRIOLLO
-- Tenant Objetivo (Nuevo): f4b18428-2321-4d32-aa7a-241517441cb5
-- Usuario Administrador: 71c45967-4651-4059-b8bd-acc2eca1049b
-- ============================================================================

SET app.current_tenant_id = 'f4b18428-2321-4d32-aa7a-241517441cb5';

BEGIN;

-- 1. Crear nuevo Tenant "Picky Restaurant"
INSERT INTO tenants (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES ('f4b18428-2321-4d32-aa7a-241517441cb5', 'Picky Restaurant', 'picky-restaurant', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- 2. Crear StoreSettings (Tonos cálidos y cuero/madera rústicos)
INSERT INTO store_settings (
  id, "tenantId", description, phone, whatsapp, address, 
  "primaryColor", "accentColor", "backgroundColor", 
  "deliveryEnabled", "deliveryCost", "deliveryMinOrder", 
  "takeawayEnabled", "cashEnabled", "transferEnabled", "transferAlias",
  timezone, "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'f4b18428-2321-4d32-aa7a-241517441cb5',
  'Bodegón criollo tradicional. Carnes a la parrilla, empanadas cortadas a cuchillo y las minutas más abundantes de Buenos Aires.',
  '5491177777777',
  '5491177777777',
  'Arévalo 1500, Palermo Hollywood, CABA',
  '#7C2D12', '#F59E0B', '#FFFBEB', -- Tonos terracota y ocre cálidos
  true, 100000, 500000,
  true, true, true, 'picky.restaurant.mp',
  'America/Argentina/Buenos_Aires', NOW(), NOW()
)
ON CONFLICT ("tenantId") DO NOTHING;

-- 3. Asegurar la existencia del Usuario Administrador
INSERT INTO users (id, email, "passwordHash", role, "isActive", "createdAt", "updatedAt")
VALUES (
  '71c45967-4651-4059-b8bd-acc2eca1049b',
  'administrador@picky.app',
  '$2b$12$R.S2hE5e33d266eR9f7RGe1j3q7d0R1G5e33d266eR9f7RGe1j3q7', -- Hash dummy seguro para @Fer123456
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 4. Crear membresía Admin
INSERT INTO tenant_memberships (id, "userId", "tenantId", role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '71c45967-4651-4059-b8bd-acc2eca1049b',
  'f4b18428-2321-4d32-aa7a-241517441cb5',
  'admin', -- Corregido: 'admin' en minúsculas para coincidir con el enum
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 5. Inyectar categorías y productos de Restaurante Criollo
DO $$
DECLARE
  v_tenant_id uuid := 'f4b18428-2321-4d32-aa7a-241517441cb5';
  cat_entradas uuid := gen_random_uuid();
  cat_parrilla uuid := gen_random_uuid();
  cat_minutas uuid := gen_random_uuid();
  cat_postres uuid := gen_random_uuid();
  cat_bebidas uuid := gen_random_uuid();
BEGIN
  -- Insertar Categorías
  INSERT INTO categories (id, "tenantId", name, "order", "isActive", "createdAt", "updatedAt") VALUES
  (cat_entradas, v_tenant_id, 'Entradas Patrias', 1, true, NOW(), NOW()),
  (cat_parrilla, v_tenant_id, 'De la Parrilla al Plato', 2, true, NOW(), NOW()),
  (cat_minutas, v_tenant_id, 'Minutas del Bodegón', 3, true, NOW(), NOW()),
  (cat_postres, v_tenant_id, 'Postres del Abuelo', 4, true, NOW(), NOW()),
  (cat_bebidas, v_tenant_id, 'Vinos & Bebidas', 5, true, NOW(), NOW());

  -- Insertar Productos
  -- Entradas Patrias
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_entradas, 'Empanada Tucumana (Carne cortada a cuchillo)', 220000, 'Empanada frita rellena de carne cortada a cuchillo bien jugosa, cebollita de verdeo y huevo duro.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_entradas, 'Provoleta a la Parrilla con Chimichurri', 580000, 'Queso provolone hilado dorado a la chapa, crocante por fuera y derretido por dentro. Con chimi casero.', 2, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_entradas, 'Choripán de Campo con Salsa Criolla', 450000, 'Chorizo puro de cerdo a la mariposa en pan francés crujiente con abundante salsa criolla.', 3, false, true, NOW(), NOW());

  -- De la Parrilla
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_parrilla, 'Ojo de Bife con Papas Fritas', 1890000, 'Bife de ojo de 400g cocido a las brasas en su punto exacto. Acompañado de papas fritas bastón.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_parrilla, 'Tira de Asado Banderita Premium', 1650000, 'Asado de tira cortado banderita de ternera súper tierna. Ideal para compartir.', 2, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_parrilla, 'Vacío del Fuego Cocción Lenta', 1950000, 'Corte de vacío asado a fuego lento durante 4 horas. Se deshace con el tenedor.', 3, false, true, NOW(), NOW());

  -- Minutas del Bodegón
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_minutas, 'Milanesa de Ternera Gigante a la Napolitana', 1580000, 'Milanesa de bola de lomo gigante con salsa de tomate casera, jamón cocido, mozzarella y orégano.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_minutas, 'Suprema de Pollo Maryland', 1450000, 'Pechuga deshuesada rebozada con crema de choclo, banana frita y panceta crocante.', 2, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_minutas, 'Sorrentinos Caseros de Jamón y Queso', 1150000, 'Sorrentinos hechos a mano rellenos de jamón y mozzarella. Salsa bolognesa o fileto a elección.', 3, false, true, NOW(), NOW());

  -- Postres
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_postres, 'Flan Casero Mixto (Dulce de Leche y Crema)', 380000, 'El clásico flan de huevo hecho en el día con generosas cucharadas de dulce de leche y crema batida.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_postres, 'Budín de Pan de la Abuela', 320000, 'Postre tradicional al horno con caramelo y dulce de leche.', 2, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_postres, 'Vigilante (Queso y Dulce de Membrillo)', 290000, 'El postre patrio. Cuña de queso fresco cuartirolo acompañado de dulce de membrillo rubio.', 3, false, true, NOW(), NOW());

  -- Vinos & Bebidas
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Vino Malbec Premium Botella 750ml', 1400000, 'Vino Malbec reserva con gran cuerpo, perfecto maridaje para carnes rojas asadas.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Sifón de Soda de Litro', 250000, 'El clásico sifón de agua gasificada para armar tu vermut o vino con soda.', 2, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Aperitivo Vermut con Limón y Hielo', 450000, 'Vaso de vermut rosso de la casa con rodaja de limón y mucho hielo.', 3, false, true, NOW(), NOW());

END $$;

COMMIT;
