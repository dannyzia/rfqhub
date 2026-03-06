-- =====================================================================
-- Rollback for Migration 019: Fix tender_type FK on tenders table
--
-- Restores the original (incorrect) FK pointing back to tender_type_master.
-- Use only if migration 019 needs to be reverted.
-- =====================================================================

-- Drop the corrected FK
ALTER TABLE tenders
  DROP CONSTRAINT IF EXISTS tenders_tender_type_fkey;

-- Restore the original FK pointing to tender_type_master
ALTER TABLE tenders
  ADD CONSTRAINT tenders_tender_type_fkey
    FOREIGN KEY (tender_type)
    REFERENCES tender_type_master (code)
    ON DELETE RESTRICT;
