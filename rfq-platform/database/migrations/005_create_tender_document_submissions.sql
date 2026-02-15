-- Migration: 005_create_tender_document_submissions.sql
-- Description: Table for tracking document uploads by vendors
-- Phase 0, Task 5

CREATE TABLE IF NOT EXISTS tender_document_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    vendor_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_requirement_id UUID NOT NULL REFERENCES tender_type_document_requirements(id) ON DELETE CASCADE,
    
    -- File information
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,                         -- Physical path on server
    file_size BIGINT,                                -- File size in bytes
    mime_type TEXT,                                  -- application/pdf, image/jpeg, etc.
    
    -- Upload metadata
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Document status
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints: one submission per vendor per document per tender
    UNIQUE(tender_id, vendor_org_id, document_requirement_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_doc_sub_tender_vendor ON tender_document_submissions(tender_id, vendor_org_id);
CREATE INDEX IF NOT EXISTS idx_doc_sub_requirement ON tender_document_submissions(document_requirement_id);
CREATE INDEX IF NOT EXISTS idx_doc_sub_vendor ON tender_document_submissions(vendor_org_id);
CREATE INDEX IF NOT EXISTS idx_doc_sub_uploaded_at ON tender_document_submissions(uploaded_at DESC);

COMMENT ON TABLE tender_document_submissions IS 'Tracks which documents vendors have uploaded for each tender';
COMMENT ON COLUMN tender_document_submissions.file_path IS 'Server file path, typically /uploads/tender-documents/{tender_id}/{org_id}/{document_id}';
