-- ============================================================================
-- SEED DE ELECTRODOMÉSTICOS & LÍNEA BLANCA
-- Tenant Objetivo (Nuevo): aa218428-2321-4d32-aa7a-241517441cb6
-- Usuario Administrador: 71c45967-4651-4059-b8bd-acc2eca1049b
-- ============================================================================

SET app.current_tenant_id = 'aa218428-2321-4d32-aa7a-241517441cb6';

BEGIN;

-- 1. Crear nuevo Tenant "Picky Electrodomésticos"
INSERT INTO tenants (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES ('aa218428-2321-4d32-aa7a-241517441cb6', 'Picky Electrodomésticos', 'picky-electrodomesticos', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- 2. Crear StoreSettings (Tonos gris metálico / slate corporativo)
INSERT INTO store_settings (
  id, "tenantId", description, phone, whatsapp, address, 
  "primaryColor", "accentColor", "backgroundColor", 
  "deliveryEnabled", "deliveryCost", "deliveryMinOrder", 
  "takeawayEnabled", "cashEnabled", "transferEnabled", "transferAlias",
  timezone, "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'aa218428-2321-4d32-aa7a-241517441cb6',
  'Tu tienda de electrodomésticos líder. Heladeras, smart TVs, climatización y pequeños artefactos para tu hogar con garantía oficial.',
  '5491188888888',
  '5491188888888',
  'Av. Cabildo 1800, Belgrano, CABA',
  '#475569', '#0F172A', '#F8FAFC',
  true, 300000, 3000000, -- Envíos pesados base $3000
  true, true, true, 'picky.electro.mp',
  'America/Argentina/Buenos_Aires', NOW(), NOW()
)
ON CONFLICT ("tenantId") DO NOTHING;

-- 3. Asegurar la existencia del Usuario Administrador
INSERT INTO users (id, email, "passwordHash", role, "isActive", "createdAt", "updatedAt")
VALUES (
  '71c45967-4651-4059-b8bd-acc2eca1049b',
  'administrador@picky.app',
  '$2b$12$R.S2hE5e33d266eR9f7RGe1j3q7d0R1G5e33d266eR9f7RGe1j3q7', -- Hash de contraseña
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
  'aa218428-2321-4d32-aa7a-241517441cb6',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 5. Inyectar categorías y productos de Electrodomésticos (30 Productos)
DO $$
DECLARE
  v_tenant_id uuid := 'aa218428-2321-4d32-aa7a-241517441cb6';
  cat_blanca uuid := gen_random_uuid();
  cat_clima uuid := gen_random_uuid();
  cat_pequenos uuid := gen_random_uuid();
  cat_tv_audio uuid := gen_random_uuid();
  cat_coccion uuid := gen_random_uuid();
BEGIN
  -- Insertar Categorías
  INSERT INTO categories (id, "tenantId", name, "order", "isActive", "createdAt", "updatedAt") VALUES
  (cat_blanca, v_tenant_id, 'Línea Blanca & Lavado', 1, true, NOW(), NOW()),
  (cat_clima, v_tenant_id, 'Climatización', 2, true, NOW(), NOW()),
  (cat_pequenos, v_tenant_id, 'Pequeños Electrodomésticos', 3, true, NOW(), NOW()),
  (cat_tv_audio, v_tenant_id, 'Smart TVs & Audio', 4, true, NOW(), NOW()),
  (cat_coccion, v_tenant_id, 'Cocción & Hornos', 5, true, NOW(), NOW());

  -- Insertar Productos (30 total - 6 por categoría)
  
  -- 1. Línea Blanca & Lavado (6)
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_blanca, 'Heladera No Frost Inverter 430L', 249000000, 'Heladera No Frost con tecnología digital inverter para ahorro de energía. Freezer superior de alta capacidad. Color acero inoxidable.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_blanca, 'Lavarropas Automático de Carga Frontal 8kg', 189000000, 'Lavarropas de 8kg de capacidad, 1200 RPM de centrifugado variable, motor inverter silencioso con 14 programas especiales.', 2, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_blanca, 'Lavavajillas Digital 12 Cubiertos', 165000000, 'Lavavajillas inteligente con panel táctil, 6 ciclos de lavado ecológicos y display digital de tiempo restante.', 3, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_blanca, 'Secarropas por Calor Centrífugo 6kg', 95000000, 'Secador de ropa por flujo térmico circular. Temporizador digital y programa antiarrugas.', 4, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_blanca, 'Heladera Cíclica Compacta Bajo Mesada 120L', 115000000, 'Frigobar o heladera bajo mesada ideal para oficinas, monoambientes u hoteles. Con congelador silencioso.', 5, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_blanca, 'Lavarropas de Carga Superior Semiautomático', 79000000, 'Lavarropas compacto de cuba plástica, ideal para espacios reducidos. Carga de agua manual o automática.', 6, false, true, NOW(), NOW());

  -- 2. Climatización (6)
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_clima, 'Aire Acondicionado Split Frio/Calor 3500W', 215000000, 'Split inverter de alta eficiencia. Gas ecológico R410, control remoto inteligente y función de deshumidificación.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_clima, 'Ventilador de Pie con Control Remoto 20"', 2990000, 'Ventilador con 3 aspas de metal y rejilla giratoria. Timer de apagado de hasta 8 horas y oscilación suave.', 2, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_clima, 'Turboventilador de Suelo Alta Velocidad', 3800000, 'Estructura metálica resistente y motor industrial de 90W. Inclinación regulable 180°.', 3, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_clima, 'Estufa Halógena de Pared/Suelo 1200W', 4900000, 'Calefactor halógeno con 3 tubos seleccionables, interruptor de corte de seguridad en caso de caída.', 4, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_clima, 'Ventilador de Techo con Luz Led', 5400000, 'Ventilador silencioso con 4 palas de madera reversible y plafón LED con control de temperatura de color.', 5, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_clima, 'Caloventor Portátil Compacto 2000W', 2490000, 'Calefactor de aire rápido para baños o espacios pequeños. Función de termostato y protección térmica.', 6, false, true, NOW(), NOW());

  -- 3. Pequeños Electrodomésticos (6)
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_pequenos, 'Licuadora de Vaso de Vidrio 1000W', 9800000, 'Licuadora de 5 velocidades más pulsador turbo, jarra de vidrio de 1.5L ideal para hielo y smoothies.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_pequenos, 'Cafetera Expreso Automática 19 Bar', 48900000, 'Bomba italiana de 19 bares de presión. Depósito de leche con espumador automático para lattes exquisitos.', 2, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_pequenos, 'Tostadora Eléctrica para 2 Rebanadas Anchas', 4200000, 'Tostadora de acero inoxidable con 7 niveles de tostado y ranuras extra anchas para pan de campo.', 3, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_pequenos, 'Pava Eléctrica con Regulador de Temperatura', 5400000, 'Pava de acero inoxidable ideal para mate. Regulador analógico de 70° a 100° y corte automático.', 4, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_pequenos, 'Batidora de Pedestal Planetaria 800W', 38900000, 'Batidora profesional con tazón de acero de 4.5L. Incluye tres batidores: globo, gancho y paleta.', 5, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_pequenos, 'Exprimidor de Cítricos Automático', 3200000, 'Exprimidor con dos conos intercambiables y jarra graduada transparente de 1L con filtro de pulpa.', 6, false, true, NOW(), NOW());

  -- 4. Smart TVs & Audio (6)
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_tv_audio, 'Smart TV QLED 4K HDR 55"', 299000000, 'Resolución 4K nativa con tecnología QLED. Smart Hub con todas tus apps (Netflix, YouTube, Disney+). Control por voz.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_tv_audio, 'Smart TV UHD LED 43"', 185000000, 'Pantalla 4K Ultra HD con marcos ultra delgados y sistema operativo fluido con Chromecast integrado.', 2, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_tv_audio, 'Barra de Sonido Soundbar 2.1 con Subwoofer', 49000000, 'Sistema de sonido envolvente de 120W con conexión HDMI ARC, fibra óptica y Bluetooth 5.0.', 3, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_tv_audio, 'Proyector Smart Home Portátil', 89000000, 'Proyector con Android TV, resolución FHD y hasta 120 pulgadas de proyección. Altavoces integrados.', 4, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_tv_audio, 'Auriculares Inalámbricos para TV con Base', 18900000, 'Auriculares inalámbricos RF cerrados con base transmisora que no genera delay con la TV. Ideales para cine.', 5, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_tv_audio, 'Soporte Articulado de Pared Reforzado 32-70"', 4500000, 'Soporte metálico de doble brazo articulado con organizador de cables. Soporta hasta 45kg.', 6, false, true, NOW(), NOW());

  -- 5. Cocción & Hornos (6)
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_coccion, 'Horno Eléctrico con Convección 60L', 58900000, 'Horno de gran capacidad con doble resistencia, temporizador de 60 minutos y grill giratorio de espiedo.', 1, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_coccion, 'Freidora de Aire Air Fryer Digital 4L', 42900000, 'Cocción saludable sin aceite. Panel táctil con 8 programas preestablecidos y canasta antiadherente.', 2, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_coccion, 'Microondas con Grill Digital 25L', 64000000, 'Microondas con puerta espejada, 900W de potencia en microondas y 1000W de potencia en grill.', 3, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_coccion, 'Cocina Multigas 4 Hornallas', 289000000, 'Cocina de acero inoxidable con encendido electrónico a una mano y horno con visor panorámico y luz.', 4, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_coccion, 'Anafe Vitrocerámico Eléctrico Dual 2 Hornallas', 54000000, 'Anafe empotrable digital táctil con 9 niveles de calor y bloqueo de seguridad para niños.', 5, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, cat_coccion, 'Extractor Campana de Cocina Acero 60cm', 48900000, 'Motor de alta succión con tres velocidades y filtros de carbón activado lavables para grasa.', 6, false, true, NOW(), NOW());

END $$;

COMMIT;
