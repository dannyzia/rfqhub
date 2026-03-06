-- =====================================================================
-- Rollback Migration 022: Drop support_tickets Table
-- Removes the support_tickets table, trigger, function, and indexes
-- =====================================================================

-- Drop trigger first (depends on table)
DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON support_tickets;

-- Drop the function used by the trigger
DROP FUNCTION IF EXISTS update_support_tickets_updated_at();

-- Drop indexes (PostgreSQL drops them with the table; explicit for clarity)
DROP INDEX IF EXISTS idx_support_tickets_created;
DROP INDEX IF EXISTS idx_support_tickets_type;
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_support_tickets_submitted_by;

-- Drop the table
DROP TABLE IF EXISTS support_tickets;

-- Note: This will permanently delete all support ticket data.
-- Ensure you have a backup if running in production.
