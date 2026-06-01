-- ============================================================================
-- INCREMENTAL SEED: NUEVAS BEBIDAS
-- Tenant Objetivo (Existente): b5763874-892d-44d1-8d26-859d0df5d0e1
-- ============================================================================

-- Bypass temporal de RLS para el script
SET app.current_tenant_id = 'b5763874-892d-44d1-8d26-859d0df5d0e1';

BEGIN;

DO $$
DECLARE
  v_tenant_id uuid := 'b5763874-892d-44d1-8d26-859d0df5d0e1';
  v_cat_bebidas_id uuid;
BEGIN
  -- 1. Buscar el ID de la categoría de bebidas ya existente para este tenant
  SELECT id INTO v_cat_bebidas_id 
  FROM categories 
  WHERE "tenantId" = v_tenant_id AND name = 'Bebidas Heladas'
  LIMIT 1;

  -- Si por alguna razón no existiera, la creamos al vuelo para proteger el script
  IF v_cat_bebidas_id IS NULL THEN
    v_cat_bebidas_id := gen_random_uuid();
    INSERT INTO categories (id, "tenantId", name, "order", "isActive", "createdAt", "updatedAt")
    VALUES (v_cat_bebidas_id, v_tenant_id, 'Bebidas Heladas', 5, true, NOW(), NOW());
    RAISE NOTICE 'Categoría Bebidas Heladas no existía, creada con ID: %', v_cat_bebidas_id;
  ELSE
    RAISE NOTICE 'Categoría Bebidas Heladas encontrada con ID: %', v_cat_bebidas_id;
  END IF;

  -- 2. Insertar únicamente las Bebidas nuevas desde cero (excluyendo las dos que ya inyectó el script base)
  INSERT INTO products (id, "tenantId", "categoryId", name, price, description, "order", "isFeatured", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), v_tenant_id, v_cat_bebidas_id, 'Coca Cola Sin Azúcar 500ml', 180000, 'Gaseosa Coca-Cola sin azúcares y sin calorías helada.', 3, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_cat_bebidas_id, 'Sprite Sin Azúcar 500ml', 180000, 'Gaseosa lima-limón Sprite sin azúcares helada.', 4, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_cat_bebidas_id, 'Fanta Naranja 500ml', 180000, 'Gaseosa Fanta sabor naranja refrescante.', 5, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_cat_bebidas_id, 'Cerveza IPA Artesanal Lata 473ml', 320000, 'Birra artesanal bien fría de lupulado intenso y notas cítricas.', 6, true, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_cat_bebidas_id, 'Cerveza Golden Artesanal Lata 473ml', 300000, 'Birra artesanal dorada, suave, ligera y sumamente refrescante.', 7, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_cat_bebidas_id, 'Agua Mineral Sin Gas 500ml', 150000, 'Agua mineral de manantial fresca sin gas.', 8, false, true, NOW(), NOW()),
  (gen_random_uuid(), v_tenant_id, v_cat_bebidas_id, 'Agua Mineral Con Gas 500ml', 150000, 'Agua mineral gasificada bien helada.', 9, false, true, NOW(), NOW());

  RAISE NOTICE 'Nuevas bebidas insertadas correctamente en la base de datos.';
END $$;

COMMIT;
