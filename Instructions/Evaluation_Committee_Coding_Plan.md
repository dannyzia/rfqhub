**EVALUATION COMMITTEE CODING PLAN**

**RFQ & Tendering Platform – Evaluation Committee & Tiered Evaluation Workflow**

Step‑by‑Step Guide for Developers

Based on Technical PRD v3.1 | Schema v3.0 | February 2026

3 Phases • 15 Tasks • Every step explained

**Changelog v1.0:**
- Introduces two new roles (`evaluator`, `purchase_head`)
- Adds three‑tier evaluation committee (Pre‑qualification, Technical, Commercial)
- Implements tier‑specific field visibility based on `Instructions/TENDER_TYPES_AND_REQUIREMENTS.md`
- Builds committee management, evaluator dashboard, and forwarding workflow

---

## Table of Contents

1. How to Read This Document
2. Phase Overview Map
3. Phase 1: Database & Role Setup
4. Phase 2: Backend Services & Endpoints
5. Phase 3: Frontend Components & UI
6. Quick Reference – All Tasks at a Glance

---

### 1. How to Read This Document

This plan assumes you are already familiar with the existing RFQ platform codebase (`rfq-platform/backend` and `rfq-platform/frontend`). Each Task is a single, focused piece of work that you can complete in one sitting. Do them in the exact order shown; later Tasks depend on earlier ones.

**Golden Rules**
- Do one Task at a time. Finish it completely before moving to the next.
- After every Task, run the existing tests (`npm test`) and confirm the app still works.
- Copy‑paste commands exactly as written; typos cause confusing errors.
- Use the existing patterns in the codebase – new files should follow the same structure as similar existing files.

### 2. Phase Overview Map

| **Phase** | **Name**                     | **What You Build**                                                                 | **Unlocks**                                                                 |
|-----------|------------------------------|------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| 1         | Database & Role Setup        | New table, tender status, role validation                                          | The database can store committee assignments and tier‑specific permissions. |
| 2         | Backend Services & Endpoints | Committee management, visibility service, evaluator dashboard, forwarding workflow | The API can assign evaluators, filter fields, and move tenders between tiers. |
| 3         | Frontend Components & UI     | Buyer assignment UI, evaluator dashboard, tier‑adaptive evaluation interface       | Users can see and use the new workflow in the browser.                      |

---

## Phase 1: Database & Role Setup

This phase adds the required database structures and extends the role system to support the two new roles (`evaluator`, `purchase_head`). No existing functionality is broken.

**Task 1 – Create Migration for the Committee Table**

Create a new migration file in `rfq-platform/database/migrations/`. The file name must follow the existing numbering pattern (e.g., `012_evaluation_committee.sql`).

```sql
-- rfq-platform/database/migrations/012_evaluation_committee.sql

-- 1. Create the committee assignment table
CREATE TABLE tender_evaluation_committees (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id        UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES users(id),
    tier             TEXT NOT NULL CHECK (tier IN ('pre_qualification', 'technical', 'commercial')),
    status           TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'forwarded')),
    assigned_by      UUID NOT NULL REFERENCES users(id),
    assigned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at     TIMESTAMPTZ,
    forwarded_at     TIMESTAMPTZ,
    UNIQUE (tender_id, user_id, tier)
);

-- Indexes for performance
CREATE INDEX idx_tender_evaluation_committees_tender ON tender_evaluation_committees(tender_id);
CREATE INDEX idx_tender_evaluation_committees_user ON tender_evaluation_committees(user_id);
CREATE INDEX idx_tender_evaluation_committees_tier ON tender_evaluation_committees(tier);

-- 2. Add the new tender status 'pre_qual_eval' to the master table (if not present)
INSERT INTO tender_status_master (code) VALUES ('pre_qual_eval') ON CONFLICT DO NOTHING;
```

**Run the migration:**

```bash
cd rfq-platform/backend
npm run migrate:up  # or the appropriate command you use to apply migrations
```

**Verify:** Connect to your PostgreSQL database and check that the table exists and the new status appears in `tender_status_master`.

---

**Task 2 – Update Role Validation & Authorization**

The platform already supports a `roles` array in the `users` table. The existing `authorize` middleware (in `backend/src/middleware/auth.middleware.ts`) already accepts `evaluator`. We need to add `purchase_head` as a recognized role.

**File to modify:** `backend/src/types/user.types.ts`

Add `'purchase_head'` to the `UserRole` type.

```typescript
// backend/src/types/user.types.ts
export type UserRole =
  | 'admin'
  | 'buyer'
  | 'vendor'
  | 'evaluator'
  | 'purchase_head';   // <-- add this line
```

**Also update** any hard‑coded role lists (e.g., in `backend/src/schemas/auth.schema.ts`) if they restrict registration roles. The registration API should still only allow `buyer` and `vendor`; evaluators and purchase heads are assigned by admins, not self‑registered.

**Test:** Log in as a user with the `purchase_head` role (you may need to manually update the `users.roles` array in the database) and verify that endpoints protected by `authorize('purchase_head')` now allow access.

---

## Phase 2: Backend Services & Endpoints

This phase builds the core business logic: committee management, field‑visibility filtering, and the forwarding workflow.

**Task 3 – Create Committee Management Service**

**File:** `backend/src/services/committee.service.ts`

This service will handle CRUD operations on the `tender_evaluation_committees` table.

```typescript
import db from '../config/database';
import logger from '../config/logger';

export interface CommitteeAssignment {
  id: string;
  tender_id: string;
  user_id: string;
  tier: 'pre_qualification' | 'technical' | 'commercial';
  status: 'pending' | 'approved' | 'forwarded';
  assigned_by: string;
  assigned_at: Date;
  completed_at?: Date;
  forwarded_at?: Date;
}

export class CommitteeService {
  // Add one or more evaluators to a tender tier
  static async assign(
    tenderId: string,
    userIds: string[],
    tier: CommitteeAssignment['tier'],
    assignedBy: string
  ): Promise<void> {
    // ... implementation (insert rows, handle duplicates)
  }

  // List all committee assignments for a tender, grouped by tier
  static async list(tenderId: string): Promise<CommitteeAssignment[]> {
    // ... implementation
  }

  // Remove an evaluator from a tender tier
  static async remove(tenderId: string, userId: string, tier: string): Promise<void> {
    // ... implementation
  }

  // Mark an evaluator's evaluation as approved for a given tier
  static async approve(tenderId: string, userId: string, tier: string): Promise<void> {
    // ... implementation
  }

  // Forward the tender to the next tier (only if all evaluators in the current tier have approved)
  static async forwardTier(tenderId: string, currentTier: string): Promise<void> {
    // ... implementation
  }
}
```

**Write unit tests** in `backend/src/services/__tests__/committee.service.test.ts`.

---

**Task 4 – Create Visibility Service**

**File:** `backend/src/services/visibility.service.ts`

This service filters tender data (documents, line items, features, etc.) based on the viewer's tier. The mapping of which fields belong to which tier is defined in `Instructions/TENDER_TYPES_AND_REQUIREMENTS.md`.

The service will expose a single method:

```typescript
export class VisibilityService {
  static filterForTier<T extends Record<string, any>>(
    data: T,
    tier: 'pre_qualification' | 'technical' | 'commercial',
    dataType: 'document' | 'feature' | 'bid_item' | 'tender'
  ): Partial<T> {
    // Return only the properties that the given tier is allowed to see.
    // Implementation can be a hard‑coded map or a configuration read from a JSON file.
  }
}
```

Because the mapping is static, start with a hard‑coded map. Example for documents:

```typescript
const documentVisibility = {
  pre_qualification: ['legal', 'financial', 'experience'],
  technical: ['technical', 'specifications', 'drawings', 'test_reports'],
  commercial: ['tender_form', 'contract_form', 'price_schedule']
};
```

**Integration:** This service will be called by the evaluator dashboard endpoint (Task 6) and the evaluation data endpoint (Task 7).

---

**Task 5 – Create Committee Controller & Routes**

**Controller:** `backend/src/controllers/committee.controller.ts`

Implement the following endpoints:

| Method | URL                                      | What It Does                                                       |
|--------|------------------------------------------|--------------------------------------------------------------------|
| POST   | `/tenders/:tenderId/committee`           | Assign one or more evaluators to a tier                            |
| GET    | `/tenders/:tenderId/committee`           | List all committee assignments for the tender                      |
| DELETE | `/tenders/:tenderId/committee/:userId`   | Remove an evaluator from a tier (requires `tier` query parameter)  |
| POST   | `/tenders/:tenderId/committee/forward`   | Forward the tender to the next tier (body: `{ tier }`)             |
| POST   | `/tenders/:tenderId/committee/approve`   | Mark the current user's evaluation as approved for the given tier  |

**Routes:** Create `backend/src/routes/committee.routes.ts` and wire it into `backend/src/routes/index.ts`.

**Validation:** Use Zod schemas (create `backend/src/schemas/committee.schema.ts`) for request validation.

**Authorization:** Only buyers and admins can assign/remove committee members. Only assigned evaluators can approve. Only buyers/admins (or the system) can forward.

---

**Task 6 – Create Evaluator Dashboard Endpoint**

**Endpoint:** `GET /evaluator/tenders`

**Controller:** `backend/src/controllers/evaluator.controller.ts`

This endpoint returns a list of tenders where the authenticated user is assigned as an evaluator, grouped by tier. For each tender, include basic info (title, tender number, current status, deadline) and the user's own committee status (pending/approved/forwarded).

**Implementation steps:**

1. Query `tender_evaluation_committees` for the current user.
2. Join with `tenders` and `organizations` to get tender details.
3. Group results by `tier`.
4. Return a JSON structure like:
   ```json
   {
     "pre_qualification": [...],
     "technical": [...],
     "commercial": [...]
   }
   ```

**Route:** Add a new route in `backend/src/routes/evaluator.routes.ts` and include it in the main router.

---

**Task 7 – Create Tier‑Specific Evaluation Data Endpoint**

**Endpoint:** `GET /tenders/:tenderId/evaluation-data`

This endpoint returns all the data (documents, line items, features, etc.) that the authenticated evaluator is allowed to see, based on their assigned tier. It uses the `VisibilityService` from Task 4.

**Implementation:**

1. Validate that the user is assigned to a committee tier for this tender.
2. Determine the tier from the committee record.
3. Fetch all relevant data from the database (via existing services).
4. Pass each data set through `VisibilityService.filterForTier`.
5. Return the filtered data.

**Security:** If the user is not assigned, return 403.

---

**Task 8 – Extend Existing Evaluation Service**

The existing `evaluation.service.ts` already handles technical and commercial scoring. We need to extend it to support pre‑qualification evaluation.

**Changes:**

1. Add a `tier` parameter to `createEvaluation` (or infer it from the tender's current status).
2. If `tier === 'pre_qualification'`, store the score in a new column `pre_qualification_score` (add this column to the `evaluations` table via a migration) or reuse `technical_score` with a flag.
3. Update the evaluation validation to ensure that an evaluator can only submit an evaluation for the tier they are assigned to and only when the tender is in the corresponding status.

**Migration for `pre_qualification_score` column (optional):**

```sql
ALTER TABLE evaluations ADD COLUMN pre_qualification_score INTEGER CHECK (pre_qualification_score >= 0 AND pre_qualification_score <= 100);
```

---

**Task 9 – Wire Up Forwarding Workflow**

When all evaluators in a tier have approved, the buyer (or the system) can forward the tender to the next tier. Forwarding should:

1. Update the `status` of all committee records in the current tier to `'forwarded'`.
2. Transition the tender's status:
   - `pre_qual_eval` → `tech_eval`
   - `tech_eval` → `comm_eval`
   - `comm_eval` → (no change; forwarding to purchase head is a separate step)
3. Insert a notification for the next‑tier evaluators (or purchase head).

Implement this logic in `CommitteeService.forwardTier` and call it from the controller.

**Important:** The forwarding endpoint should check that all assigned evaluators have `status = 'approved'` before proceeding.

---

**Task 10 – Add Notifications**

Extend the existing notification service (`backend/src/services/notification.service.ts`) to send notifications for:

- Committee assignment (“You have been assigned as a {tier} evaluator for tender {tender_number}”)
- Tier forwarding (“Tender {tender_number} has been forwarded to {next_tier}”)
- Purchase‑head assignment (“You are required to make a final award decision for tender {tender_number}”)

Use the existing notification queue; no new infrastructure needed.

---

## Phase 3: Frontend Components & UI

This phase builds the user interface for buyers (assignment), evaluators (dashboard and evaluation), and purchase heads (final decision).

**Task 11 – Buyer Interface: Committee Assignment Tab**

**File:** `frontend/src/routes/(app)/tenders/[id]/edit/committee/+page.svelte`

Add a new tab “Evaluation Committee” to the tender edit page (next to “Details”, “Line Items”, etc.).

**What it does:**

- Shows a three‑column layout (Pre‑qualification, Technical, Commercial).
- Each column lists the currently assigned evaluators (with name, status).
- Provides a multi‑select component to add more evaluators (search users with role `evaluator` or `purchase_head`).
- A “Forward” button for each tier that appears only when all evaluators in that tier have approved (calls the forward endpoint).
- Uses the committee endpoints from Task 5.

**Implementation tips:**

- Reuse the existing `MultiSelect` component from the design system.
- Fetch committee data on mount and keep it reactive.

---

**Task 12 – Evaluator Dashboard Page**

**File:** `frontend/src/routes/(app)/evaluator/+page.svelte`

Create a new route for evaluators. This page displays three sections (Pre‑qualification, Technical, Commercial) with cards for each tender the user is assigned to.

Each card shows:
- Tender title & number
- Deadline
- Current status (pending/approved/forwarded)
- A button “Evaluate” that links to the evaluation interface.

**Data source:** Use the `/evaluator/tenders` endpoint (Task 6).

**Styling:** Follow the existing dashboard card patterns.

---

**Task 13 – Tier‑Adaptive Evaluation Interface**

**File:** `frontend/src/routes/(app)/evaluator/[tenderId]/+page.svelte`

This page adapts its content based on the user's assigned tier for this tender.

**Steps:**

1. On load, fetch `/tenders/:tenderId/evaluation-data` (Task 7) to get the filtered data.
2. Render the appropriate UI:
   - **Pre‑qualification:** Show vendor qualification documents and compliance checkboxes.
   - **Technical:** Show technical specifications, feature scoring, compliance remarks.
   - **Commercial:** Show price breakdown, tax calculations, commercial envelope details.
3. Include an “Approve” button that submits the evaluation (via the existing evaluation API) and updates the committee status.
4. If the user is the last approver in the tier, show a “Forward” button (visible only to buyers/admins) or a message “Ready for forwarding”.

**Important:** The UI must not expose fields that belong to other tiers (the backend already filters them out).

---

**Task 14 – Purchase Head Interface**

**File:** `frontend/src/routes/(app)/purchase-head/+page.svelte`

Similar to the evaluator dashboard, but only shows tenders that have been forwarded to the commercial tier and where the authenticated user has the `purchase_head` role.

Each tender card includes a “Review & Award” button that opens a page where the purchase head can:

- See the commercial data (price, taxes, etc.)
- Compare bids side‑by‑side (reuse the existing comparison matrix component)
- Make a final award decision (Award / Reject) with a justification field.

**Award decision** calls the existing award endpoint (`/tenders/:tenderId/awards`). After awarding, the tender status becomes `awarded`.

---

**Task 15 – End‑to‑End Testing & Validation**

**Testing checklist:**

1. **Unit tests** for new services (`committee.service.ts`, `visibility.service.ts`).
2. **Integration tests** for new endpoints (`committee.routes`, `evaluator.routes`).
3. **Frontend component tests** for the new Svelte pages.
4. **End‑to‑end workflow test** using Playwright:
   - Buyer creates a tender, assigns evaluators.
   - Evaluator logs in, sees the tender in their dashboard, submits approval.
   - Buyer forwards the tender to the next tier.
   - Purchase head logs in, makes an award decision.

**Run the full test suite:**

```bash
cd rfq-platform/backend
npm test

cd ../frontend
npm run test:e2e
```

**Final validation:** Perform a manual walk‑through of the entire workflow with at least two evaluators and a purchase head. Ensure that field‑level visibility works as specified in `TENDER_TYPES_AND_REQUIREMENTS.md`.

---

## Quick Reference – All 15 Tasks at a Glance

| #  | Task                                  | Phase | Key File(s) Created or Modified                                     |
|----|---------------------------------------|-------|----------------------------------------------------------------------|
| 1  | Create migration for committee table  | 1     | `database/migrations/012_evaluation_committee.sql`                   |
| 2  | Update role validation                | 1     | `backend/src/types/user.types.ts`, `backend/src/schemas/auth.schema.ts` |
| 3  | Create committee service              | 2     | `backend/src/services/committee.service.ts`                          |
| 4  | Create visibility service             | 2     | `backend/src/services/visibility.service.ts`                         |
| 5  | Create committee controller & routes  | 2     | `backend/src/controllers/committee.controller.ts`, `backend/src/routes/committee.routes.ts` |
| 6  | Create evaluator dashboard endpoint   | 2     | `backend/src/controllers/evaluator.controller.ts`, `backend/src/routes/evaluator.routes.ts` |
| 7  | Create tier‑specific evaluation data endpoint | 2 | `backend/src/controllers/evaluator.controller.ts` (additional method) |
| 8  | Extend evaluation service             | 2     | `backend/src/services/evaluation.service.ts`, `database/migrations/013_pre_qual_score.sql` (optional) |
| 9  | Wire up forwarding workflow           | 2     | `backend/src/services/committee.service.ts` (forwardTier)            |
| 10 | Add notifications                     | 2     | `backend/src/services/notification.service.ts`                       |
| 11 | Buyer interface – committee assignment | 3    | `frontend/src/routes/(app)/tenders/[id]/edit/committee/+page.svelte` |
| 12 | Evaluator dashboard page              | 3     | `frontend/src/routes/(app)/evaluator/+page.svelte`                   |
| 13 | Tier‑adaptive evaluation interface    | 3     | `frontend/src/routes/(app)/evaluator/[tenderId]/+page.svelte`        |
| 14 | Purchase head interface               | 3     | `frontend/src/routes/(app)/purchase-head/+page.svelte`               |
| 15 | End‑to‑end testing & validation       | 3     | `tests/integration/committee.api.test.ts`, `frontend/e2e/committee.spec.ts` |

---

**Next Step:** Review this coding plan with the product owner. Once approved, switch to **Code mode** and begin implementation following the task order above.

