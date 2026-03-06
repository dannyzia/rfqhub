-- =====================================================================
-- Migration 018 ROLLBACK: Export Jobs & Currencies
-- Reverses migration 018_export_jobs_and_currencies.sql
-- =====================================================================

-- Drop indexes first (they are dropped automatically with the table,
-- but listed here for clarity)
DROP INDEX IF EXISTS idx_export_jobs_created_at;
DROP INDEX IF EXISTS idx_export_jobs_status;
DROP INDEX IF EXISTS idx_export_jobs_user_id;

-- 1. Drop export_jobs table
DROP TABLE IF EXISTS export_jobs;

-- 2. Drop currencies table
-- Note: does NOT remove currency_master (that is a separate legacy table)
DROP TABLE IF EXISTS currencies;
