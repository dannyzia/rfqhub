# Skill: `surgical_execution`

> Change exactly what was planned. Nothing more.

---

## Purpose

Make the smallest possible change that achieves the task. Protect working code from accidental breakage. Every line you touch is a line that can break production.

---

## When This Skill Is Active

Trigger this skill when the request involves:

- Bug fixes — any scope
- Small enhancements to an existing feature
- Adding a field, column, or parameter
- Hotfixes under time pressure
- Extending a single function or method
- Any task where `plan_before_code` has already been approved and execution begins

---

## Step-by-Step Behaviour

### Step 1 — Confirm Scope

Before touching any file, state the exact scope:

```
Scope:
- File to modify: backend/src/services/subscription.service.ts
- Function to change: checkTenderQuota()
- What changes: add isDetailed parameter, branch on weekly_detailed_tender_limit
- What does NOT change: getActive(), adjustStorage(), incrementQuota()
```

If the scope is not clear, ask. Do not infer scope from context and proceed.

### Step 2 — Read the Target File(s) in Full

Read the complete file before writing a single character. Confirm:

- The function signature you are about to change
- The calling pattern used in this codebase
- Existing error handling style
- Variable naming conventions already in use

### Step 3 — Make the Minimal Change

Apply the change. Then stop.

Do not:
- Reformat code that wasn't in scope
- Rename variables you notice are poorly named
- Add imports that aren't needed for this change
- Restructure logic that works but looks ugly
- Add console.logs or debug output
- Extract constants that could be extracted but weren't asked for

Do:
- Make exactly the change in the plan
- Match the existing code style precisely
- Use the same error handling pattern already in the file
- Use the same naming convention already in the file

### Step 4 — Explain Every Change

After each file change, provide a brief explanation:

```
Changed: Added `isDetailed: boolean` parameter to `checkTenderQuota()`
Reason: Required to branch between weekly_simple_rfq_limit and weekly_detailed_tender_limit
Impact: All callers updated — 2 call sites in tender.controller.ts (lines 44 and 71)
```

If a change has a downstream caller that now needs updating, name it explicitly — don't silently update it without saying so.

### Step 5 — Verify the Diff

Before presenting the change, mentally check:

- Did I only touch files named in the scope?
- Is the diff smaller than I expected? (If it's large, something is wrong)
- Did I accidentally change indentation, formatting, or import order in untouched lines?
- Would a senior developer be able to read this diff in 30 seconds and understand exactly what changed and why?

---

## Hard Constraints

| Constraint | Rule |
|-----------|------|
| ❌ No file renaming | Even if the current name is wrong. File renames break imports everywhere. Note it as a follow-up. |
| ❌ No function renaming | Same reason — note it as a follow-up. |
| ❌ No "while I'm here" changes | If you notice a bug or improvement in a nearby line, do not fix it. Log it as a follow-up. |
| ❌ No style cleanups | Unless the task is explicitly "clean up style in X". |
| ❌ No new dependencies | Unless explicitly required by the task and approved. |
| ✅ One concern per change | If execution reveals that two things need changing, stop and report before making the second change. |
| ✅ Preserve existing patterns | If the codebase uses `pool.query` with a specific format, use that format. Don't switch to `pool.connect()` because you prefer it. |

---

## Output Format (Execution Phase)

After each file change:

```
## Change: [File Path]

**Scope confirmed:** [what was changed, what was not]

**Diff summary:**
- Line 44: Added `isDetailed` parameter to function signature
- Line 51–58: Added conditional branch for detailed vs simple quota check
- Lines 1–43, 59+: Unchanged

**Downstream callers updated:**
- backend/src/routes/tender.routes.ts — updated 2 call sites

**Follow-up items (not done, not in scope):**
- [ ] Consider extracting quota error message to a shared constant — noted, not done
```

---

## When Active During Testing Phase

When `surgical_execution` is applied to a failing test, these additional constraints apply:

### Scope rule for test fixes

State the scope explicitly before touching anything:

```
Scope:
- File to fix: backend/src/services/vendor.service.ts
- Root cause: route ID mapping returns organization_id instead of vendor profile id
- Fix: change query on line 44 to join vendor_profiles and return correct id
- Test file: backend/src/tests/integration/vendor.api.test.ts — READ ONLY, do not modify
- What does NOT change: anything outside vendor.service.ts
```

### Hard constraints specific to test work

| Constraint | Rule |
|-----------|------|
| ❌ Do not modify the test file | Fix the source code. The test defines the contract. |
| ❌ Do not skip or `.skip()` a failing test | Document why it cannot be fixed instead. |
| ❌ Do not change jest.config.js or vitest.config.ts | These are infrastructure — require `plan_before_code`. |
| ❌ Do not create a new report file | Update the status section at the bottom of the relevant plan file in place. |
| ✅ Run the specific suite first | `npm test -- [suite].test.ts --maxWorkers=1` before running full suite. |
| ✅ Update the plan file after fixing | Append outcome to the bottom of the relevant `PHASE_7_MASTER_TESTING_PLAN_REVISED_XX.md`. |

### Test plan file reference

Read the relevant plan file before making any change:

| Area | Plan File |
|------|-----------|
| Backend unit tests | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_04.md` |
| Backend integration tests | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_05.md` |
| Frontend unit tests | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_06.md` |
| Frontend E2E tests | `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_07.md` |

---

## Common Mistakes to Avoid in This Codebase

- Spelling `organisations` instead of `organizations` — the schema uses American spelling
- Creating tables that already exist instead of ALTERing them
- Assuming `live_bidding_sessions` needs to be created — it was created in migration 010
- Modifying `tenderTypeSelector.service.ts` wholesale — extend it with new exported functions only
- Changing `pool` import pattern — use the existing `import pool from '../config/database'`
