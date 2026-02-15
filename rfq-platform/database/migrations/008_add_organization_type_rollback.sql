-- Rollback: 008_add_organization_type_rollback.sql
-- Description: Rollback organization_type and is_govt_type columns
-- Phase 1, Task 1 & Task 2

BEGIN;

-- Remove indexes
DROP INDEX IF EXISTS idx_tender_type_govt;
DROP INDEX IF EXISTS idx_organizations_type;

-- Remove columns
ALTER TABLE tender_type_definitions DROP COLUMN IF EXISTS is_govt_type;
ALTER TABLE organizations DROP COLUMN IF EXISTS organization_type;

COMMIT;
