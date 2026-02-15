-- Rollback: Remove tender modes and extended fields from tenders table
DROP INDEX IF EXISTS idx_tenders_extended_data_gin;
DROP INDEX IF EXISTS idx_tenders_live_scheduled;
DROP INDEX IF EXISTS idx_tenders_govt;
DROP INDEX IF EXISTS idx_tenders_mode;

ALTER TABLE tenders 
DROP COLUMN IF EXISTS api_version,
DROP COLUMN IF EXISTS live_bidding_duration_minutes,
DROP COLUMN IF EXISTS live_bidding_end,
DROP COLUMN IF EXISTS live_bidding_start,
DROP COLUMN IF EXISTS extended_data,
DROP COLUMN IF EXISTS is_govt_tender,
DROP COLUMN IF EXISTS tender_mode;
