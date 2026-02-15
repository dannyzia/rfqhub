-- Migration: 009_seed_nongovt_tender_types.sql
-- Description: Seed non-government tender types (NRQ1, NRQ2, NRQ3)
-- Phase 2, Task 6

BEGIN;

-- NRQ1: Simple RFQ (up to $10,000 USD)
INSERT INTO tender_type_definitions (
  code, name, description, procurement_type,
  min_value_bdt, max_value_bdt,
  requires_tender_security, tender_security_percent,
  requires_performance_security, performance_security_percent,
  requires_two_envelope, requires_newspaper_ad, requires_prequalification,
  min_submission_days, max_submission_days, default_validity_days,
  section_count, is_international, is_direct_procurement, is_govt_type, is_active
) VALUES (
  'NRQ1',
  'Simple RFQ - Basic (up to $10,000)',
  'Quick commercial procurement for low-value purchases. Minimum 2 vendor quotes required. No formal bid security needed. Suitable for office supplies, small IT purchases, routine services.',
  'goods',
  0, 1000000,  -- 0 to ~$10k USD (using 100 BDT = $1 conversion)
  FALSE, NULL,  -- No bid security required
  FALSE, NULL,  -- No performance security
  FALSE, FALSE, FALSE,  -- Simplified process
  2, 7, 30,  -- 2-7 days submission, 30 days validity
  3, FALSE, FALSE, FALSE, TRUE  -- 3 sections, not international, not direct, NON-GOVT type
) ON CONFLICT (code) DO NOTHING;

-- NRQ2: Standard RFQ ($10,000 - $50,000 USD)
INSERT INTO tender_type_definitions (
  code, name, description, procurement_type,
  min_value_bdt, max_value_bdt,
  requires_tender_security, tender_security_percent,
  requires_performance_security, performance_security_percent,
  requires_two_envelope, requires_newspaper_ad, requires_prequalification,
  min_submission_days, max_submission_days, default_validity_days,
  section_count, is_international, is_direct_procurement, is_govt_type, is_active
) VALUES (
  'NRQ2',
  'Standard RFQ ($10,000 - $50,000)',
  'Standard commercial procurement with basic compliance. Minimum 3 vendor quotes. Optional 1% bid security. Suitable for IT equipment, professional services, bulk supplies.',
  'goods',
  1000001, 5000000,  -- ~$10k to ~$50k USD
  TRUE, 1.00,  -- 1% bid security (optional, at buyer discretion)
  TRUE, 5.00,  -- 5% performance security
  FALSE, FALSE, FALSE,  -- No two-envelope, no newspaper ad
  5, 14, 60,  -- 5-14 days submission, 60 days validity
  4, FALSE, FALSE, FALSE, TRUE  -- 4 sections, NON-GOVT type
) ON CONFLICT (code) DO NOTHING;

-- NRQ3: Detailed Tender (above $50,000 USD)
INSERT INTO tender_type_definitions (
  code, name, description, procurement_type,
  min_value_bdt, max_value_bdt,
  requires_tender_security, tender_security_percent,
  requires_performance_security, performance_security_percent,
  requires_two_envelope, requires_newspaper_ad, requires_prequalification,
  min_submission_days, max_submission_days, default_validity_days,
  section_count, is_international, is_direct_procurement, is_govt_type, is_active
) VALUES (
  'NRQ3',
  'Detailed Tender (above $50,000)',
  'Formal commercial tendering with comprehensive requirements. 2% bid security required. Two-envelope evaluation. Suitable for large equipment purchases, construction, long-term service contracts.',
  'goods',
  5000001, NULL,  -- Above ~$50k USD, no upper limit
  TRUE, 2.00,  -- 2% bid security required
  TRUE, 10.00,  -- 10% performance security
  TRUE, FALSE, FALSE,  -- Two-envelope system
  10, 21, 90,  -- 10-21 days submission, 90 days validity
  6, FALSE, FALSE, FALSE, TRUE  -- 6 sections, NON-GOVT type
) ON CONFLICT (code) DO NOTHING;

COMMIT;

-- Verify
-- SELECT code, name, is_govt_type 
-- FROM tender_type_definitions 
-- WHERE is_govt_type = FALSE;
-- Should return NRQ1, NRQ2, NRQ3
