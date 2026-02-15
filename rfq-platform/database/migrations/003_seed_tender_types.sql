-- Migration: 003_seed_tender_types.sql
-- Description: Seed all 14 Bangladesh e-GP tender types
-- Phase 0, Task 3
-- Source: TENDER_TYPES_AND_REQUIREMENTS.md

BEGIN;

-- ============================================================================
-- PROCUREMENT OF GOODS (PG)
-- ============================================================================

-- PG1: RFQ for Goods (up to 8 Lac)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, requires_performance_security,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PG1',
    'Request for Quotation - Goods (up to BDT 8 Lac)',
    'RFQ pursuant to Rules 90-94 PPR 2025. For readily available off-the-shelf goods. No tender security required. Free document issuance. Splitting NOT permitted.',
    'goods',
    0, 800000,
    FALSE, FALSE,
    FALSE, FALSE,
    3, 7, 30,
    4, FALSE
) ON CONFLICT DO NOTHING;

-- PG2: Open/Limited Tendering for Goods (8 Lac - 50 Lac)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, tender_security_percent, tender_security_validity_days,
    requires_performance_security, performance_security_percent,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PG2',
    'Open/Limited Tendering - Goods (BDT 8 Lac to 50 Lac)',
    'Standard tendering for small to medium value goods. 8 sections. Tender security 2% required. Newspaper advertisement mandatory.',
    'goods',
    800001, 5000000,
    TRUE, 2.00, 28,
    TRUE, 5.00,
    FALSE, TRUE,
    15, 30, 90,
    8, FALSE
) ON CONFLICT DO NOTHING;

-- PG3: Open Tendering for Goods (above 50 Lac, National)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, tender_security_percent, tender_security_validity_days,
    requires_performance_security, performance_security_percent,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PG3',
    'Open Tendering - Goods (above BDT 50 Lac, National)',
    'For medium to high value goods procurement. Enhanced qualification requirements. Newspaper ad required.',
    'goods',
    5000000, NULL,
    TRUE, 2.00, 28,
    TRUE, 10.00,
    FALSE, TRUE,
    30, 45, 90,
    8, FALSE
) ON CONFLICT DO NOTHING;

-- PG4: Open Tendering - International (any value)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, tender_security_percent, tender_security_validity_days,
    requires_performance_security, performance_security_percent,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PG4',
    'Open Tendering - Goods (International)',
    'International competitive bidding. Any value. Incoterms apply. Foreign currency allowed.',
    'goods',
    0, NULL,
    TRUE, 2.00, 28,
    TRUE, 10.00,
    FALSE, TRUE,
    30, 60, 120,
    8, TRUE
) ON CONFLICT DO NOTHING;

-- PG5A: Turnkey Contract for Plant & Equipment
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, tender_security_percent, tender_security_validity_days,
    requires_performance_security, performance_security_percent,
    requires_two_envelope, requires_newspaper_ad, requires_prequalification,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PG5A',
    'Turnkey Contract - Plant & Equipment (One Stage Two Envelope)',
    'One stage two envelope. Supply + Installation + Commissioning. Technical envelope evaluated first, then commercial for qualified bidders.',
    'goods',
    0, NULL,
    TRUE, 2.00, 28,
    TRUE, 10.00,
    TRUE, TRUE,
    TRUE,
    30, 60, 120,
    8, TRUE
) ON CONFLICT DO NOTHING;

-- PG9A: Direct Procurement (Emergency/Single Source)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, requires_performance_security,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, default_validity_days,
    section_count, is_direct_procurement
) VALUES (
    'PG9A',
    'Direct Procurement - Goods (Emergency or Single Source)',
    'Emergency procurement (natural disaster, urgent need). Single source (only one supplier available, proprietary item). Requires documented justification.',
    'goods',
    0, NULL,
    FALSE, FALSE,
    FALSE, FALSE,
    1, 7,
    4, TRUE
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROCUREMENT OF WORKS (PW)
-- ============================================================================

-- PW1: RFQ for Works (up to 15 Lac)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, requires_performance_security,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PW1',
    'Request for Quotation - Works (up to BDT 15 Lac)',
    'Small works (repairs, maintenance, minor construction). No tender security. Free document issuance.',
    'works',
    0, 1500000,
    FALSE, FALSE,
    FALSE, FALSE,
    7, 14, 30,
    4, FALSE
) ON CONFLICT DO NOTHING;

-- PW3: Open Tendering for Works (above 5 Crore)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, tender_security_percent, tender_security_validity_days,
    requires_performance_security, performance_security_percent,
    requires_retention_money, retention_money_percent,
    requires_two_envelope, requires_newspaper_ad, requires_prequalification, requires_site_visit,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PW3',
    'Open Tendering - Works (above BDT 5 Crore)',
    'Large infrastructure projects. Two-envelope system. Pre-qualification. Site visit mandatory. Retention money required.',
    'works',
    50000000, NULL,
    TRUE, 2.00, 28,
    TRUE, 10.00,
    TRUE, 5.00,
    TRUE, TRUE,
    TRUE, TRUE,
    45, 60, 120,
    10, FALSE
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROCUREMENT OF SERVICES (PPS)
-- ============================================================================

-- PPS2: Outsourcing of Personnel
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, requires_performance_security,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PPS2',
    'Outsourcing of Personnel (Guards, Drivers, Cleaners, etc.)',
    'Hiring services for guards, security personnel, drivers, cleaners, landscaping. Quality and cost evaluation. Performance-based contract.',
    'services',
    0, NULL,
    FALSE, FALSE,
    FALSE, FALSE,
    14, 30, 90,
    7, FALSE
) ON CONFLICT DO NOTHING;

-- PPS3: Least Cost Selection (Standard Services)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, requires_performance_security,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PPS3',
    'Least Cost Selection - Services (Consulting, Training, etc.)',
    'Least-cost services after technical qualification. Lowest cost wins among qualified bidders. Standard consulting/training services.',
    'services',
    0, NULL,
    FALSE, FALSE,
    FALSE, FALSE,
    14, 30, 90,
    7, FALSE
) ON CONFLICT DO NOTHING;

-- PPS6: Direct Procurement - Services (Emergency/Single Source)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, requires_performance_security,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, default_validity_days,
    section_count, is_direct_procurement
) VALUES (
    'PPS6',
    'Direct Procurement - Services (Emergency or Single Source)',
    'Emergency service requirement or only one qualified service provider. Requires documented justification.',
    'services',
    0, NULL,
    FALSE, FALSE,
    FALSE, FALSE,
    1, 7,
    4, TRUE
) ON CONFLICT DO NOTHING;

COMMIT;

-- Verify: Count seeded tender types
SELECT COUNT(*) as tender_type_count FROM tender_type_definitions WHERE is_active = TRUE;
