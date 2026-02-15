-- Migration: 001_create_tender_type_definitions.sql
-- Description: Creates table for Bangladesh e-GP tender type specifications
-- Phase 0, Task 1

CREATE TABLE IF NOT EXISTS tender_type_definitions (
    code TEXT PRIMARY KEY,                          -- PG1, PG2, PG3, etc.
    name TEXT NOT NULL,                             -- "RFQ for Goods (up to 8 Lac)"
    description TEXT,                               -- Full description
    procurement_type TEXT NOT NULL                  -- goods, works, services
        CHECK (procurement_type IN ('goods', 'works', 'services')),
    
    -- Value thresholds (in base currency, BDT)
    min_value_bdt NUMERIC(18,2) DEFAULT 0,          -- Minimum tender value
    max_value_bdt NUMERIC(18,2),                    -- Maximum (NULL = unlimited)
    
    -- Security requirements
    requires_tender_security BOOLEAN DEFAULT FALSE,
    tender_security_percent NUMERIC(5,2),           -- e.g., 2.00 for 2%
    tender_security_validity_days INTEGER,          -- Days beyond tender validity
    
    requires_performance_security BOOLEAN DEFAULT FALSE,
    performance_security_percent NUMERIC(5,2),      -- e.g., 10.00 for 10%
    
    requires_retention_money BOOLEAN DEFAULT FALSE, -- For works only
    retention_money_percent NUMERIC(5,2),          -- e.g., 5.00 for 5%
    
    -- Process requirements
    requires_two_envelope BOOLEAN DEFAULT FALSE,
    requires_newspaper_ad BOOLEAN DEFAULT FALSE,
    requires_website_publication BOOLEAN DEFAULT TRUE,
    requires_prequalification BOOLEAN DEFAULT FALSE,
    requires_site_visit BOOLEAN DEFAULT FALSE,      -- For works
    
    -- Timeline constraints
    min_submission_days INTEGER NOT NULL,           -- Minimum days from publish to deadline
    max_submission_days INTEGER,                    -- Maximum allowed period
    default_validity_days INTEGER NOT NULL,         -- Default bid validity period
    default_evaluation_days INTEGER,                -- Expected evaluation duration
    
    -- Document structure
    section_count INTEGER,                          -- 4, 7, 8, or 10 sections
    
    -- Scope
    is_international BOOLEAN DEFAULT FALSE,         -- Allows foreign bidders
    is_direct_procurement BOOLEAN DEFAULT FALSE,    -- Single source (PG9A, PPS6)
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by procurement type and value
CREATE INDEX IF NOT EXISTS idx_tender_type_procurement ON tender_type_definitions(procurement_type);
CREATE INDEX IF NOT EXISTS idx_tender_type_active ON tender_type_definitions(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE tender_type_definitions IS 'Bangladesh Public Procurement Rules 2025 - Standard Tender Types';
COMMENT ON COLUMN tender_type_definitions.code IS 'Official BPPA code: PG1, PG2, PG3, PG4, PG5A, PG9A, PW1, PW3, PPS2, PPS3, PPS6';
