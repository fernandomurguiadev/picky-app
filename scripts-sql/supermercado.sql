-- ============================================================================
-- SEED SUPERMERCADO ARGENTINO — Picky Supermercado
-- Tenant:   picky-supermercado  (a8c94521-3b72-4890-8def-912345678901)
-- Usuario:  testing1@gmail.com  /  TestingSupermercado1
-- Fecha:    2026-06-06
-- ============================================================================

SET app.current_tenant_id = 'a8c94521-3b72-4890-8def-912345678901';

BEGIN;

-- ============================================================
-- 1. Tenant
-- ============================================================
INSERT INTO tenants (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES (
  'a8c94521-3b72-4890-8def-912345678901',
  'Picky Supermercado',
  'picky-supermercado',
  true, NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- ============================================================
-- 2. Store Settings — verde fresco, estilo supermercado moderno
-- ============================================================
INSERT INTO store_settings (
  id, "tenantId", description, phone, whatsapp, address,
  "primaryColor", "accentColor", "backgroundColor",
  "deliveryEnabled", "deliveryCost", "deliveryMinOrder",
  "takeawayEnabled", "cashEnabled", "transferEnabled", "transferAlias",
  timezone, "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'a8c94521-3b72-4890-8def-912345678901',
  'Tu supermercado online de confianza. Los mejores precios en lácteos, carnes, frutas, verduras, limpieza y mucho más. Entrega a domicilio en el día.',
  '5491155123456',
  '5491155123456',
  'Av. Corrientes 2500, CABA, Argentina',
  '#16a34a', '#f59e0b', '#f0fdf4',  -- Verde, ámbar y blanco verdoso
  true, 250000, 1000000,            -- $2.500 delivery, mínimo $10.000
  true, true, true, 'picky.super.mp',
  'America/Argentina/Buenos_Aires', NOW(), NOW()
)
ON CONFLICT ("tenantId") DO NOTHING;

-- ============================================================
-- 3. Usuario testing1@gmail.com
-- Hash bcrypt cost=12 de: TestingSupermercado1
-- ============================================================
INSERT INTO users (id, email, "passwordHash", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'f2a48523-9d3e-4127-a651-8c4de0123456',
  'testing1@gmail.com',
  '$2b$12$r9n4YuSpSMS7pCS/xlOXAeLRTHH434QYJ1qHLC5epmxXZDpq/vfoW',
  'admin',
  true,
  NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE
  SET "passwordHash" = EXCLUDED."passwordHash",
      "isActive"     = true;

-- ============================================================
-- 4. Membresía Admin
-- ============================================================
INSERT INTO tenant_memberships (id, "userId", "tenantId", role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'f2a48523-9d3e-4127-a651-8c4de0123456',
  'a8c94521-3b72-4890-8def-912345678901',
  'admin',
  true,
  NOW(), NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. Categorías y Productos
-- ============================================================
DO $$
DECLARE
  v_tenant_id   uuid := 'a8c94521-3b72-4890-8def-912345678901';
  cat_almacen   uuid := gen_random_uuid();
  cat_lacteos   uuid := gen_random_uuid();
  cat_carnes    uuid := gen_random_uuid();
  cat_fiambre   uuid := gen_random_uuid();
  cat_fyverdura uuid := gen_random_uuid();
  cat_panaderia uuid := gen_random_uuid();
  cat_bebidas   uuid := gen_random_uuid();
  cat_limpieza  uuid := gen_random_uuid();
  cat_higiene   uuid := gen_random_uuid();
  cat_congelado uuid := gen_random_uuid();
  cat_snacks    uuid := gen_random_uuid();
  cat_desayuno  uuid := gen_random_uuid();
BEGIN

  -- ── Categorías ──────────────────────────────────────────────────────────────
  INSERT INTO categories (id, "tenantId", name, "order", "isActive", "createdAt", "updatedAt") VALUES
  (cat_almacen,   v_tenant_id, 'Almacén',                    1,  true, NOW(), NOW()),
  (cat_lacteos,   v_tenant_id, 'Lácteos & Huevos',           2,  true, NOW(), NOW()),
  (cat_carnes,    v_tenant_id, 'Carnes & Aves',              3,  true, NOW(), NOW()),
  (cat_fiambre,   v_tenant_id, 'Fiambrería',                 4,  true, NOW(), NOW()),
  (cat_fyverdura, v_tenant_id, 'Frutas & Verduras',          5,  true, NOW(), NOW()),
  (cat_panaderia, v_tenant_id, 'Panadería & Pastelería',     6,  true, NOW(), NOW()),
  (cat_bebidas,   v_tenant_id, 'Bebidas',                    7,  true, NOW(), NOW()),
  (cat_limpieza,  v_tenant_id, 'Limpieza del Hogar',         8,  true, NOW(), NOW()),
  (cat_higiene,   v_tenant_id, 'Higiene Personal',           9,  true, NOW(), NOW()),
  (cat_congelado, v_tenant_id, 'Congelados',                 10, true, NOW(), NOW()),
  (cat_snacks,    v_tenant_id, 'Snacks & Golosinas',         11, true, NOW(), NOW()),
  (cat_desayuno,  v_tenant_id, 'Desayuno & Merienda',        12, true, NOW(), NOW());

  -- ── ALMACÉN ─────────────────────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Arroz Largo Fino SOS 1 kg',
    280000, 'Arroz largo fino de primera calidad. Granos sueltos y de cocción perfecta. Rinde hasta 3 tazas de arroz cocido.',
    'https://images.unsplash.com/photo-1536304993881-ff86e422dd22?w=400&q=80', 1, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Fideos Tallarín Lucchetti 500 g',
    220000, 'Tallarines de sémola de trigo candeal. Ideales para todo tipo de salsas. Cocción al dente en 8 minutos.',
    'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=400&q=80', 2, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Aceite de Girasol Natura 1,5 L',
    550000, 'Aceite 100% girasol de alta oleicidad. Sin colesterol, ideal para frituras y aderezos. Botella de 1,5 L.',
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', 3, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Harina 0000 Cañuelas 1 kg',
    240000, 'Harina de trigo extra fina 0000 para repostería, pizzas y pastas. Bolsa 1 kg.',
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80', 4, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Azúcar Ledesma Blanca 1 kg',
    220000, 'Azúcar blanca granulada refinada. Pureza superior, ideal para repostería y bebidas calientes. Bolsa 1 kg.',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', 5, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Yerba Mate Taragüi Con Palo 1 kg',
    780000, 'La yerba mate más consumida de Argentina. Blend con palo, sabor suave y persistente. 1 kg.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Yerba_mate.jpg/400px-Yerba_mate.jpg', 6, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Café Molido Cabrales Premium 250 g',
    650000, 'Café molido de tostado medio intenso. 100% arábica seleccionado. Aroma profundo y sabor equilibrado.',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80', 7, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Salsa de Tomate Arcor 520 g',
    320000, 'Salsa de tomate natural con tomates maduros seleccionados. Sin conservantes. Lista para usar.',
    'https://images.unsplash.com/photo-1574484284002-952d92a03a40?w=400&q=80', 8, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Aceitunas Verdes Nucete 400 g',
    480000, 'Aceitunas verdes sin carozo en salmuera. Calibre grande, ideal para picadas y ensaladas. Lata 400 g.',
    'https://images.unsplash.com/photo-1604579278670-5e18f1eb6980?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Lentejas Secas Gallo 500 g',
    280000, 'Lentejas pardinas secas seleccionadas. Ricas en hierro y proteínas. Sin gluten. 500 g.',
    'https://images.unsplash.com/photo-1621955964441-c173e01c135b?w=400&q=80', 10, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Polenta Instantánea La Ragione 500 g',
    280000, 'Polenta de maíz de cocción rápida. Lista en 3 minutos. Versatil para guarniciones y tartas.',
    'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&q=80', 11, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_almacen, 'Vinagre de Manzana Manzanino 500 ml',
    320000, 'Vinagre de manzana artesanal. Ideal para aderezos, marinadas y usos medicinales. Sin filtrar.',
    'https://images.unsplash.com/photo-1574484284002-952d92a03a40?w=400&q=80', 12, false, true, NOW(), NOW());

  -- ── LÁCTEOS & HUEVOS ────────────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_lacteos, 'Leche Entera La Serenísima 1 L',
    280000, 'Leche entera pasteurizada y homogeneizada. Rico en calcio y vitaminas. Botella 1 litro.',
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80', 1, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_lacteos, 'Leche Descremada Sancor 1 L',
    320000, 'Leche descremada enriquecida con calcio y vitamina D. Ideal para dietas bajas en grasas. 1 litro.',
    'https://images.unsplash.com/photo-1550583724-aa280fee69b?w=400&q=80', 2, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_lacteos, 'Yogur Activia Frutilla x4 140 g',
    450000, 'Yogur con bífidus activo. Sabor frutilla con frutas reales. Pack de 4 potecitos de 140 g cada uno.',
    'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=400&q=80', 3, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_lacteos, 'Queso Cremoso Mendicrim 200 g',
    420000, 'Queso cremoso suave de textura firme. Perfecto para untar, tostadas y preparaciones calientes.',
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80', 4, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_lacteos, 'Queso Mozzarella La Serenísima 200 g',
    550000, 'Mozzarella fresca de vaca. Alta fusibilidad, ideal para pizzas, pastas y empanadas.',
    'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80', 5, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_lacteos, 'Manteca La Serenísima 200 g',
    480000, 'Manteca elaborada con crema de leche fresca. Sin aditivos. Ideal para repostería y cocina.',
    'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80', 6, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_lacteos, 'Huevos Blancos Granja Del Sol x12',
    650000, 'Huevos frescos de gallinas criadas en granja. Categoría A. Docena de 12 unidades.',
    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80', 7, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_lacteos, 'Crema de Leche Sancor 200 ml',
    380000, 'Crema de leche entera pasteurizada. 35% materia grasa. Ideal para salsas, postres y rellenos.',
    'https://images.unsplash.com/photo-1585515656973-7b21e8fc0bf8?w=400&q=80', 8, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_lacteos, 'Queso Ricotta Manfrey 250 g',
    320000, 'Ricotta fresca artesanal. Textura suave y sabor delicado. Ideal para rellenos de pasta y tartas.',
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_lacteos, 'Dulce de Leche Mastellone 400 g',
    520000, 'Dulce de leche clásico de primera calidad. Elaborado con leche entera. Pote 400 g.',
    'https://images.unsplash.com/photo-1624815742228-acd249b89e48?w=400&q=80', 10, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_lacteos, 'Leche en Polvo Nido Entera 400 g',
    980000, 'Leche en polvo entera enriquecida con hierro y vitaminas. Fácil de preparar. Lata 400 g.',
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80', 11, false, true, NOW(), NOW());

  -- ── CARNES & AVES ────────────────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_carnes, 'Pollo Entero Fresco (por kg)',
    650000, 'Pollo entero de producción local. Sin aditivos ni conservantes. Peso promedio 2 kg. Precio por kg.',
    'https://images.unsplash.com/photo-1604503468506-a8da13d11d36?w=400&q=80', 1, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_carnes, 'Pechuga de Pollo sin Hueso 500 g',
    850000, 'Pechuga de pollo fresca deshuesada y limpia. Sin piel. Lista para milanesas, salteados y asado.',
    'https://images.unsplash.com/photo-1604503468506-a8da13d11d36?w=400&q=80', 2, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_carnes, 'Carne Picada Especial 500 g',
    820000, 'Carne picada de cortes especiales de res. Baja en grasas. Ideal para salsas, hamburguesas y rellenos.',
    'https://images.unsplash.com/photo-1628191139765-41a86be24c6b?w=400&q=80', 3, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_carnes, 'Milanesa de Ternera 500 g',
    1250000, 'Milanesa de ternera de primera calidad. Feteada fina, lista para rebozar. 500 g.',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', 4, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_carnes, 'Asado de Tira (por kg)',
    1150000, 'Asado de tira con hueso de novillos alimentados a pasto. El corte estrella de la parrilla argentina.',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80', 5, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_carnes, 'Bife de Chorizo (por kg)',
    1650000, 'Bife de chorizo sin hueso, jugoso y tierno. Corte ideal para la parrilla o la sartén.',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', 6, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_carnes, 'Salchicha Parrillera Cerdo 500 g',
    720000, 'Salchicha parrillera de cerdo con especias naturales. Sin gluten. Paquete de 500 g.',
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80', 7, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_carnes, 'Chorizo de Cerdo Fresco 500 g',
    680000, 'Chorizo fresco de cerdo artesanal. Con ajo, pimentón y especias. Ideal para asado y sandwiches.',
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80', 8, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_carnes, 'Bondiola de Cerdo 500 g',
    950000, 'Bondiola de cerdo fresca con veteado natural. Jugosa y sabrosa a la parrilla o al horno.',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_carnes, 'Medallones de Hamburguesa x4 300 g',
    850000, '4 medallones de carne vacuna pura. Sin conservantes. El disco perfecto para tus hamburguesas caseras.',
    'https://images.unsplash.com/photo-1603359543838-c1b5f67e1d34?w=400&q=80', 10, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_carnes, 'Vacío de Res (por kg)',
    1050000, 'Vacío de ternera, el clásico corte criollo para asado a fuego lento. Tierno y lleno de sabor.',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', 11, false, true, NOW(), NOW());

  -- ── FIAMBRERÍA ───────────────────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_fiambre, 'Jamón Cocido La Salamandra 100 g',
    250000, 'Jamón cocido de primera categoría. Bajo en grasas y sodio. Feteado al momento del despacho.',
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80', 1, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fiambre, 'Salame Milano Casancrem 100 g',
    320000, 'Salame estilo Milano con blend de carne de res y cerdo. Curado artesanalmente. Sabor intenso y balanceado.',
    'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=400&q=80', 2, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fiambre, 'Mortadela Fargo con Aceitunas 100 g',
    220000, 'Mortadela clásica con aceitunas verdes. Suave y sabrosa. Perfecta para picadas y sándwiches.',
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80', 3, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fiambre, 'Paleta Cocida Tres Ases 100 g',
    280000, 'Paleta de cerdo cocida, suave y jugosa. Excelente alternativa al jamón. Feteada fina.',
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80', 4, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fiambre, 'Queso Cremoso Feteado La Serenísima 150 g',
    550000, 'Queso cremoso feteado listo para usar. Ideal para sándwiches calientes y picadas. Pack 150 g.',
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80', 5, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fiambre, 'Queso Gruyere Importado 100 g',
    680000, 'Queso gruyere de origen suizo. Con agujeros característicos y sabor a nuez. Ideal para fondue.',
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80', 6, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fiambre, 'Paté de Hígado de Cerdo 100 g',
    280000, 'Paté suave de hígado de cerdo con especias. Untable, ideal para tostadas y crudités.',
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80', 7, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fiambre, 'Pepperoni Feteado El Árabe 100 g',
    380000, 'Pepperoni de cerdo y res con pimentón picante. Ideal para pizzas artesanales y picadas.',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', 8, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fiambre, 'Lomito de Pavo Light Filet 100 g',
    320000, 'Lomito de pavo bajo en calorías y grasas. Alto en proteínas. Ideal para dietas saludables.',
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fiambre, 'Queso de Máquina Port Salut 100 g',
    450000, 'Queso port salut fundido y cremoso. De corteza naranja característica. Suave y versátil.',
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80', 10, false, true, NOW(), NOW());

  -- ── FRUTAS & VERDURAS ────────────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Papa Blanca (por kg)',
    220000, 'Papa blanca fresca de la región pampeana. Ideal para todo uso: fritas, al horno, puré. Por kg.',
    'https://images.unsplash.com/photo-1518977676555-f49bf1dab5e2?w=400&q=80', 1, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Tomate Perita Fresco (por kg)',
    350000, 'Tomate perita maduro de primera calidad. Rico en licopeno. Perfecto para salsas y ensaladas. Por kg.',
    'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80', 2, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Lechuga Criolla Hidropónica',
    280000, 'Lechuga criolla de cultivo hidropónico. Sin tierra, lavada y lista para consumir. Unidad grande.',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80', 3, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Cebolla Blanca (por kg)',
    220000, 'Cebolla blanca fresca y crujiente. Base fundamental de la cocina argentina. Por kg.',
    'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80', 4, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Zanahoria (por kg)',
    250000, 'Zanahoria fresca entera sin hoja. Rica en betacaroteno. Ideal para ensaladas, sopas y jugos. Por kg.',
    'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80', 5, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Manzana Roja Delicious (por kg)',
    420000, 'Manzana roja jugosa y dulce de la región del Alto Valle de Río Negro. Por kg.',
    'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80', 6, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Banana de Ecuador (por kg)',
    280000, 'Banana madura de pulpa suave y dulce. Rica en potasio y energía natural. Por kg.',
    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80', 7, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Naranja Valencia (por kg)',
    320000, 'Naranja jugosa y dulce. Alta en vitamina C. Ideal para jugo exprimido o consumo directo. Por kg.',
    'https://images.unsplash.com/photo-1582578597-d11b22a0e25a?w=400&q=80', 8, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Limón Sutil (por kg)',
    380000, 'Limón fresco aromático y ácido. Imprescindible en la cocina argentina. Muy jugoso. Por kg.',
    'https://images.unsplash.com/photo-1568909344553-f3b9de9d4ed0?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Palta Hass Grande x3',
    650000, 'Paltas Hass en punto de maduración óptimo. Cremosas y con sabor suave. Pack de 3 unidades.',
    'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80', 10, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Espinaca Fresca Bolsa 250 g',
    350000, 'Espinaca baby lavada y lista para usar. Rica en hierro y ácido fólico. Bolsa 250 g.',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80', 11, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_fyverdura, 'Ajo Pelado (por 100 g)',
    220000, 'Ajo blanco pelado y fresco. Aroma y sabor intenso. Listo para picar o laminar. Por 100 g.',
    'https://images.unsplash.com/photo-1501420193839-eb3aa59d67b6?w=400&q=80', 12, false, true, NOW(), NOW());

  -- ── PANADERÍA & PASTELERÍA ──────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_panaderia, 'Pan Lactal Bimbo Clásico 550 g',
    480000, 'Pan de molde blanco de miga suave y corteza fina. 24 rebanadas. Ideal para sándwiches y tostadas.',
    'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&q=80', 1, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_panaderia, 'Pan Lactal Integral Fargo 450 g',
    550000, 'Pan de molde integral con semillas de lino y sésamo. Alto en fibra. 20 rebanadas.',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', 2, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_panaderia, 'Pan Francés Artesanal (por unidad)',
    120000, 'Pan francés crujiente de elaboración artesanal diaria. Corteza dorada y miga aireada.',
    'https://images.unsplash.com/photo-1519183071298-a2962d3f9822?w=400&q=80', 3, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_panaderia, 'Medialunas de Manteca x6',
    750000, 'Medialunas de manteca hojaldradas y glaseadas. El clásico desayuno argentino. Pack de 6 unidades.',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80', 4, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_panaderia, 'Factura Variada Surtida (por unidad)',
    220000, 'Facturas surtidas: vigilantes, cañoncitos, bolas de fraile. Rellenos de dulce de leche y crema.',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80', 5, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_panaderia, 'Tostadas Cerealitas Integrales 200 g',
    420000, 'Tostadas crujientes de cereal integral. Sin azúcar agregada. Excelente para desayuno y merienda.',
    'https://images.unsplash.com/photo-1531401671484-70b6da7fe1d1?w=400&q=80', 6, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_panaderia, 'Bizcochos de Grasa x6',
    550000, 'Bizcochos de grasa tradicionales. Crujientes por fuera y tiernos por dentro. Pack de 6 unidades.',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80', 7, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_panaderia, 'Budín de Limón Artesanal 350 g',
    850000, 'Budín de limón húmedo con glaseado de azúcar. Elaborado con jugo de limón natural. 350 g.',
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80', 8, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_panaderia, 'Tapas de Empanadas La Salteña x12',
    480000, 'Tapas de empanadas de harina de trigo. Tamaño estándar. Pack de 12 unidades listas para rellenar.',
    'https://images.unsplash.com/photo-1626080234025-d1d79dac39e1?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_panaderia, 'Pan de Salvado Artesanal 500 g',
    550000, 'Pan de salvado de trigo con semillas de girasol. Alto en fibra. Ideal para dietas saludables.',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', 10, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_panaderia, 'Pionono Relleno de Dulce de Leche',
    1200000, 'Pionono artesanal relleno con dulce de leche mastellone y crema chantilly. Porción para 6.',
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80', 11, true, true, NOW(), NOW());

  -- ── BEBIDAS ──────────────────────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Coca-Cola 2,25 L',
    550000, 'La gaseosa más famosa del mundo. Sabor clásico original. Botella familiar 2,25 litros.',
    'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=80', 1, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Sprite Limón-Lima 2,25 L',
    520000, 'Gaseosa sin cafeína con sabor refrescante a limón y lima. Sin colorantes. Botella 2,25 litros.',
    'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80', 2, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Fanta Naranja 2,25 L',
    520000, 'Gaseosa de sabor naranja con 3% de jugo de fruta real. Refrescante y frutal. 2,25 litros.',
    'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80', 3, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Agua Mineral Villavicencio 2,25 L',
    320000, 'Agua mineral natural con bajo contenido de sodio. Equilibrada y pura. Botella 2,25 litros.',
    'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80', 4, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Agua Saborizada Ser Manzana 1,5 L',
    450000, 'Agua saborizada sabor manzana sin azúcar ni calorías. 0% grasas. Botella 1,5 litros.',
    'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&q=80', 5, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Jugo de Naranja Exprimido Fresco 1 L',
    850000, 'Jugo de naranja 100% exprimido en el día. Sin azúcar ni conservantes agregados. 1 litro.',
    'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80', 6, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Cerveza Quilmes Cristal Lata 473 ml',
    450000, 'La cerveza argentina de mayor tradición. Lager rubia suave y refrescante. Lata 473 ml.',
    'https://images.unsplash.com/photo-1608270586818-1e9a3e1c7c94?w=400&q=80', 7, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Vino Tinto Trapiche Malbec Roble 750 ml',
    980000, 'Malbec mendocino criado en barricas de roble americano. Intenso, especiado y frutal. 750 ml.',
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80', 8, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Gatorade Naranja 1 L',
    480000, 'Bebida isotónica con electrolitos para la hidratación deportiva. Sabor naranja. 1 litro.',
    'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Soda La Real 2 L',
    280000, 'Agua gasificada sin gas natural. Clásica soda argentina para termos, aperitivos y mezclas.',
    'https://images.unsplash.com/photo-1437620341100-92b5bfdd8e4a?w=400&q=80', 10, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_bebidas, 'Vino Blanco Santa Julia Torrontés 750 ml',
    850000, 'Torrontés aromático con notas florales de rosa y mandarina. Fresco, ideal para mariscos y ensaladas.',
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80', 11, false, true, NOW(), NOW());

  -- ── LIMPIEZA DEL HOGAR ───────────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_limpieza, 'Lavandina Ayudín Regular 1 L',
    420000, 'Lavandina concentrada con poder blanqueador y desinfectante. Elimina el 99,9% de bacterias. 1 litro.',
    'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&q=80', 1, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_limpieza, 'Jabón en Polvo Ariel Regular 1 kg',
    850000, 'Detergente en polvo con enzimas activas. Elimina manchas difíciles en lavado a mano y máquina.',
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80', 2, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_limpieza, 'Jabón en Polvo Skip Matic 1 kg',
    820000, 'Jabón en polvo especial para lavarropas automáticos. Fórmula activa en agua fría y caliente.',
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80', 3, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_limpieza, 'Limpiavidrios Windex 500 ml',
    480000, 'Limpiavidrios sin rayado de acción rápida. Deja espejos y vidrios impecables sin marcas. 500 ml.',
    'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&q=80', 4, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_limpieza, 'Limpiador Flash Piso y Baño 500 ml',
    550000, 'Limpiador multiusos desengrasante de acción rápida. Aroma lavanda. Para todo tipo de superficies.',
    'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&q=80', 5, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_limpieza, 'Esponja Scotch-Brite Doble Cara x2',
    320000, 'Esponja con lado suave y lado abrasivo. Anti-bacteria. Ideal para vajilla y superficies delicadas.',
    'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&q=80', 6, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_limpieza, 'Suavizante de Ropa Comfort Lavanda 900 ml',
    680000, 'Suavizante concentrado con fragancia lavanda. Deja la ropa suave, con aroma duradero. 900 ml.',
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80', 7, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_limpieza, 'Desengrasante CIF Crema Multiusos 450 ml',
    520000, 'Limpiador cremoso con microcristales activos. Remueve grasa y suciedad sin rayar. 450 ml.',
    'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&q=80', 8, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_limpieza, 'Bolsas de Residuo Biodegradables 10 L x30',
    380000, 'Bolsas de residuo biodegradables de alta resistencia. Cierre atado incluido. 30 unidades 10 litros.',
    'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_limpieza, 'Cera para Pisos Johnson Brillo Natural 750 ml',
    650000, 'Cera líquida auto-brillante para pisos de madera y vinílicos. Protege y da brillo intenso. 750 ml.',
    'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&q=80', 10, false, true, NOW(), NOW());

  -- ── HIGIENE PERSONAL ────────────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_higiene, 'Shampoo Pantene Pro-V Hidratación 400 ml',
    850000, 'Shampoo con Pro-Vitamina B5. Hidrata y fortalece el cabello desde la raíz. Cabello liso y brilloso.',
    'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80', 1, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_higiene, 'Acondicionador Elvive Nutrigloss 400 ml',
    820000, 'Acondicionador con proteínas de seda. Desenreda, suaviza y aporta brillo al cabello. 400 ml.',
    'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80', 2, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_higiene, 'Jabón en Barra Dove Original x2 90 g',
    420000, 'Jabón en barra con 1/4 de crema hidratante. Deja la piel suave y hidratada. Pack de 2 x 90 g.',
    'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&q=80', 3, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_higiene, 'Pasta Dental Colgate Triple Acción 100 ml',
    580000, 'Pasta dental con flúor activo. Limpieza profunda, blanqueamiento y protección anticaries.',
    'https://images.unsplash.com/photo-1559757148-0e5f6b1c4f7c?w=400&q=80', 4, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_higiene, 'Cepillo Dental Oral-B Advantage Soft',
    450000, 'Cepillo dental de cerdas suaves con indicadores de desgaste. Limpieza superior y cuidado de encías.',
    'https://images.unsplash.com/photo-1559757148-0e5f6b1c4f7c?w=400&q=80', 5, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_higiene, 'Desodorante Rexona Clinical Women 150 ml',
    750000, 'Desodorante antitranspirante con tecnología clinical. 48h de protección. Sin manchas. 150 ml.',
    'https://images.unsplash.com/photo-1615397587338-1ac4c09f6a1b?w=400&q=80', 6, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_higiene, 'Papel Higiénico Renova Doble Hoja x4',
    720000, 'Papel higiénico suave de doble hoja con estampado. Pack de 4 rollos de 80 hojas cada uno.',
    'https://images.unsplash.com/photo-1583947213834-c3b6b59bb3e5?w=400&q=80', 7, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_higiene, 'Crema Corporal Nivea Original 400 ml',
    980000, 'Crema corporal humectante con extracto de aloe vera. Hidratación duradera para todo tipo de piel.',
    'https://images.unsplash.com/photo-1567721913486-6585f069b332?w=400&q=80', 8, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_higiene, 'Gillete Mach3 Repuesto x4 Cartuchos',
    1550000, '4 cartuchos de repuesto con 3 hojas de acero inoxidable. Afeitada precisa y duradera.',
    'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_higiene, 'Toallitas Húmedas WC Familia x80',
    550000, 'Toallitas húmedas biodegradables con aloe vera. Refrescantes y suaves. Pack de 80 unidades.',
    'https://images.unsplash.com/photo-1614621747441-92a8f52c8c7c?w=400&q=80', 10, false, true, NOW(), NOW());

  -- ── CONGELADOS ───────────────────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_congelado, 'Papas Fritas Congeladas McCain Clásicas 600 g',
    850000, 'Papas fritas congeladas precocidas. Crujientes por fuera y tiernas por dentro. Al horno o fritas. 600 g.',
    'https://images.unsplash.com/photo-1630743983898-4e4c93b9fc8a?w=400&q=80', 1, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_congelado, 'Pizza Congelada Banchero Mozzarella',
    1450000, 'Pizza precocida con salsa de tomate y mozzarella. Ideal para preparar en menos de 15 minutos.',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', 2, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_congelado, 'Empanadas Congeladas El Noble x12',
    1250000, '12 empanadas variadas (carne, pollo, verdura). Cocción en horno en 20 minutos. Sin frituras.',
    'https://images.unsplash.com/photo-1626080234025-d1d79dac39e1?w=400&q=80', 3, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_congelado, 'Helado Freddo Dulce de Leche Granizado 1 kg',
    1850000, 'El helado gourmet más buscado de Argentina. Dulce de leche cremoso con chips de chocolate. 1 kg.',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80', 4, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_congelado, 'Helado Grido Vainilla 1 L',
    980000, 'Helado de vainilla con extracto natural. Textura cremosa y suave. Pote familiar 1 litro.',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80', 5, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_congelado, 'Tarta de Verdura La Salteña Congelada',
    1220000, 'Tarta de verdura con espinaca, ricotta y cebolla. Masa dorada. Lista para calentar en horno.',
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80', 6, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_congelado, 'Croquetas de Pollo GranjaMix 500 g',
    850000, 'Croquetas de pollo con cobertura de pan rallado. Sin gluten. Cocción en horno o freidora. 500 g.',
    'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&q=80', 7, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_congelado, 'Brócoli Congelado en Ramitos 400 g',
    550000, 'Brócoli fresco congelado en ramitos listo para cocinar. Sin aditivos. Rico en vitamina C. 400 g.',
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&q=80', 8, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_congelado, 'Lasagna Congelada Tres Cruces Bolognesa 800 g',
    1550000, 'Lasagna precocida con carne bolognesa y bechamel. Porción para 2-3 personas. Listo en 25 min.',
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_congelado, 'Nuggets de Pollo Sin TACC 500 g',
    950000, 'Nuggets de pollo sin gluten. Crujientes por fuera, jugosos por dentro. Aptos celíacos. 500 g.',
    'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&q=80', 10, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_congelado, 'Palitos de Merluza Pescasur x10',
    1100000, 'Palitos de merluza con cobertura crocante. 100% filete, sin espinas. Pack de 10 unidades.',
    'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&q=80', 11, false, true, NOW(), NOW());

  -- ── SNACKS & GOLOSINAS ───────────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_snacks, 'Chizitos Mozzarella 300 g',
    520000, 'El snack argentino favorito. Bocadillos de maíz sabor mozzarella. Crujientes e irresistibles. 300 g.',
    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', 1, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_snacks, 'Papas Fritas Lays Clásicas 200 g',
    580000, 'Papas fritas finas con sal marina. Crujientes y de sabor suave. La clásica de siempre. 200 g.',
    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', 2, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_snacks, 'Galletitas Oreo Clásicas 118 g',
    450000, 'Las galletitas de chocolate con relleno de crema más famosas del mundo. Paquete de 118 g.',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', 3, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_snacks, 'Alfajor Havanna Triple Chocolate x2',
    850000, 'El alfajor premium argentino. Tres capas de chocolate negro y blanco con relleno de dulce de leche.',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', 4, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_snacks, 'Chocolinas 200 g',
    550000, 'Galletitas de chocolate de la marca más tradicional de Argentina. Ideales para tartas y postres.',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', 5, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_snacks, 'Chocolate Milka Almendra 135 g',
    750000, 'Chocolate con leche alpina Milka con almendras enteras tostadas. Suave y cremoso. 135 g.',
    'https://images.unsplash.com/photo-1606312619070-a6c37b8700a0?w=400&q=80', 6, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_snacks, 'Caramelos Sugus Surtidos x70 unidades',
    520000, 'Caramelos masticables con sabores frutales. Mix de naranja, limón, frutilla y frambuesa. x70 u.',
    'https://images.unsplash.com/photo-1562159278-1253a58da141?w=400&q=80', 7, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_snacks, 'Pringles Original 149 g',
    680000, 'Papas fritas en formato tubo con forma uniforme. Sabor original con sal. Lata 149 g.',
    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', 8, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_snacks, 'Maní Salado Tostado Menú 200 g',
    480000, 'Maní tostado con sal de mar. Alto en proteínas y grasas saludables. Sin gluten. 200 g.',
    'https://images.unsplash.com/photo-1567003901839-be3f3e8e7f1b?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_snacks, 'Chicles Trident Menta x30 unidades',
    350000, 'Chicles sin azúcar con xilitol. Sabor menta refrescante de larga duración. Blister de 30 u.',
    'https://images.unsplash.com/photo-1562159278-1253a58da141?w=400&q=80', 10, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_snacks, 'Mix de Frutos Secos Premium 200 g',
    1200000, 'Mix de castañas de cajú, almendras, nueces y pasas de uva. Sin sal agregada. 200 g.',
    'https://images.unsplash.com/photo-1567003901839-be3f3e8e7f1b?w=400&q=80', 11, false, true, NOW(), NOW());

  -- ── DESAYUNO & MERIENDA ──────────────────────────────────────────────────────
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "imageUrl", "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, cat_desayuno, 'Cereales Kellogg''s Froot Loops 300 g',
    980000, 'Cereales de colores con sabor frutal. Enriquecidos con vitaminas y minerales. 300 g.',
    'https://images.unsplash.com/photo-1621236378699-8597faf6a11a?w=400&q=80', 1, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_desayuno, 'Granola Natural con Miel 350 g',
    850000, 'Granola artesanal con avena, miel, semillas de chía y frutos secos. Sin azúcar refinada. 350 g.',
    'https://images.unsplash.com/photo-1517093602195-b40af9688ab0?w=400&q=80', 2, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_desayuno, 'Mermelada de Frutilla Arcor 454 g',
    550000, 'Mermelada de frutilla con 45% de fruta real. Baja en calorías. Frasco de vidrio 454 g.',
    'https://images.unsplash.com/photo-1464349153-cd33dccb2f4a?w=400&q=80', 3, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_desayuno, 'Dulce de Leche Repostero Mastellone 400 g',
    580000, 'Dulce de leche de alta consistencia para repostería. Ideal para alfajores, tortas y rellenos. 400 g.',
    'https://images.unsplash.com/photo-1624815742228-acd249b89e48?w=400&q=80', 4, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_desayuno, 'Mate Cocido Taragüi Saquitos x50',
    480000, '50 saquitos de mate cocido de la marca más tradicional. Sabor intenso. Fácil preparación.',
    'https://images.unsplash.com/photo-1556679343-c4306a8ef083?w=400&q=80', 5, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_desayuno, 'Té Negro Lipton Yellow Label x25',
    420000, '25 saquitos de té negro de hojas seleccionadas. Suave y aromático. Excelente con leche.',
    'https://images.unsplash.com/photo-1556679343-c4306a8ef083?w=400&q=80', 6, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_desayuno, 'Cacao en Polvo Nesquik 800 g',
    1450000, 'Cacao soluble azucarado con vitaminas. El clásico de los desayunos argentinos. 800 g.',
    'https://images.unsplash.com/photo-1606312619070-a6c37b8700a0?w=400&q=80', 7, true, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_desayuno, 'Avena Instantánea Quaker 400 g',
    750000, 'Avena en hojuelas de cocción rápida. Rica en fibra y bajo índice glucémico. Sin gluten. 400 g.',
    'https://images.unsplash.com/photo-1495197359483-d092478c170a?w=400&q=80', 8, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_desayuno, 'Tostadas de Salvado Wasa x12',
    650000, 'Tostadas crujientes de salvado de trigo. Altas en fibra, bajas en calorías. Pack de 12 u.',
    'https://images.unsplash.com/photo-1531401671484-70b6da7fe1d1?w=400&q=80', 9, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_desayuno, 'Crema de Maní Natural Skippy 340 g',
    1250000, 'Crema de maní sin azúcar agregada ni aceite de palma. Textura cremosa. 340 g.',
    'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&q=80', 10, false, true, NOW(), NOW()),

  (gen_random_uuid(), v_tenant_id, cat_desayuno, 'Honey Bunches de Oro Miel 500 g',
    1100000, 'Cereales de trigo y maíz con grumos de miel caramelizados. Con vitaminas. Caja 500 g.',
    'https://images.unsplash.com/photo-1621236378699-8597faf6a11a?w=400&q=80', 11, false, true, NOW(), NOW());

END $$;

COMMIT;
