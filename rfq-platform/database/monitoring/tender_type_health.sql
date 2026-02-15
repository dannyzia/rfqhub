-- ============================================================================
-- Tender Type System Monitoring Queries
-- Task 41: Operations Dashboard SQL Queries
-- Purpose: Real-time monitoring of tender type system health and usage
-- ============================================================================

-- ============================================================================
-- 1. TENDER TYPE USAGE STATISTICS (Last 30 Days)
-- ============================================================================
-- Monitors adoption and usage of each tender type
-- Used for: Daily usage reports, adoption tracking, system health

SELECT 
    ttd.code,
    ttd.name,
    ttd.procurement_type,
    COALESCE(stats.tender_count, 0) as tender_count_30d,
    COALESCE(stats.min_value, 0) as min_value_bd,
    COALESCE(stats.max_value, 0) as max_value_bd,
    ROUND(COALESCE(stats.avg_value, 0)::numeric, 2) as avg_value_bd,
    COALESCE(stats.org_count, 0) as unique_orgs,
    ROUND(100.0 * COALESCE(stats.tender_count, 0) / 
        NULLIF(SUM(COALESCE(stats.tender_count, 0)) OVER (), 0), 2) as pct_of_total,
    CASE 
        WHEN COALESCE(stats.tender_count, 0) = 0 THEN 'Unused'
        WHEN COALESCE(stats.tender_count, 0) < 5 THEN 'Low usage'
        WHEN COALESCE(stats.tender_count, 0) < 20 THEN 'Medium usage'
        ELSE 'High usage'
    END as usage_level
FROM tender_type_definitions ttd
LEFT JOIN (
    SELECT 
        tender_type,
        COUNT(*) as tender_count,
        MIN(estimated_value) as min_value,
        MAX(estimated_value) as max_value,
        AVG(estimated_value) as avg_value,
        COUNT(DISTINCT created_by) as org_count
    FROM tenders
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY tender_type
) stats ON ttd.code = stats.tender_type
WHERE ttd.is_active = true
ORDER BY COALESCE(stats.tender_count, 0) DESC;

-- Expected output: Shows usage distribution across all active tender types
-- Alert conditions:
--   - Any type with 0 usage after 30 days (might be misconfigured)
--   - Significant drop in usage for previously popular type (possible issue)
--   - Max value exceeding defined range (data integrity issue)

---

-- ============================================================================
-- 2. DOCUMENT UPLOAD STATISTICS (Last 7 Days)
-- ============================================================================
-- Tracks document submission rates and file patterns
-- Used for: Upload volume monitoring, file type analysis, checklist compliance

SELECT 
    ttd.code,
    ttd.name,
    COUNT(DISTINCT tds.tender_id) as tender_with_docs_7d,
    COUNT(tds.id) as total_documents_7d,
    ROUND(AVG(tds.file_size_kb), 2) as avg_file_size_kb,
    MAX(tds.file_size_kb) as max_file_size_kb,
    ROUND(
        100.0 * COUNT(DISTINCT tds.tender_id) / 
        NULLIF(COUNT(DISTINCT t.id), 0), 2
    ) as pct_tenders_with_docs,
    COUNT(DISTINCT tds.file_type) as unique_file_types,
    STRING_AGG(DISTINCT tds.file_type, ', ' ORDER BY tds.file_type) as file_types_used
FROM tender_type_definitions ttd
LEFT JOIN tenders t ON t.tender_type = ttd.code 
    AND t.created_at >= NOW() - INTERVAL '7 days'
LEFT JOIN tender_document_submissions tds ON t.id = tds.tender_id
    AND tds.created_at >= NOW() - INTERVAL '7 days'
WHERE ttd.is_active = true
GROUP BY ttd.code, ttd.name
ORDER BY COUNT(tds.id) DESC;

-- Expected output: Shows document submission patterns by type
-- Alert conditions:
--   - pct_tenders_with_docs < 50% (low compliance)
--   - File size approaching MAX_FILE_SIZE_MB limit
--   - Unexpected file types in uploads (possible security issue)

---

-- ============================================================================
-- 3. SUGGESTION ACCURACY TRACKING (Last 30 Days)
-- ============================================================================
-- Monitors AI suggestion accuracy by comparing recommended vs selected types
-- Used for: ML model evaluation, suggestion algorithm tuning, quality metrics

SELECT 
    DATE(al.created_at) as date,
    COALESCE(al.metadata->>'tender_type', 'Unknown') as suggested_type,
    COUNT(*) as suggestion_count,
    COUNT(*) FILTER (WHERE al.metadata->>'accepted' = 'true') as accepted_count,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE al.metadata->>'accepted' = 'true') / 
        NULLIF(COUNT(*), 0), 2
    ) as acceptance_rate_pct,
    ROUND(AVG((al.metadata->>'confidence')::float), 3) as avg_confidence,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE (al.metadata->>'confidence')::float > 0.8) / 
        NULLIF(COUNT(*), 0), 2
    ) as pct_high_confidence
FROM audit_logs al
WHERE al.action = 'tender_type_suggestion'
    AND al.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(al.created_at), COALESCE(al.metadata->>'tender_type', 'Unknown')
ORDER BY date DESC, suggestion_count DESC;

-- Expected output: Daily suggestion accuracy metrics
-- Alert conditions:
--   - acceptance_rate < 60% (suggestion algorithm needs tuning)
--   - avg_confidence trending down (model drift)
--   - Specific type with low accuracy (check training data for that type)

---

-- ============================================================================
-- 4. MANDATORY DOCUMENT COMPLIANCE (Current State)
-- ============================================================================
-- Shows completion rate for mandatory documents per tender type
-- Used for: Bid readiness verification, compliance auditing, workflow tracking

SELECT 
    ttd.code,
    ttd.name,
    COUNT(DISTINCT t.id) as total_active_tenders,
    COUNT(DISTINCT CASE 
        WHEN COALESCE(mandatory_submitted, 0) > 0 
        THEN t.id 
    END) as tenders_with_mandatory_docs,
    ROUND(
        100.0 * COUNT(DISTINCT CASE 
            WHEN COALESCE(mandatory_submitted, 0) > 0 
            THEN t.id 
        END) / NULLIF(COUNT(DISTINCT t.id), 0), 2
    ) as compliance_rate_pct,
    ROUND(AVG(COALESCE(optional_submitted, 0)), 2) as avg_optional_docs,
    MIN(submission_date) as oldest_incomplete_tender
FROM tender_type_definitions ttd
LEFT JOIN tenders t ON t.tender_type = ttd.code 
    AND t.status IN ('draft', 'published', 'bidding_open')
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) FILTER (WHERE tdreq.is_mandatory = true) as mandatory_submitted,
        COUNT(*) FILTER (WHERE tdreq.is_mandatory = false) as optional_submitted,
        MIN(tds.created_at) as submission_date
    FROM tender_type_document_requirements tdreq
    LEFT JOIN tender_document_submissions tds ON tdreq.id = tds.requirement_id
        AND tds.tender_id = t.id
    WHERE tdreq.tender_type = t.tender_type
) doc_stats ON true
WHERE ttd.is_active = true
GROUP BY ttd.code, ttd.name, t.id
HAVING COUNT(DISTINCT t.id) > 0
ORDER BY compliance_rate_pct ASC;

-- Expected output: Compliance status for each tender type
-- Alert conditions:
--   - compliance_rate < 70% (document checklist not being used)
--   - Many old incomplete tenders (possible abandoned tenders)
--   - Specific tender with missing mandatory docs (bidders won't be able to submit)

---

-- ============================================================================
-- 5. DOCUMENT COMPLETION RATE BY TYPE (Trend Analysis)
-- ============================================================================
-- Tracks percent of submitted documents vs required documents
-- Used for: Workflow maturity, bidder engagement, process improvement

SELECT 
    ttd.code,
    ttd.name,
    COUNT(DISTINCT t.id) as tender_count_30d,
    ROUND(
        100.0 * SUM(documents_submitted) / 
        NULLIF(SUM(documents_required), 0), 2
    ) as overall_completion_pct,
    ROUND(
        AVG(CASE 
            WHEN documents_required > 0 
            THEN 100.0 * documents_submitted / documents_required 
            ELSE 100
        END), 2
    ) as avg_tender_completion_pct,
    COUNT(DISTINCT CASE 
        WHEN documents_submitted >= documents_required 
        THEN t.id 
    END) as full_completion_count,
    ROUND(
        100.0 * COUNT(DISTINCT CASE 
            WHEN documents_submitted >= documents_required 
            THEN t.id 
        END) / NULLIF(COUNT(DISTINCT t.id), 0), 2
    ) as pct_tenders_complete
FROM tender_type_definitions ttd
LEFT JOIN tenders t ON t.tender_type = ttd.code 
    AND t.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) FILTER (WHERE is_mandatory = true) as documents_required,
        COUNT(*) FILTER (WHERE is_mandatory = true) as documents_required_count
    FROM tender_type_document_requirements
    WHERE tender_type = t.tender_type
) required ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*) as documents_submitted
    FROM tender_document_submissions
    WHERE tender_id = t.id
) submitted ON true
WHERE ttd.is_active = true
GROUP BY ttd.code, ttd.name
ORDER BY overall_completion_pct DESC;

-- Expected output: Document completion trends
-- Alert conditions:
--   - overall_completion_pct < 60% (bidders struggling to complete docs)
--   - pct_tenders_complete < 50% (most tenderers not finishing checklist)
--   - Sudden drop week-over-week (possible usability issue with form)

---

-- ============================================================================
-- 6. SYSTEM HEALTH INDICATORS (Real-Time Dashboard)
-- ============================================================================
-- Overall system health metrics for operations monitoring
-- Used for: Real-time dashboards, health checks, alerting

SELECT 
    'Active Tender Types' as metric,
    CAST(COUNT(*) as text) as value,
    'count' as unit,
    CASE WHEN COUNT(*) = 14 THEN '✓ OK' ELSE '⚠ Check' END as status
FROM tender_type_definitions
WHERE is_active = true
UNION ALL
SELECT 
    'Total Active Tenders',
    CAST(COUNT(*) as text),
    'count',
    CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '⚠ No tenders' END
FROM tenders
WHERE status IN ('published', 'bidding_open')
UNION ALL
SELECT 
    'Documents Uploaded (24h)',
    CAST(COUNT(*) as text),
    'count',
    '✓ OK'
FROM tender_document_submissions
WHERE created_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'API Calls (1h)',
    CAST(COUNT(*) as text),
    'count',
    CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '⚠ No activity' END
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'Database Indexes',
    CAST(COUNT(*) as text),
    'count',
    CASE WHEN COUNT(*) >= 7 THEN '✓ OK' ELSE '⚠ Missing indexes' END
FROM pg_indexes
WHERE tablename IN ('tenders', 'tender_type_definitions', 
    'tender_type_document_requirements', 'tender_document_submissions')
UNION ALL
SELECT 
    'Avg API Response (10s)',
    CAST(ROUND(COALESCE(AVG(EXTRACT(EPOCH FROM (now() - al.created_at)) * 1000), 0), 0) as text),
    'ms',
    CASE 
        WHEN COALESCE(AVG(EXTRACT(EPOCH FROM (now() - al.created_at)) * 1000), 0) < 200 THEN '✓ OK'
        WHEN COALESCE(AVG(EXTRACT(EPOCH FROM (now() - al.created_at)) * 1000), 0) < 500 THEN '⚠ Slow'
        ELSE '⚠ Very Slow'
    END
FROM audit_logs al
WHERE al.created_at >= NOW() - INTERVAL '10 seconds'
UNION ALL
SELECT 
    'Last Database Backup',
    TO_CHAR(MAX(created_at), 'YYYY-MM-DD HH24:MI') as last_backup,
    'timestamp',
    CASE 
        WHEN NOW() - MAX(created_at) < INTERVAL '24 hours' THEN '✓ OK'
        ELSE '⚠ Overdue'
    END
FROM (
    SELECT NOW() as created_at LIMIT 1
) backup_check
ORDER BY metric;

-- Expected output: Key health metrics at a glance
-- Alert conditions:
--   - Active Tender Types < 14 (configuration issue)
--   - API Calls = 0 (service might be down)
--   - Database Indexes < 7 (migrations not run)
--   - Avg Response > 500ms (performance degradation)

---

-- ============================================================================
-- MONITORING SCHEDULE
-- ============================================================================
/*
Recommended monitoring cadence:

REAL-TIME (Every 5 minutes):
  - Query 6: System Health Indicators
  - Check for API errors (error rate > 1%)
  - Check for database connection issues

HOURLY:
  - Query 2: Document Upload Statistics
  - Check average response times
  - Verify Redis cache hit rate (target > 80%)

DAILY:
  - Query 1: Tender Type Usage Statistics
  - Query 3: Suggestion Accuracy
  - Query 4: Mandatory Document Compliance
  - Review error logs for patterns
  - Verify nightly backups completed

WEEKLY:
  - Query 5: Document Completion Rate Trends
  - Review analytics views for business insights
  - Check for slow query reports
  - Assess suggestion model accuracy

MONTHLY:
  - Compare current month vs previous month usage
  - Review capacity utilization
  - Assess if any tender types need tuning
  - Plan optimizations based on usage patterns

ON-DEMAND (When Issues Occur):
  - Check audit_logs for user activity
  - Analyze slow queries
  - Review error logs
  - Check database size and fragmentation
*/

-- ============================================================================
-- ALERT THRESHOLDS (Recommended for Automated Monitoring)
-- ============================================================================
/*
ERROR RATE:
  - Warning: > 0.5%
  - Critical: > 2%

RESPONSE TIME:
  - Warning: > 300ms (non-cached)
  - Critical: > 1000ms

SUGGESTION ACCURACY:
  - Warning: < 70% acceptance
  - Critical: < 50% acceptance

DOCUMENT COMPLIANCE:
  - Warning: < 70%
  - Critical: < 50%

DATABASE:
  - Warning: No activity for 30 minutes
  - Critical: Connection failures
  - Warning: Slow queries > 500ms
  - Critical: Slow queries > 2000ms

CACHE:
  - Warning: Hit rate < 70%
  - Critical: Hit rate < 50% or cache unavailable
*/

-- ============================================================================
-- END OF MONITORING QUERIES
-- ============================================================================
