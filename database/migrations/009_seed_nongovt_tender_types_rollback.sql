-- Rollback: 009_seed_nongovt_tender_types_rollback.sql
-- Description: Remove non-government tender types
-- Phase 2, Task 6

BEGIN;

-- Remove non-government tender types
DELETE FROM tender_type_definitions 
WHERE code IN ('NRQ1', 'NRQ2', 'NRQ3');

COMMIT;
