-- =====================================================================
-- Migration 017: Add Missing Tables for Testing
-- Uses gen_random_uuid() (pgcrypto) instead of uuid_generate_v4()
-- for compatibility with Neon PostgreSQL
-- =====================================================================

-- 1. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action          TEXT        NOT NULL,
    entity_type     TEXT        NOT NULL,
    entity_id       UUID        NOT NULL,
    metadata        JSONB,
    ip_address      TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. BID FEATURE VALUES
CREATE TABLE IF NOT EXISTS bid_feature_values (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_id          UUID        NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    feature_id      UUID        NOT NULL REFERENCES feature_definitions(id) ON DELETE CASCADE,
    value           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (bid_id, feature_id)
);

-- 3. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    package_type    TEXT        NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'active',
    start_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date        TIMESTAMPTZ,
    auto_renew      BOOLEAN     DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. SUBSCRIPTION USAGE
CREATE TABLE IF NOT EXISTS subscription_usage (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID        NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    metric_name     TEXT        NOT NULL,
    metric_value    INTEGER     NOT NULL DEFAULT 0,
    limit_value     INTEGER,
    period_start    TIMESTAMPTZ NOT NULL DEFAULT now(),
    period_end      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TENDER COMMITTEE MEMBERS
CREATE TABLE IF NOT EXISTS tender_committee_members (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id       UUID        NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT        NOT NULL DEFAULT 'member',
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID        REFERENCES users(id)
);

-- 6. TENDER DOCUMENTS
CREATE TABLE IF NOT EXISTS tender_documents (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id       UUID        NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    document_type   TEXT        NOT NULL,
    file_name       TEXT        NOT NULL,
    file_path       TEXT        NOT NULL,
    file_size       INTEGER     NOT NULL,
    mime_type       TEXT        NOT NULL,
    uploaded_by     UUID        NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TENDER FEATURES
CREATE TABLE IF NOT EXISTS tender_features (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id       UUID        NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    feature_id      UUID        NOT NULL REFERENCES feature_definitions(id) ON DELETE CASCADE,
    is_required     BOOLEAN     NOT NULL DEFAULT TRUE,
    description     TEXT,
    weight          NUMERIC(5,2) DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TENDER WORKFLOW STATES
CREATE TABLE IF NOT EXISTS tender_workflow_states (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id       UUID        NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    current_state   TEXT        NOT NULL DEFAULT 'draft',
    previous_state  TEXT,
    state_reason    TEXT,
    changed_by      UUID        NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone           TEXT,
    address         TEXT,
    city            TEXT,
    region          TEXT,
    postal_code     TEXT,
    country         TEXT,
    designation     TEXT,
    department      TEXT,
    profile_image   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
