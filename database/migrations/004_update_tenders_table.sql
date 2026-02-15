-- Migration: 004_update_tenders_table.sql
-- Description: Add tender_type foreign key to tenders table
-- Phase 0, Task 4

-- Add tender_type column if it doesn't exist
ALTER TABLE tenders 
ADD COLUMN IF NOT EXISTS tender_type TEXT REFERENCES tender_type_definitions(code);

-- If tenders already have old tender_type enum, migrate data
-- This maps old RFQ/TENDER to new types with a default
UPDATE tenders 
SET tender_type = 'PG1' 
WHERE tender_type IS NULL AND (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'tenders' AND column_name = 'tender_type'
) > 0;

-- Index the foreign key for fast lookups
CREATE INDEX IF NOT EXISTS idx_tenders_tender_type ON tenders(tender_type);

-- Create composite index for status + tender_type queries
CREATE INDEX IF NOT EXISTS idx_tenders_status_type ON tenders(status, tender_type);

COMMENT ON COLUMN tenders.tender_type IS 'Bangladesh e-GP tender type code (PG1, PG2, etc.)';
