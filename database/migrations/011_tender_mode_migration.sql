-- Migration: 011_tender_mode_migration.sql
-- Description: Add tender mode migration support and backfill existing tenders
-- Phase 6, Task 22

BEGIN;

-- Add tender_mode column to tenders table if not exists
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS tender_mode VARCHAR(50);
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS api_version VARCHAR(10) DEFAULT 'v1';
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS is_govt_tender BOOLEAN DEFAULT true;

-- Create migration log table
CREATE TABLE IF NOT EXISTS tender_mode_migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  from_mode VARCHAR(50),
  to_mode VARCHAR(50),
  migration_type VARCHAR(50), -- 'auto_backfill', 'manual_switch', 'upgrade'
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  migrated_by VARCHAR(255),
  metadata JSONB
);

-- Backfill existing tenders based on their current state
-- Logic: If tender has extended_data with rfqDetails -> simple_rfq, else detailed_rft
UPDATE tenders 
SET 
  tender_mode = CASE 
    WHEN extended_data->'rfqDetails' IS NOT NULL THEN 'simple_rfq'
    ELSE 'detailed_rft'
  END,
  api_version = 'v1',
  is_govt_tender = true
WHERE tender_mode IS NULL;

-- Create index for tender mode queries
CREATE INDEX IF NOT EXISTS idx_tenders_mode ON tenders(tender_mode);
CREATE INDEX IF NOT EXISTS idx_tenders_api_version ON tenders(api_version);
CREATE INDEX IF NOT EXISTS idx_tenders_govt_tender ON tenders(is_govt_tender);

-- Create function to migrate tender mode
CREATE OR REPLACE FUNCTION migrate_tender_mode(
  p_tender_id UUID,
  p_new_mode VARCHAR(50),
  p_migrated_by VARCHAR(255)
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_mode VARCHAR(50);
  v_tender_data JSONB;
  v_result BOOLEAN := false;
BEGIN
  -- Get current tender data
  SELECT tender_mode, extended_data INTO v_current_mode, v_tender_data
  FROM tenders WHERE id = p_tender_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tender not found: %', p_tender_id;
  END IF;
  
  -- Validate migration
  IF v_current_mode = p_new_mode THEN
    RETURN true; -- Already in target mode
  END IF;
  
  -- Log the migration
  INSERT INTO tender_mode_migrations (
    tender_id, from_mode, to_mode, migration_type, migrated_by, metadata
  ) VALUES (
    p_tender_id, v_current_mode, p_new_mode, 'manual_switch', p_migrated_by,
    jsonb_build_object(
      'previous_data', v_tender_data,
      'migration_timestamp', now()
    )
  );
  
  -- Update tender
  UPDATE tenders 
  SET 
    tender_mode = p_new_mode,
    api_version = 'v2',
    updated_at = now()
  WHERE id = p_tender_id;
  
  v_result := true;
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Migration failed for tender %: %', p_tender_id, SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Create function to get tender migration history
CREATE OR REPLACE FUNCTION get_tender_migration_history(p_tender_id UUID)
RETURNS TABLE(
  id UUID,
  from_mode VARCHAR(50),
  to_mode VARCHAR(50),
  migration_type VARCHAR(50),
  migrated_at TIMESTAMP WITH TIME ZONE,
  migrated_by VARCHAR(255),
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.id,
    tm.from_mode,
    tm.to_mode,
    tm.migration_type,
    tm.migrated_at,
    tm.migrated_by,
    tm.metadata
  FROM tender_mode_migrations tm
  WHERE tm.tender_id = p_tender_id
  ORDER BY tm.migrated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for tender mode statistics
CREATE OR REPLACE VIEW tender_mode_stats AS
SELECT 
  tender_mode,
  api_version,
  is_govt_tender,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'awarded') as awarded_count,
  COUNT(*) FILTER (WHERE is_live_tendering = true) as live_tendering_count,
  AVG(EXTRACT(EPOCH FROM (awarded_at - created_at))/86400)::integer as avg_days_to_award
FROM tenders
GROUP BY tender_mode, api_version, is_govt_tender
ORDER BY tender_mode, api_version;

COMMIT;

-- Verification queries
-- SELECT * FROM tender_mode_stats;
-- SELECT COUNT(*) FROM tenders WHERE tender_mode IS NOT NULL;
-- SELECT COUNT(*) FROM tender_mode_migrations;