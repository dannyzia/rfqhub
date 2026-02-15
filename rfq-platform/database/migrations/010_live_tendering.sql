-- Migration: 010_live_tendering.sql
-- Description: Create database schema for live tendering with auction-style bidding
-- Phase 4, Task 13

BEGIN;

-- Create live bidding sessions table
CREATE TABLE live_bidding_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID UNIQUE REFERENCES tenders(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'paused', 'completed', 'cancelled')),
  bidding_type VARCHAR(20) NOT NULL
    CHECK (bidding_type IN ('sealed', 'open_reverse', 'open_auction')),
  current_best_bid_id UUID REFERENCES bids(id),
  total_bids_submitted INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}', -- min increment, visibility rules, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create limited tender vendors table for restricted access
CREATE TABLE limited_tender_vendors (
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  vendor_org_id UUID REFERENCES organizations(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  invitation_status VARCHAR(20) DEFAULT 'sent' CHECK (invitation_status IN ('sent', 'accepted', 'declined')),
  PRIMARY KEY (tender_id, vendor_org_id)
);

-- Create live bid updates table for real-time events
CREATE TABLE live_bid_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES live_bidding_sessions(id),
  bid_id UUID REFERENCES bids(id),
  vendor_org_id UUID REFERENCES organizations(id),
  event_type VARCHAR(20), -- new_bid, bid_withdrawn, bid_improved, outbid
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_live_session_tender ON live_bidding_sessions(tender_id);
CREATE INDEX idx_live_session_status ON live_bidding_sessions(status);
CREATE INDEX idx_live_session_scheduled ON live_bidding_sessions(scheduled_start) WHERE status = 'scheduled';
CREATE INDEX idx_limited_vendors_tender ON limited_tender_vendors(tender_id);
CREATE INDEX idx_live_bid_updates_session ON live_bid_updates(session_id);
CREATE INDEX idx_live_bid_updates_created ON live_bid_updates(created_at);

-- Add live tendering flag to tenders table
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS is_live_tendering BOOLEAN DEFAULT false;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS live_session_id UUID REFERENCES live_bidding_sessions(id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_live_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_live_bidding_sessions_updated_at
  BEFORE UPDATE ON live_bidding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_live_session_updated_at();

COMMIT;

-- Verification queries
-- SELECT * FROM live_bidding_sessions LIMIT 5;
-- SELECT * FROM limited_tender_vendors LIMIT 5;
-- SELECT * FROM live_bid_updates LIMIT 5;