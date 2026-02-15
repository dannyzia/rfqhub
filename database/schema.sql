-- =====================================================================
-- RFQ & TENDERING PLATFORM — COMPLETE ENTERPRISE SCHEMA v3.0
-- Fully aligned to Technical PRD v3.0 (February 2026)
-- Target: PostgreSQL 16+
-- =====================================================================
-- Why PostgreSQL (kept as primary):
--   • JSONB with GIN indexes        → feature search in sub-ms
--   • Row-Level Security (RLS)      → multi-tenant isolation at DB layer
--   • Point-In-Time Recovery (PITR) → 7-day rollback, required by §17.2
--   • Recursive CTEs                → hierarchical BoM queries natively
--   • TIMESTAMPTZ                   → audit precision without app-layer tz bugs
-- No other single RDBMS satisfies all five constraints together.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. ORGANIZATIONS & USERS
-- =====================================================================
-- organizations.type allows 'both' so one legal entity can act as
-- buyer on one tender and vendor on another (common in large groups).

CREATE TABLE organizations (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT        NOT NULL,
    type        TEXT        NOT NULL CHECK (type IN ('buyer','vendor','both')),
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- users.role is stored as an ARRAY so a single account can carry
-- multiple roles (e.g., admin + buyer) as stated in PRD §3.
CREATE TABLE users (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID        REFERENCES organizations(id),
    name            TEXT        NOT NULL,
    email           TEXT        UNIQUE NOT NULL,
    password_hash   TEXT        NOT NULL,                          -- bcrypt, cost ≥ 12
    roles           TEXT[]      NOT NULL DEFAULT '{"vendor"}',     -- RBAC multi-role
    is_active       BOOLEAN     DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 2. MASTER / REFERENCE TABLES
-- =====================================================================

CREATE TABLE uom_master (
    code        TEXT PRIMARY KEY,
    description TEXT
);

CREATE TABLE currency_master (
    code CHAR(3) PRIMARY KEY,  -- ISO 4217
    name TEXT NOT NULL
);

CREATE TABLE tender_status_master (
    code TEXT PRIMARY KEY
    -- Seed: draft, published, clarification, closed,
    --       tech_eval, comm_eval, awarded, cancelled
);

CREATE TABLE tender_type_master (
    code TEXT PRIMARY KEY
    -- Seed: RFQ, TENDER
);

CREATE TABLE feature_type_master (
    code TEXT PRIMARY KEY
    -- Seed: single_select, multi_select, text, numeric, boolean
);

CREATE TABLE envelope_type_master (
    code TEXT PRIMARY KEY
    -- Seed: technical, commercial
);

CREATE TABLE categories_master (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

-- =====================================================================
-- 3. TENDERS (HEADER)
-- =====================================================================

CREATE TABLE tenders (
    id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_number        TEXT        NOT NULL,
    buyer_org_id         UUID        NOT NULL REFERENCES organizations(id),
    title                TEXT        NOT NULL,
    tender_type          TEXT        NOT NULL REFERENCES tender_type_master(code),
    visibility           TEXT        NOT NULL CHECK (visibility IN ('open','limited')),
    procurement_type     TEXT        NOT NULL CHECK (procurement_type IN ('goods','works','services')),  -- §4.1
    currency             CHAR(3)     NOT NULL REFERENCES currency_master(code),
    price_basis          TEXT        NOT NULL DEFAULT 'unit_rate'
                                     CHECK (price_basis IN ('unit_rate','lump_sum')),                     -- §4.1
    fund_allocation      NUMERIC(18,2),                                         -- buyer's hidden budget
    bid_security_amount  NUMERIC(18,2),                                         -- EMD; NULL = not required  §4.1
    pre_bid_meeting_date TIMESTAMPTZ,                                           -- §4.1
    pre_bid_meeting_link TEXT,                                                  -- §4.1
    submission_deadline  TIMESTAMPTZ NOT NULL,
    bid_opening_time     TIMESTAMPTZ,                                           -- NULL = manual open
    validity_days        INTEGER     NOT NULL DEFAULT 90,
    status               TEXT        NOT NULL DEFAULT 'draft'
                                     REFERENCES tender_status_master(code),
    created_by           UUID        NOT NULL REFERENCES users(id),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),                    -- §4.1
    UNIQUE (buyer_org_id, tender_number)
);

CREATE TABLE tender_terms (
    tender_id       UUID PRIMARY KEY REFERENCES tenders(id) ON DELETE CASCADE,
    payment_terms   TEXT,
    delivery_terms  TEXT   -- Incoterm: EXW|FCA|FAS|FOB|CFR|CIF|CIP|DAP|DAT|DDP
);

-- =====================================================================
-- 4. TENDER VISIBILITY & INVITATION LIFECYCLE
-- =====================================================================
-- Replaces the old tender_vendor_access which had no token or status.
-- For open tenders this table is not used; any approved vendor may bid.

CREATE TABLE tender_vendor_invitations (
    tender_id         UUID        NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    vendor_org_id     UUID        NOT NULL REFERENCES organizations(id),
    invitation_token  TEXT        NOT NULL,   -- crypto-random, ≥ 32 bytes hex; single-use first-access
    status            TEXT        NOT NULL DEFAULT 'sent'
                                  CHECK (status IN ('sent','viewed','bid_started','submitted','declined')),
    invited_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    viewed_at         TIMESTAMPTZ,
    declined_at       TIMESTAMPTZ,
    declined_reason   TEXT,
    PRIMARY KEY (tender_id, vendor_org_id)
);

-- =====================================================================
-- 5. TENDER ITEMS (BOQ / HIERARCHICAL BoM)
-- =====================================================================

CREATE TABLE tender_items (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id       UUID        NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    parent_item_id  UUID        REFERENCES tender_items(id),                    -- NULL = root
    item_type       TEXT        NOT NULL DEFAULT 'item'
                                CHECK (item_type IN ('group','item')),
    sl_no           INTEGER     NOT NULL,
    item_code       TEXT,                                                       -- buyer SKU  §5.1
    item_name       TEXT        NOT NULL,
    specification   TEXT,                                                       -- rich-text / markdown
    quantity        NUMERIC(14,3) NOT NULL DEFAULT 0,                           -- 0 for groups
    uom             TEXT        REFERENCES uom_master(code),
    estimated_cost  NUMERIC(18,2),                                              -- hidden from vendors §5.1
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- sl_no unique within the same parent (enables independent numbering per group)
    UNIQUE (tender_id, parent_item_id, sl_no)
);

-- =====================================================================
-- 6. FEATURE SYSTEM (NORMALIZED + SCORING)
-- =====================================================================

CREATE TABLE feature_definitions (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              TEXT        NOT NULL,
    feature_type      TEXT        NOT NULL REFERENCES feature_type_master(code),
    scoring_type      TEXT        NOT NULL DEFAULT 'binary'
                                  CHECK (scoring_type IN ('binary','graded','numeric')),
    evaluation_weight NUMERIC(5,2),   -- 0.00–100.00; sum per item should = 100
    is_global         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE feature_options (
    id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_id    UUID    NOT NULL REFERENCES feature_definitions(id) ON DELETE CASCADE,
    option_value  TEXT    NOT NULL,
    option_score  NUMERIC(5,2) DEFAULT 0,   -- meaningful only for graded scoring_type
    sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE tender_item_features (
    tender_item_id  UUID    NOT NULL REFERENCES tender_items(id) ON DELETE CASCADE,
    feature_id      UUID    NOT NULL REFERENCES feature_definitions(id),
    is_mandatory    BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (tender_item_id, feature_id)
);

-- =====================================================================
-- 7. QUALIFICATION / ELIGIBILITY REQUIREMENTS
-- =====================================================================

CREATE TABLE tender_qualification_requirements (
    id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id    UUID    NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    requirement  TEXT    NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================================
-- 8. VENDOR ENLISTMENT & APPROVAL
-- =====================================================================

CREATE TABLE vendor_profiles (
    organization_id   UUID        PRIMARY KEY REFERENCES organizations(id),  -- 1:1
    legal_name        TEXT        NOT NULL,
    tax_id            TEXT,
    contact_name      TEXT,
    contact_email     TEXT,
    contact_phone     TEXT,
    website           TEXT,
    status            TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','approved','rejected','suspended')),
    status_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status_changed_by UUID        REFERENCES users(id),
    rejection_reason  TEXT,       -- mandatory when status = rejected (enforced in app layer)
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vendor_categories (
    vendor_org_id UUID NOT NULL REFERENCES organizations(id),
    category_id   UUID NOT NULL REFERENCES categories_master(id),
    added_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (vendor_org_id, category_id)
);

CREATE TABLE vendor_documents (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_org_id   UUID        NOT NULL REFERENCES organizations(id),
    document_type   TEXT        NOT NULL
                                CHECK (document_type IN ('trade_license','vat_certificate','iso_cert','other')),
    file_url        TEXT        NOT NULL,   -- S3 / MinIO path
    issued_date     DATE,
    expiry_date     DATE,                  -- triggers alerts at 30 d and 7 d before
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    uploaded_by     UUID        NOT NULL REFERENCES users(id)
);

-- =====================================================================
-- 9. BID HEADER, ENVELOPES & VERSIONING
-- =====================================================================
-- CRITICAL FIX vs v2.1:
--   • Added 'version' column
--   • UNIQUE changed to (tender_id, vendor_org_id, version)
--   • Added compliance_status, digital_hash, updated_at

CREATE TABLE bids (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id         UUID        NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    vendor_org_id     UUID        NOT NULL REFERENCES organizations(id),
    version           INTEGER     NOT NULL DEFAULT 1,                           -- increments on resubmit
    status            TEXT        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft','submitted','withdrawn')),
    total_amount      NUMERIC(18,2),                                            -- auto-calc cache
    compliance_status TEXT        CHECK (compliance_status IN ('compliant','non_compliant','partial')),  -- §6.1
    digital_hash      TEXT,                                                     -- SHA-256 of payload  §6.1
    submitted_at      TIMESTAMPTZ,                                              -- NULL while draft
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tender_id, vendor_org_id, version)                                  -- allows multi-version history
);

CREATE TABLE bid_envelopes (
    id             UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_id         UUID    NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    envelope_type  TEXT    NOT NULL REFERENCES envelope_type_master(code),
    is_open        BOOLEAN NOT NULL DEFAULT FALSE,
    opened_at      TIMESTAMPTZ,
    opened_by      UUID    REFERENCES users(id),                                -- §6.2
    UNIQUE (bid_id, envelope_type)                                              -- one envelope per type per bid
);

-- =====================================================================
-- 10. BID ITEMS & FEATURE VALUES
-- =====================================================================
-- CRITICAL FIX vs v2.1:
--   • compliance changed from BOOLEAN to tri-state ENUM
--   • Added item_total_price (cached) and brand_make

CREATE TABLE bid_items (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_id                  UUID        NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    tender_item_id          UUID        NOT NULL REFERENCES tender_items(id),
    envelope_type           TEXT        NOT NULL REFERENCES envelope_type_master(code),
    unit_price              NUMERIC(18,4),                                      -- NULL in technical envelope
    item_total_price        NUMERIC(18,2),                                      -- cached: qty × unit_price  §6.4
    compliance              TEXT        CHECK (compliance IN ('compliant','non_compliant','partial')),  -- §6.4
    non_compliance_remarks  TEXT,       -- mandatory when compliance ≠ compliant (app-layer)
    brand_make              TEXT,                                               -- §6.4
    UNIQUE (bid_id, tender_item_id, envelope_type)
);

CREATE TABLE bid_item_feature_values (
    bid_item_id   UUID        NOT NULL REFERENCES bid_items(id) ON DELETE CASCADE,
    feature_id    UUID        NOT NULL REFERENCES feature_definitions(id),
    option_id     UUID        REFERENCES feature_options(id),    -- set for select types
    text_value    TEXT,                                           -- set for text type
    numeric_value NUMERIC(12,3),                                 -- set for numeric type
    PRIMARY KEY (bid_item_id, feature_id)
);

-- =====================================================================
-- 11. ATTACHMENTS (placed here — referenced by qualification responses)
-- =====================================================================

CREATE TABLE attachments (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type  TEXT        NOT NULL,
    entity_id    UUID        NOT NULL,
    file_url     TEXT        NOT NULL,
    uploaded_by  UUID        REFERENCES users(id),
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 12. QUALIFICATION RESPONSES
-- =====================================================================

CREATE TABLE bid_qualification_responses (
    requirement_id UUID NOT NULL REFERENCES tender_qualification_requirements(id),
    bid_id         UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    response       TEXT,
    document_id    UUID REFERENCES attachments(id),              -- supporting evidence  §14.2
    compliant      BOOLEAN,                                      -- evaluator verdict
    PRIMARY KEY (requirement_id, bid_id)
);

-- =====================================================================
-- 12. EVALUATION & SCORING
-- =====================================================================
-- CHANGES vs v2.1:
--   • Removed financial_score (redundant — PRD uses commercial_score)
--   • Added overall_score, is_technically_qualified, updated_at
--   • Added id as own PK for FK referencing from evaluation_line_scores

CREATE TABLE evaluations (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_id                  UUID        NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    evaluator_id            UUID        NOT NULL REFERENCES users(id),
    technical_score         NUMERIC(6,2),                                       -- 0–100
    commercial_score        NUMERIC(6,2),                                       -- system-calc after unlock
    overall_score           NUMERIC(6,2),                                       -- blended final  §10.2
    is_technically_qualified BOOLEAN,                                           -- score ≥ threshold  §10.2
    remarks                 TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (bid_id, evaluator_id)
);

-- Per-item, per-feature granular scoring — §10.3
CREATE TABLE evaluation_line_scores (
    evaluation_id  UUID        NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    tender_item_id UUID        NOT NULL REFERENCES tender_items(id),
    feature_id     UUID        NOT NULL REFERENCES feature_definitions(id),
    score          NUMERIC(5,2),
    remarks        TEXT,
    PRIMARY KEY (evaluation_id, tender_item_id, feature_id)
);

-- =====================================================================
-- 13. AWARDS (PARTIAL / FULL)
-- =====================================================================
-- CHANGES vs v2.1:
--   • Own UUID PK (needed for audit_logs FK)
--   • tender_id denormalized for fast query  §11.1
--   • awarded_by added  §11.1

CREATE TABLE awards (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id         UUID        NOT NULL REFERENCES tenders(id),              -- denormalized
    tender_item_id    UUID        NOT NULL REFERENCES tender_items(id),
    bid_id            UUID        NOT NULL REFERENCES bids(id),
    awarded_quantity  NUMERIC(14,3) NOT NULL,                                   -- must be ≤ item qty
    awarded_price     NUMERIC(18,2) NOT NULL,
    awarded_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    awarded_by        UUID        NOT NULL REFERENCES users(id)
);

-- =====================================================================
-- 14. CLARIFICATIONS & ADDENDA
-- =====================================================================

CREATE TABLE clarification_questions (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id       UUID        NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    vendor_org_id   UUID        NOT NULL REFERENCES organizations(id),
    question_text   TEXT        NOT NULL,
    is_public       BOOLEAN     NOT NULL DEFAULT FALSE,   -- TRUE = all vendors see
    status          TEXT        NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open','answered','closed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clarification_answers (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id      UUID        NOT NULL UNIQUE REFERENCES clarification_questions(id) ON DELETE CASCADE,
    buyer_user_id    UUID        NOT NULL REFERENCES users(id),
    answer_text      TEXT        NOT NULL,
    creates_addendum BOOLEAN     NOT NULL DEFAULT FALSE,
    answered_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE addenda (
    id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id             UUID        NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    addendum_number       INTEGER     NOT NULL,   -- sequential per tender
    title                 TEXT        NOT NULL,
    description           TEXT        NOT NULL,
    extends_deadline_days INTEGER,                -- if > 0 auto-extends submission_deadline
    published_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_by          UUID        NOT NULL REFERENCES users(id),
    UNIQUE (tender_id, addendum_number)
);

CREATE TABLE addendum_acknowledgements (
    addendum_id       UUID        NOT NULL REFERENCES addenda(id) ON DELETE CASCADE,
    vendor_org_id     UUID        NOT NULL REFERENCES organizations(id),
    acknowledged_at   TIMESTAMPTZ,                                              -- NULL = pending
    acknowledged_by   UUID        REFERENCES users(id),
    PRIMARY KEY (addendum_id, vendor_org_id)
);

-- =====================================================================
-- 15. TAX & MULTI-CURRENCY
-- =====================================================================

CREATE TABLE tax_rules (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT        NOT NULL,                                           -- e.g., 'GST 18%'
    rate_percent NUMERIC(6,2) NOT NULL,
    applies_to  TEXT        NOT NULL CHECK (applies_to IN ('goods','works','services','all')),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bid_item_taxes (
    bid_item_id UUID        NOT NULL REFERENCES bid_items(id) ON DELETE CASCADE,
    tax_rule_id UUID        NOT NULL REFERENCES tax_rules(id),
    tax_amount  NUMERIC(18,2) NOT NULL,   -- item_total_price × (rate_percent / 100)
    PRIMARY KEY (bid_item_id, tax_rule_id)
);

CREATE TABLE currency_rates (
    base_currency   CHAR(3)     NOT NULL,
    target_currency CHAR(3)     NOT NULL,
    rate            NUMERIC(12,6) NOT NULL,
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (base_currency, target_currency)
);

-- =====================================================================
-- 16. NOTIFICATIONS
-- =====================================================================

CREATE TABLE notifications (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id         UUID        REFERENCES tenders(id),                       -- nullable (some are user-only)
    recipient_id      UUID        NOT NULL REFERENCES users(id),
    notification_type TEXT        NOT NULL,
    channel           TEXT        NOT NULL CHECK (channel IN ('email','sms','in_app')),
    status            TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','sent','delivered','failed','retried')),
    payload           JSONB,                                                    -- tender title, deadline, etc.
    sent_at           TIMESTAMPTZ,
    failed_reason     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 17. IMMUTABLE AUDIT LOG
-- =====================================================================
-- Append-only: revoke UPDATE, DELETE on this table from the app service account.
CREATE TABLE audit_logs (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id    UUID        REFERENCES users(id),                               -- NULL for system events
    action      TEXT        NOT NULL,   -- TENDER_CREATED, BID_SUBMITTED, ENVELOPE_OPENED, …
    entity_type TEXT        NOT NULL,
    entity_id   UUID        NOT NULL,
    metadata    JSONB,                                                          -- {old_status, new_status}, etc.
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 18. INDEXES
-- =====================================================================
-- Group A — Tender lookup & lifecycle
CREATE INDEX idx_tenders_status_deadline       ON tenders(status, submission_deadline);
CREATE INDEX idx_tenders_buyer_status          ON tenders(buyer_org_id, status);

-- Group B — Line items
CREATE INDEX idx_tender_items_tender           ON tender_items(tender_id);
CREATE INDEX idx_tender_items_parent           ON tender_items(tender_id, parent_item_id);

-- Group C — Features
CREATE INDEX idx_tender_item_features_feature  ON tender_item_features(feature_id);
CREATE INDEX idx_feature_options_feature       ON feature_options(feature_id);

-- Group D — Bids (active-bid lookup is the hottest query)
CREATE INDEX idx_bids_tender                   ON bids(tender_id);
CREATE INDEX idx_bids_active_bid               ON bids(tender_id, vendor_org_id, version DESC)
                                                WHERE status = 'submitted';
CREATE INDEX idx_bids_vendor_status            ON bids(vendor_org_id, status);

-- Group E — Bid items & features
CREATE INDEX idx_bid_items_bid                 ON bid_items(bid_id);
CREATE INDEX idx_bid_items_tender_item         ON bid_items(tender_item_id);
CREATE INDEX idx_bid_items_price               ON bid_items(unit_price);
CREATE INDEX idx_bid_item_feature_values_bid   ON bid_item_feature_values(bid_item_id);

-- Group F — Invitations
CREATE INDEX idx_invitations_token             ON tender_vendor_invitations(invitation_token);
CREATE INDEX idx_invitations_vendor            ON tender_vendor_invitations(vendor_org_id, status);

-- Group G — Vendor enlistment
CREATE INDEX idx_vendor_docs_expiry            ON vendor_documents(vendor_org_id, expiry_date);
CREATE INDEX idx_vendor_categories_category    ON vendor_categories(category_id);

-- Group H — Clarifications & Addenda
CREATE INDEX idx_clarification_questions_tender ON clarification_questions(tender_id, status);
CREATE INDEX idx_addenda_tender                ON addenda(tender_id);
CREATE INDEX idx_addendum_acks_vendor          ON addendum_acknowledgements(vendor_org_id);

-- Group I — Evaluations
CREATE INDEX idx_evaluations_bid               ON evaluations(bid_id);
CREATE INDEX idx_eval_line_scores_eval         ON evaluation_line_scores(evaluation_id);

-- Group J — Awards
CREATE INDEX idx_awards_tender                 ON awards(tender_id);
CREATE INDEX idx_awards_item                   ON awards(tender_item_id);
CREATE INDEX idx_awards_bid                    ON awards(bid_id);

-- Group K — Notifications
CREATE INDEX idx_notifications_recipient       ON notifications(recipient_id, status);
CREATE INDEX idx_notifications_tender          ON notifications(tender_id);

-- Group L — Audit (entity-level retrieval)
CREATE INDEX idx_audit_logs_entity             ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor              ON audit_logs(actor_id, created_at DESC);

-- Group M — Tax & FX
CREATE INDEX idx_bid_item_taxes_item           ON bid_item_taxes(bid_item_id);

-- =====================================================================
-- END SCHEMA v3.0
-- =====================================================================
