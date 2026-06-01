-- ============================================================================
-- SEED DE FERRETERÍA & HERRAMIENTAS
-- Tenant Objetivo (Nuevo): d4b18428-2321-4d32-aa7a-241517441cb3
-- Usuario Administrador: 71c45967-4651-4059-b8bd-acc2eca1049b
-- ============================================================================

SET app.current_tenant_id = 'd4b18428-2321-4d32-aa7a-241517441cb3';

BEGIN;

-- 1. Crear nuevo Tenant "Picky Ferretería"
INSERT INTO tenants (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES ('d4b18428-2321-4d32-aa7a-241517441cb3', 'Picky Ferretería Industrial', 'picky-herramientas', true, NOW(), NOW())
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
  'd4b18428-2321-4d32-aa7a-241517441cb3',
  'Herramientas de mano profesionales, maquinaria eléctrica de alto rendimiento y equipamiento de seguridad industrial.',
  '5491155555555',
  '5491155555555',
  'Av. Juan B. Justo 3200, Palermo, CABA',
  '#F97316', '#1E293B', '#F8FAFC',
  true, 200000, 1500000,
  true, true, true, 'picky.ferreteria.mp',
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
  'd4b18428-2321-4d32-aa7a-241517441cb3',
  'admin', -- Corregido: 'admin' en minúsculas para coincidir con el enum
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 5. Inyectar categorías y productos
DO $$
DECLARE
  v_tenant_id uuid := 'd4b18428-2321-4d32-aa7a-241517441cb3';
  cat_electricas uuid := gen_random_uuid();
  cat_mano uuid := gen_random_uuid();
  cat_medicion uuid := gen_random_uuid();
  cat_seguridad uuid := gen_random_uuid();
BEGIN
  -- Insertar Categorías
  INSERT INTO categories (id, "tenantId", name, "order", "isActive", "createdAt", "updatedAt") VALUES
  (cat_electricas, v_tenant_id, 'Herramientas Eléctricas', 1, true, NOW(), NOW()),
  (cat_mano, v_tenant_id, 'Herramientas de Mano', 2, true, NOW(), NOW()),
  (cat_medicion, v_tenant_id, 'Medición y Precisión', 3, true, NOW(), NOW()),
  (cat_seguridad, v_tenant_id, 'Protección e Industrial', 4, true, NOW(), NOW());

  -- Insertar Productos
  -- Eléctricas
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_electricas, 'Rotomartillo Neumático 800W SDS Plus', 18500000, 'Potente motor de 800W con fuerza de impacto de 2.7 Joules. Tres modos de operación.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_electricas, 'Taladro Atornillador Inalámbrico 20V Max', 23500000, 'Taladro con mandril autoajustable de 13mm, 2 velocidades variables, luz LED.', 2, true, true, NOW(), NOW());

  -- Mano
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_mano, 'Juego de Tubos y Llaves Cromo Vanadio (x40)', 34500000, 'Set profesional en caja de transporte metálica reforzada. Llave de tubo crique reversible.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_mano, 'Pinza Universal Aislada 8" VDE 1000V', 3900000, 'Pinza aislada con mango ergonómico bimaterial para trabajos eléctricos.', 2, false, true, NOW(), NOW());

  -- Medición
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_medicion, 'Nivel Láser Autonivelante de 3 Planos 360°', 21900000, 'Láser de líneas verdes de gran visibilidad con rango de nivelación de +/- 4 grados.', 1, true, true, NOW(), NOW());

  -- Seguridad
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_seguridad, 'Máscara de Soldar Fotosensible Automática', 11900000, 'Filtro de oscurecimiento automático DIN 9-13 y celda solar de carga rápida.', 1, false, true, NOW(), NOW());

END $$;

COMMIT;
