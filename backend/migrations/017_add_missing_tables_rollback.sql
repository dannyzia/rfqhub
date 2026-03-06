-- =====================================================================
-- Rollback Migration 017: Remove Missing Tables
-- =====================================================================
-- This rollback removes the 9 tables that were added
-- for testing purposes.
-- =====================================================================

-- 1. ACTIVITY LOGS
DROP TABLE IF EXISTS activity_logs CASCADE;

-- 2. BID FEATURE VALUES
DROP TABLE IF EXISTS bid_feature_values CASCADE;

-- 3. SUBSCRIPTIONS
DROP TABLE IF EXISTS subscriptions CASCADE;

-- 4. SUBSCRIPTION USAGE
DROP TABLE IF EXISTS subscription_usage CASCADE;

-- 5. TENDER COMMITTEE MEMBERS
DROP TABLE IF EXISTS tender_committee_members CASCADE;

-- 6. TENDER DOCUMENTS
DROP TABLE IF EXISTS tender_documents CASCADE;

-- 7. TENDER FEATURES
DROP TABLE IF EXISTS tender_features CASCADE;

-- 8. TENDER WORKFLOW STATES
DROP TABLE IF EXISTS tender_workflow_states CASCADE;

-- 9. USER PROFILES
DROP TABLE IF EXISTS user_profiles CASCADE;
