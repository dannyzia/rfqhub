# Skill: `root_cause_debugging`

> Fix the cause. Never the symptom.

---

## Purpose

Systematically trace a bug to its exact origin before proposing any fix. Speculative fixes waste time, introduce new bugs, and mask the real problem.

---

## When This Skill Is Active

Trigger this skill when:

- Something that worked is now broken
- Behaviour is inconsistent or intermittent
- An error message doesn't match the expected failure point
- A fix was applied but the bug persists
- The cause is not immediately obvious from the error message alone
- Production issues, regression reports, or "it worked yesterday" scenarios

---

## Step-by-Step Behaviour

### Step 1 — Gather the Full Error Context

Before touching any code, collect:

```
Error report:
- Error message (exact, copy-pasted — not paraphrased)
- Stack trace (full — not truncated)
- HTTP status code (if API)
- Request payload (if relevant)
- Environment: development / staging / production
- When it started: always broken / regression after commit X
- Frequency: always / intermittent / only under specific conditions
```

If any of these are missing, ask for them before proceeding.

### Step 2 — Reproduce Before Fixing

Do not attempt a fix until you have a reproduction path:

```
Reproduction path:
1. POST /api/tenders/simple-rfq with body { tenderTypeCode: 'NRQ1', ... }
2. Observe: 500 Internal Server Error
3. Server log shows: "relation 'organisations' does not exist"
4. Confirmed reproducible: yes, 100% of the time
```

If you cannot reproduce it, say so. Do not guess at a fix for an unreproducible bug.

### Step 3 — Trace the Data Flow End-to-End

For a given bug, trace the execution path from entry point to failure:

```
Data flow trace:
Request → tender.routes.ts (POST /tenders/simple-rfq)
        → enforceTenderQuota middleware
        → subscriptionService.checkTenderQuota()
        → pool.query("SELECT ... FROM organisation_subscriptions ...")
        ← ERROR: relation 'organisations' does not exist
           ^--- actual failure point: typo in SQL string, 'organisations' vs 'organizations'
```

Identify the **exact line** where the failure occurs. Not "somewhere in the service" — the exact line.

### Step 4 — Identify the Root Cause

State the root cause explicitly and completely:

```
Root cause:
SQL query on line 34 of subscription.service.ts references table 'organisations'
but the actual table name in schema.sql is 'organizations' (American spelling).
This was introduced in the initial implementation and has never been caught because
the test suite mocks pool.query and does not run against the real database.
```

The root cause statement must be falsifiable — it must describe something you can point to in a file.

### Step 5 — Propose the Fix Before Implementing

Write the fix in plain English first:

```
Proposed fix:
Change line 34 of subscription.service.ts:
FROM: FROM organisations os
TO:   FROM organizations os

Also search all new service files for 'organisations' to find any other instances.
Grep: grep -rn "organisations" backend/src/services/ backend/src/controllers/
```

State explicitly: does this fix address the root cause, or only a symptom?

### Step 6 — Implement the Fix (using `surgical_execution`)

Once the root cause is confirmed and the fix is proposed, apply it using `surgical_execution` rules:
- Minimum change
- No scope creep
- Explain the exact diff

### Step 7 — Verify the Fix

After applying:
```
Verification:
- SQL query now references 'organizations' (correct)
- Grep confirms no other instances of 'organisations' in new service files
- Manual test: POST /api/tenders/simple-rfq returns 201 (was 500)
- Existing tests: npm test — all pass
```

---

## Hard Constraints

| Constraint | Rule |
|-----------|------|
| ❌ No fixes before reproduction | If you can't reproduce it, you can't verify the fix. |
| ❌ No speculative fixes | "This might be the issue" is not acceptable. Trace to certainty. |
| ❌ No refactors while debugging | The codebase is already fragile — don't touch what isn't broken. |
| ❌ No bundling multiple fixes | One bug report = one confirmed root cause = one fix. Additional bugs found during tracing go in a separate report. |
| ✅ One bug, one fix | If tracing reveals a second unrelated bug, document it separately and fix it separately. |
| ✅ Confirm fix verifiability | Before implementing, confirm how you will verify the fix worked. |

---

## Testing Phase Context

When debugging a **failing test** (not a production bug), follow these additional rules:

### Is the test wrong or is the code wrong?

Before tracing, answer this question explicitly:

```
Is the test asserting the correct behaviour? YES / NO
- If YES → the source code is broken. Trace and fix the source code.
- If NO  → the test expectation is wrong. Propose the correction and wait for approval before changing the test.
```

**Never change a test to make it pass unless the test itself is provably incorrect.** Changing a test to match broken code is the most dangerous form of silent failure.

### Read the test plan file first

Each test area has a corresponding plan file. Read it before touching anything:

| Test Area | Plan File |
|-----------|-----------|
| Backend unit tests (services, middleware) | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_04.md` |
| Backend integration tests (API endpoints) | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_05.md` |
| Frontend unit tests (stores, components) | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_06.md` |
| Frontend E2E tests | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_07.md` |
| Test infrastructure / config / seed data | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_02.md` |
| Database schema / missing tables | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_APPENDIX_D.md` |

The status section at the **bottom of each plan file** documents what is currently failing, known root causes, and what has already been tried. Read it — the answer may already be there.

### After fixing a test failure

- ✅ Run the specific suite first: `npm test -- [suite].test.ts --maxWorkers=1`
- ✅ Then run the full suite to check for regressions: `npm test`
- ✅ Update the status section at the bottom of the relevant plan file — in place, no new files
- ❌ Do not create a separate report file summarising what you fixed

---

## Common Bug Patterns in This Codebase

Document patterns as they are discovered:

| Pattern | Symptom | Root Cause |
|---------|---------|-----------|
| Table name typo | `relation 'X' does not exist` | British vs American spelling: always use `organizations` |
| Wrong FK target | Foreign key constraint violation | Verify target table exists and has matching PK type (UUID) |
| Migration not run | Column does not exist | Check that latest migrations (012–014) have been applied |
| Redis cache stale | Quota not updating | `adjustStorage()` calls `redis.del()` — ensure this is called after every upload/delete |
| Live session orphan | `live_session_id` FK constraint | On transaction rollback, delete the live_bidding_sessions row created before the tender insert |
| Wrong enum value | Postgres type error | `procurement_role` enum has exactly 6 values — check spelling against migration 014 |

---

## Output Format (Debugging)

```
## Debug Report: [Issue Title]

**Skill active:** root_cause_debugging

### Error context:
[Full error + stack trace + environment]

### Reproduction path:
[Step-by-step to trigger the bug]

### Data flow trace:
[Entry point → ... → exact failure line]

### Root cause:
[Specific, falsifiable statement of what is wrong and where]

### Proposed fix:
[Plain English description of the change]
[Does this fix the root cause or a symptom? ROOT CAUSE]

### Verification plan:
[How you will confirm the fix worked]

Awaiting confirmation to apply fix.
```
