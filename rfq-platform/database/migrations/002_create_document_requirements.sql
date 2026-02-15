-- Migration: 002_create_document_requirements.sql
-- Description: Tender type specific document requirements
-- Phase 0, Task 2

CREATE TABLE IF NOT EXISTS tender_type_document_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_type_code TEXT NOT NULL REFERENCES tender_type_definitions(code) ON DELETE CASCADE,
    
    -- Document identification
    document_code TEXT NOT NULL,                    -- PG2-1, trade_license, tin_certificate, etc.
    document_name TEXT NOT NULL,                    -- "Tender Submission Letter"
    document_category TEXT NOT NULL                 -- tender_form, legal, financial, technical, contract_form
        CHECK (document_category IN ('tender_form', 'legal', 'financial', 'technical', 'contract_form', 'other')),
    
    -- Requirements
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    is_template_provided BOOLEAN DEFAULT FALSE,     -- Does BPPA provide a standard form?
    
    -- File constraints
    allowed_file_formats TEXT[],                    -- ['pdf', 'jpg', 'png']
    max_file_size_mb INTEGER DEFAULT 10,
    
    -- Help text
    description TEXT,                               -- Instructions for this document
    example_url TEXT,                               -- Link to sample/template
    
    -- Display order
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tender_type_code, document_code)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_doc_req_tender_type ON tender_type_document_requirements(tender_type_code);
CREATE INDEX IF NOT EXISTS idx_doc_req_category ON tender_type_document_requirements(document_category);
CREATE INDEX IF NOT EXISTS idx_doc_req_mandatory ON tender_type_document_requirements(is_mandatory) WHERE is_mandatory = TRUE;

COMMENT ON TABLE tender_type_document_requirements IS 'Required documents per tender type (e.g., PG2 requires forms PG2-1 through PG2-11)';
