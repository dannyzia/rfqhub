-- Migration: 020_make_simple_rfq_columns_nullable.sql
-- Description: Allow buyer_org_id and created_by to be NULL for Simple RFQ tenders
--              Simple RFQ is a public-facing feature that may not have authenticated users
-- Phase 7: Simple RFQ Integration Test Stabilization

BEGIN;

-- Make buyer_org_id nullable (allows simple RFQ without authenticated organization)
ALTER TABLE tenders ALTER COLUMN buyer_org_id DROP NOT NULL;

-- Make created_by nullable (allows simple RFQ without authenticated user)
ALTER TABLE tenders ALTER COLUMN created_by DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN tenders.buyer_org_id IS 'Buyer organization (NULL for simple RFQ without authentication)';
COMMENT ON COLUMN tenders.created_by IS 'User who created the tender (NULL for simple RFQ without authentication)';

COMMIT;