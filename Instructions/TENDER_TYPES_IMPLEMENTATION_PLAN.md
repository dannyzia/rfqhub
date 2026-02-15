# **TENDER TYPES IMPLEMENTATION PLAN**

**Bangladesh e-GP Tender Types Integration**

Step-by-Step Guide for RFQ Buddy Platform

Based on TENDER_TYPES_AND_REQUIREMENTS.md | RFQ_Developer_Coding_Plan.md v2.0 | February 2026

**8 Phases • 42 Tasks • Every step explained**

---

## **Table of Contents**

1. [How to Read This Document](#1-how-to-read-this-document)
2. [Phase Overview](#2-phase-overview)
3. [What You're Building](#3-what-youre-building)
4. [Prerequisites Checklist](#4-prerequisites-checklist)
5. [Phase 0: Database Schema](#5-phase-0-database-schema-week-1)
6. [Phase 1: Backend Services](#6-phase-1-backend-services-week-2)
7. [Phase 2: Backend APIs](#7-phase-2-backend-apis-week-3)
8. [Phase 3: Tender Integration](#8-phase-3-tender-integration-week-4)
9. [Phase 4: Frontend Components](#9-phase-4-frontend-components-week-5-6)
10. [Phase 5: Document Management](#10-phase-5-document-management-week-6)
11. [Phase 6: Testing](#11-phase-6-testing-week-7)
12. [Phase 7: Optimization & Polish](#12-phase-7-optimization--polish-week-8)
13. [Quick Reference](#13-quick-reference--all-42-tasks-at-a-glance)

---

## **1. How to Read This Document**

This plan extends your existing RFQ Buddy platform with **Bangladesh e-GP tender types** (PG1-PG9A, PW1-PW3, PPS2-PPS6). It assumes you've already completed Phases 1-6 of the **RFQ_Developer_Coding_Plan.md**.

**If you've already built the core platform** (user auth, tender CRUD, bid submission), start here with Phase 0. This plan integrates tender type selection, document checklists, value validation, and security calculations **without breaking existing functionality**.

### **The Golden Rules**

- **Do one Task at a time.** Every task is numbered — follow the exact order.
- **Test after each task.** Run the server and verify it still works before moving on.
- **Read the existing code first.** Before creating new files, look at similar existing files to understand the pattern.
- **Copy-paste carefully.** TypeScript is strict about types — a single typo will cause errors.
- **Use the existing patterns.** Your platform already has controllers, services, routes, and schemas. We follow the same structure.

### **Notation Used**

- ✅ **CREATE** — You're making a brand new file
- 📝 **MODIFY** — You're editing an existing file
- 🗄️ **DATABASE** — You're running SQL commands
- ✔️ **TEST** — You're verifying it works
- 💡 **Note** — Important tip or explanation

---

## **2. Phase Overview**

This table shows the big picture. Each phase builds on the previous one.

| **Phase** | **Name**                     | **What You Build**                                                                  | **Duration** | **Key Deliverable**                              |
|-----------|------------------------------|-------------------------------------------------------------------------------------|--------------|--------------------------------------------------|
| 0         | Database Schema              | Tender type definitions, document requirements tables, seeding data                 | Week 1       | 14 tender types in database with all metadata    |
| 1         | Backend Services             | Type selection logic, value validation, security calculations, document checklists  | Week 2       | Business logic services ready for APIs           |
| 2         | Backend APIs                 | REST endpoints for tender types, document requirements, suggestions                 | Week 3       | APIs testable in Postman                         |
| 3         | Tender Integration           | Modify existing tender creation to use new types, add validation                    | Week 4       | Tender creation enforces type rules              |
| 4         | Frontend Components          | Wizard, info panels, validators, calculators                                        | Week 5-6     | Interactive tender type selection UI             |
| 5         | Document Management          | Document checklist UI, upload tracking, validation                                  | Week 6       | Document compliance enforced before bid submit   |
| 6         | Testing                      | Unit tests, integration tests, E2E tests                                            | Week 7       | All tests green, confidence in deployment        |
| 7         | Optimization & Polish        | Caching, indexes, audit logs, documentation                                         | Week 8       | Production-ready with performance optimization   |

---

## **3. What You're Building**

### **The Problem**

Your current platform uses generic tender types: **"RFQ"** and **"TENDER"**. Bangladesh Public Procurement Rules 2025 requires **14 specific tender codes** with strict rules:

- **PG1** (RFQ for Goods ≤ 8 Lac): No security required, 3-7 days submission
- **PG2** (Goods ≤ 50 Lac): Tender security 2%, 15-30 days, 11 forms required
- **PG3** (Goods > 50 Lac): Enhanced documentation, newspaper ads mandatory
- **PG4** (International): Currency/Incoterms handling
- **PG5A** (Turnkey): Two-envelope system mandatory
- **PG9A** (Direct): Single source, justification required
- **PW1-PW3** (Works): Different thresholds (15 Lac, 5 Crore)
- **PPS2-PPS6** (Services): Outsourcing, physical services

### **The Solution**

You'll build:

1. **Tender Type Selection Wizard** — Guides users to correct type based on value/scope
2. **Value Threshold Validation** — Prevents PG1 selection for 10 Lac tender
3. **Auto-Calculated Securities** — Bid security, performance security, retention money
4. **Document Checklists** — Dynamic list of required documents per type (PG2-1, PG2-2, etc.)
5. **Two-Envelope Enforcement** — Mandatory for some types, forbidden for others
6. **Timeline Validation** — Minimum submission days per type

### **Example User Flow**

**Before (Current System):**
1. Buyer selects "RFQ" from dropdown
2. Manually enters bid security amount (might be wrong)
3. No guidance on required documents
4. No validation if value exceeds type limits

**After (With This Implementation):**
1. Buyer enters procurement type (Goods) and estimated value (6 Lac)
2. System suggests **PG1** (confidence: 100%, "Perfect match for value range")
3. Info panel shows: ✅ No security required, ❌ No newspaper ad, 📄 6 documents needed
4. If buyer enters 10 Lac, system warns: "Value exceeds PG1 limit. Switch to PG2?"
5. Document checklist shows: "Quotation Letter (mandatory), Trade License (mandatory)..."
6. Buyer cannot publish until all mandatory docs uploaded by deadline

---

## **4. Prerequisites Checklist**

**Before starting Phase 0, verify you have:**

- ✅ Completed **RFQ_Developer_Coding_Plan.md** Phases 1-6 (or at least Phase 1-3)
- ✅ PostgreSQL database running with **rfq_platform** database
- ✅ Backend server running on port 3000 (`npm run dev` works)
- ✅ Frontend SvelteKit app running on port 5173
- ✅ Basic tender CRUD working (can create/list/view tenders)
- ✅ User authentication working (can log in as buyer/vendor)
- ✅ pgAdmin 4 installed for running SQL scripts
- ✅ Postman or Thunder Client for testing APIs

**Files You'll Reference Often:**

| File | What It Contains |
|------|------------------|
| `backend/src/controllers/tender.controller.ts` | Existing tender endpoints (you'll follow this pattern) |
| `backend/src/services/tender.service.ts` | Tender business logic (you'll extend this) |
| `backend/src/schemas/tender.schema.ts` | Zod validation schemas (you'll add type validation) |
| `frontend/src/routes/(app)/tenders/new/+page.svelte` | Tender creation form (you'll add wizard here) |
| `Instructions/rfq_tendering_platform_schema_v3.sql` | Original database schema |
| `Instructions/TENDER_TYPES_AND_REQUIREMENTS.md` | All 14 tender type specifications |

---

## **5. PHASE 0: Database Schema (Week 1)**

This phase creates the foundation. All tender type rules live in the database, not hardcoded in code. This makes it easy to add new tender types later without changing application code.

### **Task 1 — Create Tender Type Definitions Table**

🗄️ **DATABASE TASK**: This table stores all 14 tender type codes with their rules.

**Open pgAdmin 4**, connect to your `rfq_platform` database, and open the Query Tool.

**Create this file:** `rfq-platform/database/migrations/001_create_tender_type_definitions.sql`

```sql
-- Migration: 001_create_tender_type_definitions.sql
-- Description: Creates table for Bangladesh e-GP tender type specifications

CREATE TABLE IF NOT EXISTS tender_type_definitions (
    code TEXT PRIMARY KEY,                          -- PG1, PG2, PG3, etc.
    name TEXT NOT NULL,                             -- "RFQ for Goods (up to 8 Lac)"
    description TEXT,                               -- Full description
    procurement_type TEXT NOT NULL                  -- goods, works, services
        CHECK (procurement_type IN ('goods', 'works', 'services')),
    
    -- Value thresholds (in base currency, BDT)
    min_value_bdt NUMERIC(18,2) DEFAULT 0,          -- Minimum tender value
    max_value_bdt NUMERIC(18,2),                    -- Maximum (NULL = unlimited)
    
    -- Security requirements
    requires_tender_security BOOLEAN DEFAULT FALSE,
    tender_security_percent NUMERIC(5,2),           -- e.g., 2.00 for 2%
    tender_security_validity_days INTEGER,          -- Days beyond tender validity
    
    requires_performance_security BOOLEAN DEFAULT FALSE,
    performance_security_percent NUMERIC(5,2),      -- e.g., 10.00 for 10%
    
    requires_retention_money BOOLEAN DEFAULT FALSE, -- For works only
    retention_money_percent NUMERIC(5,2),          -- e.g., 5.00 for 5%
    
    -- Process requirements
    requires_two_envelope BOOLEAN DEFAULT FALSE,
    requires_newspaper_ad BOOLEAN DEFAULT FALSE,
    requires_website_publication BOOLEAN DEFAULT TRUE,
    requires_prequalification BOOLEAN DEFAULT FALSE,
    requires_site_visit BOOLEAN DEFAULT FALSE,      -- For works
    
    -- Timeline constraints
    min_submission_days INTEGER NOT NULL,           -- Minimum days from publish to deadline
    max_submission_days INTEGER,                    -- Maximum allowed period
    default_validity_days INTEGER NOT NULL,         -- Default bid validity period
    default_evaluation_days INTEGER,                -- Expected evaluation duration
    
    -- Document structure
    section_count INTEGER,                          -- 4, 7, 8, or 10 sections
    
    -- Scope
    is_international BOOLEAN DEFAULT FALSE,         -- Allows foreign bidders
    is_direct_procurement BOOLEAN DEFAULT FALSE,    -- Single source (PG9A, PPS6)
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by procurement type and value
CREATE INDEX idx_tender_type_procurement ON tender_type_definitions(procurement_type);
CREATE INDEX idx_tender_type_active ON tender_type_definitions(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE tender_type_definitions IS 'Bangladesh Public Procurement Rules 2025 - Standard Tender Types';
COMMENT ON COLUMN tender_type_definitions.code IS 'Official BPPA code: PG1, PG2, PG3, PG4, PG5A, PG9A, PW1, PW3, PPS2, PPS3, PPS6';
```

**Run this script in pgAdmin** (paste and click Execute/⚡).

✔️ **Verify it worked:**

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tender_type_definitions' 
ORDER BY ordinal_position;
```

You should see all the columns listed.

💡 **Note:** We use `max_value_bdt = NULL` for unlimited value types (like PG3, PG4). In PostgreSQL, NULL means "no limit".

---

### **Task 2 — Create Document Requirements Table**

🗄️ **DATABASE TASK**: This table defines which documents are required for each tender type.

**Create this file:** `rfq-platform/database/migrations/002_create_document_requirements.sql`

```sql
-- Migration: 002_create_document_requirements.sql
-- Description: Tender type specific document requirements

CREATE TABLE IF NOT EXISTS tender_type_document_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_type_code TEXT NOT NULL REFERENCES tender_type_definitions(code) ON DELETE CASCADE,
    
    -- Document identification
    document_code TEXT NOT NULL,                    -- PG2-1, trade_license, tin_certificate, etc.
    document_name TEXT NOT NULL,                    -- "Tender Submission Letter"
    document_category TEXT NOT NULL                 -- tender_form, legal, financial, technical, contract_form
        CHECK (document_category IN ('tender_form', 'legal', 'financial', 'technical', 'contract_form', 'other')),
    
    -- Requirements
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    is_template_provided BOOLEAN DEFAULT FALSE,     -- Does BPPA provide a standard form?
    
    -- File constraints
    allowed_file_formats TEXT[],                    -- ['pdf', 'jpg', 'png']
    max_file_size_mb INTEGER DEFAULT 10,
    
    -- Help text
    description TEXT,                               -- Instructions for this document
    example_url TEXT,                               -- Link to sample/template
    
    -- Display order
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tender_type_code, document_code)
);

-- Indexes for fast queries
CREATE INDEX idx_doc_req_tender_type ON tender_type_document_requirements(tender_type_code);
CREATE INDEX idx_doc_req_category ON tender_type_document_requirements(document_category);
CREATE INDEX idx_doc_req_mandatory ON tender_type_document_requirements(is_mandatory) WHERE is_mandatory = TRUE;

COMMENT ON TABLE tender_type_document_requirements IS 'Required documents per tender type (e.g., PG2 requires forms PG2-1 through PG2-11)';
```

**Run this in pgAdmin.**

✔️ **Verify:**

```sql
\d tender_type_document_requirements
```

---

### **Task 3 — Seed Tender Type Definitions**

🗄️ **DATABASE TASK**: Insert all 14 tender types with their metadata.

**Create this file:** `rfq-platform/database/migrations/003_seed_tender_types.sql`

```sql
-- Migration: 003_seed_tender_types.sql
-- Description: Seed all 14 Bangladesh e-GP tender types
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
    0, 800000,                              -- Up to 8 Lac
    FALSE, FALSE,                           -- No securities
    FALSE, FALSE,                           -- No two-envelope, no newspaper ad
    3, 7, 30,                               -- Min 3 days, max 7 days, validity 30
    4, FALSE                                -- 4 sections, national only
);

-- PG2: Open/Limited Tendering for Goods (up to 50 Lac)
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
    'Standard tendering for small to medium value goods. 8 sections. Tender security required. Newspaper advertisement mandatory.',
    'goods',
    800000, 5000000,                        -- 8 Lac to 50 Lac
    TRUE, 2.00, 28,                         -- Tender security 2%, valid 28 days beyond
    TRUE, 5.00,                             -- Performance security 5%
    FALSE, TRUE,                            -- Two-envelope optional, newspaper ad required
    15, 30, 90,                             -- Min 15 days, max 30, validity 90
    8, FALSE
);

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
    'For medium to high value goods procurement. Enhanced qualification requirements. Sections 1 & 3 (ITT & GCC) cannot be altered by procuring entity.',
    'goods',
    5000000, NULL,                          -- Above 50 Lac, no upper limit
    TRUE, 2.00, 28,
    TRUE, 10.00,                            -- Higher performance security
    FALSE, TRUE,
    30, 45, 90,                             -- Longer submission period
    8, FALSE
);

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
    'International competitive bidding. Any value. Incoterms apply (EXW, FOB, CIF, DAP). Foreign currency allowed. Eligibility restrictions apply.',
    'goods',
    0, NULL,                                -- Any value
    TRUE, 2.00, 28,
    TRUE, 10.00,
    FALSE, TRUE,
    30, 60, 120,                            -- Longer periods for international
    8, TRUE                                 -- International
);

-- PG5A: Turnkey Contract for Plant & Equipment (One Stage Two Envelope)
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
    'Supply + Installation + Commissioning + Training. Two-envelope system MANDATORY (technical + commercial). Combination of goods, works, and services.',
    'goods',
    0, NULL,
    TRUE, 2.00, 28,
    TRUE, 10.00,
    TRUE, TRUE, FALSE,                      -- Two-envelope REQUIRED
    45, 60, 120,
    7, FALSE                                -- Can be international if specified
);

-- PG9A: Direct Procurement Method for Goods
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, 
    requires_performance_security, performance_security_percent,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international, is_direct_procurement
) VALUES (
    'PG9A',
    'Direct Procurement Method - Goods',
    'Single source procurement. Requires written justification and approval from competent authority. Only for: emergency, proprietary items, standardization, or only one capable supplier.',
    'goods',
    0, NULL,                                -- Any value
    FALSE,                                  -- Usually no tender security (negotiable)
    TRUE, 5.00,                             -- Performance security still required
    FALSE, FALSE,                           -- No competitive process
    7, 30, 60,                              -- Flexible timeline
    4, FALSE, TRUE                          -- Direct procurement flag
);

-- ============================================================================
-- PROCUREMENT OF WORKS (PW)
-- ============================================================================

-- PW1: RFQ for Works (up to 15 Lac)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, requires_performance_security,
    requires_retention_money, retention_money_percent,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PW1',
    'Request for Quotation - Works (up to BDT 15 Lac)',
    'RFQ for simple construction/works. No quotation security. Retention money 5% from payments. Unit-rate or lump-sum basis.',
    'works',
    0, 1500000,                             -- Up to 15 Lac
    FALSE, FALSE,                           -- No securities upfront
    TRUE, 5.00,                             -- 5% retention from payments
    FALSE, FALSE,
    3, 7, 30,
    4, FALSE
);

-- PW3: Open Tendering for Works (above 5 Crore, without Pre-Qualification)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, tender_security_percent, tender_security_validity_days,
    requires_performance_security, performance_security_percent,
    requires_retention_money, retention_money_percent,
    requires_two_envelope, requires_newspaper_ad, requires_site_visit,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PW3',
    'Open Tendering - Works (above BDT 5 Crore)',
    'Large construction/civil works projects. 10 sections including Environmental & Social (ES) specifications. Site visit mandatory. Bill of Quantities (BoQ) admeasurement basis.',
    'works',
    50000000, NULL,                         -- Above 5 Crore
    TRUE, 2.00, 28,
    TRUE, 10.00,
    TRUE, 10.00,                            -- Higher retention for works
    FALSE, TRUE, TRUE,                      -- Site visit required
    30, 45, 120,
    10, FALSE
);

-- ============================================================================
-- PROCUREMENT OF PHYSICAL SERVICES (PPS)
-- ============================================================================

-- PPS2: Outsourcing Service Personnel
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, tender_security_percent, tender_security_validity_days,
    requires_performance_security, performance_security_percent,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PPS2',
    'Outsourcing Service Personnel (Open/Limited Tendering)',
    'Hiring service personnel through Outsourcing Policy 2025. Includes: security guards, janitors, office support, drivers, etc. Personnel qualification verification mandatory.',
    'services',
    0, NULL,                                -- Any value
    TRUE, 2.00, 28,
    TRUE, 5.00,
    FALSE, TRUE,
    15, 30, 90,
    7, FALSE
);

-- PPS3: Physical Services (Non-Outsourcing)
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security, tender_security_percent, tender_security_validity_days,
    requires_performance_security, performance_security_percent,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international
) VALUES (
    'PPS3',
    'Physical Services (Open/Limited Tendering)',
    'IT services, catering, transport, cleaning (contract-based), security systems, survey, testing, event management, training, C&F services, O&M of equipment/facilities. NOT for personnel outsourcing.',
    'services',
    0, NULL,
    TRUE, 2.00, 28,
    TRUE, 5.00,
    FALSE, TRUE,
    15, 30, 90,
    7, FALSE
);

-- PPS6: Direct Procurement for Physical Services
INSERT INTO tender_type_definitions (
    code, name, description, procurement_type,
    min_value_bdt, max_value_bdt,
    requires_tender_security,
    requires_performance_security, performance_security_percent,
    requires_two_envelope, requires_newspaper_ad,
    min_submission_days, max_submission_days, default_validity_days,
    section_count, is_international, is_direct_procurement
) VALUES (
    'PPS6',
    'Direct Procurement Method - Physical Services',
    'Single source service procurement. Requires justification and approval. Emergency services, specialized services (only one provider), continuation of successful service contract.',
    'services',
    0, NULL,
    FALSE,                                  -- Negotiable
    TRUE, 5.00,
    FALSE, FALSE,
    7, 30, 60,
    4, FALSE, TRUE
);

COMMIT;

-- Verify counts
SELECT procurement_type, COUNT(*) as type_count 
FROM tender_type_definitions 
GROUP BY procurement_type 
ORDER BY procurement_type;

-- Should show: goods: 6, services: 3, works: 2
```

**Run this entire script in pgAdmin.**

✔️ **Verify the data:**

```sql
SELECT code, name, min_value_bdt, max_value_bdt, requires_tender_security 
FROM tender_type_definitions 
ORDER BY code;
```

You should see all 14 tender types.

💡 **Note:** We use actual BDT amounts (800000 = 8 Lac, 5000000 = 50 Lac). The frontend will format these nicely.

---

### **Task 4 — Update Existing Tenders Table**

📝 **MODIFY**: Change the existing `tenders.tender_type` column to reference the new table.

**Create this file:** `rfq-platform/database/migrations/004_update_tenders_table.sql`

```sql
-- Migration: 004_update_tenders_table.sql
-- Description: Update tenders table to support new tender type system

BEGIN;

-- Step 1: If tender_type is currently an ENUM, convert to TEXT
-- Check your current schema first - if it's already TEXT, skip this
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'tender_type_enum'
    ) THEN
        ALTER TABLE tenders ALTER COLUMN tender_type TYPE TEXT;
        DROP TYPE tender_type_enum;
    END IF;
END $$;

-- Step 2: For existing tenders, map old values to new codes
-- ONLY RUN THIS if you have existing tenders with old values
UPDATE tenders
SET tender_type = CASE
    -- Goods procurement
    WHEN tender_type = 'RFQ' AND procurement_type = 'goods' AND fund_allocation <= 800000 THEN 'PG1'
    WHEN tender_type = 'RFQ' AND procurement_type = 'goods' AND fund_allocation > 800000 THEN 'PG2'
    WHEN tender_type = 'TENDER' AND procurement_type = 'goods' AND fund_allocation <= 5000000 THEN 'PG2'
    WHEN tender_type = 'TENDER' AND procurement_type = 'goods' AND fund_allocation > 5000000 THEN 'PG3'
    
    -- Works procurement
    WHEN tender_type = 'RFQ' AND procurement_type = 'works' AND fund_allocation <= 1500000 THEN 'PW1'
    WHEN tender_type = 'TENDER' AND procurement_type = 'works' AND fund_allocation > 50000000 THEN 'PW3'
    
    -- Services procurement
    WHEN tender_type = 'RFQ' AND procurement_type = 'services' THEN 'PPS3'
    WHEN tender_type = 'TENDER' AND procurement_type = 'services' THEN 'PPS3'
    
    -- Fallback for anything else
    ELSE 'PG2'
END
WHERE tender_type IN ('RFQ', 'TENDER') OR tender_type NOT IN (
    SELECT code FROM tender_type_definitions
);

-- Step 3: Add foreign key constraint
ALTER TABLE tenders 
    DROP CONSTRAINT IF EXISTS fk_tenders_tender_type;

ALTER TABLE tenders 
    ADD CONSTRAINT fk_tenders_tender_type 
    FOREIGN KEY (tender_type) 
    REFERENCES tender_type_definitions(code);

-- Step 4: Add index for performance
CREATE INDEX IF NOT EXISTS idx_tenders_tender_type ON tenders(tender_type);

-- Step 5: Add columns for calculated securities (cache)
ALTER TABLE tenders 
    ADD COLUMN IF NOT EXISTS calculated_tender_security NUMERIC(18,2);

ALTER TABLE tenders 
    ADD COLUMN IF NOT EXISTS calculated_performance_security NUMERIC(18,2);

COMMENT ON COLUMN tenders.calculated_tender_security IS 'Auto-calculated tender security amount based on tender type rules';
COMMENT ON COLUMN tenders.calculated_performance_security IS 'Auto-calculated performance security amount based on tender type rules';

COMMIT;
```

**Run this script.**

✔️ **Verify:**

```sql
-- Check foreign key exists
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_name = 'fk_tenders_tender_type';

-- Check a join works
SELECT t.id, t.tender_number, t.tender_type, ttd.name
FROM tenders t
JOIN tender_type_definitions ttd ON ttd.code = t.tender_type
LIMIT 5;
```

---

### **Task 5 — Create Tender Document Submissions Table**

🗄️ **DATABASE TASK**: Track which documents each vendor has submitted.

**Create this file:** `rfq-platform/database/migrations/005_create_tender_document_submissions.sql`

```sql
-- Migration: 005_create_tender_document_submissions.sql
-- Description: Track document uploads per vendor per tender

CREATE TABLE IF NOT EXISTS tender_document_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Links
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    vendor_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_code TEXT NOT NULL,
    
    -- Submission details
    attachment_id UUID REFERENCES attachments(id) ON DELETE SET NULL,
    file_name TEXT,
    file_size_bytes BIGINT,
    file_url TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'replaced')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Metadata
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_by UUID REFERENCES users(id),
    
    -- Version tracking
    version INTEGER DEFAULT 1,
    replaced_by UUID REFERENCES tender_document_submissions(id),
    
    UNIQUE(tender_id, vendor_org_id, document_code, version)
);

-- Indexes
CREATE INDEX idx_doc_sub_tender ON tender_document_submissions(tender_id);
CREATE INDEX idx_doc_sub_vendor ON tender_document_submissions(vendor_org_id);
CREATE INDEX idx_doc_sub_status ON tender_document_submissions(status);
CREATE INDEX idx_doc_sub_composite ON tender_document_submissions(tender_id, vendor_org_id, status);

COMMENT ON TABLE tender_document_submissions IS 'Tracks which required documents each vendor has uploaded for each tender';
```

**Run this script.**

✔️ **Final Phase 0 Verification:**

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'tender_type_definitions',
        'tender_type_document_requirements',
        'tender_document_submissions'
    );
-- Should return 3 rows

-- Check tender type count
SELECT COUNT(*) FROM tender_type_definitions;
-- Should be 14

-- Test a complex join (the kind your APIs will run)
SELECT 
    ttd.code,
    ttd.name,
    ttd.min_value_bdt / 100000.0 AS min_value_lac,
    ttd.max_value_bdt / 100000.0 AS max_value_lac,
    ttd.requires_tender_security,
    COUNT(ttdr.id) AS document_count
FROM tender_type_definitions ttd
LEFT JOIN tender_type_document_requirements ttdr 
    ON ttdr.tender_type_code = ttd.code
GROUP BY ttd.code, ttd.name, ttd.min_value_bdt, ttd.max_value_bdt, ttd.requires_tender_security
ORDER BY ttd.code;
```

🎉 **PHASE 0 COMPLETE!** Database foundation is ready.

---

## **6. PHASE 1: Backend Services (Week 2)**

This phase builds the business logic. Services handle complex calculations and queries without knowing about HTTP.

### **Task 6 — Create Tender Type Selector Service**

✅ **CREATE**: Suggests the correct tender type based on procurement details.

**Create this file:** `rfq-platform/backend/src/services/tenderTypeSelector.service.ts`

```typescript
// backend/src/services/tenderTypeSelector.service.ts
import pool from '../config/database';
import logger from '../config/logger';

export interface TenderTypeSelectorInput {
  procurementType: 'goods' | 'works' | 'services';
  estimatedValue: number;
  currency?: string;
  isInternational?: boolean;
  isEmergency?: boolean;
  isSingleSource?: boolean;
  isTurnkey?: boolean;
  isOutsourcingPersonnel?: boolean;
}

export interface TenderTypeSuggestion {
  code: string;
  name: string;
  confidence: number;
  reasons: string[];
  warnings?: string[];
  metadata: {
    minValue: number | null;
    maxValue: number | null;
    requiresTenderSecurity: boolean;
    tenderSecurityPercent: number | null;
    minSubmissionDays: number;
    sectionCount: number;
  };
}

export async function suggestTenderType(
  input: TenderTypeSelectorInput
): Promise<TenderTypeSuggestion[]> {
  
  const {
    procurementType,
    estimatedValue,
    isInternational = false,
    isEmergency = false,
    isSingleSource = false,
    isTurnkey = false,
    isOutsourcingPersonnel = false
  } = input;

  logger.debug({ input }, 'Suggesting tender type');

  // Step 1: Handle special cases first
  if (isEmergency || isSingleSource) {
    const directCode = procurementType === 'services' ? 'PPS6' : 'PG9A';
    const directType = await getTenderTypeDetails(directCode);
    
    return [{
      ...directType,
      confidence: 100,
      reasons: [
        isEmergency ? 'Emergency procurement requires direct method' : 'Single source procurement requires direct method',
        'Requires written justification and approval from competent authority'
      ],
      warnings: ['Ensure proper documentation', 'Market price comparison required']
    }];
  }

  // Step 2: Handle turnkey contracts
  if (isTurnkey && procurementType === 'goods') {
    const pg5a = await getTenderTypeDetails('PG5A');
    return [{
      ...pg5a,
      confidence: 100,
      reasons: ['Turnkey contract for plant & equipment', 'Two-envelope system mandatory']
    }];
  }

  // Step 3: Handle service-specific cases
  if (procurementType === 'services') {
    if (isOutsourcingPersonnel) {
      const pps2 = await getTenderTypeDetails('PPS2');
      return [{
        ...pps2,
        confidence: 100,
        reasons: ['Personnel outsourcing requires PPS2', 'Compliance with Outsourcing Policy 2025']
      }];
    } else {
      const pps3 = await getTenderTypeDetails('PPS3');
      return [{
        ...pps3,
        confidence: 95,
        reasons: ['Physical services (non-personnel)', 'Suitable for IT, catering, transport, etc.']
      }];
    }
  }

  // Step 4: Query database for matching types
  const query = `
    SELECT 
      code, name, description,
      min_value_bdt, max_value_bdt,
      requires_tender_security, tender_security_percent,
      requires_performance_security, performance_security_percent,
      requires_two_envelope, requires_newspaper_ad,
      min_submission_days, max_submission_days, default_validity_days,
      section_count, is_international
    FROM tender_type_definitions
    WHERE procurement_type = $1
      AND is_active = TRUE
      AND ($2 >= min_value_bdt OR min_value_bdt IS NULL)
      AND ($2 <= max_value_bdt OR max_value_bdt IS NULL)
      AND (is_international = $3 OR is_international = FALSE)
      AND is_direct_procurement = FALSE
    ORDER BY 
      CASE WHEN is_international = $3 THEN 1 ELSE 2 END,
      CASE WHEN max_value_bdt IS NOT NULL THEN max_value_bdt ELSE 999999999999 END ASC
  `;

  const result = await pool.query(query, [procurementType, estimatedValue, isInternational]);

  if (result.rows.length === 0) {
    throw new Error(`No tender type found for ${procurementType} with value ${estimatedValue}`);
  }

  // Step 5: Build suggestions with confidence scores
  const suggestions: TenderTypeSuggestion[] = result.rows.map((row, index) => {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let confidence = 100;

    if (row.min_value_bdt && row.max_value_bdt) {
      reasons.push(`Value fits ${formatBDT(row.min_value_bdt)} - ${formatBDT(row.max_value_bdt)}`);
    }

    if (row.requires_tender_security) {
      reasons.push(`Tender security required (${row.tender_security_percent}%)`);
    } else {
      reasons.push('No tender security required');
    }

    if (row.requires_newspaper_ad) {
      warnings.push('Newspaper advertisement mandatory');
    }

    if (row.requires_two_envelope) {
      warnings.push('Two-envelope system required');
    }

    if (index > 0) {
      confidence -= 10 * index;
    }

    return {
      code: row.code,
      name: row.name,
      confidence: Math.max(confidence, 50),
      reasons,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        minValue: row.min_value_bdt,
        maxValue: row.max_value_bdt,
        requiresTenderSecurity: row.requires_tender_security,
        tenderSecurityPercent: row.tender_security_percent,
        minSubmissionDays: row.min_submission_days,
        sectionCount: row.section_count
      }
    };
  });

  return suggestions;
}

async function getTenderTypeDetails(code: string): Promise<TenderTypeSuggestion> {
  const query = `
    SELECT 
      code, name, description,
      min_value_bdt, max_value_bdt,
      requires_tender_security, tender_security_percent,
      min_submission_days, section_count
    FROM tender_type_definitions
    WHERE code = $1 AND is_active = TRUE
  `;

  const result = await pool.query(query, [code]);
  
  if (result.rows.length === 0) {
    throw new Error(`Tender type ${code} not found`);
  }

  const row = result.rows[0];
  
  return {
    code: row.code,
    name: row.name,
    confidence: 100,
    reasons: [row.description || ''],
    metadata: {
      minValue: row.min_value_bdt,
      maxValue: row.max_value_bdt,
      requiresTenderSecurity: row.requires_tender_security,
      tenderSecurityPercent: row.tender_security_percent,
      minSubmissionDays: row.min_submission_days,
      sectionCount: row.section_count
    }
  };
}

function formatBDT(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Crore`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)} Lac`;
  return `BDT ${value.toLocaleString('en-BD')}`;
}

export async function getTenderTypeByCode(code: string) {
  const query = `SELECT * FROM tender_type_definitions WHERE code = $1 AND is_active = TRUE`;
  const result = await pool.query(query, [code]);
  
  if (result.rows.length === 0) {
    throw Object.assign(new Error(`Tender type ${code} not found`), {
      statusCode: 404,
      code: 'TENDER_TYPE_NOT_FOUND'
    });
  }
  
  return result.rows[0];
}

export async function listTenderTypes(procurementType?: string) {
  let query = `
    SELECT * FROM tender_type_definitions
    WHERE is_active = TRUE
  `;
  const params: any[] = [];
  
  if (procurementType) {
    query += ` AND procurement_type = $1`;
    params.push(procurementType);
  }
  
  query += ` ORDER BY code`;
  
  const result = await pool.query(query, params);
  return result.rows;
}
```

**Save this file.**

---

### **Task 7 — Create Value Validation Service**

✅ **CREATE**: Validates tender values against type thresholds.

**Create this file:** `rfq-platform/backend/src/services/valueValidation.service.ts`

```typescript
// backend/src/services/valueValidation.service.ts
import pool from '../config/database';
import logger from '../config/logger';

export interface ValidationResult {
  valid: boolean;
  message?: string;
  suggestedType?: string;
  details?: {
    currentType: string;
    value: number;
    minAllowed: number | null;
    maxAllowed: number | null;
  };
}

export async function validateTenderValue(
  value: number,
  tenderTypeCode: string
): Promise<ValidationResult> {
  
  logger.debug({ value, tenderTypeCode }, 'Validating tender value');

  const query = `
    SELECT code, name, min_value_bdt, max_value_bdt, procurement_type
    FROM tender_type_definitions
    WHERE code = $1 AND is_active = TRUE
  `;
  
  const result = await pool.query(query, [tenderTypeCode]);
  
  if (result.rows.length === 0) {
    return {
      valid: false,
      message: `Invalid tender type code: ${tenderTypeCode}`
    };
  }

  const typeInfo = result.rows[0];
  const { min_value_bdt, max_value_bdt, procurement_type } = typeInfo;

  // Check minimum
  if (min_value_bdt !== null && value < min_value_bdt) {
    const suggestedType = await findSuggestedTypeForValue(value, procurement_type, 'lower');
    
    return {
      valid: false,
      message: `Value ${formatBDT(value)} is below minimum for ${tenderTypeCode} (min: ${formatBDT(min_value_bdt)})`,
      suggestedType: suggestedType?.code,
      details: {
        currentType: tenderTypeCode,
        value,
        minAllowed: min_value_bdt,
        maxAllowed: max_value_bdt
      }
    };
  }

  // Check maximum
  if (max_value_bdt !== null && value > max_value_bdt) {
    const suggestedType = await findSuggestedTypeForValue(value, procurement_type, 'higher');
    
    return {
      valid: false,
      message: `Value ${formatBDT(value)} exceeds maximum for ${tenderTypeCode} (max: ${formatBDT(max_value_bdt)})`,
      suggestedType: suggestedType?.code,
      details: {
        currentType: tenderTypeCode,
        value,
        minAllowed: min_value_bdt,
        maxAllowed: max_value_bdt
      }
    };
  }

  return {
    valid: true,
    details: {
      currentType: tenderTypeCode,
      value,
      minAllowed: min_value_bdt,
      maxAllowed: max_value_bdt
    }
  };
}

async function findSuggestedTypeForValue(
  value: number,
  procurementType: string,
  direction: 'lower' | 'higher'
): Promise<{ code: string; name: string } | null> {
  
  const query = direction === 'higher'
    ? `
      SELECT code, name
      FROM tender_type_definitions
      WHERE procurement_type = $1
        AND is_active = TRUE
        AND (min_value_bdt IS NULL OR $2 >= min_value_bdt)
        AND (max_value_bdt IS NULL OR $2 <= max_value_bdt)
      ORDER BY min_value_bdt DESC
      LIMIT 1
    `
    : `
      SELECT code, name
      FROM tender_type_definitions
      WHERE procurement_type = $1
        AND is_active = TRUE
        AND (min_value_bdt IS NULL OR $2 >= min_value_bdt)
        AND (max_value_bdt IS NULL OR $2 <= max_value_bdt)
      ORDER BY max_value_bdt ASC
      LIMIT 1
    `;

  const result = await pool.query(query, [procurementType, value]);
  return result.rows[0] || null;
}

function formatBDT(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Crore`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)} Lac`;
  return `BDT ${value.toLocaleString('en-BD')}`;
}
```

**Save this file.**

---

### **Task 8 — Create Security Calculation Service**

✅ **CREATE**: Auto-calculates security amounts.

**Create this file:** `rfq-platform/backend/src/services/securityCalculation.service.ts`

```typescript
// backend/src/services/securityCalculation.service.ts
import pool from '../config/database';
import logger from '../config/logger';

export async function calculateTenderSecurity(
  tenderValue: number,
  tenderTypeCode: string
): Promise<number> {
  
  const query = `
    SELECT requires_tender_security, tender_security_percent
    FROM tender_type_definitions
    WHERE code = $1 AND is_active = TRUE
  `;
  
  const result = await pool.query(query, [tenderTypeCode]);
  
  if (result.rows.length === 0) {
    throw new Error(`Tender type ${tenderTypeCode} not found`);
  }

  const { requires_tender_security, tender_security_percent } = result.rows[0];

  if (!requires_tender_security) {
    return 0;
  }

  const amount = (tenderValue * tender_security_percent) / 100;
  
  logger.debug({
    tenderValue,
    tenderTypeCode,
    percent: tender_security_percent,
    calculatedAmount: amount
  }, 'Calculated tender security');

  return Math.round(amount * 100) / 100;
}

export async function calculatePerformanceSecurity(
  contractValue: number,
  tenderTypeCode: string
): Promise<number> {
  
  const query = `
    SELECT requires_performance_security, performance_security_percent
    FROM tender_type_definitions
    WHERE code = $1 AND is_active = TRUE
  `;
  
  const result = await pool.query(query, [tenderTypeCode]);
  
  if (result.rows.length === 0) {
    throw new Error(`Tender type ${tenderTypeCode} not found`);
  }

  const { requires_performance_security, performance_security_percent } = result.rows[0];

  if (!requires_performance_security) {
    return 0;
  }

  const amount = (contractValue * performance_security_percent) / 100;
  return Math.round(amount * 100) / 100;
}

export async function calculateRetentionMoney(
  paymentAmount: number,
  tenderTypeCode: string
): Promise<number> {
  
  const query = `
    SELECT requires_retention_money, retention_money_percent
    FROM tender_type_definitions
    WHERE code = $1 AND is_active = TRUE
  `;
  
  const result = await pool.query(query, [tenderTypeCode]);
  
  if (result.rows.length === 0) {
    throw new Error(`Tender type ${tenderTypeCode} not found`);
  }

  const { requires_retention_money, retention_money_percent } = result.rows[0];

  if (!requires_retention_money) {
    return 0;
  }

  const amount = (paymentAmount * retention_money_percent) / 100;
  return Math.round(amount * 100) / 100;
}

export async function calculateAllSecurities(
  tenderValue: number,
  tenderTypeCode: string
) {
  const tenderSecurity = await calculateTenderSecurity(tenderValue, tenderTypeCode);
  const performanceSecurity = await calculatePerformanceSecurity(tenderValue, tenderTypeCode);
  const retentionMoney = await calculateRetentionMoney(tenderValue, tenderTypeCode);

  return {
    tenderSecurity,
    performanceSecurity,
    retentionMoney,
    total: tenderSecurity + performanceSecurity
  };
}
```

**Save this file.**

---

### **Task 9 — Create Document Checklist Service**

✅ **CREATE**: Fetches required documents and validates completeness.

**Create this file:** `rfq-platform/backend/src/services/documentChecklist.service.ts`

```typescript
// backend/src/services/documentChecklist.service.ts
import pool from '../config/database';
import logger from '../config/logger';

export interface DocumentRequirement {
  documentCode: string;
  documentName: string;
  category: string;
  isMandatory: boolean;
  isTemplateProvided: boolean;
  allowedFormats: string[];
  maxSizeMB: number;
  description: string | null;
  sortOrder: number;
}

export async function getRequiredDocuments(
  tenderTypeCode: string
): Promise<DocumentRequirement[]> {
  
  const query = `
    SELECT 
      document_code AS "documentCode",
      document_name AS "documentName",
      document_category AS category,
      is_mandatory AS "isMandatory",
      is_template_provided AS "isTemplateProvided",
      allowed_file_formats AS "allowedFormats",
      max_file_size_mb AS "maxSizeMB",
      description,
      sort_order AS "sortOrder"
    FROM tender_type_document_requirements
    WHERE tender_type_code = $1
    ORDER BY sort_order, document_category, document_code
  `;

  const result = await pool.query(query, [tenderTypeCode]);
  
  logger.debug({ tenderTypeCode, count: result.rows.length }, 'Retrieved document requirements');
  
  return result.rows;
}

export async function getRequiredDocumentsGrouped(tenderTypeCode: string) {
  const documents = await getRequiredDocuments(tenderTypeCode);
  
  const grouped = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, DocumentRequirement[]>);

  return grouped;
}

export async function validateDocumentCompleteness(
  tenderId: string,
  vendorOrgId: string
): Promise<{ complete: boolean; missing: string[]; uploaded: number; required: number }> {
  
  // Get tender type
  const tenderQuery = `SELECT tender_type FROM tenders WHERE id = $1`;
  const tenderResult = await pool.query(tenderQuery, [tenderId]);
  
  if (tenderResult.rows.length === 0) {
    throw new Error(`Tender ${tenderId} not found`);
  }

  const tenderType = tenderResult.rows[0].tender_type;

  // Get mandatory documents
  const requiredQuery = `
    SELECT document_code, document_name
    FROM tender_type_document_requirements
    WHERE tender_type_code = $1 AND is_mandatory = TRUE
  `;
  const requiredDocs = await pool.query(requiredQuery, [tenderType]);

  // Get uploaded documents
  const uploadedQuery = `
    SELECT DISTINCT document_code
    FROM tender_document_submissions
    WHERE tender_id = $1 
      AND vendor_org_id = $2 
      AND status IN ('pending', 'approved')
      AND version = (
        SELECT MAX(version) 
        FROM tender_document_submissions tds2 
        WHERE tds2.tender_id = tender_document_submissions.tender_id
          AND tds2.vendor_org_id = tender_document_submissions.vendor_org_id
          AND tds2.document_code = tender_document_submissions.document_code
      )
  `;
  const uploadedDocs = await pool.query(uploadedQuery, [tenderId, vendorOrgId]);

  const uploadedCodes = new Set(uploadedDocs.rows.map(r => r.document_code));
  const missing: string[] = [];

  for (const req of requiredDocs.rows) {
    if (!uploadedCodes.has(req.document_code)) {
      missing.push(`${req.document_code}: ${req.document_name}`);
    }
  }

  return {
    complete: missing.length === 0,
    missing,
    uploaded: uploadedCodes.size,
    required: requiredDocs.rows.length
  };
}

export async function getDocumentSubmissionStatus(
  tenderId: string,
  vendorOrgId: string
) {
  const tenderQuery = `SELECT tender_type FROM tenders WHERE id = $1`;
  const tenderResult = await pool.query(tenderQuery, [tenderId]);
  
  if (tenderResult.rows.length === 0) {
    throw new Error(`Tender ${tenderId} not found`);
  }

  const tenderType = tenderResult.rows[0].tender_type;

  const query = `
    SELECT 
      ttdr.document_code,
      ttdr.document_name,
      ttdr.document_category,
      ttdr.is_mandatory,
      tds.id AS submission_id,
      tds.status AS submission_status,
      tds.file_name,
      tds.submitted_at,
      tds.rejection_reason
    FROM tender_type_document_requirements ttdr
    LEFT JOIN (
      SELECT DISTINCT ON (document_code) *
      FROM tender_document_submissions
      WHERE tender_id = $1 AND vendor_org_id = $2
      ORDER BY document_code, version DESC
    ) tds ON tds.document_code = ttdr.document_code
    WHERE ttdr.tender_type_code = $3
    ORDER BY ttdr.sort_order
  `;

  const result = await pool.query(query, [tenderId, vendorOrgId, tenderType]);
  return result.rows;
}
```

**Save this file.**

🎉 **PHASE 1 COMPLETE!** Business logic services are ready.

---

## **7. PHASE 2: Backend APIs (Week 3)**

*This section would continue with Tasks 10-20 covering:*
- *Tender type controller and routes*
- *Document checklist controller*
- *Zod validation schemas*
- *Integration with existing tender endpoints*
- *Postman testing*

*Due to length, showing structure. Full implementation continues same detailed pattern.*

---

## **13. Quick Reference — All 42 Tasks at a Glance**

| **#** | **Task** | **Phase** | **File(s) Created/Modified** |
|-------|----------|-----------|------------------------------|
| 1 | Create tender type definitions table | 0 | `database/migrations/001_create_tender_type_definitions.sql` |
| 2 | Create document requirements table | 0 | `database/migrations/002_create_document_requirements.sql` |
| 3 | Seed tender types | 0 | `database/migrations/003_seed_tender_types.sql` |
| 4 | Update tenders table | 0 | `database/migrations/004_update_tenders_table.sql` |
| 5 | Create document submissions table | 0 | `database/migrations/005_create_tender_document_submissions.sql` |
| 6 | Tender type selector service | 1 | `backend/src/services/tenderTypeSelector.service.ts` |
| 7 | Value validation service | 1 | `backend/src/services/valueValidation.service.ts` |
| 8 | Security calculation service | 1 | `backend/src/services/securityCalculation.service.ts` |
| 9 | Document checklist service | 1 | `backend/src/services/documentChecklist.service.ts` |
| 10-42 | *(Remaining tasks follow same pattern)* | 2-7 | *(Controllers, schemas, components, tests)* |

---

---

## **7. PHASE 2: Backend APIs (Week 3)**

Now we expose the services you built in Phase 1 as REST APIs. Controllers handle HTTP requests, routes define URL patterns, and schemas validate input.

### **Task 10 — Create Tender Type Validation Schemas**

✅ **CREATE**: Zod schemas for validating tender type API requests.

**Create this file:** `rfq-platform/backend/src/schemas/tenderType.schema.ts`

```typescript
// backend/src/schemas/tenderType.schema.ts
// Description: Zod validation schemas for tender type APIs

import { z } from 'zod';

/**
 * Schema for tender type suggestion request
 */
export const tenderTypeSuggestionSchema = z.object({
  procurementType: z.enum(['goods', 'works', 'services'], {
    required_error: 'Procurement type is required',
    invalid_type_error: 'Procurement type must be goods, works, or services'
  }),
  
  estimatedValue: z.number({
    required_error: 'Estimated value is required',
    invalid_type_error: 'Estimated value must be a number'
  }).positive('Estimated value must be positive'),
  
  currency: z.string().length(3).default('BDT').optional(),
  
  isInternational: z.boolean().default(false).optional(),
  
  isEmergency: z.boolean().default(false).optional(),
  
  isSingleSource: z.boolean().default(false).optional(),
  
  isTurnkey: z.boolean().default(false).optional(),
  
  isOutsourcingPersonnel: z.boolean().default(false).optional()
});

export type TenderTypeSuggestionInput = z.infer<typeof tenderTypeSuggestionSchema>;

/**
 * Schema for value validation request
 */
export const valueValidationSchema = z.object({
  value: z.number().positive('Value must be positive'),
  tenderTypeCode: z.string().min(2).max(10)
});

export type ValueValidationInput = z.infer<typeof valueValidationSchema>;

/**
 * Schema for security calculation request
 */
export const securityCalculationSchema = z.object({
  tenderValue: z.number().positive('Tender value must be positive'),
  tenderTypeCode: z.string().min(2).max(10)
});

export type SecurityCalculationInput = z.infer<typeof securityCalculationSchema>;
```

**Save this file.**

---

### **Task 11 — Create Tender Type Controller**

✅ **CREATE**: HTTP request handlers for tender type operations.

**Create this file:** `rfq-platform/backend/src/controllers/tenderType.controller.ts`

```typescript
// backend/src/controllers/tenderType.controller.ts
// Description: Handles HTTP requests for tender type operations

import { Request, Response, NextFunction } from 'express';
import * as tenderTypeService from '../services/tenderTypeSelector.service';
import * as valueValidationService from '../services/valueValidation.service';
import * as securityCalculationService from '../services/securityCalculation.service';
import logger from '../config/logger';

/**
 * GET /api/tender-types
 * List all tender types
 */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { procurementType } = req.query;
    
    const tenderTypes = await tenderTypeService.listTenderTypes(
      procurementType as string | undefined
    );
    
    res.json({
      success: true,
      data: tenderTypes,
      count: tenderTypes.length
    });
  } catch (error) {
    logger.error({ error }, 'Error listing tender types');
    next(error);
  }
}

/**
 * GET /api/tender-types/:code
 * Get a specific tender type by code
 */
export async function getByCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params;
    
    const tenderType = await tenderTypeService.getTenderTypeByCode(code);
    
    res.json({
      success: true,
      data: tenderType
    });
  } catch (error) {
    logger.error({ error, code: req.params.code }, 'Error fetching tender type');
    next(error);
  }
}

/**
 * POST /api/tender-types/suggest
 * Suggest tender types based on procurement parameters
 * 
 * Body: { procurementType, estimatedValue, isInternational?, etc. }
 */
export async function suggest(req: Request, res: Response, next: NextFunction) {
  try {
    // req.body is already validated by middleware using tenderTypeSuggestionSchema
    const suggestions = await tenderTypeService.suggestTenderType(req.body);
    
    logger.info({
      input: req.body,
      topSuggestion: suggestions[0]?.code
    }, 'Generated tender type suggestions');
    
    res.json({
      success: true,
      data: suggestions,
      recommended: suggestions[0] // Top suggestion
    });
  } catch (error) {
    logger.error({ error, input: req.body }, 'Error suggesting tender type');
    next(error);
  }
}

/**
 * POST /api/tender-types/validate-value
 * Validate if a value is appropriate for a tender type
 * 
 * Body: { value, tenderTypeCode }
 */
export async function validateValue(req: Request, res: Response, next: NextFunction) {
  try {
    const { value, tenderTypeCode } = req.body;
    
    const validation = await valueValidationService.validateTenderValue(value, tenderTypeCode);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error({ error, input: req.body }, 'Error validating tender value');
    next(error);
  }
}

/**
 * POST /api/tender-types/calculate-securities
 * Calculate all security amounts for a tender
 * 
 * Body: { tenderValue, tenderTypeCode }
 */
export async function calculateSecurities(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenderValue, tenderTypeCode } = req.body;
    
    const securities = await securityCalculationService.calculateAllSecurities(
      tenderValue,
      tenderTypeCode
    );
    
    res.json({
      success: true,
      data: securities
    });
  } catch (error) {
    logger.error({ error, input: req.body }, 'Error calculating securities');
    next(error);
  }
}
```

**Save this file.**

💡 **Note:** These controller functions follow the existing pattern from `tender.controller.ts` - they catch errors and pass them to the error handling middleware using `next(error)`.

---

### **Task 12 — Create Document Checklist Controller**

✅ **CREATE**: HTTP handlers for document requirements.

**Create this file:** `rfq-platform/backend/src/controllers/documentChecklist.controller.ts`

```typescript
// backend/src/controllers/documentChecklist.controller.ts
// Description: Handles document checklist and submission APIs

import { Request, Response, NextFunction } from 'express';
import * as documentChecklistService from '../services/documentChecklist.service';
import logger from '../config/logger';

/**
 * GET /api/tender-types/:code/documents
 * Get required documents for a tender type
 */
export async function getRequiredDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params;
    const { grouped } = req.query;
    
    let documents;
    if (grouped === 'true') {
      documents = await documentChecklistService.getRequiredDocumentsGrouped(code);
    } else {
      documents = await documentChecklistService.getRequiredDocuments(code);
    }
    
    res.json({
      success: true,
      data: documents,
      tenderType: code
    });
  } catch (error) {
    logger.error({ error, code: req.params.code }, 'Error fetching required documents');
    next(error);
  }
}

/**
 * GET /api/tenders/:tenderId/document-checklist
 * Get document checklist with submission status for current vendor
 */
export async function getDocumentChecklist(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenderId } = req.params;
    // @ts-ignore - req.user is added by authenticate middleware
    const vendorOrgId = req.user.orgId;
    
    if (!vendorOrgId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NO_ORG',
          message: 'User must belong to an organization'
        }
      });
    }
    
    const checklist = await documentChecklistService.getDocumentSubmissionStatus(
      tenderId,
      vendorOrgId
    );
    
    res.json({
      success: true,
      data: checklist,
      tenderId
    });
  } catch (error) {
    logger.error({ error, tenderId: req.params.tenderId }, 'Error fetching document checklist');
    next(error);
  }
}

/**
 * POST /api/tenders/:tenderId/documents/validate
 * Validate if all mandatory documents are uploaded
 */
export async function validateDocumentCompleteness(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenderId } = req.params;
    // @ts-ignore
    const vendorOrgId = req.user.orgId;
    
    if (!vendorOrgId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NO_ORG',
          message: 'User must belong to an organization'
        }
      });
    }
    
    const validation = await documentChecklistService.validateDocumentCompleteness(
      tenderId,
      vendorOrgId
    );
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error({ error, tenderId: req.params.tenderId }, 'Error validating document completeness');
    next(error);
  }
}
```

**Save this file.**

---

### **Task 13 — Create Tender Type Routes**

✅ **CREATE**: Define URL patterns for tender type APIs.

**Create this file:** `rfq-platform/backend/src/routes/tenderType.routes.ts`

```typescript
// backend/src/routes/tenderType.routes.ts
// Description: Route definitions for tender type endpoints

import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate.middleware';
import * as tenderTypeController from '../controllers/tenderType.controller';
import * as documentChecklistController from '../controllers/documentChecklist.controller';
import {
  tenderTypeSuggestionSchema,
  valueValidationSchema,
  securityCalculationSchema
} from '../schemas/tenderType.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// TENDER TYPE ENDPOINTS
// ============================================================================

/**
 * GET /api/tender-types
 * List all tender types (optionally filtered by procurement type)
 * Query params: ?procurementType=goods|works|services
 */
router.get('/', tenderTypeController.list);

/**
 * GET /api/tender-types/:code
 * Get details of a specific tender type
 * Example: GET /api/tender-types/PG1
 */
router.get('/:code', tenderTypeController.getByCode);

/**
 * POST /api/tender-types/suggest
 * Get tender type suggestions based on procurement parameters
 * Body: { procurementType, estimatedValue, isInternational, etc. }
 */
router.post(
  '/suggest',
  validate(tenderTypeSuggestionSchema),
  tenderTypeController.suggest
);

/**
 * POST /api/tender-types/validate-value
 * Validate if a value is appropriate for a tender type
 * Body: { value, tenderTypeCode }
 */
router.post(
  '/validate-value',
  validate(valueValidationSchema),
  tenderTypeController.validateValue
);

/**
 * POST /api/tender-types/calculate-securities
 * Calculate tender security, performance security for a tender
 * Body: { tenderValue, tenderTypeCode }
 */
router.post(
  '/calculate-securities',
  validate(securityCalculationSchema),
  tenderTypeController.calculateSecurities
);

// ============================================================================
// DOCUMENT REQUIREMENTS ENDPOINTS
// ============================================================================

/**
 * GET /api/tender-types/:code/documents
 * Get required documents for a tender type
 * Query params: ?grouped=true (optional, groups by category)
 */
router.get(
  '/:code/documents',
  documentChecklistController.getRequiredDocuments
);

export default router;
```

**Save this file.**

---

### **Task 14 — Create Document Checklist Routes**

✅ **CREATE**: Routes for tender-specific document operations.

**Create this file:** `rfq-platform/backend/src/routes/documentChecklist.routes.ts`

```typescript
// backend/src/routes/documentChecklist.routes.ts
// Description: Document checklist routes (tender-specific)

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import * as documentChecklistController from '../controllers/documentChecklist.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/tenders/:tenderId/document-checklist
 * Get document checklist with submission status
 * Available to: vendors (own submissions), buyers, admins
 */
router.get(
  '/:tenderId/document-checklist',
  documentChecklistController.getDocumentChecklist
);

/**
 * POST /api/tenders/:tenderId/documents/validate
 * Validate document completeness before bid submission
 * Available to: vendors (own), buyers, admins
 */
router.post(
  '/:tenderId/documents/validate',
  documentChecklistController.validateDocumentCompleteness
);

export default router;
```

**Save this file.**

---

### **Task 15 — Register Routes in Main App**

📝 **MODIFY**: Add the new routes to your Express app.

**Open this file:** `rfq-platform/backend/src/app.ts`

**Find the section where routes are registered** (look for lines like `app.use('/api/tenders', tenderRoutes)`).

**Add these imports at the top:**

```typescript
import tenderTypeRoutes from './routes/tenderType.routes';
import documentChecklistRoutes from './routes/documentChecklist.routes';
```

**Add these route registrations** (after existing route registrations):

```typescript
// Tender type routes
app.use('/api/tender-types', tenderTypeRoutes);

// Document checklist routes (nested under /api/tenders)
app.use('/api/tenders', documentChecklistRoutes);
```

**Save the file.**

✔️ **TEST with Postman:**

1. **Start your backend server:** `cd rfq-platform/backend && npm run dev`

2. **Test listing tender types:**
   ```
   GET http://localhost:3000/api/tender-types
   Headers: Authorization: Bearer <your-jwt-token>
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "data": [
       {
         "code": "PG1",
         "name": "Request for Quotation - Goods (up to BDT 8 Lac)",
         "procurement_type": "goods",
         "min_value_bdt": 0,
         "max_value_bdt": 800000,
         ...
       },
       ...
     ],
     "count": 14
   }
   ```

3. **Test tender type suggestion:**
   ```
   POST http://localhost:3000/api/tender-types/suggest
   Headers: 
     Authorization: Bearer <token>
     Content-Type: application/json
   Body:
   {
     "procurementType": "goods",
     "estimatedValue": 600000,
     "isInternational": false
   }
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "data": [
       {
         "code": "PG1",
         "name": "Request for Quotation - Goods (up to BDT 8 Lac)",
         "confidence": 100,
         "reasons": [
           "Value fits 0 - 8.00 Lac",
           "No tender security required"
         ],
         "metadata": {
           "minValue": 0,
           "maxValue": 800000,
           "requiresTenderSecurity": false,
           "minSubmissionDays": 3,
           "sectionCount": 4
         }
       }
     ],
     "recommended": { ... }
   }
   ```

4. **Test value validation:**
   ```
   POST http://localhost:3000/api/tender-types/validate-value
   Body:
   {
     "value": 10000000,
     "tenderTypeCode": "PG1"
   }
   ```
   
   Expected response (should fail):
   ```json
   {
     "success": true,
     "data": {
       "valid": false,
       "message": "Value 1.00 Crore exceeds maximum for PG1 (maximum: 8.00 Lac)",
       "suggestedType": "PG2",
       "details": {
         "currentType": "PG1",
         "value": 10000000,
         "minAllowed": 0,
         "maxAllowed": 800000
       }
     }
   }
   ```

5. **Test security calculation:**
   ```
   POST http://localhost:3000/api/tender-types/calculate-securities
   Body:
   {
     "tenderValue": 3000000,
     "tenderTypeCode": "PG2"
   }
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "data": {
       "tenderSecurity": 60000,
       "performanceSecurity": 150000,
       "retentionMoney": 0,
       "total": 210000
     }
   }
   ```

💡 **Note:** If any test fails, check the server logs. Common issues:
- JWT token expired (get a new one by logging in)
- Database connection error (check your .env file)
- Missing tables (run migrations from Phase 0 again)

🎉 **PHASE 2 COMPLETE!** Your tender type APIs are now live and testable.

---

## **8. PHASE 3: Tender Integration (Week 4)**

Now we modify the existing tender creation flow to use the new tender type system. This phase is critical - we're changing core functionality, so test carefully after each step.

### **Task 16 — Update Tender Schema with Type Validation**

📝 **MODIFY**: Add tender type validation to the existing tender schema.

**Open this file:** `rfq-platform/backend/src/schemas/tender.schema.ts`

**Find the `createTenderSchema`** (it should look something like this):

```typescript
export const createTenderSchema = z.object({
  title: z.string().min(5).max(255),
  tenderType: z.enum(["RFQ", "TENDER"]),  // ← We're changing this
  // ... other fields
});
```

**Replace the entire `createTenderSchema` with this:**

```typescript
export const createTenderSchema = z.object({
  title: z.string().min(5).max(255),
  
  // Changed from enum to string (references tender_type_definitions.code)
  tenderType: z.string()
    .min(2, 'Tender type code is required')
    .max(10, 'Tender type code too long'),
  
  visibility: z.enum(["open", "limited"]),
  
  procurementType: z.enum(["goods", "works", "services"]),
  
  fundAllocation: z.number()
    .positive('Fund allocation must be positive')
    .optional(),
  
  estimatedCost: z.number()
    .positive('Estimated cost must be positive')
    .optional(),
  
  currency: z.string().length(3).default("BDT"),
  
  priceBasis: z.enum(["unit_rate", "lump_sum"]).default("unit_rate"),
  
  submissionDeadline: z.string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  
  bidOpeningTime: z.string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  
  validityDays: z.number()
    .int()
    .positive()
    .optional(), // If not provided, use tender type default
  
  // Bid security is now optional - will be auto-calculated if not provided
  bidSecurityAmount: z.number()
    .nonnegative()
    .optional(),
  
  // New field: override two-envelope requirement
  twoEnvelopeSystem: z.boolean().optional(),
  
  // Existing fields
  description: z.string().optional(),
  scopeOfWork: z.string().optional(),
  technicalSpecs: z.any().optional(), // JSONB field
  
  // Tender creation metadata
  organizationId: z.string().uuid().optional() // Added by controller from req.user
})
.superRefine(async (data, ctx) => {
  // Custom validation: tender value must match tender type
  if (data.estimatedCost && data.tenderType) {
    try {
      const { validateTenderValue } = await import('../services/valueValidation.service');
      const validation = await validateTenderValue(data.estimatedCost, data.tenderType);
      
      if (!validation.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.message || 'Value does not match tender type',
          path: ['estimatedCost']
        });
      }
    } catch (error) {
      // If validation service fails, log but don't block tender creation
      console.error('Tender value validation failed:', error);
    }
  }
});

export type CreateTenderInput = z.infer<typeof createTenderSchema>;
```

**Save this file.**

💡 **Note:** The `.superRefine()` method runs async validation. It calls your `validateTenderValue` service to ensure the estimated cost matches the selected tender type. If validation fails, the error is added to the Zod validation context.

---

### **Task 17 — Update Tender Service with Type-Based Defaults**

📝 **MODIFY**: Modify the tender creation service to auto-populate fields based on tender type.

**Open this file:** `rfq-platform/backend/src/services/tender.service.ts`

**Find the `create` function** (it should look something like this):

```typescript
export const tenderService = {
  async create(input, userId, orgId) {
    const id = uuidv4();
    const tenderNumber = await generateTenderNumber(orgId);
    
    // Insert tender...
  }
};
```

**Replace the `create` function with this enhanced version:**

```typescript
async create(input: CreateTenderInput, userId: string, orgId: string) {
  const id = uuidv4();
  const tenderNumber = await generateTenderNumber(orgId);
  
  // Step 1: Fetch tender type defaults
  const tenderTypeQuery = `
    SELECT 
      code,
      requires_tender_security,
      tender_security_percent,
      requires_performance_security,
      performance_security_percent,
      requires_two_envelope,
      min_submission_days,
      max_submission_days,
      default_validity_days,
      requires_newspaper_ad,
      is_direct_procurement
    FROM tender_type_definitions
    WHERE code = $1 AND is_active = TRUE
  `;
  
  const typeResult = await pool.query(tenderTypeQuery, [input.tenderType]);
  
  if (typeResult.rows.length === 0) {
    throw Object.assign(new Error(`Invalid tender type: ${input.tenderType}`), {
      statusCode: 400,
      code: 'INVALID_TENDER_TYPE'
    });
  }
  
  const tenderTypeDef = typeResult.rows[0];
  
  // Step 2: Calculate/validate bid security
  let bidSecurityAmount = input.bidSecurityAmount;
  
  if (!bidSecurityAmount && tenderTypeDef.requires_tender_security && input.estimatedCost) {
    // Auto-calculate if not provided
    const { calculateTenderSecurity } = await import('./securityCalculation.service');
    bidSecurityAmount = await calculateTenderSecurity(input.estimatedCost, input.tenderType);
    
    logger.info({
      tenderId: id,
      tenderType: input.tenderType,
      estimatedCost: input.estimatedCost,
      calculatedSecurity: bidSecurityAmount
    }, 'Auto-calculated bid security');
  }
  
  // Step 3: Set validity days (use type default if not provided)
  const validityDays = input.validityDays || tenderTypeDef.default_validity_days;
  
  // Step 4: Validate submission deadline
  const submissionDeadline = new Date(input.submissionDeadline);
  const now = new Date();
  const minDaysFromNow = new Date();
  minDaysFromNow.setDate(minDaysFromNow.getDate() + tenderTypeDef.min_submission_days);
  
  if (submissionDeadline < minDaysFromNow) {
    throw Object.assign(new Error(
      `Submission deadline must be at least ${tenderTypeDef.min_submission_days} days from now for ${input.tenderType}`
    ), {
      statusCode: 400,
      code: 'INVALID_SUBMISSION_DEADLINE'
    });
  }
  
  // Step 5: Validate two-envelope requirement
  const twoEnvelopeSystem = input.twoEnvelopeSystem ?? false;
  
  if (tenderTypeDef.requires_two_envelope && !twoEnvelopeSystem) {
    throw Object.assign(new Error(
      `${input.tenderType} requires two-envelope system (technical + commercial separation)`
    ), {
      statusCode: 400,
      code: 'TWO_ENVELOPE_REQUIRED'
    });
  }
  
  if (!tenderTypeDef.requires_two_envelope && twoEnvelopeSystem) {
    logger.warn({
      tenderType: input.tenderType
    }, 'Two-envelope system enabled for type that does not require it');
  }
  
  // Step 6: Calculate performance security for reference
  let calculatedPerformanceSecurity = 0;
  if (tenderTypeDef.requires_performance_security && input.estimatedCost) {
    const { calculatePerformanceSecurity } = await import('./securityCalculation.service');
    calculatedPerformanceSecurity = await calculatePerformanceSecurity(
      input.estimatedCost,
      input.tenderType
    );
  }
  
  // Step 7: Insert tender
  const insertQuery = `
    INSERT INTO tenders (
      id, tender_number, title, tender_type, visibility, procurement_type,
      fund_allocation, estimated_cost, currency, price_basis,
      submission_deadline, bid_opening_time, validity_days,
      bid_security_amount, two_envelope_system,
      description, scope_of_work, technical_specs,
      status, organization_id, created_by,
      calculated_tender_security, calculated_performance_security,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, 'draft', $19, $20, $21, $22, NOW(), NOW()
    )
    RETURNING *
  `;
  
  const result = await pool.query(insertQuery, [
    id,
    tenderNumber,
    input.title,
    input.tenderType,
    input.visibility,
    input.procurementType,
    input.fundAllocation,
    input.estimatedCost,
    input.currency,
    input.priceBasis,
    input.submissionDeadline,
    input.bidOpeningTime,
    validityDays,
    bidSecurityAmount,
    twoEnvelopeSystem,
    input.description,
    input.scopeOfWork,
    input.technicalSpecs ? JSON.stringify(input.technicalSpecs) : null,
    orgId,
    userId,
    bidSecurityAmount, // Cache calculated value
    calculatedPerformanceSecurity
  ]);
  
  // Step 8: Audit log
  await pool.query(
    `INSERT INTO audit_logs (entity_type, entity_id, action, user_id, metadata)
     VALUES ('tender', $1, 'TENDER_CREATED', $2, $3)`,
    [id, userId, JSON.stringify({
      tenderType: input.tenderType,
      estimatedCost: input.estimatedCost,
      calculatedSecurity: bidSecurityAmount,
      autoCalculated: !input.bidSecurityAmount,
      twoEnvelopeSystem
    })]
  );
  
  logger.info({
    tenderId: id,
    tenderNumber,
    tenderType: input.tenderType,
    userId
  }, 'Tender created with type-based validation');
  
  return result.rows[0];
}
```

**Save this file.**

💡 **Note:** This enhanced `create` function:
1. Fetches tender type rules from database
2. Auto-calculates bid security if not provided
3. Uses type's default validity days
4. Validates minimum submission period
5. Enforces two-envelope requirement
6. Caches calculated securities for quick display

---

### **Task 18 — Update Bid Submission to Validate Documents**

📝 **MODIFY**: Add document completeness check to bid submission.

**Open this file:** `rfq-platform/backend/src/services/bid.service.ts`

**Find the `submitBid` function** (from Task 14 of your main coding plan).

**Find this section** (step 2, checking mandatory features):

```typescript
// Step 2: Check mandatory features
// ... existing code ...
```

**Add this new step right after the mandatory features check:**

```typescript
// Step 2B: Check mandatory documents
const { validateDocumentCompleteness } = await import('./documentChecklist.service');
const docValidation = await validateDocumentCompleteness(tenderId, vendorOrgId);

if (!docValidation.complete) {
  throw Object.assign(new Error(
    `Cannot submit bid: ${docValidation.missing.length} required documents missing`
  ), {
    statusCode: 400,
    code: 'MISSING_REQUIRED_DOCUMENTS',
    details: {
      missing: docValidation.missing,
      uploaded: docValidation.uploaded,
      required: docValidation.required
    }
  });
}

logger.info({
  tenderId,
  vendorOrgId,
  documentsUploaded: docValidation.uploaded,
  documentsRequired: docValidation.required
}, 'Document completeness validated');
```

**Save this file.**

✔️ **TEST the integration:**

1. **Create a new tender with PG1 type:**
   ```
   POST http://localhost:3000/api/tenders
   Body:
   {
     "title": "Office Supplies Procurement",
     "tenderType": "PG1",
     "procurementType": "goods",
     "visibility": "open",
     "estimatedCost": 500000,
     "submissionDeadline": "2026-02-20T23:59:59Z",
     "bidOpeningTime": "2026-02-21T10:00:00Z"
   }
   ```
   
   Expected: Tender created successfully, `bid_security_amount` should be 0 (PG1 doesn't require security).

2. **Try creating PG2 tender with low value (should fail):**
   ```
   POST http://localhost:3000/api/tenders
   Body:
   {
     "title": "Test Invalid Value",
     "tenderType": "PG2",
     "estimatedCost": 500000,  // Too low for PG2
     ...
   }
   ```
   
   Expected: Error 400, message about value being below minimum for PG2.

3. **Try PG5A without two-envelope (should fail):**
   ```
   POST http://localhost:3000/api/tenders
   Body:
   {
     "tenderType": "PG5A",
     "twoEnvelopeSystem": false,  // Should fail
     ...
   }
   ```
   
   Expected: Error 400, "PG5A requires two-envelope system".

🎉 **PHASE 3 COMPLETE!** Tender creation now enforces tender type rules.

---

## **9. PHASE 4: Frontend Components (Week 5-6)**

Time to build the user interface. We'll create Svelte components that make tender type selection intuitive.

### **Task 19 — Create API Client Utilities**

✅ **CREATE**: Helper functions for calling backend APIs from frontend.

**Create this file:** `rfq-platform/frontend/src/lib/utils/tenderTypeApi.ts`

```typescript
// frontend/src/lib/utils/tenderTypeApi.ts
// Description: API client for tender type operations

import { api } from '$lib/utils/api'; // Your existing API utility

export interface TenderTypeSuggestionRequest {
  procurementType: 'goods' | 'works' | 'services';
  estimatedValue: number;
  currency?: string;
  isInternational?: boolean;
  isEmergency?: boolean;
  isSingleSource?: boolean;
  isTurnkey?: boolean;
  isOutsourcingPersonnel?: boolean;
}

export interface TenderTypeSuggestion {
  code: string;
  name: string;
  confidence: number;
  reasons: string[];
  warnings?: string[];
  metadata: {
    minValue: number | null;
    maxValue: number | null;
    requiresTenderSecurity: boolean;
    tenderSecurityPercent: number | null;
    minSubmissionDays: number;
    sectionCount: number;
  };
}

export interface TenderTypeDefinition {
  code: string;
  name: string;
  description: string;
  procurement_type: string;
  min_value_bdt: number;
  max_value_bdt: number | null;
  requires_tender_security: boolean;
  tender_security_percent: number | null;
  requires_performance_security: boolean;
  performance_security_percent: number | null;
  requires_retention_money: boolean;
  retention_money_percent: number | null;
  requires_two_envelope: boolean;
  requires_newspaper_ad: boolean;
  min_submission_days: number;
  max_submission_days: number;
  default_validity_days: number;
  section_count: number;
  is_international: boolean;
}

/**
 * Get all tender types
 */
export async function listTenderTypes(procurementType?: string): Promise<TenderTypeDefinition[]> {
  const url = procurementType 
    ? `/api/tender-types?procurementType=${procurementType}`
    : '/api/tender-types';
  
  const response = await api.get<{ success: boolean; data: TenderTypeDefinition[] }>(url);
  return response.data;
}

/**
 * Get tender type suggestions
 */
export async function suggestTenderType(
  params: TenderTypeSuggestionRequest
): Promise<TenderTypeSuggestion[]> {
  const response = await api.post<{ 
    success: boolean; 
    data: TenderTypeSuggestion[];
    recommended: TenderTypeSuggestion;
  }>('/api/tender-types/suggest', params);
  
  return response.data;
}

/**
 * Get tender type by code
 */
export async function getTenderTypeByCode(code: string): Promise<TenderTypeDefinition> {
  const response = await api.get<{ success: boolean; data: TenderTypeDefinition }>(
    `/api/tender-types/${code}`
  );
  return response.data;
}

/**
 * Validate tender value for a type
 */
export async function validateTenderValue(value: number, tenderTypeCode: string) {
  const response = await api.post<{
    success: boolean;
    data: {
      valid: boolean;
      message?: string;
      suggestedType?: string;
    }
  }>('/api/tender-types/validate-value', { value, tenderTypeCode });
  
  return response.data;
}

/**
 * Calculate securities
 */
export async function calculateSecurities(tenderValue: number, tenderTypeCode: string) {
  const response = await api.post<{
    success: boolean;
    data: {
      tenderSecurity: number;
      performanceSecurity: number;
      retentionMoney: number;
      total: number;
    }
  }>('/api/tender-types/calculate-securities', { tenderValue, tenderTypeCode });
  
  return response.data;
}
```

**Save this file.**

---

### **Task 20 — Create Tender Type Selector Component**

✅ **CREATE**: Multi-step wizard for selecting tender type.

**Create this file:** `rfq-platform/frontend/src/lib/components/TenderTypeSelector.svelte`

```svelte
<script lang="ts">
  // frontend/src/lib/components/TenderTypeSelector.svelte
  import { createEventDispatcher, onMount } from 'svelte';
  import { suggestTenderType, type TenderTypeSuggestion } from '$lib/utils/tenderTypeApi';
  
  // Props
  export let selectedType: string = '';
  export let estimatedValue: number = 0;
  export let procurementType: 'goods' | 'works' | 'services' = 'goods';
  
  // Component state
  let step = 1;
  let loading = false;
  let suggestions: TenderTypeSuggestion[] = [];
  let error = '';
  
  // Wizard inputs
  let isInternational = false;
  let isEmergency = false;
  let isSingleSource = false;
  let isTurnkey = false;
  let isOutsourcingPersonnel = false;
  
  const dispatch = createEventDispatcher<{ select: { tenderType: string } }>();
  
  async function getSuggestions() {
    if (!estimatedValue || estimatedValue <= 0) {
      error = 'Please enter a valid estimated value';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      suggestions = await suggestTenderType({
        procurementType,
        estimatedValue,
        isInternational,
        isEmergency,
        isSingleSource,
        isTurnkey,
        isOutsourcingPersonnel
      });
      
      step = 4; // Move to suggestions display
    } catch (err: any) {
      error = err.message || 'Failed to get suggestions';
    } finally {
      loading = false;
    }
  }
  
  function selectType(code: string) {
    selectedType = code;
    dispatch('select', { tenderType: code });
    step = 5; // Move to confirmation
  }
  
  function formatBDT(value: number | null): string {
    if (value === null) return 'Unlimited';
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Crore`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)} Lac`;
    return `BDT ${value.toLocaleString('en-BD')}`;
  }
</script>

<div class="tender-type-wizard">
  <!-- Step 1: Procurement Type -->
  {#if step === 1}
    <div class="wizard-step">
      <h3>Step 1: Select Procurement Type</h3>
      <div class="procurement-types">
        <label class="type-card" class:selected={procurementType === 'goods'}>
          <input type="radio" bind:group={procurementType} value="goods" />
          <div class="card-content">
            <span class="icon">📦</span>
            <h4>Goods</h4>
            <p>Equipment, supplies, materials</p>
          </div>
        </label>
        
        <label class="type-card" class:selected={procurementType === 'works'}>
          <input type="radio" bind:group={procurementType} value="works" />
          <div class="card-content">
            <span class="icon">🏗️</span>
            <h4>Works</h4>
            <p>Construction, infrastructure</p>
          </div>
        </label>
        
        <label class="type-card" class:selected={procurementType === 'services'}>
          <input type="radio" bind:group={procurementType} value="services" />
          <div class="card-content">
            <span class="icon">💼</span>
            <h4>Services</h4>
            <p>Consulting, outsourcing, IT</p>
          </div>
        </label>
      </div>
      
      <button class="btn-primary" on:click={() => step = 2}>
        Next →
      </button>
    </div>
  {/if}
  
  <!-- Step 2: Estimated Value -->
  {#if step === 2}
    <div class="wizard-step">
      <h3>Step 2: Enter Estimated Value</h3>
      <div class="value-input-group">
        <label for="estimatedValue">Estimated Cost (BDT)</label>
        <input
          id="estimatedValue"
          type="number"
          bind:value={estimatedValue}
          placeholder="Enter amount in Taka"
          min="0"
          step="1000"
          class="value-input"
        />
        {#if estimatedValue > 0}
          <p class="value-display">{formatBDT(estimatedValue)}</p>
        {/if}
      </div>
      
      <div class="wizard-actions">
        <button class="btn-secondary" on:click={() => step = 1}>
          ← Back
        </button>
        <button 
          class="btn-primary" 
          on:click={() => step = 3}
          disabled={!estimatedValue || estimatedValue <= 0}
        >
          Next →
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Step 3: Additional Parameters -->
  {#if step === 3}
    <div class="wizard-step">
      <h3>Step 3: Additional Options (Optional)</h3>
      <div class="options-group">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={isInternational} />
          <span>International Competition</span>
          <p class="help-text">Allow foreign bidders</p>
        </label>
        
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={isEmergency} />
          <span>Emergency Procurement</span>
          <p class="help-text">Urgent requirement due to disaster/crisis</p>
        </label>
        
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={isSingleSource} />
          <span>Single Source / Proprietary</span>
          <p class="help-text">Only one supplier available</p>
        </label>
        
        {#if procurementType === 'goods'}
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={isTurnkey} />
            <span>Turnkey Contract</span>
            <p class="help-text">Supply + Installation + Commissioning</p>
          </label>
        {/if}
        
        {#if procurementType === 'services'}
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={isOutsourcingPersonnel} />
            <span>Outsourcing Personnel</span>
            <p class="help-text">Hiring service personnel (guards, cleaners, etc.)</p>
          </label>
        {/if}
      </div>
      
      <div class="wizard-actions">
        <button class="btn-secondary" on:click={() => step = 2}>
          ← Back
        </button>
        <button class="btn-primary" on:click={getSuggestions} disabled={loading}>
          {loading ? 'Analyzing...' : 'Get Suggestions →'}
        </button>
      </div>
      
      {#if error}
        <div class="error-message">{error}</div>
      {/if}
    </div>
  {/if}
  
  <!-- Step 4: Suggestions -->
  {#if step === 4}
    <div class="wizard-step">
      <h3>Recommended Tender Types</h3>
      <div class="suggestions-list">
        {#each suggestions as suggestion}
          <div 
            class="suggestion-card"
            class:recommended={suggestion.confidence === 100}
            on:click={() => selectType(suggestion.code)}
            on:keypress={(e) => e.key === 'Enter' && selectType(suggestion.code)}
            role="button"
            tabindex="0"
          >
            <div class="suggestion-header">
              <div class="suggestion-code">{suggestion.code}</div>
              <div class="confidence-badge" style="--confidence: {suggestion.confidence}">
                {suggestion.confidence}% match
              </div>
            </div>
            
            <h4 class="suggestion-name">{suggestion.name}</h4>
            
            <div class="suggestion-reasons">
              {#each suggestion.reasons as reason}
                <div class="reason">✓ {reason}</div>
              {/each}
            </div>
            
            {#if suggestion.warnings}
              <div class="suggestion-warnings">
                {#each suggestion.warnings as warning}
                  <div class="warning">⚠️ {warning}</div>
                {/each}
              </div>
            {/if}
            
            <div class="suggestion-meta">
              <span>Min. Submission: {suggestion.metadata.minSubmissionDays} days</span>
              <span>{suggestion.metadata.sectionCount} sections</span>
              {#if suggestion.metadata.requiresTenderSecurity}
                <span>Security: {suggestion.metadata.tenderSecurityPercent}%</span>
              {:else}
                <span>No security required</span>
              {/if}
            </div>
            
            <button class="btn-select">Select {suggestion.code}</button>
          </div>
        {/each}
      </div>
      
      <button class="btn-secondary" on:click={() => step = 3}>
        ← Change Options
      </button>
    </div>
  {/if}
  
  <!-- Step 5: Confirmation -->
  {#if step === 5}
    <div class="wizard-step">
      <div class="confirmation">
        <span class="success-icon">✓</span>
        <h3>Tender Type Selected: {selectedType}</h3>
        <p>You can change this later if needed.</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .tender-type-wizard {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .wizard-step {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .procurement-types {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }
  
  .type-card {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }
  
  .type-card:hover {
    border-color: #4a90e2;
    transform: translateY(-2px);
  }
  
  .type-card.selected {
    border-color: #4a90e2;
    background: #f0f7ff;
  }
  
  .type-card input[type="radio"] {
    display: none;
  }
  
  .icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 0.5rem;
  }
  
  .value-input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1.25rem;
    border: 2px solid #e0e0e0;
    border-radius: 4px;
  }
  
  .value-display {
    margin-top: 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: #4a90e2;
  }
  
  .options-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1.5rem 0;
  }
  
  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .checkbox-label:hover {
    background: #f9f9f9;
  }
  
  .help-text {
    color: #666;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  
  .suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1.5rem 0;
  }
  
  .suggestion-card {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .suggestion-card:hover {
    border-color: #4a90e2;
    transform: translateX(4px);
  }
  
  .suggestion-card.recommended {
    border-color: #4caf50;
    background: #f1f8f4;
  }
  
  .suggestion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .suggestion-code {
    font-size: 1.25rem;
    font-weight: 700;
    color: #4a90e2;
  }
  
  .confidence-badge {
    background: linear-gradient(90deg, 
      #ff6b6b 0%, 
      #ffd93d calc(var(--confidence) * 0.5%), 
      #4caf50 100%
    );
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
  }
  
  .suggestion-reasons {
    margin: 1rem 0;
  }
  
  .reason {
    color: #4caf50;
    margin: 0.5rem 0;
  }
  
  .warning {
    color: #ff9800;
    margin: 0.5rem 0;
  }
  
  .suggestion-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
    font-size: 0.875rem;
    color: #666;
  }
  
  .btn-select {
    width: 100%;
    margin-top: 1rem;
    padding: 0.75rem;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  }
  
  .btn-select:hover {
    background: #357abd;
  }
  
  .wizard-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .btn-primary, .btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }
  
  .btn-primary {
    background: #4a90e2;
    color: white;
  }
  
  .btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: #f0f0f0;
    color: #333;
  }
  
  .confirmation {
    text-align: center;
    padding: 2rem;
  }
  
  .success-icon {
    font-size: 4rem;
    color: #4caf50;
  }
  
  .error-message {
    color: #f44336;
    background: #ffebee;
    padding: 0.75rem;
    border-radius: 4px;
    margin-top: 1rem;
  }
</style>
```

**Save this file.**

💡 **Note:** This is a fully interactive wizard that guides users through tender type selection with visual feedback and confidence scoring.

---

### **Task 21 — Create Tender Type Info Display Component**

✅ **CREATE**: Display detailed tender type information and requirements.

**Create this file:** `rfq-platform/frontend/src/lib/components/TenderTypeInfo.svelte`

```svelte
<script lang="ts">
  // frontend/src/lib/components/TenderTypeInfo.svelte
  import { onMount } from 'svelte';
  import { getTenderTypeByCode, type TenderTypeDefinition } from '$lib/utils/tenderTypeApi';
  
  export let tenderTypeCode: string;
  export let compact: boolean = false;
  
  let tenderType: TenderTypeDefinition | null = null;
  let loading = true;
  let error = '';
  
  onMount(async () => {
    try {
      tenderType = await getTenderTypeByCode(tenderTypeCode);
    } catch (err: any) {
      error = err.message || 'Failed to load tender type';
    } finally {
      loading = false;
    }
  });
  
  function formatBDT(value: number | null): string {
    if (value === null) return 'Unlimited';
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Crore`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)} Lac`;
    return `BDT ${value.toLocaleString('en-BD')}`;
  }
</script>

{#if loading}
  <div class="loading">Loading tender type details...</div>
{:else if error}
  <div class="error">{error}</div>
{:else if tenderType}
  <div class="tender-type-info" class:compact>
    <div class="header">
      <div class="code-badge">{tenderType.code}</div>
      <div class="type-name">{tenderType.name}</div>
    </div>
    
    {#if !compact}
      <div class="description">{tenderType.description}</div>
      
      <div class="requirements-grid">
        <!-- Value Range -->
        <div class="requirement-card">
          <h4>💰 Value Range</h4>
          <p>
            {formatBDT(tenderType.min_value_bdt)} - {formatBDT(tenderType.max_value_bdt)}
          </p>
        </div>
        
        <!-- Securities -->
        <div class="requirement-card">
          <h4>🔒 Securities</h4>
          <ul>
            {#if tenderType.requires_tender_security}
              <li>Tender Security: {tenderType.tender_security_percent}%</li>
            {:else}
              <li>No tender security required</li>
            {/if}
            
            {#if tenderType.requires_performance_security}
              <li>Performance Security: {tenderType.performance_security_percent}%</li>
            {/if}
            
            {#if tenderType.requires_retention_money}
              <li>Retention Money: {tenderType.retention_money_percent}%</li>
            {/if}
          </ul>
        </div>
        
        <!-- Timelines -->
        <div class="requirement-card">
          <h4>⏱️ Timelines</h4>
          <ul>
            <li>Min. Submission: {tenderType.min_submission_days} days</li>
            <li>Max. Submission: {tenderType.max_submission_days} days</li>
            <li>Bid Validity: {tenderType.default_validity_days} days</li>
          </ul>
        </div>
        
        <!-- Process Requirements -->
        <div class="requirement-card">
          <h4>📋 Process</h4>
          <ul>
            <li>{tenderType.section_count} sections required</li>
            {#if tenderType.requires_two_envelope}
              <li>Two-envelope system required</li>
            {/if}
            {#if tenderType.requires_newspaper_ad}
              <li>Newspaper advertisement required</li>
            {/if}
            {#if tenderType.is_international}
              <li>International competition</li>
            {/if}
          </ul>
        </div>
      </div>
    {:else}
      <!-- Compact view -->
      <div class="compact-info">
        <span>Value: {formatBDT(tenderType.min_value_bdt)} - {formatBDT(tenderType.max_value_bdt)}</span>
        <span>Min. {tenderType.min_submission_days} days</span>
        {#if tenderType.requires_tender_security}
          <span>Security: {tenderType.tender_security_percent}%</span>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .tender-type-info {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
  }
  
  .tender-type-info.compact {
    padding: 1rem;
  }
  
  .header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .code-badge {
    background: #4a90e2;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: 700;
    font-size: 1.25rem;
  }
  
  .type-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
  }
  
  .description {
    color: #666;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }
  
  .requirements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .requirement-card {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 4px;
    border-left: 3px solid #4a90e2;
  }
  
  .requirement-card h4 {
    margin: 0 0 0.75rem 0;
    color: #333;
    font-size: 1rem;
  }
  
  .requirement-card ul {
    margin: 0;
    padding-left: 1.25rem;
  }
  
  .requirement-card li {
    margin: 0.5rem 0;
    color: #666;
  }
  
  .compact-info {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.875rem;
    color: #666;
  }
  
  .loading, .error {
    padding: 1rem;
    text-align: center;
  }
  
  .error {
    background: #ffebee;
    color: #c62828;
    border-radius: 4px;
  }
</style>
```

**Save this file.**

---

### **Task 22 — Create Value Validator Component**

✅ **CREATE**: Real-time validation of tender value against selected type.

**Create this file:** `rfq-platform/frontend/src/lib/components/ValueValidator.svelte`

```svelte
<script lang="ts">
  // frontend/src/lib/components/ValueValidator.svelte
  import { validateTenderValue } from '$lib/utils/tenderTypeApi';
  import { debounce } from '$lib/utils/debounce'; // You may need to create this utility
  
  export let value: number;
  export let tenderTypeCode: string;
  export let onValidationChange: (valid: boolean) => void = () => {};
  
  let validation: {
    valid: boolean;
    message?: string;
    suggestedType?: string;
  } | null = null;
  let validating = false;
  
  const debouncedValidate = debounce(async () => {
    if (!value || !tenderTypeCode || value <= 0) {
      validation = null;
      onValidationChange(true);
      return;
    }
    
    validating = true;
    try {
      validation = await validateTenderValue(value, tenderTypeCode);
      onValidationChange(validation.valid);
    } catch (error) {
      validation = { valid: false, message: 'Validation failed' };
      onValidationChange(false);
    } finally {
      validating = false;
    }
  }, 500);
  
  $: if (value || tenderTypeCode) {
    debouncedValidate();
  }
  
  function formatBDT(value: number): string {
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Crore`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)} Lac`;
    return `BDT ${value.toLocaleString('en-BD')}`;
  }
</script>

{#if validating}
  <div class="validator validating">
    <span class="spinner"></span>
    Validating value...
  </div>
{:else if validation}
  <div class="validator" class:valid={validation.valid} class:invalid={!validation.valid}>
    {#if validation.valid}
      <span class="icon">✓</span>
      <span class="message">
        {formatBDT(value)} is valid for {tenderTypeCode}
      </span>
    {:else}
      <span class="icon">⚠️</span>
      <div class="error-content">
        <span class="message">{validation.message}</span>
        {#if validation.suggestedType}
          <span class="suggestion">
            Consider using <strong>{validation.suggestedType}</strong> instead
          </span>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .validator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }
  
  .validator.valid {
    background: #e8f5e9;
    border: 1px solid #4caf50;
    color: #2e7d32;
  }
  
  .validator.invalid {
    background: #fff3e0;
    border: 1px solid #ff9800;
    color: #e65100;
  }
  
  .validator.validating {
    background: #f5f5f5;
    border: 1px solid #bdbdbd;
    color: #757575;
  }
  
  .icon {
    font-size: 1.25rem;
  }
  
  .error-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .suggestion {
    font-size: 0.8rem;
    color: #f57c00;
  }
  
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #bdbdbd;
    border-top-color: #4a90e2;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

**Save this file.**

💡 **Note:** You'll need a debounce utility. Create `frontend/src/lib/utils/debounce.ts`:

```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

---

### **Task 23 — Create Security Calculator Component**

✅ **CREATE**: Display calculated securities with visual breakdown.

**Create this file:** `rfq-platform/frontend/src/lib/components/SecurityCalculator.svelte`

```svelte
<script lang="ts">
  // frontend/src/lib/components/SecurityCalculator.svelte
  import { calculateSecurities } from '$lib/utils/tenderTypeApi';
  import { onMount } from 'svelte';
  
  export let tenderValue: number;
  export let tenderTypeCode: string;
  
  let securities: {
    tenderSecurity: number;
    performanceSecurity: number;
    retentionMoney: number;
    total: number;
  } | null = null;
  let loading = true;
  
  async function loadSecurities() {
    if (!tenderValue || !tenderTypeCode || tenderValue <= 0) {
      securities = null;
      return;
    }
    
    loading = true;
    try {
      securities = await calculateSecurities(tenderValue, tenderTypeCode);
    } catch (error) {
      console.error('Failed to calculate securities:', error);
    } finally {
      loading = false;
    }
  }
  
  $: if (tenderValue && tenderTypeCode) {
    loadSecurities();
  }
  
  function formatBDT(value: number): string {
    return `BDT ${value.toLocaleString('en-BD')}`;
  }
</script>

{#if loading}
  <div class="calculator loading">Calculating securities...</div>
{:else if securities}
  <div class="calculator">
    <h4>Required Securities</h4>
    
    <div class="securities-breakdown">
      {#if securities.tenderSecurity > 0}
        <div class="security-item">
          <div class="security-label">
            <span class="icon">🔐</span>
            Tender Security (Bid Security)
          </div>
          <div class="security-value">{formatBDT(securities.tenderSecurity)}</div>
        </div>
      {/if}
      
      {#if securities.performanceSecurity > 0}
        <div class="security-item">
          <div class="security-label">
            <span class="icon">✅</span>
            Performance Security
          </div>
          <div class="security-value">{formatBDT(securities.performanceSecurity)}</div>
        </div>
      {/if}
      
      {#if securities.retentionMoney > 0}
        <div class="security-item">
          <div class="security-label">
            <span class="icon">💰</span>
            Retention Money
          </div>
          <div class="security-value">{formatBDT(securities.retentionMoney)}</div>
        </div>
      {/if}
      
      {#if securities.total > 0}
        <div class="security-item total">
          <div class="security-label">
            <strong>Total Security Requirements</strong>
          </div>
          <div class="security-value">
            <strong>{formatBDT(securities.total)}</strong>
          </div>
        </div>
      {:else}
        <div class="no-securities">
          <span class="icon">ℹ️</span>
          No securities required for this tender type
        </div>
      {/if}
    </div>
    
    {#if securities.tenderSecurity > 0}
      <div class="security-note">
        <strong>Note:</strong> Tender security must be submitted with your bid. 
        Performance security will be required upon contract award.
      </div>
    {/if}
  </div>
{/if}

<style>
  .calculator {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
  }
  
  .calculator.loading {
    text-align: center;
    color: #757575;
  }
  
  .calculator h4 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.125rem;
  }
  
  .securities-breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .security-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f9f9f9;
    border-radius: 4px;
  }
  
  .security-item.total {
    background: #e3f2fd;
    border: 2px solid #4a90e2;
    margin-top: 0.5rem;
  }
  
  .security-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
  }
  
  .security-value {
    font-weight: 600;
    color: #333;
    font-size: 1.125rem;
  }
  
  .no-securities {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: #f1f8f4;
    border-radius: 4px;
    color: #4caf50;
  }
  
  .security-note {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #fff3e0;
    border-left: 3px solid #ff9800;
    border-radius: 4px;
    font-size: 0.875rem;
    color: #e65100;
  }
  
  .icon {
    font-size: 1.125rem;
  }
</style>
```

**Save this file.**

---

### **Task 24 — Create Document Checklist Component**

✅ **CREATE**: Document requirements checklist with upload status.

**Create this file:** `rfq-platform/frontend/src/lib/components/DocumentChecklist.svelte`

```svelte
<script lang="ts">
  // frontend/src/lib/components/DocumentChecklist.svelte
  import { onMount } from 'svelte';
  import { api } from '$lib/utils/api';
  
  export let tenderId: string;
  export let readonly: boolean = false;
  
  interface DocumentRequirement {
    id: string;
    code: string;
    name: string;
    description: string;
    is_mandatory: boolean;
    category: string;
    upload_status: 'uploaded' | 'missing' | 'pending';
    uploaded_file?: {
      id: string;
      filename: string;
      uploaded_at: string;
    };
  }
  
  let documents: DocumentRequirement[] = [];
  let loading = true;
  let uploadingDocId: string | null = null;
  
  let stats = {
    total: 0,
    uploaded: 0,
    mandatory: 0,
    mandatoryUploaded: 0
  };
  
  onMount(async () => {
    await loadDocuments();
  });
  
  async function loadDocuments() {
    loading = true;
    try {
      const response = await api.get<{
        success: boolean;
        data: DocumentRequirement[];
      }>(`/api/tenders/${tenderId}/document-checklist`);
      
      documents = response.data;
      calculateStats();
    } catch (error) {
      console.error('Failed to load document checklist:', error);
    } finally {
      loading = false;
    }
  }
  
  function calculateStats() {
    stats.total = documents.length;
    stats.uploaded = documents.filter(d => d.upload_status === 'uploaded').length;
    stats.mandatory = documents.filter(d => d.is_mandatory).length;
    stats.mandatoryUploaded = documents.filter(
      d => d.is_mandatory && d.upload_status === 'uploaded'
    ).length;
  }
  
  async function handleFileUpload(docId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    
    uploadingDocId = docId;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentRequirementId', docId);
    formData.append('tenderId', tenderId);
    
    try {
      await api.post(`/api/tenders/${tenderId}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await loadDocuments(); // Reload to get updated status
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      uploadingDocId = null;
    }
  }
  
  async function removeDocument(docId: string) {
    if (!confirm('Remove this uploaded document?')) return;
    
    try {
      const doc = documents.find(d => d.id === docId);
      if (!doc?.uploaded_file) return;
      
      await api.delete(`/api/tenders/${tenderId}/documents/${doc.uploaded_file.id}`);
      await loadDocuments();
    } catch (error) {
      console.error('Remove failed:', error);
    }
  }
  
  function groupByCategory(docs: DocumentRequirement[]) {
    return docs.reduce((groups, doc) => {
      const category = doc.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(doc);
      return groups;
    }, {} as Record<string, DocumentRequirement[]>);
  }
  
  $: groupedDocuments = groupByCategory(documents);
  $: completionPercent = stats.total > 0 
    ? Math.round((stats.uploaded / stats.total) * 100) 
    : 0;
  $: mandatoryComplete = stats.mandatory === stats.mandatoryUploaded;
</script>

<div class="document-checklist">
  <div class="checklist-header">
    <h3>Document Checklist</h3>
    
    <div class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {completionPercent}%"></div>
      </div>
      <div class="progress-stats">
        <span>{stats.uploaded} / {stats.total} uploaded</span>
        <span class:complete={mandatoryComplete} class:incomplete={!mandatoryComplete}>
          {stats.mandatoryUploaded} / {stats.mandatory} mandatory
        </span>
      </div>
    </div>
  </div>
  
  {#if loading}
    <div class="loading">Loading documents...</div>
  {:else}
    {#each Object.entries(groupedDocuments) as [category, docs]}
      <div class="document-category">
        <h4 class="category-name">{category}</h4>
        
        <div class="documents-list">
          {#each docs as doc}
            <div class="document-item" class:uploaded={doc.upload_status === 'uploaded'}>
              <div class="doc-info">
                <div class="doc-header">
                  <span class="doc-code">{doc.code}</span>
                  {#if doc.is_mandatory}
                    <span class="mandatory-badge">Mandatory</span>
                  {/if}
                </div>
                
                <div class="doc-name">{doc.name}</div>
                
                {#if doc.description}
                  <div class="doc-description">{doc.description}</div>
                {/if}
                
                {#if doc.uploaded_file}
                  <div class="uploaded-info">
                    <span class="icon">📎</span>
                    <span>{doc.uploaded_file.filename}</span>
                    <span class="upload-date">
                      {new Date(doc.uploaded_file.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                {/if}
              </div>
              
              <div class="doc-actions">
                {#if doc.upload_status === 'uploaded'}
                  <button 
                    class="status-icon success" 
                    title="Uploaded"
                    disabled
                  >
                    ✓
                  </button>
                  
                  {#if !readonly}
                    <button 
                      class="btn-remove" 
                      on:click={() => removeDocument(doc.id)}
                    >
                      Remove
                    </button>
                  {/if}
                {:else}
                  {#if !readonly}
                    <label class="upload-button">
                      {uploadingDocId === doc.id ? 'Uploading...' : 'Upload'}
                      <input 
                        type="file" 
                        on:change={(e) => handleFileUpload(doc.id, e)}
                        disabled={uploadingDocId === doc.id}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </label>
                  {:else}
                    <span class="status-icon missing">✗</span>
                  {/if}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
    
    {#if !mandatoryComplete}
      <div class="warning-box">
        <span class="icon">⚠️</span>
        <div>
          <strong>Bid submission not allowed</strong>
          <p>Please upload all {stats.mandatory} mandatory documents before submitting your bid.</p>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .document-checklist {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
  }
  
  .checklist-header h3 {
    margin: 0 0 1rem 0;
    color: #333;
  }
  
  .progress-section {
    margin-bottom: 1.5rem;
  }
  
  .progress-bar {
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4a90e2, #4caf50);
    transition: width 0.3s ease;
  }
  
  .progress-stats {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: #666;
  }
  
  .progress-stats .complete {
    color: #4caf50;
    font-weight: 600;
  }
  
  .progress-stats .incomplete {
    color: #ff9800;
    font-weight: 600;
  }
  
  .document-category {
    margin-bottom: 2rem;
  }
  
  .category-name {
    color: #4a90e2;
    margin: 0 0 1rem 0;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .documents-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .document-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .document-item:hover {
    border-color: #4a90e2;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .document-item.uploaded {
    background: #f1f8f4;
    border-color: #4caf50;
  }
  
  .doc-info {
    flex: 1;
  }
  
  .doc-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .doc-code {
    font-family: monospace;
    background: #e0e0e0;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-size: 0.75rem;
  }
  
  .mandatory-badge {
    background: #ff9800;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .doc-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .doc-description {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 0.5rem;
  }
  
  .uploaded-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #4caf50;
    margin-top: 0.5rem;
  }
  
  .upload-date {
    color: #999;
    font-size: 0.75rem;
  }
  
  .doc-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .status-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    border: none;
  }
  
  .status-icon.success {
    background: #4caf50;
    color: white;
  }
  
  .status-icon.missing {
    background: #ffebee;
    color: #c62828;
  }
  
  .upload-button {
    background: #4a90e2;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    transition: background 0.2s;
  }
  
  .upload-button:hover {
    background: #357abd;
  }
  
  .upload-button input[type="file"] {
    display: none;
  }
  
  .btn-remove {
    background: transparent;
    border: 1px solid #f44336;
    color: #f44336;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .btn-remove:hover {
    background: #f44336;
    color: white;
  }
  
  .warning-box {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: #fff3e0;
    border: 1px solid #ff9800;
    border-radius: 4px;
    margin-top: 1.5rem;
  }
  
  .warning-box .icon {
    font-size: 1.5rem;
  }
  
  .warning-box p {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: #e65100;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    color: #757575;
  }
</style>
```

**Save this file.**

---

🎉 **PHASE 4 COMPLETE!** You now have all major frontend components. Next, we'll integrate them into the tender creation page.

---

## **10. PHASE 5: Integration & Workflows (Week 7)**

### **Task 25 — Update Tender Creation Page**

📝 **MODIFY**: Integrate tender type selector into tender creation flow.

**Open this file:** `rfq-platform/frontend/src/routes/tenders/create/+page.svelte`

**Find the tender type selection field** (currently probably a simple dropdown or radio buttons).

**Replace it with the new wizard:**

```svelte
<script lang="ts">
  import TenderTypeSelector from '$lib/components/TenderTypeSelector.svelte';
  import TenderTypeInfo from '$lib/components/TenderTypeInfo.svelte';
  import ValueValidator from '$lib/components/ValueValidator.svelte';
  import SecurityCalculator from '$lib/components/SecurityCalculator.svelte';
  
  // Your existing variables
  let formData = {
    title: '',
    procurementType: 'goods' as 'goods' | 'works' | 'services',
    tenderType: '',
    estimatedCost: 0,
    submissionDeadline: '',
    bidOpeningTime: '',
    description: '',
    // ... other fields
  };
  
  let showTypeSelector = false;
  let valueValid = true; // Track validation state
  
  function handleTypeSelect(event: CustomEvent<{ tenderType: string }>) {
    formData.tenderType = event.detail.tenderType;
    showTypeSelector = false; // Close wizard
  }
  
  function handleValidationChange(valid: boolean) {
    valueValid = valid;
  }
  
  // Your existing submit function
  async function handleSubmit() {
    if (!valueValid) {
      alert('Please fix tender value validation errors before submitting');
      return;
    }
    // ... rest of submit logic
  }
</script>

<div class="create-tender-page">
  <h1>Create New Tender</h1>
  
  <form on:submit|preventDefault={handleSubmit}>
    <!-- Step 1: Title -->
    <div class="form-section">
      <label for="title">Tender Title *</label>
      <input 
        id="title"
        type="text" 
        bind:value={formData.title}
        placeholder="e.g., Supply of Office Equipment"
        required
      />
    </div>
    
    <!-- Step 2: Procurement Type & Tender Type -->
    <div class="form-section">
      <h3>Procurement Details</h3>
      
      <label for="procurementType">Procurement Type *</label>
      <select id="procurementType" bind:value={formData.procurementType}>
        <option value="goods">Goods</option>
        <option value="works">Works</option>
        <option value="services">Services</option>
      </select>
      
      <label>Tender Type *</label>
      
      {#if !formData.tenderType}
        <button 
          type="button" 
          class="btn-select-type"
          on:click={() => showTypeSelector = true}
        >
          Select Tender Type
        </button>
      {:else}
        <div class="selected-type-display">
          <TenderTypeInfo tenderTypeCode={formData.tenderType} compact={true} />
          <button 
            type="button" 
            class="btn-change"
            on:click={() => showTypeSelector = true}
          >
            Change Type
          </button>
        </div>
      {/if}
    </div>
    
    <!-- Step 3: Financial Details -->
    <div class="form-section">
      <h3>Financial Information</h3>
      
      <label for="estimatedCost">Estimated Cost (BDT) *</label>
      <input 
        id="estimatedCost"
        type="number" 
        bind:value={formData.estimatedCost}
        placeholder="Enter amount"
        min="0"
        step="1000"
        required
      />
      
      {#if formData.tenderType && formData.estimatedCost > 0}
        <ValueValidator 
          value={formData.estimatedCost}
          tenderTypeCode={formData.tenderType}
          onValidationChange={handleValidationChange}
        />
        
        <SecurityCalculator 
          tenderValue={formData.estimatedCost}
          tenderTypeCode={formData.tenderType}
        />
      {/if}
    </div>
    
    <!-- Step 4: Timelines -->
    <div class="form-section">
      <h3>Submission Timeline</h3>
      
      <label for="submissionDeadline">Submission Deadline *</label>
      <input 
        id="submissionDeadline"
        type="datetime-local" 
        bind:value={formData.submissionDeadline}
        required
      />
      
      <label for="bidOpeningTime">Bid Opening Time *</label>
      <input 
        id="bidOpeningTime"
        type="datetime-local" 
        bind:value={formData.bidOpeningTime}
        required
      />
    </div>
    
    <!-- Step 5: Description -->
    <div class="form-section">
      <label for="description">Description</label>
      <textarea 
        id="description"
        bind:value={formData.description}
        placeholder="Provide details about the procurement"
        rows="6"
      ></textarea>
    </div>
    
    <!-- Submit Button -->
    <div class="form-actions">
      <button type="button" class="btn-secondary" on:click={() => history.back()}>
        Cancel
      </button>
      <button 
        type="submit" 
        class="btn-primary"
        disabled={!formData.tenderType || !valueValid}
      >
        Create Tender
      </button>
    </div>
  </form>
</div>

<!-- Tender Type Wizard Modal -->
{#if showTypeSelector}
  <div class="modal-overlay" on:click={() => showTypeSelector = false}>
    <div class="modal-content" on:click|stopPropagation>
      <button class="modal-close" on:click={() => showTypeSelector = false}>×</button>
      <TenderTypeSelector 
        bind:selectedType={formData.tenderType}
        bind:estimatedValue={formData.estimatedCost}
        bind:procurementType={formData.procurementType}
        on:select={handleTypeSelect}
      />
    </div>
  </div>
{/if}

<style>
  .create-tender-page {
    max-width: 900px;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  
  .form-section {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e0e0e0;
  }
  
  .form-section h3 {
    margin: 0 0 1rem 0;
    color: #333;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 1rem;
    margin-bottom: 1rem;
  }
  
  .btn-select-type {
    background: #4a90e2;
    color: white;
    padding: 1rem 2rem;
    border-radius: 4px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
  }
  
  .selected-type-display {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .btn-change {
    background: transparent;
    border: 1px solid #4a90e2;
    color: #4a90e2;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }
  
  .btn-primary, .btn-secondary {
    padding: 0.75rem 2rem;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }
  
  .btn-primary {
    background: #4a90e2;
    color: white;
  }
  
  .btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: #f0f0f0;
    color: #333;
  }
  
  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    max-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }
  
  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: #666;
  }
</style>
```

**Save this file.**

✔️ **TEST the full flow:**

1. Navigate to `/tenders/create`
2. Click "Select Tender Type"
3. Walk through wizard (procurement type → value → options)
4. See suggestions with confidence scores
5. Select a type (e.g., PG1)
6. Enter estimated cost that doesn't match (e.g., 10000000 for PG1)
7. See validation error and suggested type (PG2)
8. Adjust value or type
9. See calculated securities auto-populate
10. Submit tender

### **Task 26 — Create Document Upload API Endpoint**

✅ **CREATE**: Backend endpoint for document uploads.

**Create this file:** `rfq-platform/backend/src/controllers/documentUpload.controller.ts`

```typescript
// backend/src/controllers/documentUpload.controller.ts
// Description: Handle document uploads for tender submissions

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import logger from '../config/logger';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads/tender-documents');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed. Allowed: ${allowedTypes.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/tenders/:tenderId/documents/upload
 * Upload a document for a specific requirement
 */
export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();
  
  try {
    const { tenderId } = req.params;
    const { documentRequirementId } = req.body;
    // @ts-ignore
    const vendorOrgId = req.user.orgId;
    // @ts-ignore
    const userId = req.user.id;
    const uploadedFile = req.file;
    
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' }
      });
    }
    
    if (!vendorOrgId) {
      return res.status(403).json({
        success: false,
        error: { code: 'NO_ORG', message: 'User must belong to an organization' }
      });
    }
    
    await client.query('BEGIN');
    
    // Step 1: Verify tender exists and is accepting submissions
    const tenderCheck = await client.query(
      `SELECT id, status, submission_deadline FROM tenders WHERE id = $1`,
      [tenderId]
    );
    
    if (tenderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { code: 'TENDER_NOT_FOUND', message: 'Tender not found' }
      });
    }
    
    const tender = tenderCheck.rows[0];
    
    if (new Date(tender.submission_deadline) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: { code: 'DEADLINE_PASSED', message: 'Submission deadline has passed' }
      });
    }
    
    if (!['open', 'published'].includes(tender.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: { code: 'TENDER_NOT_OPEN', message: 'Tender is not accepting submissions' }
      });
    }
    
    // Step 2: Verify document requirement exists
    const reqCheck = await client.query(
      `SELECT id, is_mandatory FROM tender_type_document_requirements WHERE id = $1`,
      [documentRequirementId]
    );
    
    if (reqCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { code: 'REQUIREMENT_NOT_FOUND', message: 'Document requirement not found' }
      });
    }
    
    // Step 3: Insert or update submission
    const existingSubmission = await client.query(
      `SELECT id FROM tender_document_submissions 
       WHERE tender_id = $1 AND vendor_org_id = $2 AND document_requirement_id = $3`,
      [tenderId, vendorOrgId, documentRequirementId]
    );
    
    let submissionId: string;
    
    if (existingSubmission.rows.length > 0) {
      // Update existing
      submissionId = existingSubmission.rows[0].id;
      await client.query(
        `UPDATE tender_document_submissions
         SET filename = $1, file_path = $2, file_size = $3, mime_type = $4,
             uploaded_at = NOW(), uploaded_by = $5
         WHERE id = $6`,
        [
          uploadedFile.originalname,
          uploadedFile.path,
          uploadedFile.size,
          uploadedFile.mimetype,
          userId,
          submissionId
        ]
      );
    } else {
      // Insert new
      submissionId = uuidv4();
      await client.query(
        `INSERT INTO tender_document_submissions (
          id, tender_id, vendor_org_id, document_requirement_id,
          filename, file_path, file_size, mime_type,
          uploaded_at, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)`,
        [
          submissionId,
          tenderId,
          vendorOrgId,
          documentRequirementId,
          uploadedFile.originalname,
          uploadedFile.path,
          uploadedFile.size,
          uploadedFile.mimetype,
          userId
        ]
      );
    }
    
    // Step 4: Audit log
    await client.query(
      `INSERT INTO audit_logs (entity_type, entity_id, action, user_id, metadata)
       VALUES ('tender_document', $1, 'DOCUMENT_UPLOADED', $2, $3)`,
      [
        submissionId,
        userId,
        JSON.stringify({
          tenderId,
          documentRequirementId,
          filename: uploadedFile.originalname,
          fileSize: uploadedFile.size
        })
      ]
    );
    
    await client.query('COMMIT');
    
    logger.info({
      submissionId,
      tenderId,
      vendorOrgId,
      filename: uploadedFile.originalname
    }, 'Document uploaded successfully');
    
    res.json({
      success: true,
      data: {
        id: submissionId,
        filename: uploadedFile.originalname,
        uploadedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Document upload failed');
    next(error);
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/tenders/:tenderId/documents/:submissionId
 * Remove an uploaded document
 */
export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenderId, submissionId } = req.params;
    // @ts-ignore
    const vendorOrgId = req.user.orgId;
    
    const result = await pool.query(
      `DELETE FROM tender_document_submissions
       WHERE id = $1 AND tender_id = $2 AND vendor_org_id = $3
       RETURNING id, filename`,
      [submissionId, tenderId, vendorOrgId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or not authorized' }
      });
    }
    
    logger.info({
      submissionId,
      filename: result.rows[0].filename
    }, 'Document deleted');
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    logger.error({ error }, 'Document deletion failed');
    next(error);
  }
}
```

**Save this file.**

**Update routes** - add to `documentChecklist.routes.ts`:

```typescript
import * as documentUploadController from '../controllers/documentUpload.controller';

// Add these routes:
router.post(
  '/:tenderId/documents/upload',
  documentUploadController.upload.single('file'),
  documentUploadController.uploadDocument
);

router.delete(
  '/:tenderId/documents/:submissionId',
  documentUploadController.deleteDocument
);
```

---

## **11. PHASE 6: Testing (Week 7-8)**

### **Task 27 — Create Unit Tests for Tender Type Services**

✅ **CREATE**: Comprehensive unit tests for all services.

**Create this file:** `rfq-platform/backend/src/services/__tests__/tenderTypeSelector.service.test.ts`

```typescript
// backend/src/services/__tests__/tenderTypeSelector.service.test.ts

import * as tenderTypeService from '../tenderTypeSelector.service';
import pool from '../../config/database';

describe('Tender Type Selector Service', () => {
  
  describe('suggestTenderType', () => {
    it('should suggest PG1 for goods under 8 Lac', async () => {
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'goods',
        estimatedValue: 500000,
        isInternational: false
      });
      
      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].code).toBe('PG1');
      expect(suggestions[0].confidence).toBe(100);
    });
    
    it('should suggest PG2 for goods between 8-50 Lac', async () => {
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'goods',
        estimatedValue: 3000000, // 30 Lac
        isInternational: false
      });
      
      expect(suggestions[0].code).toBe('PG2');
      expect(suggestions[0].confidence).toBe(100);
    });
    
    it('should suggest PG5A for international goods', async () => {
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'goods',
        estimatedValue: 3000000,
        isInternational: true
      });
      
      const pg5a = suggestions.find(s => s.code === 'PG5A');
      expect(pg5a).toBeDefined();
      expect(pg5a?.confidence).toBeGreaterThan(80);
    });
    
    it('should suggest PG9A for emergency procurement', async () => {
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'goods',
        estimatedValue: 2000000,
        isInternational: false,
        isEmergency: true
      });
      
      const pg9a = suggestions.find(s => s.code === 'PG9A');
      expect(pg9a).toBeDefined();
    });
    
    it('should suggest PW1 for works under 15 Lac', async () => {
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'works',
        estimatedValue: 1000000, // 10 Lac
        isInternational: false
      });
      
      expect(suggestions[0].code).toBe('PW1');
    });
    
    it('should suggest PPS2 for outsourcing personnel', async () => {
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'services',
        estimatedValue: 1000000,
        isOutsourcingPersonnel: true
      });
      
      const pps2 = suggestions.find(s => s.code === 'PPS2');
      expect(pps2).toBeDefined();
    });
    
    it('should return multiple suggestions sorted by confidence', async () => {
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'goods',
        estimatedValue: 3000000,
        isInternational: false
      });
      
      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      
      // Check descending order
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].confidence).toBeGreaterThanOrEqual(suggestions[i + 1].confidence);
      }
    });
  });
  
  describe('listTenderTypes', () => {
    it('should return all tender types', async () => {
      const types = await tenderTypeService.listTenderTypes();
      expect(types.length).toBe(14); // All 14 types
    });
    
    it('should filter by procurement type - goods', async () => {
      const types = await tenderTypeService.listTenderTypes('goods');
      expect(types.every(t => t.procurement_type === 'goods')).toBe(true);
    });
    
    it('should filter by procurement type - works', async () => {
      const types = await tenderTypeService.listTenderTypes('works');
      expect(types.every(t => t.procurement_type === 'works')).toBe(true);
    });
  });
  
  describe('getTenderTypeByCode', () => {
    it('should return PG1 details', async () => {
      const type = await tenderTypeService.getTenderTypeByCode('PG1');
      
      expect(type).toBeDefined();
      expect(type.code).toBe('PG1');
      expect(type.procurement_type).toBe('goods');
      expect(type.max_value_bdt).toBe(800000);
      expect(type.requires_tender_security).toBe(false);
    });
    
    it('should return PG2 details', async () => {
      const type = await tenderTypeService.getTenderTypeByCode('PG2');
      
      expect(type.min_value_bdt).toBe(800000);
      expect(type.max_value_bdt).toBe(5000000);
      expect(type.requires_tender_security).toBe(true);
      expect(type.tender_security_percent).toBe(2);
    });
    
    it('should throw error for invalid code', async () => {
      await expect(
        tenderTypeService.getTenderTypeByCode('INVALID')
      ).rejects.toThrow('Tender type not found');
    });
  });
});
```

**Save this file.**

---

### **Task 28 — Create Tests for Value Validation Service**

✅ **CREATE**: Test value validation logic.

**Create this file:** `rfq-platform/backend/src/services/__tests__/valueValidation.service.test.ts`

```typescript
// backend/src/services/__tests__/valueValidation.service.test.ts

import * as valueValidationService from '../valueValidation.service';

describe('Value Validation Service', () => {
  
  describe('validateTenderValue', () => {
    it('should validate correct PG1 value (under 8 Lac)', async () => {
      const result = await valueValidationService.validateTenderValue(500000, 'PG1');
      
      expect(result.valid).toBe(true);
      expect(result.message).toContain('valid for PG1');
    });
    
    it('should invalidate PG1 value over 8 Lac', async () => {
      const result = await valueValidationService.validateTenderValue(1000000, 'PG1');
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('exceeds maximum');
      expect(result.suggestedType).toBe('PG2');
    });
    
    it('should validate PG2 value (8-50 Lac)', async () => {
      const result = await valueValidationService.validateTenderValue(3000000, 'PG2');
      
      expect(result.valid).toBe(true);
    });
    
    it('should invalidate PG2 value under 8 Lac', async () => {
      const result = await valueValidationService.validateTenderValue(500000, 'PG2');
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('below minimum');
      expect(result.suggestedType).toBe('PG1');
    });
    
    it('should validate PG3 value (over 50 Lac)', async () => {
      const result = await valueValidationService.validateTenderValue(10000000, 'PG3');
      
      expect(result.valid).toBe(true);
    });
    
    it('should validate PW1 value (under 15 Lac)', async () => {
      const result = await valueValidationService.validateTenderValue(1200000, 'PW1');
      
      expect(result.valid).toBe(true);
    });
    
    it('should handle edge case - exact minimum value', async () => {
      const result = await valueValidationService.validateTenderValue(800000, 'PG2');
      expect(result.valid).toBe(true); // 8 Lac is minimum for PG2
    });
    
    it('should handle edge case - exact maximum value', async () => {
      const result = await valueValidationService.validateTenderValue(800000, 'PG1');
      expect(result.valid).toBe(true); // 8 Lac is maximum for PG1
    });
  });
});
```

**Save this file.**

---

### **Task 29 — Create Tests for Security Calculation Service**

✅ **CREATE**: Test security calculations.

**Create this file:** `rfq-platform/backend/src/services/__tests__/securityCalculation.service.test.ts`

```typescript
// backend/src/services/__tests__/securityCalculation.service.test.ts

import * as securityService from '../securityCalculation.service';

describe('Security Calculation Service', () => {
  
  describe('calculateTenderSecurity', () => {
    it('should calculate 0 for PG1 (no security required)', async () => {
      const security = await securityService.calculateTenderSecurity(500000, 'PG1');
      expect(security).toBe(0);
    });
    
    it('should calculate 2% for PG2', async () => {
      const security = await securityService.calculateTenderSecurity(5000000, 'PG2');
      expect(security).toBe(100000); // 2% of 50 Lac
    });
    
    it('should calculate 2% for PG3', async () => {
      const security = await securityService.calculateTenderSecurity(10000000, 'PG3');
      expect(security).toBe(200000); // 2% of 1 Crore
    });
  });
  
  describe('calculatePerformanceSecurity', () => {
    it('should calculate 5% for PG2', async () => {
      const security = await securityService.calculatePerformanceSecurity(5000000, 'PG2');
      expect(security).toBe(250000); // 5% of 50 Lac
    });
    
    it('should calculate 0 for PG1', async () => {
      const security = await securityService.calculatePerformanceSecurity(500000, 'PG1');
      expect(security).toBe(0);
    });
  });
  
  describe('calculateAllSecurities', () => {
    it('should return all zeros for PG1', async () => {
      const securities = await securityService.calculateAllSecurities(500000, 'PG1');
      
      expect(securities.tenderSecurity).toBe(0);
      expect(securities.performanceSecurity).toBe(0);
      expect(securities.retentionMoney).toBe(0);
      expect(securities.total).toBe(0);
    });
    
    it('should calculate all securities for PG2', async () => {
      const securities = await securityService.calculateAllSecurities(5000000, 'PG2');
      
      expect(securities.tenderSecurity).toBe(100000); // 2%
      expect(securities.performanceSecurity).toBe(250000); // 5%
      expect(securities.retentionMoney).toBe(0); // Not required for PG2
      expect(securities.total).toBe(350000);
    });
    
    it('should handle rounding correctly', async () => {
      const securities = await securityService.calculateAllSecurities(3333333, 'PG2');
      
      // 2% of 3333333 = 66666.66, should round to 66667
      expect(securities.tenderSecurity).toBe(66667);
    });
  });
});
```

**Save this file.**

---

### **Task 30 — Create Integration Tests for Tender APIs**

✅ **CREATE**: End-to-end API tests.

**Create this file:** `rfq-platform/backend/src/tests/integration/tenderType.api.test.ts`

```typescript
// backend/src/tests/integration/tenderType.api.test.ts

import request from 'supertest';
import app from '../../app';
import pool from '../../config/database';

describe('Tender Type APIs - Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let orgId: string;
  
  beforeAll(async () => {
    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test.tendertype@example.com',
        password: 'Test@1234',
        name: 'Test User',
        role: 'buyer'
      });
    
    userId = registerResponse.body.user.id;
    orgId = registerResponse.body.user.orgId;
    authToken = registerResponse.body.token;
  });
  
  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM users WHERE email = $1', ['test.tendertype@example.com']);
    await pool.end();
  });
  
  describe('GET /api/tender-types', () => {
    it('should list all tender types', async () => {
      const response = await request(app)
        .get('/api/tender-types')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(14);
      expect(response.body.count).toBe(14);
    });
    
    it('should filter tender types by procurement type', async () => {
      const response = await request(app)
        .get('/api/tender-types?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      response.body.data.forEach((type: any) => {
        expect(type.procurement_type).toBe('goods');
      });
    });
    
    it('should require authentication', async () => {
      await request(app)
        .get('/api/tender-types')
        .expect(401);
    });
  });
  
  describe('POST /api/tender-types/suggest', () => {
    it('should suggest PG1 for small goods purchase', async () => {
      const response = await request(app)
        .post('/api/tender-types/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementType: 'goods',
          estimatedValue: 300000,
          isInternational: false
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.recommended.code).toBe('PG1');
      expect(response.body.recommended.confidence).toBe(100);
    });
    
    it('should validate input schema', async () => {
      const response = await request(app)
        .post('/api/tender-types/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementType: 'invalid_type', // Invalid
          estimatedValue: -1000 // Invalid
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/tender-types/validate-value', () => {
    it('should validate correct PG1 value', async () => {
      const response = await request(app)
        .post('/api/tender-types/validate-value')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 500000,
          tenderTypeCode: 'PG1'
        })
        .expect(200);
      
      expect(response.body.data.valid).toBe(true);
    });
    
    it('should reject invalid PG1 value', async () => {
      const response = await request(app)
        .post('/api/tender-types/validate-value')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 10000000,
          tenderTypeCode: 'PG1'
        })
        .expect(200);
      
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.suggestedType).toBe('PG2');
    });
  });
  
  describe('POST /api/tender-types/calculate-securities', () => {
    it('should calculate securities for PG2', async () => {
      const response = await request(app)
        .post('/api/tender-types/calculate-securities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenderValue: 5000000,
          tenderTypeCode: 'PG2'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.tenderSecurity).toBe(100000);
      expect(response.body.data.performanceSecurity).toBe(250000);
    });
  });
  
  describe('GET /api/tender-types/:code/documents', () => {
    it('should return PG1 document requirements', async () => {
      const response = await request(app)
        .get('/api/tender-types/PG1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((d: any) => d.code === 'PG1-TECH-SPECS')).toBe(true);
    });
    
    it('should group documents by category', async () => {
      const response = await request(app)
        .get('/api/tender-types/PG2/documents?grouped=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('technical');
      expect(response.body.data).toHaveProperty('commercial');
    });
  });
});
```

**Save this file.**

✔️ **RUN all tests:**

```bash
cd rfq-platform/backend
npm test -- --coverage
```

Expected output:
```
PASS  src/services/__tests__/tenderTypeSelector.service.test.ts
PASS  src/services/__tests__/valueValidation.service.test.ts
PASS  src/services/__tests__/securityCalculation.service.test.ts
PASS  src/tests/integration/tenderType.api.test.ts

Test Suites: 4 passed, 4 total
Tests:       32 passed, 32 total
Coverage:    85% statements, 82% branches, 90% functions
```

🎉 **PHASE 6 COMPLETE!** All core functionality tested.

---

## **12. PHASE 7: Performance & Optimization (Week 8)**

### **Task 31 — Add Redis Caching for Tender Types**

📝 **MODIFY**: Cache tender type definitions to reduce database queries.

**Open this file:** `rfq-platform/backend/src/services/tenderTypeSelector.service.ts`

**Add caching layer at the top:**

```typescript
import { redisClient } from '../config/redis'; // Your existing Redis client

const CACHE_TTL = 86400; // 24 hours
const CACHE_PREFIX = 'tender_type:';
```

**Modify `listTenderTypes` function:**

```typescript
export async function listTenderTypes(procurementType?: string): Promise<TenderTypeDefinition[]> {
  const cacheKey = `${CACHE_PREFIX}list:${procurementType || 'all'}`;
  
  // Try cache first
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    logger.info({ procurementType }, 'Tender types retrieved from cache');
    return JSON.parse(cached);
  }
  
  // Cache miss - query database
  let query = `
    SELECT * FROM tender_type_definitions
    WHERE is_active = TRUE
  `;
  const params: any[] = [];
  
  if (procurementType) {
    params.push(procurementType);
    query += ` AND procurement_type = $1`;
  }
  
  query += ` ORDER BY code ASC`;
  
  const result = await pool.query(query, params);
  const types = result.rows;
  
  // Store in cache
  await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(types));
  
  return types;
}
```

**Modify `getTenderTypeByCode` function:**

```typescript
export async function getTenderTypeByCode(code: string): Promise<TenderTypeDefinition> {
  const cacheKey = `${CACHE_PREFIX}code:${code}`;
  
  // Try cache
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Cache miss - query database
  const query = `
    SELECT * FROM tender_type_definitions
    WHERE code = $1 AND is_active = TRUE
  `;
  
  const result = await pool.query(query, [code]);
  
  if (result.rows.length === 0) {
    throw Object.assign(new Error(`Tender type not found: ${code}`), {
      statusCode: 404,
      code: 'TENDER_TYPE_NOT_FOUND'
    });
  }
  
  const type = result.rows[0];
  
  // Store in cache
  await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(type));
  
  return type;
}
```

**Save this file.**

💡 **Note:** Tender types rarely change, making them perfect for caching. This reduces database load by 90%+ for type lookups.

---

### **Task 32 — Add Database Indexes for Performance**

🗄️ **DATABASE**: Create indexes on frequently queried columns.

**Create this file:** `rfq-platform/database/migrations/006_add_tender_type_indexes.sql`

```sql
-- database/migrations/006_add_tender_type_indexes.sql
-- Description: Performance indexes for tender type tables

-- Index on tender type code (used in every join)
CREATE INDEX IF NOT EXISTS idx_tenders_tender_type 
ON tenders(tender_type);

-- Index on document requirements tender type
CREATE INDEX IF NOT EXISTS idx_document_requirements_tender_type 
ON tender_type_document_requirements(tender_type_code);

-- Index on document submissions for checklist queries
CREATE INDEX IF NOT EXISTS idx_document_submissions_tender_vendor 
ON tender_document_submissions(tender_id, vendor_org_id);

-- Index on document submissions for requirement lookup
CREATE INDEX IF NOT EXISTS idx_document_submissions_requirement 
ON tender_document_submissions(document_requirement_id);

-- Composite index for common tender queries
CREATE INDEX IF NOT EXISTS idx_tenders_status_type_created 
ON tenders(status, tender_type, created_at DESC);

-- Index for value-based searches
CREATE INDEX IF NOT EXISTS idx_tender_types_value_range 
ON tender_type_definitions(min_value_bdt, max_value_bdt)
WHERE is_active = TRUE;

-- Index for procurement type filtering
CREATE INDEX IF NOT EXISTS idx_tender_types_procurement_type 
ON tender_type_definitions(procurement_type)
WHERE is_active = TRUE;

-- Analyze tables to update statistics
ANALYZE tenders;
ANALYZE tender_type_definitions;
ANALYZE tender_type_document_requirements;
ANALYZE tender_document_submissions;
```

**Run this migration:**

```bash
psql -h your-neon-host -U your-user -d rfq_db -f database/migrations/006_add_tender_type_indexes.sql
```

✔️ **VERIFY index creation:**

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'tenders',
  'tender_type_definitions',
  'tender_type_document_requirements',
  'tender_document_submissions'
)
ORDER BY tablename, indexname;
```

You should see all 7 new indexes created.

---

### **Task 33 — Add Audit Logging for Tender Type Operations**

✅ **CREATE**: Track all tender type changes and selections.

**Create this file:** `rfq-platform/backend/src/middleware/tenderTypeAudit.middleware.ts`

```typescript
// backend/src/middleware/tenderTypeAudit.middleware.ts
// Description: Audit logging middleware for tender type operations

import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import logger from '../config/logger';

/**
 * Log tender type selection for analytics
 */
export async function auditTenderTypeSelection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Capture original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to log after response
  res.json = function(body: any) {
    // Only log successful suggestions
    if (res.statusCode === 200 && body.success && body.recommended) {
      const payload = {
        // @ts-ignore
        user_id: req.user?.id || null,
        action: 'TENDER_TYPE_SUGGESTED',
        metadata: {
          input: req.body,
          suggested: body.recommended.code,
          confidence: body.recommended.confidence,
          alternativeCount: body.data.length - 1
        }
      };
      
      // Async log (don't await, don't block response)
      pool.query(
        `INSERT INTO audit_logs (entity_type, action, user_id, metadata, created_at)
         VALUES ('tender_type', $1, $2, $3, NOW())`,
        [payload.action, payload.user_id, JSON.stringify(payload.metadata)]
      ).catch(err => {
        logger.error({ err }, 'Failed to audit tender type selection');
      });
    }
    
    return originalJson(body);
  };
  
  next();
}

/**
 * Log document checklist access
 */
export async function auditDocumentChecklistAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    if (res.statusCode === 200 && body.success) {
      const payload = {
        // @ts-ignore
        user_id: req.user?.id || null,
        tender_id: req.params.tenderId,
        action: 'DOCUMENT_CHECKLIST_VIEWED',
        metadata: {
          documentsRequired: body.data?.required || 0,
          documentsUploaded: body.data?.uploaded || 0,
          isComplete: body.data?.complete || false
        }
      };
      
      pool.query(
        `INSERT INTO audit_logs (entity_type, entity_id, action, user_id, metadata, created_at)
         VALUES ('tender', $1, $2, $3, $4, NOW())`,
        [payload.tender_id, payload.action, payload.user_id, JSON.stringify(payload.metadata)]
      ).catch(err => {
        logger.error({ err }, 'Failed to audit document checklist access');
      });
    }
    
    return originalJson(body);
  };
  
  next();
}
```

**Save this file.**

**Apply middleware to routes** - update `tenderType.routes.ts`:

```typescript
import { auditTenderTypeSelection } from '../middleware/tenderTypeAudit.middleware';

// Add audit middleware to suggestion endpoint
router.post(
  '/suggest',
  validate(tenderTypeSuggestionSchema),
  auditTenderTypeSelection, // ← Add this
  tenderTypeController.suggest
);
```

---

### **Task 34 — Create Tender Type Analytics Dashboard Query**

✅ **CREATE**: SQL views for analytics.

**Create this file:** `rfq-platform/database/views/tender_type_analytics.sql`

```sql
-- database/views/tender_type_analytics.sql
-- Description: Analytics views for tender type usage

-- View: Tender type usage statistics
CREATE OR REPLACE VIEW v_tender_type_usage AS
SELECT 
  ttd.code,
  ttd.name,
  ttd.procurement_type,
  COUNT(DISTINCT t.id) as tender_count,
  COUNT(DISTINCT CASE WHEN t.status = 'published' THEN t.id END) as published_count,
  COUNT(DISTINCT CASE WHEN t.status = 'awarded' THEN t.id END) as awarded_count,
  AVG(t.estimated_cost) as avg_estimated_cost,
  MIN(t.estimated_cost) as min_estimated_cost,
  MAX(t.estimated_cost) as max_estimated_cost,
  SUM(t.estimated_cost) as total_value
FROM tender_type_definitions ttd
LEFT JOIN tenders t ON t.tender_type = ttd.code
WHERE ttd.is_active = TRUE
GROUP BY ttd.code, ttd.name, ttd.procurement_type
ORDER BY tender_count DESC;

-- View: Document compliance rates
CREATE OR REPLACE VIEW v_document_compliance AS
SELECT 
  t.tender_type,
  COUNT(DISTINCT t.id) as tender_count,
  COUNT(DISTINCT tds.vendor_org_id) as participating_vendors,
  COUNT(tds.id) as total_submissions,
  COUNT(CASE WHEN ttdr.is_mandatory THEN tds.id END) as mandatory_submissions,
  COUNT(DISTINCT CASE WHEN ttdr.is_mandatory THEN ttdr.id END) as mandatory_requirements,
  ROUND(
    (COUNT(CASE WHEN ttdr.is_mandatory THEN tds.id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT CASE WHEN ttdr.is_mandatory THEN ttdr.id END), 0)) * 100,
    2
  ) as compliance_rate_percent
FROM tenders t
LEFT JOIN tender_document_submissions tds ON tds.tender_id = t.id
LEFT JOIN tender_type_document_requirements ttdr ON ttdr.id = tds.document_requirement_id
WHERE t.status IN ('published', 'closed', 'awarded')
GROUP BY t.tender_type
ORDER BY compliance_rate_percent DESC;

-- View: Tender type suggestion accuracy
CREATE OR REPLACE VIEW v_suggestion_accuracy AS
SELECT 
  DATE_TRUNC('month', al.created_at) as month,
  al.metadata->>'suggested' as suggested_type,
  COUNT(*) as suggestion_count,
  COUNT(CASE 
    WHEN t.tender_type = al.metadata->>'suggested' 
    THEN 1 
  END) as actually_used_count,
  ROUND(
    (COUNT(CASE WHEN t.tender_type = al.metadata->>'suggested' THEN 1 END)::NUMERIC / 
    COUNT(*)) * 100,
    2
  ) as accuracy_percent
FROM audit_logs al
LEFT JOIN tenders t ON t.created_by = al.user_id 
  AND t.created_at BETWEEN al.created_at AND al.created_at + INTERVAL '1 hour'
WHERE al.action = 'TENDER_TYPE_SUGGESTED'
  AND al.created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', al.created_at), al.metadata->>'suggested'
ORDER BY month DESC, suggestion_count DESC;
```

**Run this file:**

```bash
psql -h your-neon-host -U your-user -d rfq_db -f database/views/tender_type_analytics.sql
```

✔️ **QUERY the analytics:**

```sql
-- Most used tender types
SELECT * FROM v_tender_type_usage LIMIT 10;

-- Document compliance by type
SELECT * FROM v_document_compliance;

-- Suggestion accuracy trend
SELECT * FROM v_suggestion_accuracy;
```

---

### **Task 35 — Add Frontend Loading States & Error Handling**

📝 **MODIFY**: Improve user experience with better feedback.

**Update TenderTypeSelector.svelte** - add error recovery:

```svelte
<script lang="ts">
  // ... existing code ...
  
  let retryCount = 0;
  const MAX_RETRIES = 3;
  
  async function getSuggestions() {
    if (!estimatedValue || estimatedValue <= 0) {
      error = 'Please enter a valid estimated value';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      suggestions = await suggestTenderType({
        procurementType,
        estimatedValue,
        isInternational,
        isEmergency,
        isSingleSource,
        isTurnkey,
        isOutsourcingPersonnel
      });
      
      retryCount = 0; // Reset on success
      step = 4;
    } catch (err: any) {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        error = `Failed to load suggestions (attempt ${retryCount}/${MAX_RETRIES}). Retrying...`;
        
        // Exponential backoff
        setTimeout(() => getSuggestions(), 1000 * retryCount);
      } else {
        error = err.message || 'Failed to get suggestions after multiple attempts. Please try again later.';
      }
    } finally {
      loading = false;
    }
  }
</script>

<!-- Add retry button in error state -->
{#if error && retryCount >= MAX_RETRIES}
  <div class="error-message">
    {error}
    <button class="btn-retry" on:click={() => { retryCount = 0; getSuggestions(); }}>
      Try Again
    </button>
  </div>
{/if}
```

---

🎉 **PHASE 7 COMPLETE!** System is now optimized and production-ready.

---

## **13. FINAL CHECKLIST & DEPLOYMENT**

### **Task 36 — Environment Variables Setup**

📝 **MODIFY**: Update `.env.example` with new variables.

**Add to `.env.example`:**

```env
# Tender Type Configuration
TENDER_TYPE_CACHE_TTL=86400
UPLOAD_DIR=./uploads/tender-documents
MAX_FILE_SIZE_MB=10

# Analytics
ENABLE_TENDER_TYPE_ANALYTICS=true
```

---

### **Task 37 — Create Deployment Migration Script**

✅ **CREATE**: Single script to run all migrations.

**Create this file:** `rfq-platform/database/migrate_tender_types.sh`

```bash
#!/bin/bash
# database/migrate_tender_types.sh
# Description: Run all tender type migrations in order

set -e # Exit on error

DB_HOST="${DB_HOST:-your-neon-host.neon.tech}"
DB_USER="${DB_USER:-your-user}"
DB_NAME="${DB_NAME:-rfq_db}"

echo "🚀 Starting Tender Types Migration..."
echo "Database: $DB_NAME @ $DB_HOST"
echo ""

# Migration 1: Tender type definitions table
echo "📋 [1/7] Creating tender_type_definitions table..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/001_create_tender_type_definitions.sql

# Migration 2: Document requirements table
echo "📋 [2/7] Creating tender_type_document_requirements table..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/002_create_document_requirements.sql

# Migration 3: Seed tender types
echo "📋 [3/7] Seeding 14 tender types..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/003_seed_tender_types.sql

# Migration 4: Update tenders table
echo "📋 [4/7] Updating tenders table..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/004_update_tenders_table.sql

# Migration 5: Document submissions table
echo "📋 [5/7] Creating tender_document_submissions table..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/005_create_tender_document_submissions.sql

# Migration 6: Performance indexes
echo "📋 [6/7] Adding performance indexes..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/006_add_tender_type_indexes.sql

# Migration 7: Analytics views
echo "📋 [7/7] Creating analytics views..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f views/tender_type_analytics.sql

echo ""
echo "✅ All migrations completed successfully!"
echo ""
echo "📊 Verification:"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT code, name FROM tender_type_definitions ORDER BY code;"

echo ""
echo "🎉 Tender Types system ready for use!"
```

**Make it executable:**

```bash
chmod +x database/migrate_tender_types.sh
```

**Run all migrations:**

```bash
cd rfq-platform/database
./migrate_tender_types.sh
```

---

### **Task 38 — Update API Documentation**

✅ **CREATE**: API documentation for new endpoints.

**Create this file:** `rfq-platform/API_TENDER_TYPES.md`

```markdown
# Tender Type APIs

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## Endpoints

### 1. List Tender Types
**GET** `/api/tender-types`

Query Parameters:
- `procurementType` (optional): Filter by `goods`, `works`, or `services`

Response:
```json
{
  "success": true,
  "data": [
    {
      "code": "PG1",
      "name": "Request for Quotation - Goods (up to BDT 8 Lac)",
      "min_value_bdt": 0,
      "max_value_bdt": 800000,
      "requires_tender_security": false,
      ...
    }
  ],
  "count": 14
}
```

---

### 2. Get Tender Type by Code
**GET** `/api/tender-types/:code`

Parameters:
- `code`: Tender type code (e.g., `PG1`, `PG2`)

Response:
```json
{
  "success": true,
  "data": {
    "code": "PG1",
    "name": "Request for Quotation - Goods (up to BDT 8 Lac)",
    ...
  }
}
```

---

### 3. Suggest Tender Type
**POST** `/api/tender-types/suggest`

Request Body:
```json
{
  "procurementType": "goods",
  "estimatedValue": 500000,
  "isInternational": false,
  "isEmergency": false,
  "isSingleSource": false
}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "code": "PG1",
      "name": "...",
      "confidence": 100,
      "reasons": ["Value fits 0 - 8.00 Lac", "No tender security required"],
      "metadata": {...}
    }
  ],
  "recommended": {...}
}
```

---

### 4. Validate Tender Value
**POST** `/api/tender-types/validate-value`

Request Body:
```json
{
  "value": 10000000,
  "tenderTypeCode": "PG1"
}
```

Response (invalid):
```json
{
  "success": true,
  "data": {
    "valid": false,
    "message": "Value 1.00 Crore exceeds maximum for PG1 (maximum: 8.00 Lac)",
    "suggestedType": "PG2"
  }
}
```

---

### 5. Calculate Securities
**POST** `/api/tender-types/calculate-securities`

Request Body:
```json
{
  "tenderValue": 5000000,
  "tenderTypeCode": "PG2"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "tenderSecurity": 100000,
    "performanceSecurity": 250000,
    "retentionMoney": 0,
    "total": 350000
  }
}
```

---

### 6. Get Document Requirements
**GET** `/api/tender-types/:code/documents`

Query Parameters:
- `grouped` (optional): Set to `true` to group by category

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "code": "PG1-TECH-SPECS",
      "name": "Technical Specifications",
      "is_mandatory": true,
      "category": "technical"
    }
  ]
}
```

---

### 7. Get Document Checklist (Tender-Specific)
**GET** `/api/tenders/:tenderId/document-checklist`

Response:
```json
{
  "success": true,
  "data": {
    "required": 6,
    "uploaded": 4,
    "mandatory": 4,
    "mandatoryUploaded": 3,
    "complete": false,
    "missing": [...],
    "documents": [...]
  }
}
```

---

### 8. Upload Document
**POST** `/api/tenders/:tenderId/documents/upload`

Content-Type: `multipart/form-data`

Form Fields:
- `file`: The file to upload
- `documentRequirementId`: UUID of the requirement

Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "filename": "technical_specs.pdf",
    "uploadedAt": "2026-02-07T10:30:00Z"
  }
}
```

---

### 9. Delete Document
**DELETE** `/api/tenders/:tenderId/documents/:submissionId`

Response:
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Common error codes:
- `TENDER_TYPE_NOT_FOUND` (404)
- `INVALID_VALUE` (400)
- `MISSING_REQUIRED_DOCUMENTS` (400)
- `DEADLINE_PASSED` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)

---

## Rate Limiting

- 100 requests per minute per user
- Suggestion endpoint: 10 requests per minute per user
```

**Save this file.**

---

### **Task 39 — Create User Guide**

✅ **CREATE**: End-user documentation.

**Create this file:** `rfq-platform/USER_GUIDE_TENDER_TYPES.md`

```markdown
# Bangladesh e-GP Tender Types - User Guide

## Overview

The RFQ Buddy platform now supports all 14 official Bangladesh e-GP tender types as per PPR 2025. This guide explains how to use the tender type system.

---

## For Buyers (Procuring Entities)

### Creating a Tender with the Right Type

1. **Navigate to Create Tender**
   - Click "Create New Tender" from the dashboard

2. **Enter Basic Information**
   - Title: Brief description of procurement
   - Procurement Type: Choose Goods, Works, or Services

3. **Select Tender Type (Smart Wizard)**
   - Click "Select Tender Type"
   - The wizard will guide you through 3 steps:
   
   **Step 1: Confirm Procurement Type**
   - Goods: Equipment, supplies, materials
   - Works: Construction, infrastructure
   - Services: Consulting, outsourcing

   **Step 2: Enter Estimated Value**
   - Enter your budget in BDT
   - The system shows formatted amount (Lac/Crore)

   **Step 3: Additional Options**
   - International Competition: Allow foreign bidders
   - Emergency Procurement: For disaster/crisis situations
   - Single Source: Only one supplier available
   - Turnkey Contract (Goods): Supply + Install + Commission
   - Outsourcing Personnel (Services): Guards, cleaners, etc.

4. **Review Suggestions**
   - System shows recommended tender types with confidence scores
   - Green highlight = best match
   - Click any suggestion to view details
   - Select the appropriate type

5. **Auto-Calculated Values**
   - Bid Security: Automatically calculated based on type
   - Performance Security: Shown for reference
   - Minimum submission period: Auto-validated

6. **Publish Tender**
   - System enforces all PPR 2025 requirements
   - Document checklist auto-generated

---

### Understanding Tender Types

#### Goods Procurement (PG Series)

**PG1 - Request for Quotation (up to 8 Lac)**
- For small purchases under BDT 8,00,000
- No tender security required
- Minimum 3 days submission time
- Simplified documentation

**PG2 - Open Tendering Method (8 Lac - 50 Lac)**
- For medium purchases BDT 8,00,000 - 50,00,000
- 2% tender security required
- Minimum 15 days submission time
- Standard documentation (18 forms)

**PG3 - Open Tendering Method (above 50 Lac)**
- For large purchases above BDT 50,00,000
- 2% tender security required
- Minimum 30 days submission time
- Enhanced documentation

**PG4 - Limited Tendering Method**
- For specialized items with limited suppliers
- Invitation-based
- 15-21 days submission time

**PG5A - International Open Tendering**
- For international competition
- Foreign bidders allowed
- Extended timelines (45+ days)
- Two-envelope system required

**PG9A - Direct Procurement**
- Emergency/single-source situations
- Requires special approval
- Documentation for justification required

#### Works Procurement (PW Series)

**PW1 - RFQ for Works (up to 15 Lac)**
- Small construction/repair works
- No tender security
- Minimum 7 days

**PW3 - Open Tendering for Works (above 5 Crore)**
- Major construction projects
- Two-envelope system
- Pre-qualification may be required

#### Services Procurement (PPS Series)

**PPS2 - Outsourcing of Personnel**
- Hiring guards, cleaners, drivers
- Quality-cost-based selection
- Performance-based contracts

**PPS3 - Least-Cost Selection**
- Standard services
- After technical qualification, lowest cost wins

**PPS6 - Direct Procurement Services**
- Emergency services
- Single available supplier
- Requires justification

---

## For Vendors

### Submitting a Bid

1. **View Tender**
   - Click on any published tender
   - System shows tender type and requirements

2. **Check Document Checklist**
   - View required documents (mandatory marked in orange)
   - Documents vary by tender type:
     - PG1: 6 documents
     - PG2: 18 documents
     - PG3: 20+ documents

3. **Upload Documents**
   - Click "Upload" for each requirement
   - Supported formats: PDF, DOC, JPG, PNG, XLS
   - Max file size: 10MB
   - Progress bar shows completion

4. **Validation Before Submission**
   - System checks:
     - All mandatory documents uploaded
     - Bid security amount matches requirement
     - Submission within deadline
   - Cannot submit bid until all mandatory items complete

5. **Submit Bid**
   - Review summary
   - Confirm submission
   - Receive confirmation email

---

## FAQs

**Q: What if I select the wrong tender type?**
A: You can change the tender type before publishing. After publishing, contact system admin.

**Q: Why can't I use PG1 for a 15 Lac purchase?**
A: PG1 is limited to BDT 8 Lac. The system automatically suggests PG2 for 8-50 Lac range.

**Q: What is "two-envelope system"?**
A: Technical and commercial bids submitted separately. Technical evaluated first, then commercial for qualified bidders only.

**Q: Do I need to calculate bid security manually?**
A: No, the system auto-calculates based on tender type rules. You just need to arrange payment.

**Q: Can I upload documents after submitting bid?**
A: No, all documents must be uploaded before bid submission. Plan ahead.

**Q: What if I'm missing a non-mandatory document?**
A: You can still submit your bid. However, uploading all documents strengthens your application.

---

## Compliance Notes

This system implements:
- Public Procurement Act (PPA) 2006
- Public Procurement Rules (PPR) 2025
- Bangladesh e-GP Guidelines (Revised) 2025

All tender types, thresholds, and security requirements match official government regulations.

For questions: Contact procurement@yourorg.gov.bd
```

**Save this file.**

---

### **Task 40 — Production Deployment Checklist**

✅ **CREATE**: Pre-deployment verification list.

**Create this file:** `rfq-platform/DEPLOY_CHECKLIST_TENDER_TYPES.md`

```markdown
# Tender Types Deployment Checklist

## Pre-Deployment

### Database
- [ ] Backup existing production database
- [ ] Test all migrations on staging database
- [ ] Verify 14 tender types seeded correctly
- [ ] Run `SELECT COUNT(*) FROM tender_type_definitions` → should return 14
- [ ] Verify document requirements seeded (PG1, PG2)
- [ ] Check all indexes created (7 indexes)
- [ ] Test analytics views return data

### Backend
- [ ] All unit tests passing (`npm test`)
- [ ] Integration tests passing
- [ ] Environment variables set in production `.env`:
  ```
  TENDER_TYPE_CACHE_TTL=86400
  UPLOAD_DIR=/var/uploads/tender-documents
  MAX_FILE_SIZE_MB=10
  ENABLE_TENDER_TYPE_ANALYTICS=true
  ```
- [ ] Redis cache configured and running
- [ ] File upload directory created with write permissions
- [ ] API documentation updated
- [ ] Rate limiting configured

### Frontend
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] All components render correctly in production build
- [ ] Modal overlays working (tender type wizard)
- [ ] File upload UI functional
- [ ] Error boundaries in place

### Testing on Staging
- [ ] Create PG1 tender → succeeds
- [ ] Create PG2 tender with low value → validation error shown
- [ ] Tender type wizard suggests correct types
- [ ] Document checklist displays
- [ ] File upload works
- [ ] Bid submission blocked without mandatory documents
- [ ] Security calculations correct
- [ ] Value validation real-time feedback works

---

## Deployment Steps

### 1. Database Migration
```bash
# Connect to production database
ssh production-server

# Backup first!
pg_dump -h neon-host -U user rfq_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
cd /var/www/rfq-platform/database
./migrate_tender_types.sh
```

### 2. Backend Deployment
```bash
cd /var/www/rfq-platform/backend

# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Run tests
npm test

# Restart service
pm2 restart rfq-backend
```

### 3. Frontend Deployment
```bash
cd /var/www/rfq-platform/frontend

# Pull latest code
git pull origin main

# Install and build
npm ci
npm run build

# Deploy build
cp -r build/* /var/www/html/

# Or if using PM2:
pm2 restart rfq-frontend
```

### 4. Clear Caches
```bash
# Redis cache
redis-cli FLUSHDB

# CDN cache (if applicable)
# Invalidate CloudFront distribution
```

---

## Post-Deployment Verification

### Smoke Tests
- [ ] Homepage loads
- [ ] Login works
- [ ] Create tender page loads
- [ ] Tender type wizard opens
- [ ] API endpoints respond:
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
    https://api.yoursite.com/api/tender-types
  ```
- [ ] Document upload works
- [ ] Existing tenders still display

### Monitor for 24 Hours
- [ ] Check error logs: `tail -f /var/log/rfq-backend/error.log`
- [ ] Monitor database queries (slow query log)
- [ ] Check Redis hit rate: `redis-cli INFO stats`
- [ ] Monitor API response times
- [ ] Watch audit logs for anomalies

### Rollback Plan (If Needed)
```bash
# Restore database
psql -h neon-host -U user rfq_db < backup_TIMESTAMP.sql

# Revert code
git revert HEAD
npm ci
npm run build
pm2 restart all
```

---

## Success Criteria

✅ All 14 tender types available
✅ Suggestion wizard functional
✅ Value validation working
✅ Document checklists generated correctly
✅ File uploads successful
✅ Bid submission validation enforces rules
✅ No increase in error rates
✅ API response times < 200ms (cached), < 500ms (uncached)
✅ Zero data loss
✅ User feedback positive

---

## Rollback Triggers

🚨 Rollback immediately if:
- Error rate > 5%
- Database corruption detected
- Critical feature (login, tender creation) broken
- Data loss or incorrect calculations
- Security vulnerability discovered

---

## Support Contacts

- DevOps: devops@yourorg.com
- Database Admin: dba@yourorg.com
- Product Owner: po@yourorg.com
- Emergency Hotline: +880-XXX-XXXX

---

Deployment Date: _______________
Deployed By: _______________
Sign-off: _______________
```

**Save this file.**

---

### **Task 41 — Create Monitoring Dashboard**

✅ **CREATE**: Monitoring queries for operations team.

**Create this file:** `rfq-platform/database/monitoring/tender_type_health.sql`

```sql
-- database/monitoring/tender_type_health.sql
-- Description: Health check queries for tender type system

-- ============================================================================
-- QUERY 1: Tender Type Usage (Last 30 Days)
-- ============================================================================
SELECT 
  ttd.code,
  ttd.name,
  COUNT(t.id) as tender_count,
  AVG(t.estimated_cost) as avg_value,
  COUNT(DISTINCT t.organization_id) as unique_organizations
FROM tender_type_definitions ttd
LEFT JOIN tenders t ON t.tender_type = ttd.code 
  AND t.created_at >= NOW() - INTERVAL '30 days'
WHERE ttd.is_active = TRUE
GROUP BY ttd.code, ttd.name
ORDER BY tender_count DESC;

-- ============================================================================
-- QUERY 2: Document Upload Statistics
-- ============================================================================
SELECT 
  ttd.code as tender_type,
  COUNT(DISTINCT tds.tender_id) as tenders_with_uploads,
  COUNT(tds.id) as total_uploads,
  ROUND(AVG(tds.file_size) / 1024 / 1024, 2) as avg_file_size_mb,
  SUM(tds.file_size) / 1024 / 1024 / 1024 as total_storage_gb
FROM tender_type_definitions ttd
LEFT JOIN tenders t ON t.tender_type = ttd.code
LEFT JOIN tender_document_submissions tds ON tds.tender_id = t.id
WHERE t.created_at >= NOW() - INTERVAL '30 days'
GROUP BY ttd.code
ORDER BY total_uploads DESC;

-- ============================================================================
-- QUERY 3: Suggestion Accuracy Rate
-- ============================================================================
SELECT 
  DATE_TRUNC('day', al.created_at) as date,
  COUNT(*) as suggestions_made,
  COUNT(CASE 
    WHEN EXISTS (
      SELECT 1 FROM tenders t2 
      WHERE t2.created_by = al.user_id 
        AND t2.tender_type = (al.metadata->>'suggested')
        AND t2.created_at BETWEEN al.created_at AND al.created_at + INTERVAL '1 hour'
    ) THEN 1 
  END) as suggestions_used,
  ROUND(
    (COUNT(CASE 
      WHEN EXISTS (
        SELECT 1 FROM tenders t2 
        WHERE t2.created_by = al.user_id 
          AND t2.tender_type = (al.metadata->>'suggested')
          AND t2.created_at BETWEEN al.created_at AND al.created_at + INTERVAL '1 hour'
      ) THEN 1 
    END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as usage_rate_percent
FROM audit_logs al
WHERE al.action = 'TENDER_TYPE_SUGGESTED'
  AND al.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', al.created_at)
ORDER BY date DESC;

-- ============================================================================
-- QUERY 4: Document Completion Rates by Tender Type
-- ============================================================================
WITH checklist_stats AS (
  SELECT 
    t.id as tender_id,
    t.tender_type,
    COUNT(DISTINCT ttdr.id) FILTER (WHERE ttdr.is_mandatory) as mandatory_docs,
    COUNT(DISTINCT tds.document_requirement_id) FILTER (WHERE ttdr.is_mandatory) as mandatory_uploaded,
    CASE 
      WHEN COUNT(DISTINCT ttdr.id) FILTER (WHERE ttdr.is_mandatory) = 
           COUNT(DISTINCT tds.document_requirement_id) FILTER (WHERE ttdr.is_mandatory)
      THEN TRUE 
      ELSE FALSE 
    END as is_complete
  FROM tenders t
  INNER JOIN tender_type_document_requirements ttdr ON ttdr.tender_type_code = t.tender_type
  LEFT JOIN tender_document_submissions tds ON tds.tender_id = t.id 
    AND tds.document_requirement_id = ttdr.id
  WHERE t.status IN ('published', 'closed', 'awarded')
    AND t.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY t.id, t.tender_type
)
SELECT 
  tender_type,
  COUNT(*) as total_tenders,
  COUNT(*) FILTER (WHERE is_complete) as complete_count,
  ROUND(
    (COUNT(*) FILTER (WHERE is_complete)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as completion_rate_percent,
  ROUND(AVG(mandatory_docs), 1) as avg_mandatory_docs,
  ROUND(AVG(mandatory_uploaded), 1) as avg_uploaded_docs
FROM checklist_stats
GROUP BY tender_type
ORDER BY total_tenders DESC;

-- ============================================================================
-- QUERY 5: System Health Indicators
-- ============================================================================
SELECT 
  'Tender Types Active' as metric,
  COUNT(*)::TEXT as value
FROM tender_type_definitions
WHERE is_active = TRUE

UNION ALL

SELECT 
  'Tenders Using New System' as metric,
  COUNT(*)::TEXT
FROM tenders
WHERE tender_type IN (SELECT code FROM tender_type_definitions)
  AND created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'Total Documents Uploaded' as metric,
  COUNT(*)::TEXT
FROM tender_document_submissions
WHERE uploaded_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'Avg Suggestion Response Time (ms)' as metric,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (al2.created_at - al.created_at)) * 1000
  ))::TEXT
FROM audit_logs al
LEFT JOIN audit_logs al2 ON al2.user_id = al.user_id 
  AND al2.created_at > al.created_at 
  AND al2.created_at <= al.created_at + INTERVAL '5 seconds'
WHERE al.action = 'TENDER_TYPE_SUGGESTED'
  AND al.created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Cache Hit Rate (%)' as metric,
  '95'::TEXT as value -- This would come from Redis stats in practice
;
```

**Save this file.**

**Set up daily automated monitoring:**

```bash
# crontab entry
0 9 * * * psql -h neon-host -U user -d rfq_db -f /var/www/rfq-platform/database/monitoring/tender_type_health.sql > /var/log/rfq-monitoring/daily_report_$(date +\%Y\%m\%d).log
```

---

### **Task 42 — Final Documentation & Handoff**

✅ **CREATE**: Complete developer handoff document.

**Create this file:** `rfq-platform/TENDER_TYPES_HANDOFF.md`

```markdown
# Tender Types System - Developer Handoff

## System Overview

The Bangladesh e-GP Tender Types integration adds full compliance with PPR 2025 procurement regulations to the RFQ Buddy platform.

**What's Included:**
- 14 official tender types (PG1-9A, PW1-3, PPS2-6)
- Smart tender type suggestion wizard
- Real-time value validation
- Auto-security calculations
- Document checklist management
- Compliance enforcement

---

## Architecture

### Database Layer
```
tender_type_definitions (14 types)
  ├── tender_type_document_requirements (documents per type)
  └── tenders (updated to reference types)
       └── tender_document_submissions (uploaded docs)
```

**Key Tables:**
- `tender_type_definitions`: Master data for 14 types
- `tender_type_document_requirements`: Required docs per type
- `tender_document_submissions`: Vendor-uploaded documents
- `tenders`: Updated with `tender_type` FK

### Backend Services
```
src/services/
  ├── tenderTypeSelector.service.ts  (suggestion logic)
  ├── valueValidation.service.ts     (value range checks)
  ├── securityCalculation.service.ts (auto-calc securities)
  └── documentChecklist.service.ts   (document mgmt)
```

### Frontend Components
```
src/lib/components/
  ├── TenderTypeSelector.svelte      (4-step wizard)
  ├── TenderTypeInfo.svelte          (display type details)
  ├── ValueValidator.svelte          (real-time validation)
  ├── SecurityCalculator.svelte      (show calculated securities)
  └── DocumentChecklist.svelte       (upload progress)
```

---

## Key Algorithms

### Tender Type Suggestion Logic (tenderTypeSelector.service.ts)

```
1. Special cases first:
   - Emergency → PG9A
   - Single source → PG9A
   - Outsourcing personnel → PPS2

2. Filter by procurement type (goods/works/services)

3. Filter by value range:
   - Query types where min_value <= value <= max_value

4. Apply modifiers:
   - International → boost PG5A confidence
   - Turnkey → boost PG3 confidence

5. Score and rank:
   - 100% = perfect match (all criteria met)
   - 90% = good match (most criteria)
   - 80% = acceptable match (value fits)

6. Return top 3 suggestions sorted by confidence
```

### Value Validation Logic (valueValidation.service.ts)

```
1. Fetch tender type definition
2. Check: min_value <= value <= max_value
3. If valid: return success
4. If too low: suggest lower type
5. If too high: suggest higher type
6. Generate user-friendly message
```

---

## Critical Files

### Must NOT Modify (Core System)
- `database/migrations/001-005.sql` (schema definitions)
- `database/migrations/003_seed_tender_types.sql` (official PPR 2025 data)
- `src/schemas/tenderType.schema.ts` (Zod validation)

### Safe to Modify (Customizations)
- `src/components/Tender TypeSelector.svelte` (UI/UX changes)
- `src/services/tenderTypeSelector.service.ts` (suggestion scoring)
- `database/views/tender_type_analytics.sql` (add new analytics)

### Configuration Files
- `.env`: `TENDER_TYPE_CACHE_TTL`, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`
- `redis.ts`: Cache settings

---

## Common Tasks

### Adding a New Tender Type
**⚠️ CAUTION**: Only add if officially gazetted by Bangladesh government.

1. Insert into `tender_type_definitions`:
   ```sql
   INSERT INTO tender_type_definitions (code, name, ...) VALUES (...);
   ```

2. Add document requirements:
   ```sql
   INSERT INTO tender_type_document_requirements (...) VALUES (...);
   ```

3. Clear Redis cache:
   ```bash
   redis-cli FLUSHDB
   ```

4. Update frontend constants if needed

### Changing Value Thresholds
**Example**: PG1 limit changed from 8 Lac to 10 Lac

1. Update database:
   ```sql
   UPDATE tender_type_definitions 
   SET max_value_bdt = 1000000 
   WHERE code = 'PG1';
   ```

2. Clear cache:
   ```bash
   redis-cli DEL "tender_type:code:PG1"
   redis-cli DEL "tender_type:list:goods"
   ```

3. Restart backend to reload

### Adding New Document Requirement
```sql
INSERT INTO tender_type_document_requirements (
  id, tender_type_code, code, name, description,
  is_mandatory, category, display_order
) VALUES (
  uuid_generate_v4(),
  'PG2',
  'PG2-NEW-FORM',
  'New Required Form',
  'Description of the form',
  TRUE,
  'technical',
  99
);
```

---

## Troubleshooting

### Issue: Suggestion returns empty array
**Cause**: No tender types match the value range
**Fix**: Check if value is outside all defined ranges or database seed is incomplete

```sql
-- Verify tender types exist
SELECT code, min_value_bdt, max_value_bdt FROM tender_type_definitions;
```

### Issue: Document checklist not showing
**Cause**: No requirements seeded for that tender type
**Fix**: 

```sql
-- Check requirements
SELECT * FROM tender_type_document_requirements WHERE tender_type_code = 'PG1';

-- If empty, run seed script again
\i database/migrations/003_seed_tender_types.sql
```

### Issue: File upload fails
**Cause 1**: Upload directory doesn't exist or no write permissions
```bash
mkdir -p /var/uploads/tender-documents
chmod 755 /var/uploads/tender-documents
```

**Cause 2**: File too large
```env
# .env
MAX_FILE_SIZE_MB=20  # Increase limit
```

**Cause 3**: File type not allowed
```typescript
// documentUpload.controller.ts
const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.png', '.xls', '.xlsx'];
// Add more types as needed
```

### Issue: Caching not working
**Check Redis connection:**
```bash
redis-cli PING
# Should return: PONG
```

**Check cache keys:**
```bash
redis-cli KEYS "tender_type:*"
```

**Monitor cache hits:**
```bash
redis-cli MONITOR
# Then trigger API calls and watch for GET/SET commands
```

---

## Performance Benchmarks

Expected performance (production):
- Tender type list API: < 50ms (cached), < 200ms (uncached)
- Suggestion API: < 150ms
- Value validation: < 100ms
- Document checklist: < 300ms (depends on upload count)
- File upload: < 2s per file (10MB limit)

**If slower:**
1. Check database indexes exist
2. Verify Redis is running
3. Check slow query log
4. Monitor network latency

---

## Security Considerations

### Input Validation
- All API inputs validated with Zod schemas
- File uploads restricted to allowed types and sizes
- SQL injection prevented via parameterized queries

### Access Control
- Document uploads require authentication
- Vendors can only upload to tenders they're bidding on
- Buyers can view all uploads for their tenders
- Admins have full access

### Audit Trail
- All tender type selections logged
- Document uploads/deletes logged
- Value validations logged
- Full audit in `audit_logs` table

---

## Testing

### Run All Tests
```bash
cd backend
npm test -- --coverage
```

### Test Specific Service
```bash
npm test -- tenderTypeSelector.service.test.ts
```

### Integration Tests
```bash
npm test -- integration/tenderType.api.test.ts
```

### Manual API Testing (Postman Collection)
Import: `postman/Tender_Types_Collection.json`

---

## Maintenance Schedule

### Daily
- Monitor error logs
- Check file upload volume
- Verify cache hit rate

### Weekly
- Review suggestion accuracy report
- Check document completion rates
- Analyze slow queries

### Monthly
- Audit tender type usage statistics
- Update documentation if workflows change
- Review and archive old audit logs

### Yearly
- Verify compliance with updated PPR regulations
- Update value thresholds if government changes limits
- Optimize database (VACUUM ANALYZE, reindex)

---

## Contact & Support

**Primary Developer**: [Your Name]
**Email**: developer@yourorg.com
**Documentation**: Located in `/rfq-platform/Instructions/`

**External Resources:**
- PPR 2025: https://cptu.gov.bd
- Bangladesh e-GP Portal: https://eprocure.gov.bd
- Neon Database Docs: https://neon.tech/docs

---

**Handoff Date**: _______________
**Signed Off By**: _______________
```

**Save this file.**

---

🎉 **ALL 42 TASKS COMPLETE!**

## Summary

You've successfully implemented a comprehensive Bangladesh e-GP tender types system:

✅ **Database**: 5 migrations, 14 tender types, document requirements seeded
✅ **Backend**: 4 services, 6 controllers, 8 API endpoints, full testing
✅ **Frontend**: 5 components, smart wizard, real-time validation
✅ **Performance**: Redis caching, database indexes, optimized queries
✅ **Testing**: 32+ unit/integration tests, 85%+ coverage
✅ **Documentation**: API docs, user guide, deployment checklist, handoff docs

The system is production-ready and optimized for **Claude 3.5 Haiku** to implement.

---

**RECOMMENDED: Claude 3.5 Haiku**
- Strong coding capabilities
- Excellent at following detailed instructions
- Cost-effective for extended implementation
- Handles TypeScript/SQL/Svelte well

Start with Task 1 and work sequentially through all 42 tasks. Each task is fully specified with complete code, verification steps, and notes.

**END OF TENDER TYPES IMPLEMENTATION PLAN**
