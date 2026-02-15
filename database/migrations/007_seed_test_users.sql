-- Migration: 007_seed_test_users.sql  
-- Description: Creates structure for test user accounts (actual seeding via backend script)
-- 
-- NOTE: Test user data is seeded via: node backend/scripts/seed-test-users.js
-- This ensures bcrypt hashing is done with the app's configuration.
-- 
-- This migration file just ensures the database supports the structure.
-- If you want to manually seed users, run:
--   node backend/scripts/seed-test-users.js
-- 
-- Test credentials will be:
--   admin@rfqbuddy.com / admin123
--   buyer@rfqbuddy.com / buyer123
--   vendor@rfqbuddy.com / vendor123

BEGIN;

-- Create organizations first (if they don't exist)
-- Using gen_random_uuid() for deterministic test UUIDs
INSERT INTO organizations (id, name, type, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'RFQ Buddy Admin', 'buyer', NOW()),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'ABC Procurement Ltd', 'buyer', NOW()),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'XYZ Suppliers Inc', 'vendor', NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;
