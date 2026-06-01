-- ============================================================================
-- SEED DE HAMBURGUESAS (Burgers & Shakes)
-- Tenant Objetivo (Existente): b5763874-892d-44d1-8d26-859d0df5d0e1
-- Usuario Administrador: 71c45967-4651-4059-b8bd-acc2eca1049b
-- ============================================================================

-- Bypass temporal de RLS para el script de inserción
SET app.current_tenant_id = 'b5763874-892d-44d1-8d26-859d0df5d0e1';

BEGIN;

-- 1. Asegurar la existencia del Tenant
INSERT INTO tenants (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES ('b5763874-892d-44d1-8d26-859d0df5d0e1', 'Picky Burgers Premium', 'picky-hamburgueseria', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- 2. Asegurar StoreSettings
INSERT INTO store_settings (
  id, "tenantId", description, phone, whatsapp, address, 
  "primaryColor", "accentColor", "backgroundColor", 
  "deliveryEnabled", "deliveryCost", "deliveryMinOrder", 
  "takeawayEnabled", "cashEnabled", "transferEnabled", "transferAlias",
  timezone, "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'b5763874-892d-44d1-8d26-859d0df5d0e1',
  'Hamburguesas smash de altísima calidad elaboradas con carne premium de pastura y los shakes más cremosos de la ciudad.',
  '5491123456789',
  '5491123456789',
  'Av. Cerviño 3400, Palermo, CABA',
  '#E11D48', '#F59E0B', '#FFFFFF',
  true, 80000, 300000,
  true, true, true, 'picky.burgers.mp',
  'America/Argentina/Buenos_Aires', NOW(), NOW()
)
ON CONFLICT ("tenantId") DO NOTHING;

-- 4. Insertar Categorías (Guardando IDs)
-- Creamos variables temporales para guardar los UUIDs y poder asociar los productos correspondientes
DO $$
DECLARE
  v_tenant_id uuid := 'b5763874-892d-44d1-8d26-859d0df5d0e1';
  cat_clasicas uuid := gen_random_uuid();
  cat_autor uuid := gen_random_uuid();
  cat_sides uuid := gen_random_uuid();
  cat_shakes uuid := gen_random_uuid();
  cat_bebidas uuid := gen_random_uuid();
BEGIN
  -- Insertar Categorías
  INSERT INTO categories (id, "tenantId", name, "order", "isActive", "createdAt", "updatedAt") VALUES
  (cat_clasicas, v_tenant_id, 'Smash Burgers Clásicas', 1, true, NOW(), NOW()),
  (cat_autor, v_tenant_id, 'Smash Burgers de Autor', 2, true, NOW(), NOW()),
  (cat_sides, v_tenant_id, 'Acompañamientos Crujientes', 3, true, NOW(), NOW()),
  (cat_shakes, v_tenant_id, 'Milkshakes & Postres', 4, true, NOW(), NOW()),
  (cat_bebidas, v_tenant_id, 'Bebidas Heladas', 5, true, NOW(), NOW());

  -- Insertar Productos
  -- Smash Clásicas
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_clasicas, 'Classic Double Cheeseburger', 680000, 'Dos medallones smash de 90g con costra caramelizada, 4 fetas de cheddar, kétchup, mostaza y cebolla picadita.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_clasicas, 'Triple Cheeseburger Smash', 850000, 'Tres medallones de carne vacuna premium aplastados finitos, 6 fetas de queso cheddar derretido.', 2, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_clasicas, 'The Oklahoma Onion Single', 520000, 'Medallón smash de 100g con cebolla en juliana cocinada e integrada en la plancha, cheddar y pepinillos.', 3, true, true, NOW(), NOW());

  -- Smash de Autor
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_autor, 'Sweet Chili & Crispy Bacon', 790000, 'Doble smash, cheddar, panceta glaseada en sweet chili casero, crocante de cebolla deshidratada y aderezo alioli.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_autor, 'Smoked Truffle Egg', 850000, 'Doble smash premium, provola ahumada fundida, huevo a la plancha con yema blanda y emulsión de trufa.', 2, false, true, NOW(), NOW());

  -- Acompañamientos
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_sides, 'Papas Crinkle con Cheddar y Verdeo', 390000, 'Papas con corte rejilla súper crocantes, crema de queso cheddar templado y cebollita de verdeo.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_sides, 'Bastones de Mozzarella XXL (x5)', 450000, 'Cuerpo de mozzarella hilada gigante, súper crocantes por fuera y súper elásticos por dentro.', 2, false, true, NOW(), NOW());

  -- Milkshakes
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_shakes, 'Super Oreo & Cream Shake', 350000, 'Licuado súper espeso de helado de crema americana, dulce de leche natural y galletitas Oreo troceadas.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_shakes, 'Salted Caramel Peanut Shake', 350000, 'Helado de vainilla fina, salsa butterscotch salada casera y un crocante de maní tostado picado.', 2, false, true, NOW(), NOW());

  -- Bebidas
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Coca Cola Original 500ml', 180000, 'Gaseosa Coca-Cola sabor original bien helada.', 1, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Coca Cola Sin Azúcar 500ml', 180000, 'Gaseosa Coca-Cola sin azúcares y sin calorías helada.', 2, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Sprite Sin Azúcar 500ml', 180000, 'Gaseosa lima-limón Sprite sin azúcares helada.', 3, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Fanta Naranja 500ml', 180000, 'Gaseosa Fanta sabor naranja refrescante.', 4, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Limonada Casera con Menta y Jengibre', 250000, 'Exprimido natural de limones del día, hojas de menta fresca y un toque de jengibre.', 5, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Cerveza IPA Artesanal Lata 473ml', 320000, 'Birra artesanal bien fría de lupulado intenso y notas cítricas.', 6, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Cerveza Golden Artesanal Lata 473ml', 300000, 'Birra artesanal dorada, suave, ligera y sumamente refrescante.', 7, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Agua Mineral Sin Gas 500ml', 150000, 'Agua mineral de manantial fresca sin gas.', 8, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Agua Mineral Con Gas 500ml', 150000, 'Agua mineral gasificada bien helada.', 9, false, true, NOW(), NOW());

END $$;

COMMIT;
