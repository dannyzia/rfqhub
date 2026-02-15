-- Rollback: 010_live_tendering_rollback.sql
-- Description: Rollback live tendering database schema changes
-- Phase 4, Task 13

BEGIN;

-- Drop trigger and function
DROP TRIGGER IF EXISTS update_live_bidding_sessions_updated_at ON live_bidding_sessions;
DROP FUNCTION IF EXISTS update_live_session_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_live_bid_updates_created;
DROP INDEX IF EXISTS idx_live_bid_updates_session;
DROP INDEX IF EXISTS idx_limited_vendors_tender;
DROP INDEX IF EXISTS idx_live_session_scheduled;
DROP INDEX IF EXISTS idx_live_session_status;
DROP INDEX IF EXISTS idx_live_session_tender;

-- Drop tables
DROP TABLE IF EXISTS live_bid_updates;
DROP TABLE IF EXISTS limited_tender_vendors;
DROP TABLE IF EXISTS live_bidding_sessions;

-- Remove columns from tenders table
ALTER TABLE tenders DROP COLUMN IF EXISTS is_live_tendering;
ALTER TABLE tenders DROP COLUMN IF EXISTS live_session_id;

COMMIT;