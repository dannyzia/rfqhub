-- Migration Setup for AlwaysData Test Database
-- Run: psql $DATABASE_URL -f backend/setup_migrations.sql

BEGIN;

-- 1. Create tender_type_definitions table
\i database/migrations/001_create_tender_type_definitions.sql

-- 2. Seed government tender types (PG types)
\i database/migrations/003_seed_tender_types.sql

-- 3. Seed non-government tender types (includes NRQ1, NRQ2, NRQ3)
\i database/migrations/009_seed_nongovt_tender_types.sql

-- 4. Extend table structure
\i database/migrations/013_extend_tender_type_definitions.sql

-- 5. Fix foreign key
\i database/migrations/019_fix_tender_type_fk.sql

COMMIT;

-- Verification queries
SELECT code, name, is_govt_type, is_active 
FROM tender_type_definitions 
WHERE code = 'NRQ1';

SELECT code, name, is_govt_type, is_active 
FROM tender_type_definitions 
WHERE code = 'NRQ2';

SELECT code, name, is_govt_type, is_active 
FROM tender_type_definitions 
WHERE code = 'NRQ3';

SELECT code, name, is_govt_type, is_active 
FROM tender_type_definitions 
WHERE code = 'PG1';

SELECT COUNT(*) as total_types 
FROM tender_type_definitions 
WHERE is_active = TRUE;
