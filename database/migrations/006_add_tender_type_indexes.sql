-- database/migrations/006_add_tender_type_indexes.sql
-- Description: Performance indexes for tender type tables
-- Phase 7, Task 32

-- Index on tender type code (used in every join)
CREATE INDEX IF NOT EXISTS idx_tenders_tender_type 
ON tenders(tender_type);

-- Index on document requirements tender type
CREATE INDEX IF NOT EXISTS idx_document_requirements_tender_type 
ON tender_type_document_requirements(tender_type_code);

-- Index on document submissions for checklist queries
CREATE INDEX IF NOT EXISTS idx_document_submissions_tender_vendor 
ON tender_document_submissions(tender_id, vendor_org_id);

-- Index on document submissions for requirement lookup
CREATE INDEX IF NOT EXISTS idx_document_submissions_requirement 
ON tender_document_submissions(document_requirement_id);

-- Composite index for common tender queries
CREATE INDEX IF NOT EXISTS idx_tenders_status_type_created 
ON tenders(status, tender_type, created_at DESC);

-- Index for value-based searches
CREATE INDEX IF NOT EXISTS idx_tender_types_value_range 
ON tender_type_definitions(min_value_bdt, max_value_bdt)
WHERE is_active = TRUE;

-- Index for procurement type filtering
CREATE INDEX IF NOT EXISTS idx_tender_types_procurement_type 
ON tender_type_definitions(procurement_type)
WHERE is_active = TRUE;

-- Analyze tables to update statistics
ANALYZE tenders;
ANALYZE tender_type_definitions;
ANALYZE tender_type_document_requirements;
ANALYZE tender_document_submissions;
