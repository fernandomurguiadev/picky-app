-- ============================================================================
-- FIX: Corrige usuario testing1@gmail.com del tenant picky-supermercado
-- Problema: ON CONFLICT (id) ignoró el insert si el email ya existía
-- ============================================================================

BEGIN;

-- Upsert del usuario por email
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

-- Asegurar membresía al tenant picky-supermercado
INSERT INTO tenant_memberships (id, "userId", "tenantId", role, "isActive", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  u.id,
  'a8c94521-3b72-4890-8def-912345678901',
  'admin',
  true,
  NOW(), NOW()
FROM users u
WHERE u.email = 'testing1@gmail.com'
ON CONFLICT DO NOTHING;

COMMIT;
