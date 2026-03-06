# Skill: `high_risk_change_guard`

> Slow down. Read everything. Name every way this can go wrong. Then ask.

---

## Purpose

This is the last line of defence before a change that could corrupt financial data, break security, or put the platform in an unrecoverable state. It forces maximum deliberation on the changes that matter most.

---

## When This Skill Is Mandatory (non-negotiable)

Activate this skill — overriding all others — when the task touches **any** of:

| Domain | Examples |
|--------|---------|
| **Authentication & sessions** | JWT generation, refresh token rotation, password hashing, session invalidation |
| **Authorisation & RBAC** | Role checks, permission middleware, `authorize()` calls, org-type filtering |
| **Tender financial logic** | Bid amounts, award prices, quote totals, currency conversion, tax calculations |
| **Bid submission & integrity** | Bid hash (SHA-256), envelope sealing, bid_opening_time enforcement, commercial envelope unlock |
| **Subscription & quota enforcement** | Storage limits, weekly quota counters, package feature gates |
| **Procurement workflow** | Forwarding logic, role assignment validation, stage completeness checks |
| **Database migrations** | Any ALTER TABLE, DROP, schema changes on tables with production data |
| **Audit log** | Anything that modifies audit_logs (which must be append-only forever) |
| **Live tendering session** | Bid acceptance, anti-sniping extension, session start/end, rate limiting |

If you are uncertain whether a task qualifies, **treat it as high-risk and activate this skill.**

---

## Step-by-Step Behaviour

### Step 1 — Read Every Related Code Path

Do not limit reading to the file being changed. Read:

- The function being changed
- Every function that calls it
- Every function it calls
- The middleware chain that leads to it
- The database constraints that protect the data it touches
- The audit log entries it currently creates

Example for changing `forwardingWorkflowService.forward()`:
```
Read:
✅ forwardingWorkflow.service.ts — the function itself
✅ tender.routes.ts — what middleware runs before forward() is called
✅ roleAssignment.service.ts — the ROLE_SEQUENCE it depends on
✅ tender_role_assignments table — the UNIQUE constraint it relies on
✅ audit_logs table — what it currently logs and must continue to log
✅ notification.service.ts — the side effect it triggers
✅ evaluations table — what assertStageComplete() queries
✅ bid_qualification_responses table — what assertStageComplete() queries
```

### Step 2 — Identify Invariants

List every property that must remain true before and after the change:

```
Invariants for forwarding workflow:
1. Only the current active role-holder may forward (enforced in service — must not bypass)
2. A tender may only ever move forward through ROLE_SEQUENCE (no skipping, no backward without explicit return)
3. Every forward creates an entry in tender_workflow_log (append-only — must never be skipped)
4. Every forward creates an entry in audit_logs (append-only — must never be skipped)
5. current_workflow_role on tenders table must always match the role with status='active' in tender_role_assignments
6. The forwarded-from assignment must be set to 'forwarded' before the next is set to 'active' (atomicity via transaction)
```

If the proposed change would violate any invariant, **stop and report before proceeding.**

### Step 3 — List Failure Scenarios

For each possible failure mode, describe what happens:

```
Failure scenarios for forward():
A. actorId does not match assigned_user_id
   → Returns 403 NOT_ACTIVE_ROLE_HOLDER ✅ handled
   
B. Transaction commits UPDATE to current assignment but crashes before UPDATE to next assignment
   → Both updates are inside BEGIN/COMMIT block — atomic ✅ handled
   
C. auditService.log() throws after transaction commits
   → Forward is committed but not logged — ⚠ partial failure, audit gap
   → Mitigation: log inside transaction, not after
   → Flag: current implementation logs post-commit — this is a known gap, note for follow-up
   
D. notificationService throws after transaction commits
   → Forward is committed, notification not sent — acceptable (retry queue handles this)
   → ✅ acceptable failure mode
   
E. assertStageComplete() has a bug and passes when it shouldn't
   → Stage advances prematurely — ⚠ HIGH RISK
   → Mitigation: unit test assertStageComplete() independently
```

### Step 4 — Require Rollback Strategy

For any schema change or irreversible operation, a rollback path is mandatory:

```
Rollback strategy:
- Migration 014 has a matching rollback script: 014_tender_role_assignments_rollback.sql
- Rollback drops: tender_workflow_log, tender_role_assignments, procurement_role type
- Rollback removes: current_workflow_role column from tenders
- Data risk: if any tenders have been forwarded, tender_role_assignments rows exist
  → rollback would destroy workflow history — acceptable only before production data exists
- Production rollback procedure: [describe manual steps if automated rollback is not safe]
```

For non-schema changes, describe how to revert:
```
Rollback: Revert subscription.service.ts to previous commit.
Effect: Quota enforcement disabled until revert is deployed. Acceptable window: <5 min.
```

### Step 5 — Ask for Explicit Confirmation Before Executing

State clearly:

```
⛔ HIGH RISK CHANGE — Awaiting explicit confirmation before writing any code.

Summary of what will change:
- [bullet list of changes]

Invariants confirmed intact: [list]
Failure scenarios accounted for: [list]
Rollback strategy: [described above]

Known gaps / residual risks:
- [anything you could not fully mitigate]

Type "confirmed" to proceed.
```

Do not proceed on implied approval, "sounds good", or task restatement. Require the word **"confirmed"** or an explicit instruction to proceed.

---

## Hard Constraints

| Constraint | Rule |
|-----------|------|
| ❌ No schema changes without rollback script | Every ALTER, DROP, CREATE must have a matching _rollback.sql |
| ❌ No behaviour changes without explicit approval | "The existing logic is wrong" is not a reason to change it without asking |
| ❌ No changes to audit_logs structure | This table is append-only by design — no new columns, no schema changes |
| ❌ No changes to bid hashing logic | SHA-256 of bid payload is the integrity guarantee — do not touch without full review |
| ❌ No changes to envelope sealing | bid_envelopes.is_open = FALSE is the commercial secrecy guarantee |
| ❌ No changes to ROLE_SEQUENCE order | The forwarding workflow depends on array index — changing order changes all transitions |
| ✅ List all invariants before changing | If you can't list the invariants, you don't understand the system well enough to change it |
| ✅ Require rollback strategy | Even for "small" changes to high-risk domains |

---

## Escalation: When to Stop Entirely

Stop and report (do not attempt the task) if:

- The change requires modifying the `audit_logs` table structure
- The change would disable or bypass the `authorize()` middleware
- The change touches `bid_envelopes` unlock logic without a separate technical review
- The rollback strategy would result in data loss in production
- You cannot identify all callers of the function being changed

```
🛑 STOPPED — Cannot safely proceed

Reason: [specific reason]
Risk: [what could go wrong]
Need: [what information or approval is needed before proceeding]
```

---

## Output Format (High Risk)

```
## High Risk Change Assessment

**Skill active:** high_risk_change_guard
**Domain:** [which high-risk domain — e.g., "Procurement workflow forwarding"]

### Code paths read:
- [file] — [what was confirmed]

### Invariants:
1. [must remain true]
2. [must remain true]
...

### Failure scenarios:
A. [scenario] → [outcome] → [mitigation / known gap]
B. [scenario] → [outcome] → [mitigation / known gap]
...

### Rollback strategy:
[exact rollback steps]

### Residual risks:
- [anything not fully addressed]

⛔ Awaiting explicit confirmation ("confirmed") before writing any code.
```
