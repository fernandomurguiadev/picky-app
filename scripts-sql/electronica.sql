-- ============================================================================
-- SEED DE ELECTRÓNICA & GADGETS
-- Tenant Objetivo (Nuevo): c4b18428-2321-4d32-aa7a-241517441cb2
-- Usuario Administrador: 71c45967-4651-4059-b8bd-acc2eca1049b
-- ============================================================================

SET app.current_tenant_id = 'c4b18428-2321-4d32-aa7a-241517441cb2';

BEGIN;

-- 1. Crear nuevo Tenant "Picky Tech"
INSERT INTO tenants (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES ('c4b18428-2321-4d32-aa7a-241517441cb2', 'Picky Tech Store', 'picky-electronica', true, NOW(), NOW())
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
  'c4b18428-2321-4d32-aa7a-241517441cb2',
  'Especialistas en gadgets importados, hardware de vanguardia y lo último en sonido de alta definición.',
  '5491144444444',
  '5491144444444',
  'Av. Corrientes 2400, CABA',
  '#3B82F6', '#10B981', '#0F172A',
  true, 150000, 1000000,
  true, true, true, 'picky.tech.mp',
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
  'c4b18428-2321-4d32-aa7a-241517441cb2',
  'admin', -- Corregido: 'admin' en minúsculas para coincidir con el enum
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 5. Inyectar categorías y productos
DO $$
DECLARE
  v_tenant_id uuid := 'c4b18428-2321-4d32-aa7a-241517441cb2';
  cat_celulares uuid := gen_random_uuid();
  cat_audio uuid := gen_random_uuid();
  cat_notebooks uuid := gen_random_uuid();
  cat_gaming uuid := gen_random_uuid();
BEGIN
  -- Insertar Categorías
  INSERT INTO categories (id, "tenantId", name, "order", "isActive", "createdAt", "updatedAt") VALUES
  (cat_celulares, v_tenant_id, 'Celulares y Tablets', 1, true, NOW(), NOW()),
  (cat_audio, v_tenant_id, 'Audio de Alta Fidelidad', 2, true, NOW(), NOW()),
  (cat_notebooks, v_tenant_id, 'Computadoras y Notebooks', 3, true, NOW(), NOW()),
  (cat_gaming, v_tenant_id, 'Mundo Gaming & Consolas', 4, true, NOW(), NOW());

  -- Insertar Productos
  -- Celulares
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_celulares, 'Smartphone Pro 256GB Platinum', 125000000, 'Pantalla AMOLED de 120Hz, triple cámara de 50MP, procesador de 4nm con IA integrada.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_celulares, 'Tablet Creator 11" Wifi', 68900000, 'Pantalla de 11 pulgadas ultra fluida, 128GB de almacenamiento y soporte para stylus activo.', 2, false, true, NOW(), NOW());

  -- Audio
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_audio, 'Auriculares Over-Ear ANC Studio', 34990000, 'Cancelación activa de ruido inteligente, audio espacial adaptativo y 40 horas de reproducción.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_audio, 'Parlante Bluetooth WaterProof 30W', 21500000, 'Resistente al agua y al polvo IP67, doble radiador pasivo y hasta 15 horas de batería.', 2, false, true, NOW(), NOW());

  -- Notebooks
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_notebooks, 'Notebook Ultra Slim 14"', 189000000, 'Procesador de última generación, 16GB RAM LPDDR5, 512GB SSD NVMe. Chasis de aluminio.', 1, true, true, NOW(), NOW());

  -- Gaming
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_gaming, 'Consola Next-Gen 1TB SSD', 215000000, 'Juegos a 4K nativo y 120 FPS. Incluye un joystick inalámbrico de precisión.', 1, true, true, NOW(), NOW());

END $$;

COMMIT;
