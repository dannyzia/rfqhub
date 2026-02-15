-- database/views/tender_type_analytics.sql
-- Description: Analytics views for tender type usage
-- Phase 7, Task 34

-- View: Tender type usage statistics
CREATE OR REPLACE VIEW v_tender_type_usage AS
SELECT 
  ttd.code,
  ttd.name,
  ttd.procurement_type,
  COUNT(DISTINCT t.id) as tender_count,
  COUNT(DISTINCT CASE WHEN t.status = 'published' THEN t.id END) as published_count,
  COUNT(DISTINCT CASE WHEN t.status = 'awarded' THEN t.id END) as awarded_count,
  AVG(t.estimated_cost) as avg_estimated_cost,
  MIN(t.estimated_cost) as min_estimated_cost,
  MAX(t.estimated_cost) as max_estimated_cost,
  SUM(t.estimated_cost) as total_value
FROM tender_type_definitions ttd
LEFT JOIN tenders t ON t.tender_type = ttd.code
WHERE ttd.is_active = TRUE
GROUP BY ttd.code, ttd.name, ttd.procurement_type
ORDER BY tender_count DESC;

-- View: Document compliance rates
CREATE OR REPLACE VIEW v_document_compliance AS
SELECT 
  t.tender_type,
  COUNT(DISTINCT t.id) as tender_count,
  COUNT(DISTINCT tds.vendor_org_id) as participating_vendors,
  COUNT(tds.id) as total_submissions,
  COUNT(DISTINCT CASE WHEN ttdr.is_mandatory THEN ttdr.id END) as mandatory_requirements,
  ROUND(
    (COUNT(DISTINCT CASE WHEN ttdr.is_mandatory AND tds.verification_status = 'approved' THEN tds.id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT CASE WHEN ttdr.is_mandatory THEN ttdr.id END), 0)) * 100,
    2
  ) as compliance_rate_percent
FROM tenders t
LEFT JOIN tender_document_submissions tds ON tds.tender_id = t.id
LEFT JOIN tender_type_document_requirements ttdr ON ttdr.id = tds.document_requirement_id
WHERE t.status IN ('published', 'closed', 'awarded')
GROUP BY t.tender_type
ORDER BY compliance_rate_percent DESC NULLS LAST;

-- View: Tender type suggestion accuracy (if audit_logs table exists)
-- This view tracks if suggested tender types match actual selections
CREATE OR REPLACE VIEW v_suggestion_accuracy AS
SELECT 
  DATE_TRUNC('month', al.created_at)::DATE as month,
  al.metadata->>'suggested' as suggested_type,
  COUNT(*) as suggestion_count,
  COUNT(CASE 
    WHEN t.tender_type = al.metadata->>'suggested' 
    THEN 1 
  END) as actually_used_count,
  ROUND(
    (COUNT(CASE WHEN t.tender_type = al.metadata->>'suggested' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0)) * 100,
    2
  ) as accuracy_percent
FROM audit_logs al
LEFT JOIN tenders t ON t.created_by = al.user_id 
  AND t.created_at BETWEEN al.created_at AND al.created_at + INTERVAL '1 hour'
WHERE al.action = 'TENDER_TYPE_SUGGESTED'
  AND al.created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', al.created_at), al.metadata->>'suggested'
ORDER BY month DESC, suggestion_count DESC;

-- View: Document completion rate by tender type
CREATE OR REPLACE VIEW v_document_completion_rate AS
SELECT 
  t.tender_type,
  COUNT(DISTINCT t.id) as total_tenders,
  COUNT(DISTINCT CASE 
    WHEN (SELECT COUNT(*) FROM tender_document_submissions tds2 
          WHERE tds2.tender_id = t.id 
          AND tds2.verification_status = 'approved') >= 
         (SELECT COUNT(*) FROM tender_type_document_requirements ttdr2 
          WHERE ttdr2.tender_type_code = t.tender_type 
          AND ttdr2.is_mandatory)
    THEN t.id 
  END) as completed_tenders,
  ROUND(
    (COUNT(DISTINCT CASE 
      WHEN (SELECT COUNT(*) FROM tender_document_submissions tds2 
            WHERE tds2.tender_id = t.id 
            AND tds2.verification_status = 'approved') >= 
           (SELECT COUNT(*) FROM tender_type_document_requirements ttdr2 
            WHERE ttdr2.tender_type_code = t.tender_type 
            AND ttdr2.is_mandatory)
      THEN t.id 
    END)::NUMERIC / NULLIF(COUNT(DISTINCT t.id), 0)) * 100,
    2
  ) as completion_rate_percent
FROM tenders t
WHERE t.status IN ('published', 'closed', 'awarded')
GROUP BY t.tender_type
ORDER BY completion_rate_percent DESC NULLS LAST;
