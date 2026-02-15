# DEVELOPER CODING PLAN - Multi-Tender Type & Live Tendering System

**Online RFQ & Tendering Platform - Tender Type Expansion**

Step-by-Step Guide for Implementing Government vs Non-Government Tender Types with Live Tendering

Based on existing Technical PRD v3.1 | Schema v3.0 | Bangladesh e-GP Tender Types | February 2026

**6 Phases • 28 Tasks**

---

## 1. How to Read This Document

This plan extends the existing RFQ platform to support **two distinct organization types** with separate tender type bunches:

**GOVERNMENT ORGANIZATIONS** → Bangladesh e-GP tender types (PG1–PG9A, PW1–PW3, PPS2–PPS6) - already implemented
**NON-GOVERNMENT ORGANIZATIONS** → Simple RFQ tender types (NRQ1, NRQ2, NRQ3) - new implementation

### Key Architectural Decisions

1. **Organization Type**: Database field `organization_type` ('government' | 'non-government'), not name-based heuristic
2. **Tender Type Codes**: Non-govt uses formal codes (NRQ1-NRQ3) with value ranges, consistent with govt approach
3. **Live Tendering**: Optional flag for ANY tender type (govt or non-govt), not a separate mode
4. **Limited Tendering**: Reuses existing `visibility='limited'` and `tender_vendor_invitations` table

### What This Covers
- Organization type foundation with database migration
- Non-government tender type definitions (NRQ1: <$10k, NRQ2: $10k-$50k, NRQ3: >$50k)
- Simple RFQ integration with tender type system
- Live tendering as optional flag on any tender creation
- Limited vendor selection using existing invitation infrastructure

**The Golden Rules**
- Complete one Task at a time in exact order
- Test after every Task
- Never skip validation steps
- All database changes must have migration scripts
- Reuse existing Bangladesh tender type infrastructure where possible
- Maintain rollback scripts for each phase
- Existing government tender functionality must remain unchanged

---

## 2. Phase Overview Map

| **Phase** | **Name** | **What You Build** | **Unlocks** |
|-----------|----------|-------------------|-------------|
| 1 | Organization Type Foundation | Add `organization_type` to database, update auth, replace dashboard heuristic | Proper govt vs non-govt separation |
| 2 | Non-Government Tender Types | Create NRQ1-NRQ3 definitions, filter services by org type, validation middleware | Non-govt organizations can create tenders with appropriate types |
| 3 | Simple RFQ Integration | Update Simple RFQ form/service to use tender types (NRQ1/NRQ2/NRQ3), value validation | Non-govt tenders with formal type codes and value ranges |
| 4 | Live Tendering Infrastructure | Live bidding sessions table, SSE streaming, session management, real-time updates | Any tender (govt or non-govt) can enable live auction bidding |
| 5 | Live Tendering UI | Add "Enable Live" option to creation forms, live dashboard, bid submission interface | Buyers can schedule and run live auctions |
| 6 | Integration & Testing | Limited tender access control, migration, testing, performance, documentation | Production-ready system with govt/non-govt separation |

---

## PHASE 1: ORGANIZATION TYPE FOUNDATION

**Goal:** Add proper organization type field to database and update all systems to use it instead of name-based heuristics.

### **Task 1 — Database Migration: Add Organization Type**

**Create migration: `rfq-platform/database/migrations/008_add_organization_type.sql`**

```sql
-- Add organization_type column to organizations table
ALTER TABLE organizations 
ADD COLUMN organization_type VARCHAR(20) NOT NULL DEFAULT 'government'
  CHECK (organization_type IN ('government', 'non-government'));

-- Backfill existing organizations as 'government' (safe default)
UPDATE organizations 
SET organization_type = 'government' 
WHERE organization_type IS NULL;

-- Add index for fast filtering
CREATE INDEX idx_organizations_type ON organizations(organization_type);

-- Add flag to tender_type_definitions to mark govt vs non-govt types
ALTER TABLE tender_type_definitions
ADD COLUMN is_govt_type BOOLEAN NOT NULL DEFAULT true;

-- Create index
CREATE INDEX idx_tender_type_govt ON tender_type_definitions(is_govt_type);

COMMENT ON COLUMN organizations.organization_type IS 'Determines which tender types are available: government sees PG/PW/PPS types, non-government sees NRQ types';
COMMENT ON COLUMN tender_type_definitions.is_govt_type IS 'True for Bangladesh e-GP types (PG/PW/PPS), false for non-govt types (NRQ)';
```

**Rollback script: `rfq-platform/database/migrations/008_add_organization_type_rollback.sql`**

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_tender_type_govt;
DROP INDEX IF EXISTS idx_organizations_type;

-- Remove columns
ALTER TABLE tender_type_definitions DROP COLUMN IF EXISTS is_govt_type;
ALTER TABLE organizations DROP COLUMN IF EXISTS organization_type;
```

**Verification:**
```sql
-- Check organization types
SELECT organization_type, COUNT(*) 
FROM organizations 
GROUP BY organization_type;

-- Should show all organizations as 'government' after migration
```

---

### **Task 2 — Update TypeScript Types for Organization**

**Create/Update `rfq-platform/backend/src/types/organization.types.ts`**

```typescript
export enum OrganizationType {
  Government = 'government',
  NonGovernment = 'non-government'
}

export interface Organization {
  id: string;
  name: string;
  type: 'buyer' | 'vendor' | 'both';
  organizationType: OrganizationType;
  createdAt: Date;
}

export interface OrganizationWithType extends Organization {
  organizationType: OrganizationType;
}
```

**Update `rfq-platform/backend/src/types/user.types.ts`**

```typescript
import { OrganizationType } from './organization.types';

export interface UserContext {
  id: string;
  email: string;
  name: string;
  orgId: string;
  organizationName: string;
  organizationType: OrganizationType;  // NEW
  roles: string[];
}
```

---

### **Task 3 — Update Auth Service to Include Organization Type**

**Update `rfq-platform/backend/src/services/auth.service.ts`**

Find the login function and update the query to JOIN organizations table:

```typescript
async login(email: string, password: string): Promise<AuthResponse> {
  // Update query to include organization_type
  const { rows } = await pool.query(`
    SELECT 
      u.id, u.email, u.name, u.password_hash, u.roles,
      o.id as org_id, o.name as org_name, o.type as org_type,
      o.organization_type  -- NEW
    FROM users u
    LEFT JOIN organizations o ON u.organization_id = o.id
    WHERE u.email = $1 AND u.is_active = true
  `, [email]);

  if (rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = rows[0];
  
  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Create JWT payload with organization type
  const payload = {
    userId: user.id,
    email: user.email,
    orgId: user.org_id,
    organizationType: user.organization_type,  // NEW
    roles: user.roles
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h'
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: user.org_id,
      organizationName: user.org_name,
      organizationType: user.organization_type,  // NEW
      roles: user.roles
    }
  };
}
```

---

### **Task 4 — Replace Dashboard Heuristic with Database Field**

**Update `rfq-platform/frontend/src/routes/(app)/dashboard/+page.svelte`**

Find the section that checks organization type (currently using name heuristic) and replace:

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import type { OrganizationType } from '$lib/types';
  
  // Get user from store (populated from JWT/session)
  const user = $page.data.user;
  const isGovernment = user.organizationType === 'government';
</script>

<div class="dashboard-container">
  <h1>Create New Tender</h1>
  
  <div class="tender-type-cards">
    {#if isGovernment}
      <!-- Government Organizations: Show Bangladesh e-GP types -->
      <div class="card">
        <h2>Government Tender</h2>
        <p>Bangladesh e-GP compliant tendering (PG1–PG9A, PW1–PW3, PPS2–PPS6)</p>
        <p class="use-case">For: Government procurement, audit-ready, full compliance</p>
        <a href="/tenders/new" class="btn btn-primary">Create Government Tender</a>
      </div>
    {:else}
      <!-- Non-Government Organizations: Show Simple RFQ -->
      <div class="card">
        <h2>Simple RFQ</h2>
        <p>Quick commercial procurement (NRQ1-NRQ3)</p>
        <p class="use-case">For: Office supplies, IT equipment, services under $50k</p>
        <a href="/tenders/new/simple-rfq" class="btn btn-primary">Create Simple RFQ</a>
      </div>
    {/if}
  </div>
  
  <div class="info-box">
    <p><strong>Note:</strong> Live tendering (real-time auction bidding) is available as an option when creating any tender type.</p>
  </div>
</div>
```

**Remove the old heuristic:**
```svelte
<!-- OLD - REMOVE THIS -->
{#if $user.organizationName && $user.organizationName.toLowerCase().includes('gov')}
```

---

## PHASE 2: NON-GOVERNMENT TENDER TYPE DEFINITIONS

**Goal:** Create non-government tender types (NRQ1-NRQ3) in the database and update services to filter by organization type.

### **Task 5 — Seed Non-Government Tender Type Definitions**

**Create migration: `rfq-platform/database/migrations/009_seed_nongovt_tender_types.sql`**

```sql
-- Insert non-government tender types
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
);

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
);

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
);

COMMIT;

-- Verify
SELECT code, name, is_govt_type 
FROM tender_type_definitions 
WHERE is_govt_type = FALSE;
-- Should return NRQ1, NRQ2, NRQ3
```

**Rollback script: `rfq-platform/database/migrations/009_seed_nongovt_tender_types_rollback.sql`**

```sql
-- Remove non-government tender types
DELETE FROM tender_type_definitions 
WHERE code IN ('NRQ1', 'NRQ2', 'NRQ3');
```

---

### **Task 6 — Add Organization Type Filtering to Tender Type Services**

**Update `rfq-platform/backend/src/services/tenderTypeSelector.service.ts`**

Modify the `listTenderTypes()` method to filter by organization type:

```typescript
async listTenderTypes(
  procurementType?: string,
  organizationType?: OrganizationType  // NEW parameter
): Promise<TenderTypeDefinition[]> {
  let query = `
    SELECT 
      code, name, description, procurement_type,
      min_value_bdt, max_value_bdt,
      requires_tender_security, tender_security_percent,
      requires_performance_security, performance_security_percent,
      min_submission_days, default_validity_days,
      is_govt_type
    FROM tender_type_definitions
    WHERE is_active = TRUE
  `;
  
  const params: any[] = [];
  let paramCount = 1;
  
  // Filter by organization type
  if (organizationType) {
    const isGovt = organizationType === OrganizationType.Government;
    query += ` AND is_govt_type = $${paramCount}`;
    params.push(isGovt);
    paramCount++;
  }
  
  // Filter by procurement type
  if (procurementType) {
    query += ` AND procurement_type = $${paramCount}`;
    params.push(procurementType);
    paramCount++;
  }
  
  query += ' ORDER BY min_value_bdt ASC';
  
  const { rows } = await pool.query(query, params);
  return rows;
}
```

Update `suggestTenderType()` method:

```typescript
async suggestTenderType(
  input: TenderTypeSelectorInput,
  organizationType: OrganizationType  // NEW parameter
): Promise<TenderTypeSuggestion> {
  const isGovt = organizationType === OrganizationType.Government;
  
  // Filter tender types by organization type
  const query = `
    SELECT 
      code, name, description,
      min_value_bdt, max_value_bdt,
      requires_tender_security, tender_security_percent
    FROM tender_type_definitions
    WHERE procurement_type = $1 
      AND is_active = TRUE
      AND is_govt_type = $2  -- NEW filter
      AND (min_value_bdt IS NULL OR min_value_bdt <= $3)
      AND (max_value_bdt IS NULL OR max_value_bdt >= $3)
  `;
  
  const { rows } = await pool.query(query, [
    input.procurementType,
    isGovt,  // NEW parameter
    input.estimatedValue
  ]);
  
  // Rest of suggestion logic...
}
```

Update `getValueRangesForProcurementType()` method:

```typescript
async getValueRangesForProcurementType(
  procurementType: string,
  organizationType: OrganizationType  // NEW parameter
): Promise<ValueRange[]> {
  const isGovt = organizationType === OrganizationType.Government;
  
  const query = `
    SELECT 
      code,
      name,
      min_value_bdt,
      max_value_bdt
    FROM tender_type_definitions
    WHERE procurement_type = $1 
      AND is_active = TRUE
      AND is_govt_type = $2  -- NEW filter
    ORDER BY min_value_bdt ASC
  `;
  
  const { rows } = await pool.query(query, [procurementType, isGovt]);
  return rows.map(row => ({
    code: row.code,
    label: row.name,
    min: row.min_value_bdt,
    max: row.max_value_bdt
  }));
}
```

---

### **Task 7 — Create Organization Type Validation Middleware**

**Create `rfq-platform/backend/src/middleware/organizationType.middleware.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { pool } from '../config';
import { OrganizationType } from '../types/organization.types';

/**
 * Validates that the tender type matches the organization type
 * Prevents govt orgs from creating non-govt tenders and vice versa
 */
export async function validateTenderTypeMatchesOrgType(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { tenderType } = req.body;
    const userOrgType = req.user!.organizationType;
    
    if (!tenderType) {
      return res.status(400).json({
        error: {
          code: 'TENDER_TYPE_REQUIRED',
          message: 'Tender type is required'
        }
      });
    }
    
    // Look up tender type definition
    const { rows } = await pool.query(
      'SELECT is_govt_type FROM tender_type_definitions WHERE code = $1 AND is_active = TRUE',
      [tenderType]
    );
    
    if (rows.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TENDER_TYPE',
          message: `Tender type '${tenderType}' not found or inactive`
        }
      });
    }
    
    const isGovtType = rows[0].is_govt_type;
    const isGovtOrg = userOrgType === OrganizationType.Government;
    
    // Validate match
    if (isGovtType && !isGovtOrg) {
      return res.status(403).json({
        error: {
          code: 'ORG_TYPE_MISMATCH',
          message: `Tender type '${tenderType}' is only available to government organizations. Non-government organizations should use NRQ types.`
        }
      });
    }
    
    if (!isGovtType && isGovtOrg) {
      return res.status(403).json({
        error: {
          code: 'ORG_TYPE_MISMATCH',
          message: `Tender type '${tenderType}' is only available to non-government organizations. Government organizations should use PG/PW/PPS types.`
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Organization type validation error:', error);
    res.status(500).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Failed to validate organization type'
      }
    });
  }
}
```

---

### **Task 8 — Update Tender Type Controller and Routes**

**Update `rfq-platform/backend/src/controllers/tenderType.controller.ts`**

Modify controller methods to extract and pass organization type:

```typescript
import { OrganizationType } from '../types/organization.types';
import { tenderTypeService } from '../services/tenderTypeSelector.service';

export class TenderTypeController {
  
  async list(req: Request, res: Response) {
    try {
      const { procurementType } = req.query;
      const organizationType = req.user!.organizationType;  // From JWT
      
      const tenderTypes = await tenderTypeService.listTenderTypes(
        procurementType as string,
        organizationType
      );
      
      res.json(tenderTypes);
    } catch (error) {
      console.error('List tender types error:', error);
      res.status(500).json({ error: 'Failed to fetch tender types' });
    }
  }
  
  async suggest(req: Request, res: Response) {
    try {
      const organizationType = req.user!.organizationType;  // From JWT
      
      const suggestion = await tenderTypeService.suggestTenderType(
        req.body,
        organizationType
      );
      
      res.json(suggestion);
    } catch (error) {
      console.error('Suggest tender type error:', error);
      res.status(500).json({ error: 'Failed to suggest tender type' });
    }
  }
  
  async getValueRanges(req: Request, res: Response) {
    try {
      const { procurementType } = req.query;
      const organizationType = req.user!.organizationType;  // From JWT
      
      const ranges = await tenderTypeService.getValueRangesForProcurementType(
        procurementType as string,
        organizationType
      );
      
      res.json(ranges);
    } catch (error) {
      console.error('Get value ranges error:', error);
      res.status(500).json({ error: 'Failed to fetch value ranges' });
    }
  }
}
```

**Update `rfq-platform/backend/src/routes/tender.routes.ts`**

Add the validation middleware to tender creation routes:

```typescript
import { validateTenderTypeMatchesOrgType } from '../middleware/organizationType.middleware';

// Add middleware to tender creation route
router.post(
  '/tenders',
  authenticate,
  requireRole(['buyer', 'admin']),
  validateTenderTypeMatchesOrgType,  // NEW middleware
  tenderController.create
);
```

---

## PHASE 3: DETAILED RFT ENHANCEMENT

### **Task 8 — Database Schema for Detailed RFT Fields**

**Create migration: `migrations/002_detailed_rft_fields.sql`**

```sql
-- Add columns that are common to all Detailed RFT tenders (govt compliance)
ALTER TABLE tenders
ADD COLUMN department VARCHAR(200),
ADD COLUMN funding_source VARCHAR(50),
ADD COLUMN clarification_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN expected_award_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN bid_security_type VARCHAR(30), -- Bank Guarantee / Pay Order
ADD COLUMN performance_security_required BOOLEAN DEFAULT false,
ADD COLUMN performance_security_percent NUMERIC(5,2),
ADD COLUMN evaluation_criteria_json JSONB; -- { technical_weight, financial_weight, award_method }

CREATE TABLE bid_security_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  security_type VARCHAR(30) NOT NULL,
  amount NUMERIC(18,2),
  validity_days INTEGER,
  form_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE vendor_eligibility_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  criterion TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  document_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE vendor_eligibility_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id UUID REFERENCES organizations(id),
  criterion_id UUID REFERENCES vendor_eligibility_criteria(id),
  compliant BOOLEAN,
  document_id UUID REFERENCES attachments(id),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_bid_security_tender ON bid_security_requirements(tender_id);
CREATE INDEX idx_eligibility_criteria_tender ON vendor_eligibility_criteria(tender_id);
CREATE INDEX idx_eligibility_submission_vendor ON vendor_eligibility_submissions(vendor_org_id);
```

**Rollback script: `migrations/002_detailed_rft_fields_rollback.sql`**

```sql
DROP TABLE IF EXISTS vendor_eligibility_submissions;
DROP TABLE IF EXISTS vendor_eligibility_criteria;
DROP TABLE IF EXISTS bid_security_requirements;

ALTER TABLE tenders
DROP COLUMN IF EXISTS evaluation_criteria_json,
DROP COLUMN IF EXISTS performance_security_percent,
DROP COLUMN IF EXISTS performance_security_required,
DROP COLUMN IF EXISTS bid_security_type,
DROP COLUMN IF EXISTS expected_award_date,
DROP COLUMN IF EXISTS clarification_deadline,
DROP COLUMN IF EXISTS funding_source,
DROP COLUMN IF EXISTS department;
```

**Note:** Many Detailed RFT fields will still live in `extended_data` JSONB (e.g., procuring entity details, lot breakdown, commercial terms) because they are highly variable. The added columns are for fields that need indexing or relational integrity.

---

### **Task 9 — Detailed RFT Creation Wizard**

**Create `frontend/src/routes/(app)/tenders/new/detailed-rft/+page.svelte`**

6‑step wizard:
1. **Procuring Entity Details** – Organization, Department, Procurement Type, Tender Category, Reference No, Funding Source
2. **Tender Timeline** – Issue Date, Pre‑Bid Meeting Date, Clarification Deadline, Submission Deadline, Bid Opening Date, Expected Award Date
3. **Scope of Work / Supply** – Detailed Description (rich text), Technical Scope Document upload
4. **Commercial Terms** – Delivery Schedule, Delivery Location, Contract Duration, Warranty, Liquidated Damages, Performance Security
5. **Financial Terms & Bid Security** – Bid Currency, Price Validity, Payment Milestones, Tax & VAT, Price Adjustment, Bid Security details
6. **Evaluation Criteria** – Technical/Financial weightage (sum = 100%), Award Method (L1, QCBS, Single Lot)

Each step validates and stores data in `extended_data`. The wizard integrates with existing Bangladesh tender type selection (PG1‑PG9A, PW1‑PW3, PPS2‑PPS6) for value‑based validation and security calculations.

**Evaluation Workflow for Detailed RFT:**
- Two-stage evaluation: Technical first, then Commercial
- Technical envelope opened first; commercial envelope sealed until technical evaluation complete
- Evaluators score technical features and compliance
- Buyer unlocks commercial envelope for technically qualified bids
- System ranks bids by total price (L1) or evaluator-weighted scoring
- Full audit trail for Bangladesh Public Procurement Rules 2025 compliance

---

### **Task 10 — Backend Controller for Detailed RFT**

**Create `backend/src/controllers/detailedRftController.ts`**

Handles:
- Multi‑step validation (Zod schemas per step)
- Bid security requirements storage
- Eligibility criteria setup
- Transaction‑safe creation of tender with all extended fields

**Integration:** Calls existing `tenderTypeSelector.service` to suggest/validate Bangladesh tender type based on value and special flags.

---

## PHASE 4: LIVE TENDERING WITH AUCTION‑STYLE BIDDING

Live tendering is an **option** the buyer can enable when creating any tender type (government Detailed RFT or non-government Simple RFQ). It is not a third mode card on the dashboard. This phase adds the live option to both creation flows and the backend/session/SSE support.

### **Task 11 — Database Schema for Live Tendering**

**Create migration: `migrations/003_live_tendering.sql`**

```sql
CREATE TABLE live_bidding_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID UNIQUE REFERENCES tenders(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'paused', 'completed', 'cancelled')),
  bidding_type VARCHAR(20) NOT NULL
    CHECK (bidding_type IN ('sealed', 'open_reverse', 'open_auction')),
  current_best_bid_id UUID REFERENCES bids(id),
  total_bids_submitted INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}', -- min increment, visibility rules, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE limited_tender_vendors (
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  vendor_org_id UUID REFERENCES organizations(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  invitation_status VARCHAR(20) DEFAULT 'sent' CHECK (invitation_status IN ('sent', 'accepted', 'declined')),
  PRIMARY KEY (tender_id, vendor_org_id)
);

CREATE TABLE live_bid_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES live_bidding_sessions(id),
  bid_id UUID REFERENCES bids(id),
  vendor_org_id UUID REFERENCES organizations(id),
  event_type VARCHAR(20), -- new_bid, bid_withdrawn, bid_improved, outbid
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_live_session_tender ON live_bidding_sessions(tender_id);
CREATE INDEX idx_live_session_status ON live_bidding_sessions(status);
CREATE INDEX idx_live_session_scheduled ON live_bidding_sessions(scheduled_start) WHERE status = 'scheduled';
CREATE INDEX idx_limited_vendors_tender ON limited_tender_vendors(tender_id);
CREATE INDEX idx_live_bid_updates_session ON live_bid_updates(session_id);
CREATE INDEX idx_live_bid_updates_created ON live_bid_updates(created_at);
```

**Rollback script: `migrations/003_live_tendering_rollback.sql`**

```sql
DROP TABLE IF EXISTS live_bid_updates;
DROP TABLE IF EXISTS limited_tender_vendors;
DROP TABLE IF EXISTS live_bidding_sessions;
```

---

### **Task 12 — Live Tendering Configuration Schema**

**Add to `backend/src/schemas/tender.schema.ts`**

Validates:
- Scheduled start time (must be future, at least 1 hour from now)
- Duration (30‑480 minutes)
- Bidding type rules
- Vendor pre‑selection list (for limited tendering)
- Minimum bid increment (required for open auctions)

---

### **Task 13 — Backend: Live Tender Creation & Session Management**

**Create `backend/src/controllers/liveTenderController.ts`**

Functions:
- `createLiveTender` – schedules session, invites vendors (limited tender), stores settings
- `checkLimitedTenderAccess` – middleware that restricts bidding to invited vendors
- `submitLiveBid` – validates bid against auction rules (e.g., open reverse requires bid < current best by minimum increment), records bid, updates `current_best_bid_id`, publishes event via Redis pub/sub

**Create `backend/src/services/liveSessionService.ts`**

Background service that:
- Polls every 10 seconds for session state changes
- Auto‑starts sessions at `scheduled_start`
- Auto‑ends sessions at `scheduled_end`
- Publishes transition events to Redis pub/sub
- Handles session recovery on server restart

---

### **Task 14 — Frontend: Live Tendering Option in Creation Flows**

Add an **optional "Enable live tendering"** section to both (a) the govt/detailed RFT creation flow and (b) the Simple RFQ creation flow. Do not rely on a standalone "Start Live Tender" dashboard card.

**In govt flow** (`frontend/src/routes/(app)/tenders/new/+page.svelte` or detailed-rft wizard): optional section "Run as live auction" with:
- Date/time picker for scheduled start (with timezone awareness)
- Duration slider (30‑480 minutes)
- Bidding type selector (sealed / open reverse / open auction)
- Vendor pre‑selection for limited tenders (searchable vendor list with pagination)
- Preview of session timeline

**In Simple RFQ flow** (`frontend/src/routes/(app)/tenders/new/simple-rfq/+page.svelte`): same optional section when buyer enables live tendering.

If a dedicated URL (e.g. `tenders/new/live-auction`) is used, it should be reached only after choosing a base type (govt or non-govt) and then "Enable live", not as a top-level dashboard action.

---

### **Task 15 — Frontend: Live Bidding Dashboard**

**Create `frontend/src/routes/(app)/tenders/[id]/live-dashboard/+page.svelte`**

Real‑time components:
- Countdown timer (to start / to end) with visual progress bar
- Current best bid display (price, vendor, time)
- Bid submission form (with validation rules and increment calculator)
- Live bid feed (using Server‑Sent Events)
- Limited tender access message (if applicable)
- Bid history chart (for open auctions)

Uses EventSource API for real‑time updates; falls back to polling for unsupported browsers.

---

### **Task 16 — Backend: SSE Stream for Live Updates**

**Add to `backend/src/controllers/liveTenderController.ts`**

`streamLiveUpdates()`:
- Sets SSE headers with proper CORS
- Subscribes to Redis pub/sub channels for the specific tender
- Streams bid updates, session state changes, timer updates to connected clients
- Sends heartbeat every 30s
- Cleans up Redis subscription on disconnect
- Implements connection recovery logic

---

## PHASE 5: INTEGRATION & POLISH

### **Task 17 — Limited Tendering Access Control**

**Update `backend/src/middleware/authMiddleware.ts`**

Add `authorizeLimitedTender` middleware that checks `limited_tender_vendors` table before allowing bid submission or live dashboard access.

**Frontend:** Show "Not Invited" message to vendors not on the list.

**Audit:** Log all access attempts (successful and failed) to `audit_logs`.

---

### **Task 18 — Tender Mode Switching & Migration**

**Create migration script: `migrations/004_backfill_tender_modes.sql`**

```sql
-- Backfill existing tenders
UPDATE tenders 
SET 
  tender_mode = 'detailed_rft',
  is_govt_tender = true,
  api_version = 'v1'
WHERE tender_mode IS NULL OR tender_mode = 'detailed';

-- Verify migration
SELECT tender_mode, COUNT(*) 
FROM tenders 
GROUP BY tender_mode;
```

**Update all existing queries** to respect `tender_mode` where needed.

**Create compatibility layer** for existing API endpoints to handle both v1 and v2 requests.

---

### **Task 19 — Testing & Validation**

Test all three tender modes end‑to‑end:

**Simple RFQ:**
- [ ] Create with all fields
- [ ] Auto‑publish works
- [ ] Vendor quote submission
- [ ] Buyer comparison view
- [ ] Email notifications sent
- [ ] Export to PDF/Excel

**Detailed RFT:**
- [ ] Wizard validation
- [ ] All govt fields captured
- [ ] Bid security requirements
- [ ] Eligibility criteria workflow
- [ ] Integration with Bangladesh tender type validation
- [ ] Two-envelope bid submission
- [ ] Evaluation workflow

**Live Tendering:**
- [ ] Schedule future session
- [ ] Auto‑start at scheduled time
- [ ] Real‑time bid submission
- [ ] SSE updates for all clients
- [ ] Auto‑close at end
- [ ] Limited tender access control
- [ ] Bid validation (increment rules)
- [ ] Session recovery after server restart

**Load Testing:**
- [ ] 100 concurrent live bidders
- [ ] SSE connection stability
- [ ] Redis pub/sub performance

---

### **Task 20 — Documentation & Training**

**Create user guides:**

**1. Tender Mode Selection Guide** (`docs/user_guides/tender_mode_selection.md`)

Describe two bunches (Govt vs Non-govt) and Live as an option at creation, not a third mode. Example structure:

```markdown
# Tender Type Selection Guide

## Two bunches
1. **Government (Detailed RFT)** - Govt buyers only. Bangladesh e-GP types (PG1–PG9A, PW1–PW3, PPS2–PPS6). Full compliance, audit-ready.
2. **Non-government (Simple RFQ)** - Non-govt buyers only. Quick commercial purchases (<$50k), speed over compliance.

## Live tendering
An **option** at creation time for any tender type (govt or non-govt). When creating a tender, the buyer can enable "Run as live auction" and set schedule, duration, bidding type, and optional limited vendor list. Not a separate dashboard choice.

## Selection criteria (by bunch)
| Factor            | Simple RFQ (non-govt) | Detailed RFT (govt) |
|-------------------|------------------------|----------------------|
| Procurement Value | <$50k                  | Any                  |
| Complexity        | Low                    | High                 |
| Compliance Needs  | Minimal                | Full e-GP            |
| Time to Award     | 1-3 days               | 30-90 days           |

## Decision flow
Govt buyer → Government Tender only. Non-govt buyer → Simple RFQ only. In either flow, optionally enable live tendering at creation.
```

**2. API Migration Guide** (`docs/developer_guides/api_migration_v1_to_v2.md`)

**3. Live Tendering Best Practices** (`docs/user_guides/live_tendering_best_practices.md`)

**4. Rollback Procedures** (`docs/operations/rollback_procedures.md`)

---

### **Task 21 — Performance Optimization**

**Optimize bid submission for live auctions:**

**Create `backend/src/services/bidOptimizationService.ts`**

```typescript
// Batch bid validation using Redis pipeline
async validateBidsBatch(sessionId: string, bids: BidSubmission[]): Promise<ValidationResult[]> {
  const pipeline = redis.pipeline();
  
  for (const bid of bids) {
    pipeline.get(`session:${sessionId}:current_best`);
    pipeline.get(`session:${sessionId}:min_increment`);
  }
  
  const results = await pipeline.exec();
  // Validate all bids in memory
}

// Optimistic locking for bid submission
async submitBidOptimistic(bid: BidSubmission): Promise<void> {
  const version = await redis.get(`session:${bid.sessionId}:version`);
  
  // Submit to DB
  // On success, increment version
  await redis.incr(`session:${bid.sessionId}:version`);
}
```

**Database query optimization:**
- Add materialized view for live session leaderboard
- Partition `live_bid_updates` table by date
- Index optimization based on query patterns

---

### **Task 22 — Caching Strategy**

**Implement Redis caching layer:**

**Create `backend/src/services/tenderCacheService.ts`**

```typescript
// Cache frequently accessed tender data
async cacheTenderData(tenderId: string): Promise<void> {
  const tender = await db.query('SELECT * FROM tenders WHERE id = $1', [tenderId]);
  await redis.setex(`tender:${tenderId}`, 3600, JSON.stringify(tender.rows[0]));
}

// Cache live session state
async cacheLiveSessionState(sessionId: string): Promise<void> {
  const session = await db.query('SELECT * FROM live_bidding_sessions WHERE id = $1', [sessionId]);
  await redis.setex(`session:${sessionId}`, 60, JSON.stringify(session.rows[0]));
}

// Invalidate cache on updates
async invalidateTenderCache(tenderId: string): Promise<void> {
  await redis.del(`tender:${tenderId}`);
}
```

**Cache warming strategy:**
- Pre-cache active live sessions 5 minutes before start
- Cache vendor eligibility data for large tenders
- Implement cache-aside pattern for tender listings

---

### **Task 23 — Audit Log Enhancement**

**Extend audit logging for tender modes:**

**Update `backend/src/services/auditService.ts`**

```typescript
// Log tender mode transitions
async logTenderModeEvent(
  tenderId: string, 
  userId: string, 
  eventType: string, 
  metadata: any
): Promise<void> {
  await db.query(`
    INSERT INTO audit_logs (
      id, user_id, action, entity_type, entity_id, metadata, created_at
    ) VALUES ($1, $2, $3, 'tender', $4, $5, now())
  `, [
    uuidv4(),
    userId,
    eventType, // TENDER_MODE_CREATED, LIVE_SESSION_STARTED, BID_SUBMITTED_LIVE, etc.
    tenderId,
    JSON.stringify({
      ...metadata,
      tender_mode: metadata.tenderMode,
      api_version: metadata.apiVersion
    })
  ]);
}
```

**Add audit dashboard:**
- Real-time audit log viewer
- Filter by tender mode, user, date range
- Export audit reports

---

### **Task 24 — Analytics Dashboard**

**Create analytics for tender modes:**

**Create `backend/src/controllers/analyticsController.ts`**

```typescript
// Tender mode usage statistics
async getTenderModeStats(dateRange: DateRange): Promise<TenderModeStats> {
  const stats = await db.query(`
    SELECT 
      tender_mode,
      COUNT(*) as total,
      AVG(EXTRACT(EPOCH FROM (awarded_at - created_at))) as avg_duration_seconds,
      SUM(CASE WHEN status = 'awarded' THEN 1 ELSE 0 END) as awarded_count
    FROM tenders
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY tender_mode
  `, [dateRange.start, dateRange.end]);
  
  return stats.rows;
}

// Live auction performance metrics
async getLiveAuctionMetrics(sessionId: string): Promise<AuctionMetrics> {
  return {
    totalBids: await redis.get(`session:${sessionId}:total_bids`),
    uniqueBidders: await redis.scard(`session:${sessionId}:bidders`),
    avgBidInterval: await calculateAvgBidInterval(sessionId),
    priceReductionPercent: await calculatePriceReduction(sessionId)
  };
}
```

**Frontend dashboard:**
- Tender mode adoption charts
- Live auction performance metrics
- Vendor engagement analytics
- Time-to-award comparison across modes

---

## 3. Quick Reference - All 24 Tasks

| **#** | **Task** | **Phase** | **Key Files** |
|-------|----------|-----------|---------------|
| 1 | Database schema for tender modes | 1 | Migration SQL + Rollback |
| 2 | TypeScript types | 1 | `types/tender.types.ts` |
| 3 | Zod validation schemas | 1 | `schemas/tender.schema.ts` |
| 4 | Dashboard UI — govt vs non-govt bunch only; no Live card; live is option at creation | 1 | `routes/(app)/dashboard/+page.svelte` |
| 5 | Simple RFQ form | 2 | `routes/(app)/tenders/new/simple-rfq/+page.svelte` |
| 6 | Simple RFQ controller | 2 | `controllers/simpleRfqController.ts` |
| 7 | Simple RFQ vendor quote interface | 2 | `routes/(app)/tenders/[id]/quote/+page.svelte` |
| 8 | Detailed RFT schema | 3 | Migration SQL + Rollback |
| 9 | Detailed RFT wizard | 3 | `routes/(app)/tenders/new/detailed-rft/+page.svelte` |
| 10 | Detailed RFT controller | 3 | `controllers/detailedRftController.ts` |
| 11 | Live tendering schema | 4 | Migration SQL + Rollback |
| 12 | Live tender validation | 4 | `schemas/tender.schema.ts` |
| 13 | Live tender creation & session management | 4 | `controllers/liveTenderController.ts`, `services/liveSessionService.ts` |
| 14 | Live tender form | 4 | `routes/(app)/tenders/new/live-auction/+page.svelte` |
| 15 | Live bidding dashboard | 4 | `routes/(app)/tenders/[id]/live-dashboard/+page.svelte` |
| 16 | SSE streaming | 4 | `controllers/liveTenderController.ts` |
| 17 | Limited tendering access control | 5 | `middleware/authMiddleware.ts` |
| 18 | Tender mode switching & migration | 5 | Migration SQL |
| 19 | End‑to‑end testing | 5 | Test suite + Load testing |
| 20 | Documentation | 5 | User guides + API docs + Operations docs |
| 21 | Performance optimization | 5 | `services/bidOptimizationService.ts` |
| 22 | Caching strategy | 5 | `services/tenderCacheService.ts` |
| 23 | Audit log enhancement | 5 | `services/auditService.ts` |
| 24 | Analytics dashboard | 5 | `controllers/analyticsController.ts` |

---

## 4. Critical Implementation Notes

### API Versioning Strategy

```typescript
// Route handling for versioned API
app.use('/api/v1/tenders', v1TenderRoutes); // Existing routes (read-only)
app.use('/api/v2/tenders', v2TenderRoutes); // New routes with tender modes

// Backward compatibility middleware
app.use('/api/tenders', (req, res, next) => {
  req.url = '/api/v2' + req.url;
  next();
});
```

**Versioning Approach:**

| **Version** | **Status** | **Key Features** | **Deprecation Timeline** |
|-------------|-------------|-------------------|------------------------|
| v1 | Legacy | Original tender types (RFQ/TENDER), standard evaluation workflow | No deprecation planned |
| v2 | Current | Tender modes (simple_rfq/detailed_rft/live_auction), live tendering, limited tendering | Active |

**API Endpoint Routing:**
- `/api/v1/tenders/*` → Legacy endpoints (read-only, existing tenders)
- `/api/v2/tenders/*` → New endpoints with tender mode support
- `/api/tenders/*` → Alias to v2 (default for new clients)

**Backward Compatibility:**
- Existing v1 API clients continue to work for reading tender data
- New v2 endpoints support all tender modes and live bidding
- Response format includes `api_version` field to indicate which version was used
- Migration guide provided for v1 clients to upgrade to v2

**Version Detection:**
- Request header `X-API-Version` can specify preferred version (v1 or v2)
- Default to v2 if header not specified
- v1 requests automatically mapped to v2 responses where compatible

### Limited Tendering Access Control

```typescript
// Middleware check
export const authorizeLimitedTender = async (req: Request, res: Response, next: NextFunction) => {
  const { tenderId } = req.params;
  
  const { rows } = await db.query(`
    SELECT t.visibility, ltv.vendor_org_id, t.tender_mode
    FROM tenders t
    LEFT JOIN limited_tender_vendors ltv ON t.id = ltv.tender_id 
      AND ltv.vendor_org_id = $1
    WHERE t.id = $2
  `, [req.user!.orgId, tenderId]);

  if (!rows[0]) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Tender not found' }});
  }

  const tender = rows[0];
  
  // For live auctions with limited participation
  if (tender.tender_mode === 'live_auction' && tender.visibility === 'limited') {
    if (!tender.vendor_org_id) {
      // Log unauthorized access attempt
      await auditService.logTenderModeEvent(tenderId, req.user!.id, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
        orgId: req.user!.orgId,
        tenderMode: 'live_auction'
      });
      
      return res.status(403).json({ 
        error: { code: 'NOT_INVITED', message: 'You are not invited to this tender' }
      });
    }
  }
  
  next();
};
```

### Live Session Auto‑Management

Sessions auto‑transition based on wall‑clock time:
- `scheduled` → `active` when NOW() >= `scheduled_start`
- `active` → `completed` when NOW() >= `scheduled_end`

Background service polls every 10 seconds.

**Session recovery on restart:**

```typescript
// On server startup
async recoverLiveSessions(): Promise<void> {
  const { rows } = await db.query(`
    SELECT id, tender_id, scheduled_start, scheduled_end
    FROM live_bidding_sessions
    WHERE status = 'active'
  `);
  
  for (const session of rows) {
    const now = new Date();
    
    if (now >= new Date(session.scheduled_end)) {
      // Session should have ended
      await this.endSession(session.id);
    } else {
      // Session is still active, restore state
      await this.restoreSessionState(session.id);
    }
  }
}
```

### Real‑Time Bid Validation (Open Reverse Auction)

```typescript
// Optimistic validation using Redis
async validateBidForOpenReverse(sessionId: string, bidAmount: number): Promise<ValidationResult> {
  const [currentBest, minIncrement] = await Promise.all([
    redis.get(`session:${sessionId}:current_best`),
    redis.get(`session:${sessionId}:min_increment`)
  ]);
  
  const currentBestNum = parseFloat(currentBest || '0');
  const minIncrementNum = parseFloat(minIncrement || '0');
  
  if (bidAmount >= currentBestNum) {
    return { valid: false, reason: `Bid must be lower than current best: ${currentBestNum}` };
  }
  
  if (minIncrementNum > 0 && bidAmount > (currentBestNum - minIncrementNum)) {
    return { 
      valid: false, 
      reason: `Bid must be at least ${minIncrementNum} lower than current best` 
    };
  }
  
  return { valid: true };
}
```

### JSONB Field Indexing

Create GIN indexes on `extended_data` for frequently queried fields:

```sql
-- General GIN index
CREATE INDEX idx_tenders_extended_data_gin ON tenders USING GIN (extended_data);

-- Specific path indexes for better performance
CREATE INDEX idx_tenders_buyer_email ON tenders 
  ((extended_data->>'buyer_email')) 
  WHERE tender_mode = 'simple_rfq';

CREATE INDEX idx_tenders_procuring_entity ON tenders 
  ((extended_data->>'procuring_entity')) 
  WHERE tender_mode = 'detailed_rft';
```

---

## 5. Rollback Procedures

### Phase 1 Rollback
```bash
# Rollback tender mode foundation
psql -U postgres -d rfq_platform -f migrations/001_add_tender_modes_rollback.sql
```

### Phase 3 Rollback
```bash
# Rollback detailed RFT fields
psql -U postgres -d rfq_platform -f migrations/002_detailed_rft_fields_rollback.sql
```

### Phase 4 Rollback
```bash
# Rollback live tendering
psql -U postgres -d rfq_platform -f migrations/003_live_tendering_rollback.sql
```

### Full System Rollback
```bash
# Execute all rollback scripts in reverse order
for file in migrations/*_rollback.sql; do
  echo "Rolling back: $file"
  psql -U postgres -d rfq_platform -f "$file"
done
```

---

## 6. Technology Stack Summary

| **Component** | **Technology** | **Version** |
|---------------|----------------|-------------|
| Database | PostgreSQL (JSONB, GIN indexes) | 16+ |
| Backend | Node.js + Express + TypeScript | 20 LTS |
| Real‑time | Redis Pub/Sub + Server‑Sent Events | 7+ |
| Frontend | SvelteKit | 2.0+ |
| Validation | Zod | 3.22+ |
| State Management | TanStack Query | 5.0+ |
| Caching | Redis | 7+ |
| Background Jobs | Node‑cron | 3.0+ |
| Load Balancing | Nginx (for SSE connections) | 1.24+ |

---

## 7. Performance Targets

| **Metric** | **Target** | **Notes** |
|------------|-----------|-------------|
| Simple RFQ creation time | < 2 seconds | Standard for modern web applications |
| Detailed RFT creation time | < 10 seconds | Complex form with multiple steps |
| Live bid submission latency | < 500ms | **Ambitious** - requires optimized infrastructure, Redis caching, and efficient database queries. Consider 1-2s target for initial implementation |
| SSE message delivery | < 100ms | Requires efficient Redis pub/sub and minimal payload size |
| Concurrent live bidders | 1000+ per session | Requires horizontal scaling and load balancing |
| Database query time (95th percentile) | < 100ms | Requires proper indexing and query optimization |
| API response time (95th percentile) | < 500ms | Standard for REST APIs |
| Cache hit rate | > 80% | Requires effective cache warming strategy |

### Performance Optimization Recommendations

**1. Live Bidding Optimization:**
- Use Redis for current best bid caching
- Implement optimistic locking for bid submission
- Batch bid validation using Redis pipelines
- Use database connection pooling

**2. Caching Strategy:**
- Cache tender data for 1 hour (TTL)
- Pre-warm cache for live sessions 5 minutes before start
- Cache vendor eligibility data for large tenders
- Implement cache-aside pattern for tender listings

**3. Database Optimization:**
- Add GIN indexes on JSONB columns for mode-specific fields
- Use materialized views for complex queries
- Partition `live_bid_updates` table by date
- Optimize query patterns based on actual usage

**4. Real-Time Updates:**
- Use SSE instead of WebSockets for simpler implementation
- Implement heartbeat every 30 seconds for connection health
- Batch multiple events into single SSE message
- Implement connection recovery logic

---

## END OF PLAN
