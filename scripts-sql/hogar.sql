-- ============================================================================
-- SEED DE ARTÍCULOS DEL HOGAR & DECORACIÓN
-- Tenant Objetivo (Nuevo): e4b18428-2321-4d32-aa7a-241517441cb4
-- Usuario Administrador: 71c45967-4651-4059-b8bd-acc2eca1049b
-- ============================================================================

SET app.current_tenant_id = 'e4b18428-2321-4d32-aa7a-241517441cb4';

BEGIN;

-- 1. Crear nuevo Tenant "Picky Hogar" con slug alineado
INSERT INTO tenants (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES ('e4b18428-2321-4d32-aa7a-241517441cb4', 'Picky Hogar', 'picky-hogar', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- 2. Crear StoreSettings (Tonos cálidos y acogedores)
INSERT INTO store_settings (
  id, "tenantId", description, phone, whatsapp, address, 
  "primaryColor", "accentColor", "backgroundColor", 
  "deliveryEnabled", "deliveryCost", "deliveryMinOrder", 
  "takeawayEnabled", "cashEnabled", "transferEnabled", "transferAlias",
  timezone, "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'e4b18428-2321-4d32-aa7a-241517441cb4',
  'Mobiliario de diseño, objetos de decoración únicos, confort textil y soluciones de iluminación para transformar tus espacios favoritos.',
  '5491166666666',
  '5491166666666',
  'Av. Libertador 4200, Belgrano, CABA',
  '#D97706', '#1E293B', '#FAFAF9', -- Tonos ocre cálido, charcoal y fondo crema
  true, 250000, 2000000,
  true, true, true, 'picky.hogar.mp',
  'America/Argentina/Buenos_Aires', NOW(), NOW()
)
ON CONFLICT ("tenantId") DO NOTHING;

-- 3. Asegurar la existencia del Usuario Administrador
INSERT INTO users (id, email, "passwordHash", role, "isActive", "createdAt", "updatedAt")
VALUES (
  '71c45967-4651-4059-b8bd-acc2eca1049b',
  'administrador@picky.app',
  '$2b$12$R.S2hE5e33d266eR9f7RGe1j3q7d0R1G5e33d266eR9f7RGe1j3q7', -- Hash seguro para @Fer123456
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
  'e4b18428-2321-4d32-aa7a-241517441cb4',
  'admin', -- 'admin' en minúsculas para coincidir con el enum
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 5. Inyectar categorías y productos de Hogar (20+ Ejemplos)
DO $$
DECLARE
  v_tenant_id uuid := 'e4b18428-2321-4d32-aa7a-241517441cb4';
  cat_muebles uuid := gen_random_uuid();
  cat_deco uuid := gen_random_uuid();
  cat_iluminacion uuid := gen_random_uuid();
  cat_confort uuid := gen_random_uuid();
  cat_organizacion uuid := gen_random_uuid();
BEGIN
  -- Insertar Categorías
  INSERT INTO categories (id, "tenantId", name, "order", "isActive", "createdAt", "updatedAt") VALUES
  (cat_muebles, v_tenant_id, 'Mobiliario & Estilo', 1, true, NOW(), NOW()),
  (cat_deco, v_tenant_id, 'Cocina & Decoración', 2, true, NOW(), NOW()),
  (cat_iluminacion, v_tenant_id, 'Iluminación de Diseño', 3, true, NOW(), NOW()),
  (cat_confort, v_tenant_id, 'Dormitorio & Confort', 4, true, NOW(), NOW()),
  (cat_organizacion, v_tenant_id, 'Organización & Orden', 5, true, NOW(), NOW());

  -- Insertar Productos
  
  -- A. Mobiliario (4 productos)
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_muebles, 'Mesa de Centro Industrial', 7890000, 'Mesa ratona con tapa de madera maciza de pino elliotis y estructura de hierro pintado al horno en negro mate.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_muebles, 'Sillón Nórdico Escandinavo 2 Cuerpos', 24500000, 'Sillón tapizado en tela chenille premium con patas de madera de paraíso maciza. Estilo minimalista cómodo.', 2, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_muebles, 'Estantería Modular Biblioteca', 5600000, 'Biblioteca de 5 estantes abiertos, ideal para living, estudio u oficina. Madera laqueada y metal.', 3, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_muebles, 'Rack de TV Escandinavo', 8900000, 'Mesa para televisión de hasta 65 pulgadas con cajoneras de guardado y patas de madera maciza.', 4, false, true, NOW(), NOW());

  -- B. Cocina & Deco (4 productos)
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_deco, 'Set Vajilla de Cerámica Artesanal (x16)', 1490000, 'Vajilla artesanal esmaltada a mano. Incluye 4 platos playos, 4 de postre, 4 bowls y 4 tazas. Color arena.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_deco, 'Florero de Vidrio Granulado', 350000, 'Florero soplado artesanalmente con textura granulada. Ideal para ramos secos o flores frescas.', 2, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_deco, 'Set Tabla para Quesos y Copetín', 245000, 'Tabla de servir hecha de madera de acacia con terminación en aceite de oliva y tres cuchillos especiales.', 3, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_deco, 'Espejo Redondo Marco de Metal', 680000, 'Espejo de 60cm de diámetro con marco delgado de hierro negro. Ideal para recibidores o baños.', 4, true, true, NOW(), NOW());

  -- C. Iluminación (4 productos)
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_iluminacion, 'Lámpara de Pie Trípode Madera', 8900000, 'Lámpara con patas de madera regulables y pantalla cilíndrica de lino crudo. Aporta luz cálida indirecta.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_iluminacion, 'Colgante de Techo Metal & Cobre', 5400000, 'Lámpara colgante de estilo industrial con interior cobreado y exterior negro mate. Apta bombillas filamento.', 2, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_iluminacion, 'Velador Nórdico de Escritorio', 2900000, 'Velador de madera de paraíso con cabezal de aluminio blanco orientable. Diseño moderno y minimalista.', 3, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_iluminacion, 'Aplique de Pared Articulado Bronce', 3800000, 'Lámpara aplique articulado de latón envejecido y pantalla metálica orientable de estilo retro.', 4, false, true, NOW(), NOW());

  -- D. Dormitorio (4 productos)
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_confort, 'Juego de Sábanas 300 Hilos Algodón', 9500000, 'Sábanas king size de satén de algodón de 300 hilos. Textura sedosa, hipoalergénicas y extra suaves.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_confort, 'Manta Pie de Cama Tejida Waffle', 3200000, 'Manta tejida en telar 100% hilo de algodón con terminación de flecos. Súper abrigada y decorativa.', 2, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_confort, 'Almohadón Terciopelo Soft (x2)', 1800000, 'Pack de dos fundas y rellenos siliconados de almohadones decorativos de 50x50cm, tela terciopelo.', 3, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_confort, 'Alfombra de Pelo Corto Jacquard', 14500000, 'Alfombra tejida jacquard de 160x230cm con diseño geométrico sobrio en tonos grises y crudo.', 4, true, true, NOW(), NOW());

  -- E. Organización (4 productos)
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_organizacion, 'Set Organizadores de Cocina Bamboo (x3)', 189000, 'Contenedores herméticos con tapa de bambú natural y cuerpo de vidrio de borosilicato resistente.', 1, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_organizacion, 'Cesto de Ropa en Hilo de Algodón', 280000, 'Canasto organizador multiuso tejido en soga de algodón con asas reforzadas. Capacidad 45 Litros.', 2, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_organizacion, 'Perchero de Pared de Madera Paraíso', 190000, 'Perchero con 4 ganchos torneados de madera maciza de paraíso laqueada natural. Listo para colgar.', 3, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_organizacion, 'Zapatero Apilable de 3 Estantes', 420000, 'Estante organizador de calzado metálico reforzado con capacidad para hasta 9 pares. Apilable y firme.', 4, true, true, NOW(), NOW());

END $$;

COMMIT;
