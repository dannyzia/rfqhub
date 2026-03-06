-- =====================================================================
-- Migration 019: Fix tender_type FK on tenders table
--
-- Problem:
--   tenders.tender_type has a FK constraint pointing to tender_type_master(code).
--   tender_type_master only holds high-level categories ('RFQ', 'TENDER').
--   The service layer validates tender types against tender_type_definitions
--   (which holds detailed codes: NRQ1, PG1, PW1, etc.).
--   This mismatch causes a FK violation (23503 → HTTP 400) on every tender
--   creation attempt using the detailed codes.
--
-- Fix:
--   Drop the incorrect FK constraint and recreate it pointing to
--   tender_type_definitions(code) — the table the service actually uses.
-- =====================================================================

-- Drop the incorrect FK constraint
ALTER TABLE tenders
  DROP CONSTRAINT IF EXISTS tenders_tender_type_fkey;

-- Recreate pointing to tender_type_definitions (the correct reference table)
ALTER TABLE tenders
  ADD CONSTRAINT tenders_tender_type_fkey
    FOREIGN KEY (tender_type)
    REFERENCES tender_type_definitions (code)
    ON DELETE RESTRICT;
