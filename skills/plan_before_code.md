# Skill: `plan_before_code`

> Stop. Read. Plan. Get approval. Then code.

---

## Purpose

Prevent impulsive execution on any change that touches multiple files, introduces new behaviour, or modifies business logic. This skill enforces a structured thinking loop before a single line of production code is written.

**This skill alone prevents 60–70% of AI-introduced regressions.**

---

## When This Skill Is Active

Trigger this skill automatically when the request involves any of:

- A new feature or new module
- Changes to more than one file
- Any modification to business logic (tender workflow, bid submission, evaluation, award, subscription quotas, role assignments)
- New database migrations or schema changes
- New API endpoints
- Changes to shared services, middleware, or utilities
- Anything described as "integrate", "extend", "add", "implement", or "build"
- Writing new test cases or test suites
- Changing test infrastructure (jest.config.js, vitest.config.ts, global setup/teardown, seed scripts)

When in doubt: **use this skill.**

---

## Step-by-Step Behaviour

### Step 1 — Read First (no exceptions)

Before forming any opinion, read:

1. The task description in full
2. All files explicitly named in the task
3. Related files — controllers, services, schemas, routes, and migrations that the change will touch or depend on
4. The relevant section of `rfq-buddy-rules.md` for conventions
5. Any applicable skill files that may also apply (e.g., `high_risk_change_guard.md` if touching auth or financials)
6. **If the task is test-related:** the relevant test plan file (see table below) before forming any plan

Do not skim. Do not assume you know the structure from memory.

### Step 2 — Identify Affected Modules

List explicitly:

```
Affected files (will be modified):
- backend/src/services/xxx.service.ts
- database/migrations/015_xxx.sql

Affected files (will be read/depended on but not modified):
- backend/src/controllers/yyy.controller.ts
- database/schema.sql (for table verification)

Downstream effects:
- Route Z will need the new service method
- Frontend component A fetches from the modified endpoint
```

### Step 3 — Surface Assumptions

List every assumption you are making. Examples:

```
Assumptions:
- The `organizations` table (not `organisations`) is the correct spelling — verified in schema.sql line 21
- Migration numbering: latest is 014, so next is 015
- The existing `tenderTypeSelector.service.ts` already handles is_govt_type filtering — will extend, not replace
- No equivalent `file_uploads` table exists — confirmed by searching schema.sql and all migrations
```

If an assumption cannot be verified by reading existing files, flag it as a risk.

### Step 4 — Produce the Plan

Write a numbered, sequential plan. Each step must be a single, completable unit of work.

```
Plan:
1. Add column `method` to existing `tender_type_definitions` via ALTER TABLE (not CREATE)
2. Backfill `method` column from existing `is_direct_procurement` and `code` values
3. Add `form_segment_config` JSONB column with defaults
4. Create rollback script
5. Add `suggestTenderTypeCode()` function to existing tenderTypeSelector.service.ts (extend, don't replace)
6. Wire new function to GET /api/tender-types/suggest route
```

### Step 5 — Call Out Risks

```
Risks:
⚠ Migration 012 ALTER TABLE will fail if run twice — idempotency ensured with IF NOT EXISTS
⚠ Backfill assumes no NULLs in is_direct_procurement — check: SELECT COUNT(*) FROM tender_type_definitions WHERE is_direct_procurement IS NULL
⚠ Extending tenderTypeSelector.service.ts could break existing cache keys if prefix logic changes — will not change cache key format
```

### Step 6 — Wait for Approval

**Do not write any code until the plan is explicitly approved.**

State clearly:
```
Plan ready. Awaiting approval before writing any code.
```

If the user says "go ahead", "looks good", "proceed", "yes", or similar → proceed to execution.

If the user modifies the plan → incorporate changes and confirm the updated plan before proceeding.

---

## When Active During Testing Phase

When `plan_before_code` is applied to a test-writing or test-infrastructure task, the plan must include an additional mandatory step.

### Step 0 — Read the test plan file first

Before Step 1, identify and read the relevant test plan file:

| Task | Plan File to Read |
|------|-------------------|
| Writing backend unit tests | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_04.md` |
| Writing backend integration tests | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_05.md` |
| Writing frontend unit tests | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_06.md` |
| Writing frontend E2E tests | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_07.md` |
| Test infrastructure changes | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_02.md` |
| Seed data / test data changes | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_03.md` |
| Database schema / migration | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_APPENDIX_D.md` |

Read the **status section at the bottom** of the plan file. It documents what is currently passing, failing, and blocked. Your plan must not duplicate work already done or contradict decisions already recorded there.

### Additional plan requirements for test work

The plan must explicitly state:

```
Test plan file read: [file name]
Current status per plan file: [summary of what is passing/failing/blocked]
Test cases being added: [list of test IDs from plan file, e.g. TEND-I001 to TEND-I010]
Source files affected (fixes needed): [list — these are what get modified, not the test files]
Test files affected: [list — read-only unless the test itself is provably wrong]
Verification: npm test -- [suite].test.ts --maxWorkers=1, then full suite
Plan file update: append outcome to bottom of [plan file] after completion
```

### Hard constraint specific to test planning

- ❌ Do not plan to modify a test file to make it pass — plan to fix the source code instead
- ❌ Do not plan to create a new report file — plan to update the relevant plan file in place
- ❌ Do not plan changes to jest.config.js or vitest.config.ts without `high_risk_change_guard` also active
- ✅ Every new test case written must correspond to a test ID already defined in the plan file, or the plan must justify adding a new one

---

## Hard Constraints

| Constraint | Rule |
|-----------|------|
| ❌ No refactoring during planning | If you spot something to improve, note it separately as a follow-up. Do not fold it into the current task. |
| ❌ No "quick fixes" in passing | Every change must be in the plan. If it's not in the plan, it doesn't get done. |
| ❌ No code before approval | Not even "just the migration" or "just the types". |
| ✅ Call out risks explicitly | Even if you think the risk is low, name it. |
| ✅ Assumptions must be verified | Read the file. Don't guess. |

---

## Output Format (Planning Phase)

```
## Plan: [Task Name]

**Skill active:** plan_before_code
**Also applying:** [other skill names if applicable, or "none"]

### Files I read:
- [file path] — [what I confirmed from it]

### Affected modules:
- **Modify:** [list]
- **Read/depend on:** [list]
- **Downstream effects:** [list]

### Assumptions:
- [assumption] — [how verified]

### Risks:
⚠ [risk description] — [mitigation]

### Step-by-step plan:
1. [Atomic step]
2. [Atomic step]
...

Plan ready. Awaiting approval before writing any code.
```
