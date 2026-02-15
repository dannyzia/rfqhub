-- =====================================================================
-- RFQ & TENDERING PLATFORM — ROW-LEVEL SECURITY & TRIGGERS v3.0
-- Multi-tenant isolation, automatic timestamps, and business rule enforcement
-- Run after: rfq_tendering_platform_schema_v3.sql and schema_seed.sql
-- =====================================================================

-- =====================================================================
-- SECTION 1: HELPER FUNCTIONS FOR RLS
-- =====================================================================

-- Function to get current user's organization ID from JWT/session
CREATE OR REPLACE FUNCTION current_user_org_id()
RETURNS UUID AS $$
BEGIN
    -- In production, extract from JWT claim or session variable
    -- Example: current_setting('app.current_org_id', true)::UUID
    RETURN NULLIF(current_setting('app.current_org_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get current user's ID from JWT/session
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get current user's roles
CREATE OR REPLACE FUNCTION current_user_roles()
RETURNS TEXT[] AS $$
DECLARE
    roles TEXT[];
BEGIN
    SELECT u.roles INTO roles
    FROM users u
    WHERE u.id = current_user_id();
    RETURN COALESCE(roles, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if current user has a specific role
CREATE OR REPLACE FUNCTION user_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN role_name = ANY(current_user_roles());
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN user_has_role('admin');
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if organization is a buyer for a specific tender
CREATE OR REPLACE FUNCTION is_tender_buyer(tender_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenders t
        WHERE t.id = tender_id_param
        AND t.buyer_org_id = current_user_org_id()
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if organization is invited to a limited tender
CREATE OR REPLACE FUNCTION is_invited_vendor(tender_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tender_vendor_invitations tvi
        WHERE tvi.tender_id = tender_id_param
        AND tvi.vendor_org_id = current_user_org_id()
        AND tvi.status NOT IN ('declined')
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================================
-- SECTION 2: ENABLE RLS ON ALL TABLES
-- =====================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_vendor_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_item_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_qualification_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_item_feature_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_qualification_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_line_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarification_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarification_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE addendum_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Master tables don't need RLS (public read-only)
-- uom_master, currency_master, tender_status_master, tender_type_master,
-- feature_type_master, envelope_type_master, categories_master, tax_rules, currency_rates

-- =====================================================================
-- SECTION 3: RLS POLICIES - ORGANIZATIONS
-- =====================================================================

-- Admins can see all organizations
CREATE POLICY organizations_admin_all ON organizations
    FOR ALL
    TO PUBLIC
    USING (is_admin());

-- Users can see their own organization
CREATE POLICY organizations_own ON organizations
    FOR SELECT
    TO PUBLIC
    USING (id = current_user_org_id());

-- Buyers can see approved vendor organizations
CREATE POLICY organizations_approved_vendors ON organizations
    FOR SELECT
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM vendor_profiles vp
            WHERE vp.organization_id = organizations.id
            AND vp.status = 'approved'
        )
    );

-- =====================================================================
-- SECTION 4: RLS POLICIES - USERS
-- =====================================================================

-- Admins can see all users
CREATE POLICY users_admin_all ON users
    FOR ALL
    TO PUBLIC
    USING (is_admin());

-- Users can see other users in their organization
CREATE POLICY users_same_org ON users
    FOR SELECT
    TO PUBLIC
    USING (organization_id = current_user_org_id());

-- Users can update their own record (except roles)
CREATE POLICY users_update_own ON users
    FOR UPDATE
    TO PUBLIC
    USING (id = current_user_id());

-- =====================================================================
-- SECTION 5: RLS POLICIES - VENDOR PROFILES
-- =====================================================================

-- Admins can manage all vendor profiles
CREATE POLICY vendor_profiles_admin ON vendor_profiles
    FOR ALL
    TO PUBLIC
    USING (is_admin());

-- Vendors can see and update their own profile
CREATE POLICY vendor_profiles_own ON vendor_profiles
    FOR ALL
    TO PUBLIC
    USING (organization_id = current_user_org_id());

-- Buyers can see approved vendor profiles
CREATE POLICY vendor_profiles_buyers_view ON vendor_profiles
    FOR SELECT
    TO PUBLIC
    USING (
        user_has_role('buyer') AND status = 'approved'
    );

-- =====================================================================
-- SECTION 6: RLS POLICIES - TENDERS
-- =====================================================================

-- Admins can see all tenders
CREATE POLICY tenders_admin ON tenders
    FOR ALL
    TO PUBLIC
    USING (is_admin());

-- Buyers can manage their own tenders
CREATE POLICY tenders_buyer_own ON tenders
    FOR ALL
    TO PUBLIC
    USING (buyer_org_id = current_user_org_id());

-- Vendors can see published open tenders
CREATE POLICY tenders_vendor_open ON tenders
    FOR SELECT
    TO PUBLIC
    USING (
        user_has_role('vendor')
        AND status IN ('published', 'clarification', 'closed', 'tech_eval', 'comm_eval', 'awarded')
        AND visibility = 'open'
    );

-- Vendors can see limited tenders they're invited to
CREATE POLICY tenders_vendor_invited ON tenders
    FOR SELECT
    TO PUBLIC
    USING (
        user_has_role('vendor')
        AND visibility = 'limited'
        AND is_invited_vendor(id)
    );

-- =====================================================================
-- SECTION 7: RLS POLICIES - TENDER ITEMS
-- =====================================================================

-- Users who can see the tender can see its items
CREATE POLICY tender_items_view ON tender_items
    FOR SELECT
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM tenders t
            WHERE t.id = tender_items.tender_id
        )
    );

-- Buyers can manage items on their tenders
CREATE POLICY tender_items_buyer_manage ON tender_items
    FOR ALL
    TO PUBLIC
    USING (is_tender_buyer(tender_id));

-- =====================================================================
-- SECTION 8: RLS POLICIES - BIDS
-- =====================================================================

-- Admins can see all bids
CREATE POLICY bids_admin ON bids
    FOR ALL
    TO PUBLIC
    USING (is_admin());

-- Vendors can manage their own bids
CREATE POLICY bids_vendor_own ON bids
    FOR ALL
    TO PUBLIC
    USING (vendor_org_id = current_user_org_id());

-- Buyers can see submitted bids on their tenders
CREATE POLICY bids_buyer_view ON bids
    FOR SELECT
    TO PUBLIC
    USING (
        is_tender_buyer(tender_id)
        AND status = 'submitted'
    );

-- =====================================================================
-- SECTION 9: RLS POLICIES - BID ENVELOPES
-- =====================================================================

-- Vendors can see their own bid envelopes
CREATE POLICY bid_envelopes_vendor ON bid_envelopes
    FOR SELECT
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM bids b
            WHERE b.id = bid_envelopes.bid_id
            AND b.vendor_org_id = current_user_org_id()
        )
    );

-- Buyers can see envelopes on their tender bids (respects envelope opening)
CREATE POLICY bid_envelopes_buyer ON bid_envelopes
    FOR SELECT
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM bids b
            JOIN tenders t ON t.id = b.tender_id
            WHERE b.id = bid_envelopes.bid_id
            AND t.buyer_org_id = current_user_org_id()
            AND b.status = 'submitted'
        )
    );

-- =====================================================================
-- SECTION 10: RLS POLICIES - BID ITEMS
-- =====================================================================

-- Vendors can manage items on their bids
CREATE POLICY bid_items_vendor ON bid_items
    FOR ALL
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM bids b
            WHERE b.id = bid_items.bid_id
            AND b.vendor_org_id = current_user_org_id()
        )
    );

-- Buyers can view bid items (technical always, commercial only if envelope is open)
CREATE POLICY bid_items_buyer_view ON bid_items
    FOR SELECT
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM bids b
            JOIN tenders t ON t.id = b.tender_id
            JOIN bid_envelopes be ON be.bid_id = b.id AND be.envelope_type = bid_items.envelope_type
            WHERE b.id = bid_items.bid_id
            AND t.buyer_org_id = current_user_org_id()
            AND b.status = 'submitted'
            AND (
                bid_items.envelope_type = 'technical'
                OR (bid_items.envelope_type = 'commercial' AND be.is_open = TRUE)
            )
        )
    );

-- =====================================================================
-- SECTION 11: RLS POLICIES - EVALUATIONS
-- =====================================================================

-- Admins can see all evaluations
CREATE POLICY evaluations_admin ON evaluations
    FOR ALL
    TO PUBLIC
    USING (is_admin());

-- Evaluators can manage their own evaluations
CREATE POLICY evaluations_evaluator_own ON evaluations
    FOR ALL
    TO PUBLIC
    USING (evaluator_id = current_user_id());

-- Buyers can see evaluations on their tenders
CREATE POLICY evaluations_buyer_view ON evaluations
    FOR SELECT
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM bids b
            JOIN tenders t ON t.id = b.tender_id
            WHERE b.id = evaluations.bid_id
            AND t.buyer_org_id = current_user_org_id()
        )
    );

-- =====================================================================
-- SECTION 12: RLS POLICIES - CLARIFICATIONS
-- =====================================================================

-- Vendors can manage their own questions
CREATE POLICY clarification_questions_vendor ON clarification_questions
    FOR ALL
    TO PUBLIC
    USING (vendor_org_id = current_user_org_id());

-- Buyers can see all questions on their tenders
CREATE POLICY clarification_questions_buyer ON clarification_questions
    FOR ALL
    TO PUBLIC
    USING (is_tender_buyer(tender_id));

-- Vendors can see public questions
CREATE POLICY clarification_questions_public ON clarification_questions
    FOR SELECT
    TO PUBLIC
    USING (is_public = TRUE);

-- Buyers can manage answers on their tenders
CREATE POLICY clarification_answers_buyer ON clarification_answers
    FOR ALL
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM clarification_questions cq
            JOIN tenders t ON t.id = cq.tender_id
            WHERE cq.id = clarification_answers.question_id
            AND t.buyer_org_id = current_user_org_id()
        )
    );

-- =====================================================================
-- SECTION 13: RLS POLICIES - NOTIFICATIONS
-- =====================================================================

-- Users can see their own notifications
CREATE POLICY notifications_own ON notifications
    FOR SELECT
    TO PUBLIC
    USING (recipient_id = current_user_id());

-- =====================================================================
-- SECTION 14: RLS POLICIES - AUDIT LOGS
-- =====================================================================

-- Admins can see all audit logs
CREATE POLICY audit_logs_admin ON audit_logs
    FOR SELECT
    TO PUBLIC
    USING (is_admin());

-- Users can see audit logs for their own actions
CREATE POLICY audit_logs_own ON audit_logs
    FOR SELECT
    TO PUBLIC
    USING (actor_id = current_user_id());

-- Prevent any modifications to audit logs (append-only)
-- Note: INSERT should be done by service account, not app users

-- =====================================================================
-- SECTION 15: TRIGGERS - AUTOMATIC TIMESTAMPS
-- =====================================================================

-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_tenders_updated_at
    BEFORE UPDATE ON tenders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_bids_updated_at
    BEFORE UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_evaluations_updated_at
    BEFORE UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- SECTION 16: TRIGGERS - AUDIT LOGGING
-- =====================================================================

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    action_name TEXT;
    entity_type_name TEXT;
    old_data JSONB;
    new_data JSONB;
    metadata JSONB;
BEGIN
    entity_type_name := TG_TABLE_NAME;

    IF TG_OP = 'INSERT' THEN
        action_name := UPPER(TG_TABLE_NAME) || '_CREATED';
        new_data := to_jsonb(NEW);
        metadata := jsonb_build_object('new', new_data);

        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (current_user_id(), action_name, entity_type_name, NEW.id, metadata);

        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        action_name := UPPER(TG_TABLE_NAME) || '_UPDATED';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        metadata := jsonb_build_object('old', old_data, 'new', new_data);

        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (current_user_id(), action_name, entity_type_name, NEW.id, metadata);

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        action_name := UPPER(TG_TABLE_NAME) || '_DELETED';
        old_data := to_jsonb(OLD);
        metadata := jsonb_build_object('old', old_data);

        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (current_user_id(), action_name, entity_type_name, OLD.id, metadata);

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
CREATE TRIGGER tr_tenders_audit
    AFTER INSERT OR UPDATE OR DELETE ON tenders
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER tr_bids_audit
    AFTER INSERT OR UPDATE OR DELETE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER tr_bid_envelopes_audit
    AFTER INSERT OR UPDATE ON bid_envelopes
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER tr_evaluations_audit
    AFTER INSERT OR UPDATE OR DELETE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER tr_awards_audit
    AFTER INSERT OR UPDATE OR DELETE ON awards
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER tr_vendor_profiles_audit
    AFTER INSERT OR UPDATE ON vendor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

-- =====================================================================
-- SECTION 17: TRIGGERS - BUSINESS RULE ENFORCEMENT
-- =====================================================================

-- Prevent bid submission after deadline
CREATE OR REPLACE FUNCTION check_bid_submission_deadline()
RETURNS TRIGGER AS $$
DECLARE
    tender_deadline TIMESTAMPTZ;
BEGIN
    IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status != 'submitted') THEN
        SELECT submission_deadline INTO tender_deadline
        FROM tenders
        WHERE id = NEW.tender_id;

        IF NOW() > tender_deadline THEN
            RAISE EXCEPTION 'Cannot submit bid after tender deadline (%)' , tender_deadline;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_bids_check_deadline
    BEFORE INSERT OR UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION check_bid_submission_deadline();

-- Prevent modification of submitted bids (except withdrawal)
CREATE OR REPLACE FUNCTION prevent_submitted_bid_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'submitted' AND NEW.status != 'withdrawn' THEN
        -- Allow only status change to withdrawn
        IF NEW.status = OLD.status THEN
            RAISE EXCEPTION 'Cannot modify a submitted bid. Create a new version instead.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_bids_prevent_modification
    BEFORE UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION prevent_submitted_bid_modification();

-- Auto-increment bid version on resubmission
CREATE OR REPLACE FUNCTION auto_increment_bid_version()
RETURNS TRIGGER AS $$
DECLARE
    max_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version), 0) INTO max_version
    FROM bids
    WHERE tender_id = NEW.tender_id
    AND vendor_org_id = NEW.vendor_org_id;

    NEW.version := max_version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_bids_auto_version
    BEFORE INSERT ON bids
    FOR EACH ROW
    EXECUTE FUNCTION auto_increment_bid_version();

-- Prevent opening commercial envelope before technical qualification
CREATE OR REPLACE FUNCTION check_commercial_envelope_opening()
RETURNS TRIGGER AS $$
DECLARE
    is_qualified BOOLEAN;
BEGIN
    IF NEW.envelope_type = 'commercial' AND NEW.is_open = TRUE AND OLD.is_open = FALSE THEN
        SELECT e.is_technically_qualified INTO is_qualified
        FROM evaluations e
        WHERE e.bid_id = NEW.bid_id
        LIMIT 1;

        IF is_qualified IS NULL OR is_qualified = FALSE THEN
            RAISE EXCEPTION 'Cannot open commercial envelope before technical qualification';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_bid_envelopes_check_opening
    BEFORE UPDATE ON bid_envelopes
    FOR EACH ROW
    EXECUTE FUNCTION check_commercial_envelope_opening();

-- Calculate item total price automatically
CREATE OR REPLACE FUNCTION calculate_bid_item_total()
RETURNS TRIGGER AS $$
DECLARE
    item_qty NUMERIC;
BEGIN
    IF NEW.unit_price IS NOT NULL THEN
        SELECT quantity INTO item_qty
        FROM tender_items
        WHERE id = NEW.tender_item_id;

        NEW.item_total_price := NEW.unit_price * COALESCE(item_qty, 0);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_bid_items_calc_total
    BEFORE INSERT OR UPDATE ON bid_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_bid_item_total();

-- Update bid total amount when items change
CREATE OR REPLACE FUNCTION update_bid_total_amount()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bids
    SET total_amount = (
        SELECT COALESCE(SUM(item_total_price), 0)
        FROM bid_items
        WHERE bid_id = COALESCE(NEW.bid_id, OLD.bid_id)
        AND envelope_type = 'commercial'
    )
    WHERE id = COALESCE(NEW.bid_id, OLD.bid_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_bid_items_update_total
    AFTER INSERT OR UPDATE OR DELETE ON bid_items
    FOR EACH ROW
    EXECUTE FUNCTION update_bid_total_amount();

-- Auto-extend deadline when addendum specifies extension
CREATE OR REPLACE FUNCTION apply_addendum_deadline_extension()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.extends_deadline_days IS NOT NULL AND NEW.extends_deadline_days > 0 THEN
        UPDATE tenders
        SET submission_deadline = submission_deadline + (NEW.extends_deadline_days || ' days')::INTERVAL,
            updated_at = NOW()
        WHERE id = NEW.tender_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_addenda_extend_deadline
    AFTER INSERT ON addenda
    FOR EACH ROW
    EXECUTE FUNCTION apply_addendum_deadline_extension();

-- Validate tender status transitions
CREATE OR REPLACE FUNCTION validate_tender_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    valid_transitions JSONB := '{
        "draft": ["published", "cancelled"],
        "published": ["clarification", "closed", "cancelled"],
        "clarification": ["closed", "cancelled"],
        "closed": ["tech_eval", "cancelled"],
        "tech_eval": ["comm_eval", "cancelled"],
        "comm_eval": ["awarded", "cancelled"],
        "awarded": [],
        "cancelled": [],
        "suspended": ["published", "cancelled"]
    }'::JSONB;
    allowed_statuses JSONB;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        allowed_statuses := valid_transitions -> OLD.status;

        IF allowed_statuses IS NULL OR NOT (allowed_statuses ? NEW.status) THEN
            RAISE EXCEPTION 'Invalid tender status transition from % to %', OLD.status, NEW.status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tenders_status_transition
    BEFORE UPDATE ON tenders
    FOR EACH ROW
    EXECUTE FUNCTION validate_tender_status_transition();

-- =====================================================================
-- SECTION 18: NOTIFICATION TRIGGERS
-- =====================================================================

-- Create notification when tender is published
CREATE OR REPLACE FUNCTION notify_tender_published()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND OLD.status = 'draft' THEN
        -- For open tenders, notify all approved vendors
        IF NEW.visibility = 'open' THEN
            INSERT INTO notifications (tender_id, recipient_id, notification_type, channel, payload)
            SELECT NEW.id, u.id, 'TENDER_PUBLISHED', 'in_app',
                   jsonb_build_object(
                       'tender_title', NEW.title,
                       'tender_number', NEW.tender_number,
                       'deadline', NEW.submission_deadline
                   )
            FROM users u
            JOIN organizations o ON o.id = u.organization_id
            JOIN vendor_profiles vp ON vp.organization_id = o.id
            WHERE vp.status = 'approved'
            AND 'vendor' = ANY(u.roles);
        END IF;

        -- For limited tenders, notifications handled by invitation system
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tenders_notify_published
    AFTER UPDATE ON tenders
    FOR EACH ROW
    EXECUTE FUNCTION notify_tender_published();

-- Notify vendor when invited to limited tender
CREATE OR REPLACE FUNCTION notify_vendor_invitation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (tender_id, recipient_id, notification_type, channel, payload)
    SELECT t.id, u.id, 'TENDER_INVITATION', 'in_app',
           jsonb_build_object(
               'tender_title', t.title,
               'tender_number', t.tender_number,
               'deadline', t.submission_deadline,
               'invitation_token', NEW.invitation_token
           )
    FROM tenders t
    JOIN users u ON u.organization_id = NEW.vendor_org_id
    WHERE t.id = NEW.tender_id
    AND 'vendor' = ANY(u.roles);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_invitations_notify_vendor
    AFTER INSERT ON tender_vendor_invitations
    FOR EACH ROW
    EXECUTE FUNCTION notify_vendor_invitation();

-- Notify buyer when bid is submitted
CREATE OR REPLACE FUNCTION notify_bid_submitted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status != 'submitted') THEN
        INSERT INTO notifications (tender_id, recipient_id, notification_type, channel, payload)
        SELECT t.id, u.id, 'BID_SUBMITTED', 'in_app',
               jsonb_build_object(
                   'tender_title', t.title,
                   'vendor_name', o.name,
                   'bid_version', NEW.version
               )
        FROM tenders t
        JOIN users u ON u.organization_id = t.buyer_org_id
        JOIN organizations o ON o.id = NEW.vendor_org_id
        WHERE t.id = NEW.tender_id
        AND 'buyer' = ANY(u.roles);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_bids_notify_submitted
    AFTER INSERT OR UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION notify_bid_submitted();

-- =====================================================================
-- SECTION 19: DOCUMENT EXPIRY ALERT FUNCTION
-- =====================================================================

-- Function to check for expiring vendor documents (call via cron job)
CREATE OR REPLACE FUNCTION check_expiring_documents()
RETURNS TABLE (
    vendor_org_id UUID,
    document_type TEXT,
    expiry_date DATE,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vd.vendor_org_id,
        vd.document_type,
        vd.expiry_date,
        (vd.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry
    FROM vendor_documents vd
    WHERE vd.expiry_date IS NOT NULL
    AND vd.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    ORDER BY vd.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SECTION 20: UTILITY VIEWS
-- =====================================================================

-- View for active tenders with bid counts
CREATE OR REPLACE VIEW vw_active_tenders AS
SELECT
    t.*,
    COUNT(DISTINCT b.vendor_org_id) FILTER (WHERE b.status = 'submitted') as submitted_bid_count,
    COUNT(DISTINCT b.vendor_org_id) FILTER (WHERE b.status = 'draft') as draft_bid_count
FROM tenders t
LEFT JOIN bids b ON b.tender_id = t.id
WHERE t.status NOT IN ('cancelled', 'awarded')
GROUP BY t.id;

-- View for vendor bid summary
CREATE OR REPLACE VIEW vw_vendor_bid_summary AS
SELECT
    b.vendor_org_id,
    o.name as vendor_name,
    COUNT(DISTINCT b.tender_id) FILTER (WHERE b.status = 'submitted') as total_submitted_bids,
    COUNT(DISTINCT a.tender_id) as total_awards,
    SUM(a.awarded_price) as total_awarded_value
FROM bids b
JOIN organizations o ON o.id = b.vendor_org_id
LEFT JOIN awards a ON a.bid_id = b.id
GROUP BY b.vendor_org_id, o.name;

-- =====================================================================
-- END RLS & TRIGGERS v3.0
-- =====================================================================
