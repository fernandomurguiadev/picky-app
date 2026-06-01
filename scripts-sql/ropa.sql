-- ============================================================================
-- SEED DE MODA & ROPA
-- Tenant Objetivo (Nuevo): 43640248-2321-4d32-aa7a-241517441cb1
-- Usuario Administrador: 71c45967-4651-4059-b8bd-acc2eca1049b
-- ============================================================================

SET app.current_tenant_id = '43640248-2321-4d32-aa7a-241517441cb1';

BEGIN;

-- 1. Crear nuevo Tenant "Picky Style"
INSERT INTO tenants (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES ('43640248-2321-4d32-aa7a-241517441cb1', 'Picky Style & Co', 'picky-ropa', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- 2. Crear StoreSettings
INSERT INTO store_settings (
  id, "tenantId", description, phone, whatsapp, address, 
  "primaryColor", "accentColor", "backgroundColor", 
  "deliveryEnabled", "deliveryCost", "deliveryMinOrder", 
  "takeawayEnabled", "cashEnabled", "transferEnabled", "transferAlias",
  timezone, "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  '43640248-2321-4d32-aa7a-241517441cb1',
  'Las últimas tendencias en indumentaria urbana y de diseño. Calidad premium y envíos a todo el país.',
  '5491133333333',
  '5491133333333',
  'Honduras 4800, Palermo, CABA',
  '#EC4899', '#10B981', '#FFFFFF',
  true, 120000, 500000,
  true, true, true, 'picky.style.mp',
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
  '43640248-2321-4d32-aa7a-241517441cb1',
  'admin', -- Corregido: 'admin' en minúsculas para coincidir con el enum
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 5. Inyectar categorías y productos
DO $$
DECLARE
  v_tenant_id uuid := '43640248-2321-4d32-aa7a-241517441cb1';
  cat_remeras uuid := gen_random_uuid();
  cat_pantalones uuid := gen_random_uuid();
  cat_camperas uuid := gen_random_uuid();
  cat_calzado uuid := gen_random_uuid();
BEGIN
  -- Insertar Categorías
  INSERT INTO categories (id, "tenantId", name, "order", "isActive", "createdAt", "updatedAt") VALUES
  (cat_remeras, v_tenant_id, 'Remeras y Tops', 1, true, NOW(), NOW()),
  (cat_pantalones, v_tenant_id, 'Pantalones y Joggers', 2, true, NOW(), NOW()),
  (cat_camperas, v_tenant_id, 'Camperas y Abrigos', 3, true, NOW(), NOW()),
  (cat_calzado, v_tenant_id, 'Calzado Premium', 4, true, NOW(), NOW());

  -- Insertar Productos
  -- Remeras
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_remeras, 'Remera Oversize Básica', 189900, 'Remera oversize 100% algodón pesado 220g. Talle único XS al XL. En blanco, negro y arena.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_remeras, 'Remera Premium Slim Fit', 199900, 'Algodón peinado 24/1 con detalles de costura premium. Calce ajustado.', 2, false, true, NOW(), NOW());

  -- Pantalones
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_pantalones, 'Jogger Cargo Técnico', 499900, 'Pantalón cargo scuba técnico con cierres termosellados y bolsillos laterales amplios.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_pantalones, 'Jean straight 90s Vintage', 580000, 'Denim rígido 100% algodón con lavado estilo retro. Cinco bolsillos y tiro medio.', 2, false, true, NOW(), NOW());

  -- Camperas
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_camperas, 'Campera Puffer Ultraliviana', 1199000, 'Relleno de pluma sintética ecológica, repele el agua ligera y corta el viento.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_camperas, 'Buzo Canguro Oversize Heavy', 649000, 'Rústico pesado frizado, capucha doble forrada y cordones de algodón pesado.', 2, false, true, NOW(), NOW());

  -- Calzado
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_calzado, 'Zapatilla Chunky Retro', 1399000, 'Diseño retro deportivo con suela de goma expandida y plantilla viscoelástica.', 1, true, true, NOW(), NOW());

END $$;

COMMIT;
