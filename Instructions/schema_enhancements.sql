-- =====================================================================
-- RFQ & TENDERING PLATFORM — SCHEMA ENHANCEMENTS v3.0
-- Additional improvements: Full-text search, extensions, partitioning
-- Run after: rfq_tendering_platform_schema_v3.sql
-- =====================================================================

-- =====================================================================
-- SECTION 1: ADDITIONAL EXTENSIONS
-- =====================================================================

-- Full-text search with better language support
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Cryptographic functions for hash generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Better UUID generation (v7 for time-ordered UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fuzzy string matching for vendor/tender search
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- =====================================================================
-- SECTION 2: FULL-TEXT SEARCH INDEXES
-- =====================================================================

-- Add full-text search vector column to tenders
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION tenders_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.tender_number, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.tender_type, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.procurement_type, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
CREATE TRIGGER tr_tenders_search_vector
    BEFORE INSERT OR UPDATE OF tender_number, title, tender_type, procurement_type
    ON tenders
    FOR EACH ROW
    EXECUTE FUNCTION tenders_search_vector_update();

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_tenders_search_vector
    ON tenders USING GIN(search_vector);

-- Trigram index for partial/fuzzy matching
CREATE INDEX IF NOT EXISTS idx_tenders_title_trgm
    ON tenders USING GIN(title gin_trgm_ops);

-- Add full-text search to tender_items
ALTER TABLE tender_items ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION tender_items_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.item_code, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.item_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.specification, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tender_items_search_vector
    BEFORE INSERT OR UPDATE OF item_code, item_name, specification
    ON tender_items
    FOR EACH ROW
    EXECUTE FUNCTION tender_items_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_tender_items_search_vector
    ON tender_items USING GIN(search_vector);

-- Add full-text search to vendor_profiles
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION vendor_profiles_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.legal_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.contact_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.website, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_vendor_profiles_search_vector
    BEFORE INSERT OR UPDATE OF legal_name, contact_name, website
    ON vendor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION vendor_profiles_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_search_vector
    ON vendor_profiles USING GIN(search_vector);

-- =====================================================================
-- SECTION 3: SEARCH FUNCTIONS
-- =====================================================================

-- Search tenders with ranking
CREATE OR REPLACE FUNCTION search_tenders(
    search_query TEXT,
    org_id UUID DEFAULT NULL,
    status_filter TEXT[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    tender_id UUID,
    tender_number TEXT,
    title TEXT,
    status TEXT,
    submission_deadline TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.tender_number,
        t.title,
        t.status,
        t.submission_deadline,
        ts_rank(t.search_vector, websearch_to_tsquery('english', search_query)) as rank
    FROM tenders t
    WHERE
        (search_query IS NULL OR t.search_vector @@ websearch_to_tsquery('english', search_query))
        AND (org_id IS NULL OR t.buyer_org_id = org_id)
        AND (status_filter IS NULL OR t.status = ANY(status_filter))
    ORDER BY rank DESC, t.submission_deadline DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Search vendors with fuzzy matching
CREATE OR REPLACE FUNCTION search_vendors(
    search_query TEXT,
    category_ids UUID[] DEFAULT NULL,
    status_filter TEXT DEFAULT 'approved',
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    vendor_org_id UUID,
    legal_name TEXT,
    status TEXT,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        vp.organization_id,
        vp.legal_name,
        vp.status,
        similarity(vp.legal_name, search_query) as similarity_score
    FROM vendor_profiles vp
    LEFT JOIN vendor_categories vc ON vc.vendor_org_id = vp.organization_id
    WHERE
        (search_query IS NULL OR
         vp.search_vector @@ websearch_to_tsquery('english', search_query) OR
         similarity(vp.legal_name, search_query) > 0.3)
        AND (category_ids IS NULL OR vc.category_id = ANY(category_ids))
        AND (status_filter IS NULL OR vp.status = status_filter)
    ORDER BY similarity_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SECTION 4: AUDIT LOG PARTITIONING (for high-volume systems)
-- =====================================================================

-- Note: This requires recreating the audit_logs table
-- Only apply if expecting >1M audit records/month

-- Create partitioned audit_logs table
-- CREATE TABLE audit_logs_partitioned (
--     id          UUID        DEFAULT uuid_generate_v4(),
--     actor_id    UUID        REFERENCES users(id),
--     action      TEXT        NOT NULL,
--     entity_type TEXT        NOT NULL,
--     entity_id   UUID        NOT NULL,
--     metadata    JSONB,
--     created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
--     PRIMARY KEY (id, created_at)
-- ) PARTITION BY RANGE (created_at);

-- Create partitions for each month
-- CREATE TABLE audit_logs_y2026m01 PARTITION OF audit_logs_partitioned
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- CREATE TABLE audit_logs_y2026m02 PARTITION OF audit_logs_partitioned
--     FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... continue for each month

-- =====================================================================
-- SECTION 5: MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================================================

-- Dashboard statistics view (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_stats AS
SELECT
    -- Tender statistics
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'published') as active_tenders,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'draft') as draft_tenders,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'awarded') as awarded_tenders,
    COUNT(DISTINCT t.id) FILTER (WHERE t.created_at >= NOW() - INTERVAL '30 days') as new_tenders_30d,

    -- Bid statistics
    COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'submitted') as submitted_bids,
    COUNT(DISTINCT b.id) FILTER (WHERE b.created_at >= NOW() - INTERVAL '30 days') as new_bids_30d,

    -- Vendor statistics
    COUNT(DISTINCT vp.organization_id) FILTER (WHERE vp.status = 'approved') as approved_vendors,
    COUNT(DISTINCT vp.organization_id) FILTER (WHERE vp.status = 'pending') as pending_vendors,

    -- Award statistics
    COALESCE(SUM(a.awarded_price), 0) as total_awarded_value,
    COALESCE(SUM(a.awarded_price) FILTER (WHERE a.awarded_at >= NOW() - INTERVAL '30 days'), 0) as awarded_value_30d,

    NOW() as refreshed_at
FROM tenders t
CROSS JOIN bids b
CROSS JOIN vendor_profiles vp
CROSS JOIN awards a;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_stats_refresh
    ON mv_dashboard_stats(refreshed_at);

-- Tender performance metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_tender_metrics AS
SELECT
    t.id as tender_id,
    t.tender_number,
    t.title,
    t.buyer_org_id,
    t.status,
    t.submission_deadline,
    t.created_at,
    COUNT(DISTINCT b.vendor_org_id) as total_bidders,
    COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'submitted') as submitted_bids,
    MIN(b.total_amount) FILTER (WHERE b.status = 'submitted') as lowest_bid,
    MAX(b.total_amount) FILTER (WHERE b.status = 'submitted') as highest_bid,
    AVG(b.total_amount) FILTER (WHERE b.status = 'submitted') as avg_bid,
    COUNT(DISTINCT cq.id) as clarification_count,
    COUNT(DISTINCT ad.id) as addendum_count,
    EXTRACT(EPOCH FROM (t.submission_deadline - t.created_at)) / 86400 as tender_duration_days
FROM tenders t
LEFT JOIN bids b ON b.tender_id = t.id
LEFT JOIN clarification_questions cq ON cq.tender_id = t.id
LEFT JOIN addenda ad ON ad.tender_id = t.id
GROUP BY t.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_tender_metrics_id
    ON mv_tender_metrics(tender_id);

-- Vendor performance metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_vendor_metrics AS
SELECT
    o.id as vendor_org_id,
    o.name as vendor_name,
    vp.status as vendor_status,
    COUNT(DISTINCT b.tender_id) as tenders_participated,
    COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'submitted') as bids_submitted,
    COUNT(DISTINCT a.tender_id) as tenders_won,
    COALESCE(SUM(a.awarded_price), 0) as total_awarded_value,
    CASE
        WHEN COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'submitted') > 0
        THEN ROUND(COUNT(DISTINCT a.tender_id)::NUMERIC /
             COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'submitted') * 100, 2)
        ELSE 0
    END as win_rate_percent,
    AVG(e.technical_score) as avg_technical_score,
    MIN(b.created_at) as first_bid_date,
    MAX(b.submitted_at) as last_bid_date
FROM organizations o
JOIN vendor_profiles vp ON vp.organization_id = o.id
LEFT JOIN bids b ON b.vendor_org_id = o.id
LEFT JOIN awards a ON a.bid_id = b.id
LEFT JOIN evaluations e ON e.bid_id = b.id
WHERE o.type IN ('vendor', 'both')
GROUP BY o.id, o.name, vp.status;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_vendor_metrics_id
    ON mv_vendor_metrics(vendor_org_id);

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tender_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vendor_metrics;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SECTION 6: HELPER FUNCTIONS
-- =====================================================================

-- Generate SHA-256 hash for bid integrity verification
CREATE OR REPLACE FUNCTION generate_bid_hash(bid_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    bid_data TEXT;
    hash_result TEXT;
BEGIN
    SELECT
        b.id::TEXT || '|' ||
        b.tender_id::TEXT || '|' ||
        b.vendor_org_id::TEXT || '|' ||
        b.version::TEXT || '|' ||
        COALESCE(b.total_amount::TEXT, 'null') || '|' ||
        (
            SELECT STRING_AGG(
                bi.tender_item_id::TEXT || ':' ||
                COALESCE(bi.unit_price::TEXT, 'null') || ':' ||
                COALESCE(bi.compliance, 'null'),
                ','
                ORDER BY bi.tender_item_id
            )
            FROM bid_items bi
            WHERE bi.bid_id = b.id
        )
    INTO bid_data
    FROM bids b
    WHERE b.id = bid_id_param;

    hash_result := encode(digest(bid_data, 'sha256'), 'hex');

    RETURN hash_result;
END;
$$ LANGUAGE plpgsql;

-- Validate bid hash on retrieval
CREATE OR REPLACE FUNCTION validate_bid_hash(bid_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
    computed_hash TEXT;
BEGIN
    SELECT digital_hash INTO stored_hash
    FROM bids
    WHERE id = bid_id_param;

    computed_hash := generate_bid_hash(bid_id_param);

    RETURN stored_hash = computed_hash;
END;
$$ LANGUAGE plpgsql;

-- Generate hierarchical BOQ report using recursive CTE
CREATE OR REPLACE FUNCTION get_tender_boq_hierarchy(tender_id_param UUID)
RETURNS TABLE (
    item_id UUID,
    parent_id UUID,
    level INTEGER,
    path TEXT,
    sl_no INTEGER,
    item_type TEXT,
    item_code TEXT,
    item_name TEXT,
    specification TEXT,
    quantity NUMERIC,
    uom TEXT,
    estimated_cost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE item_tree AS (
        -- Base case: root items (no parent)
        SELECT
            ti.id,
            ti.parent_item_id,
            1 as level,
            ti.sl_no::TEXT as path,
            ti.sl_no,
            ti.item_type,
            ti.item_code,
            ti.item_name,
            ti.specification,
            ti.quantity,
            ti.uom,
            ti.estimated_cost
        FROM tender_items ti
        WHERE ti.tender_id = tender_id_param
        AND ti.parent_item_id IS NULL

        UNION ALL

        -- Recursive case: child items
        SELECT
            ti.id,
            ti.parent_item_id,
            it.level + 1,
            it.path || '.' || ti.sl_no::TEXT,
            ti.sl_no,
            ti.item_type,
            ti.item_code,
            ti.item_name,
            ti.specification,
            ti.quantity,
            ti.uom,
            ti.estimated_cost
        FROM tender_items ti
        JOIN item_tree it ON ti.parent_item_id = it.id
        WHERE ti.tender_id = tender_id_param
    )
    SELECT
        it.id,
        it.parent_item_id,
        it.level,
        it.path,
        it.sl_no,
        it.item_type,
        it.item_code,
        it.item_name,
        it.specification,
        it.quantity,
        it.uom,
        it.estimated_cost
    FROM item_tree it
    ORDER BY it.path;
END;
$$ LANGUAGE plpgsql;

-- Get comparative bid analysis for a tender
CREATE OR REPLACE FUNCTION get_bid_comparison(tender_id_param UUID)
RETURNS TABLE (
    tender_item_id UUID,
    item_name TEXT,
    quantity NUMERIC,
    uom TEXT,
    vendor_org_id UUID,
    vendor_name TEXT,
    unit_price NUMERIC,
    item_total NUMERIC,
    compliance TEXT,
    rank_by_price INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ti.id as tender_item_id,
        ti.item_name,
        ti.quantity,
        ti.uom,
        b.vendor_org_id,
        o.name as vendor_name,
        bi.unit_price,
        bi.item_total_price as item_total,
        bi.compliance,
        RANK() OVER (
            PARTITION BY ti.id
            ORDER BY bi.unit_price ASC NULLS LAST
        )::INTEGER as rank_by_price
    FROM tender_items ti
    JOIN bids b ON b.tender_id = ti.tender_id AND b.status = 'submitted'
    JOIN bid_items bi ON bi.bid_id = b.id AND bi.tender_item_id = ti.id
    JOIN bid_envelopes be ON be.bid_id = b.id AND be.envelope_type = 'commercial' AND be.is_open = TRUE
    JOIN organizations o ON o.id = b.vendor_org_id
    WHERE ti.tender_id = tender_id_param
    AND ti.item_type = 'item'
    ORDER BY ti.sl_no, bi.unit_price ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SECTION 7: SOFT DELETE SUPPORT
-- =====================================================================

-- Add soft delete columns to key tables
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tender_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_tenders_active
    ON tenders(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tender_items_active
    ON tender_items(tender_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bids_active
    ON bids(tender_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_active
    ON vendor_profiles(organization_id) WHERE deleted_at IS NULL;

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SECTION 8: PERFORMANCE MONITORING
-- =====================================================================

-- Table to track slow queries and performance issues
CREATE TABLE IF NOT EXISTS query_performance_log (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_text  TEXT        NOT NULL,
    duration_ms NUMERIC     NOT NULL,
    user_id     UUID        REFERENCES users(id),
    context     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for analyzing slow queries
CREATE INDEX IF NOT EXISTS idx_query_performance_duration
    ON query_performance_log(duration_ms DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_created
    ON query_performance_log(created_at DESC);

-- =====================================================================
-- SECTION 9: TABLE COMMENTS (Documentation)
-- =====================================================================

COMMENT ON TABLE organizations IS 'Legal entities that can act as buyers, vendors, or both. Core tenant entity for multi-tenant isolation.';
COMMENT ON COLUMN organizations.type IS 'Organization type: buyer (procuring entity), vendor (supplier), or both (dual-role organizations)';

COMMENT ON TABLE users IS 'User accounts with RBAC multi-role support. Users belong to one organization.';
COMMENT ON COLUMN users.roles IS 'Array of roles: admin, buyer, vendor, evaluator. Single user can have multiple roles.';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash with cost factor ≥ 12';

COMMENT ON TABLE tenders IS 'Main tender header table. Contains all tender metadata and lifecycle state.';
COMMENT ON COLUMN tenders.visibility IS 'open: any approved vendor can bid; limited: only invited vendors';
COMMENT ON COLUMN tenders.price_basis IS 'unit_rate: price per unit qty; lump_sum: fixed total price';
COMMENT ON COLUMN tenders.fund_allocation IS 'Buyer''s hidden budget estimate - never exposed to vendors';

COMMENT ON TABLE tender_items IS 'Bill of Quantities (BOQ) with hierarchical support. parent_item_id enables nested grouping.';
COMMENT ON COLUMN tender_items.item_type IS 'group: container for child items; item: priced line item';
COMMENT ON COLUMN tender_items.estimated_cost IS 'Buyer estimate - hidden from vendors during bidding';

COMMENT ON TABLE bids IS 'Vendor bid submissions with versioning. Multiple versions allowed per vendor per tender.';
COMMENT ON COLUMN bids.version IS 'Increments on each resubmission. Latest submitted version is active bid.';
COMMENT ON COLUMN bids.digital_hash IS 'SHA-256 hash of bid content for integrity verification';
COMMENT ON COLUMN bids.compliance_status IS 'Overall bid compliance: compliant, non_compliant, partial';

COMMENT ON TABLE bid_envelopes IS 'Two-envelope system: technical (specs) and commercial (prices) are separated.';
COMMENT ON COLUMN bid_envelopes.is_open IS 'FALSE until envelope is officially opened by buyer committee';

COMMENT ON TABLE evaluations IS 'Bid evaluation scores by evaluator. Multiple evaluators possible per bid.';
COMMENT ON COLUMN evaluations.is_technically_qualified IS 'TRUE if technical_score >= threshold defined in tender';

COMMENT ON TABLE awards IS 'Partial or full award records. One tender item can be split across multiple vendors.';
COMMENT ON COLUMN awards.awarded_quantity IS 'Must be ≤ tender_item.quantity. Enables partial awards.';

COMMENT ON TABLE audit_logs IS 'Immutable append-only audit trail. REVOKE UPDATE/DELETE from app service account.';

-- =====================================================================
-- END SCHEMA ENHANCEMENTS v3.0
-- =====================================================================
