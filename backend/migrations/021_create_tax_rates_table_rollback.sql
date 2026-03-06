-- =====================================================================
-- Rollback Migration 021: Drop tax_rates Table
-- Removes the tax_rates table and all its indexes
-- =====================================================================

-- Drop indexes first (PostgreSQL drops indexes automatically when table is dropped,
-- but being explicit is clearer and safer)
DROP INDEX IF EXISTS idx_tax_rates_active;
DROP INDEX IF EXISTS idx_tax_rates_expiry_date;
DROP INDEX IF EXISTS idx_tax_rates_effective_date;
DROP INDEX IF EXISTS idx_tax_rates_tax_type;
DROP INDEX IF EXISTS idx_tax_rates_jurisdiction;

-- Drop the table
DROP TABLE IF EXISTS tax_rates;

-- Note: This will permanently delete all tax rate data
-- Ensure you have a backup if running in production
