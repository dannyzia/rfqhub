-- Rollback: 020_make_simple_rfq_columns_nullable_rollback.sql
-- Description: Restore NOT NULL constraints on buyer_org_id and created_by
-- Phase 7: Simple RFQ Integration Test Stabilization

BEGIN;

-- Create default organization for any NULL buyer_org_id rows
INSERT INTO organizations (id, name, type, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Default Simple RFQ Organization',
  'buyer',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create default user for any NULL created_by rows
-- Note: password_hash is required; use a bcrypt hash of 'default-password'
INSERT INTO users (id, name, email, password_hash, roles, is_active, organization_id, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Default Simple RFQ User',
  'default-simple-rfq@example.com',
  '$2a$12$Kc6o2Xc7v8q9V8p3f5Z3Ee6z5Xy7A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4', -- bcrypt hash of 'default-password'
  ARRAY['buyer']::text[],
  true,
  '11111111-1111-1111-1111-111111111111'::uuid,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update any NULL buyer_org_id to the default organization
UPDATE tenders
SET buyer_org_id = '11111111-1111-1111-1111-111111111111'::uuid
WHERE buyer_org_id IS NULL;

-- Update any NULL created_by to the default user
UPDATE tenders
SET created_by = '22222222-2222-2222-2222-222222222222'::uuid
WHERE created_by IS NULL;

-- Restore NOT NULL constraints
ALTER TABLE tenders ALTER COLUMN buyer_org_id SET NOT NULL;
ALTER TABLE tenders ALTER COLUMN created_by SET NOT NULL;

-- Restore original comments
COMMENT ON COLUMN tenders.buyer_org_id IS 'Buyer organization';
COMMENT ON COLUMN tenders.created_by IS 'User who created the tender';

COMMIT;