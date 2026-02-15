-- Migration: Add tender modes and extended fields to tenders table
ALTER TABLE tenders 
ADD COLUMN tender_mode VARCHAR(20) NOT NULL DEFAULT 'detailed_rft'
  CHECK (tender_mode IN ('simple_rfq', 'detailed_rft', 'live_auction')),
ADD COLUMN is_govt_tender BOOLEAN DEFAULT true,
ADD COLUMN extended_data JSONB DEFAULT '{}',
ADD COLUMN live_bidding_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN live_bidding_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN live_bidding_duration_minutes INTEGER;

CREATE INDEX idx_tenders_mode ON tenders(tender_mode);
