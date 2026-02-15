-- Migration: 008_add_organization_type.sql
-- Description: Add organization_type column to organizations table and is_govt_type to tender_type_definitions
-- Phase 1, Task 1 & Task 2

BEGIN;

-- Add organization_type column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS organization_type VARCHAR(20) NOT NULL DEFAULT 'government'
  CHECK (organization_type IN ('government', 'non-government'));

-- Backfill existing organizations as 'government' (safe default)
UPDATE organizations 
SET organization_type = 'government' 
WHERE organization_type IS NULL OR organization_type = '';

-- Add index for fast filtering
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(organization_type);

-- Add flag to tender_type_definitions to mark govt vs non-govt types
ALTER TABLE tender_type_definitions
ADD COLUMN IF NOT EXISTS is_govt_type BOOLEAN NOT NULL DEFAULT true;

-- Update existing tender types as government types
UPDATE tender_type_definitions
SET is_govt_type = true
WHERE is_govt_type IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_tender_type_govt ON tender_type_definitions(is_govt_type);

COMMENT ON COLUMN organizations.organization_type IS 'Determines which tender types are available: government sees PG/PW/PPS types, non-government sees NRQ types';
COMMENT ON COLUMN tender_type_definitions.is_govt_type IS 'True for Bangladesh e-GP types (PG/PW/PPS), false for non-govt types (NRQ)';

COMMIT;

-- Verification
-- SELECT organization_type, COUNT(*) 
-- FROM organizations 
-- GROUP BY organization_type;
-- 
-- SELECT code, name, is_govt_type 
-- FROM tender_type_definitions 
-- WHERE is_active = TRUE;
