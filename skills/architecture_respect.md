# Skill: `architecture_respect`

> The structure is the contract. Don't break it silently.

---

## Purpose

Protect the integrity of the established architecture. Every shortcut taken today becomes a landmine for tomorrow. This skill enforces layering, prevents cross-layer coupling, and ensures new code fits the existing system rather than fighting it.

---

## When This Skill Is Active

Trigger this skill when:

- Adding or modifying any backend service, controller, or route
- Adding or modifying any shared utility, middleware, or config
- Working with database schema, migrations, or models
- Adding a new module or file that others will import
- Touching anything imported by more than two files

This skill applies **in parallel** with other active skills. It is never the sole active skill — it is always a co-constraint.

---

## The Architecture of This Codebase

### Backend Layering (strict top-down only)

```
Routes         (tender.routes.ts)           ← entry point, wires middleware + controller
    ↓
Middleware     (auth, quota, rateLimit)     ← cross-cutting concerns only
    ↓
Controllers    (tender.controller.ts)       ← HTTP in/out, no business logic
    ↓
Services       (subscription.service.ts)    ← all business logic lives here
    ↓
Database       (pool.query / pool.connect)  ← raw SQL only, no business logic in queries
```

**Illegal shortcuts:**
- ❌ Controller querying the database directly (bypass service)
- ❌ Service importing another controller
- ❌ Route handler containing business logic
- ❌ Middleware calling a service that calls another service in a chain that loops back
- ❌ Two services importing each other (circular dependency)

### Frontend Layering (SvelteKit)

```
+page.svelte           ← UI rendering, user interaction
    ↓
$lib/stores/           ← shared reactive state
    ↓
$lib/utils/api.ts      ← HTTP calls to backend (single abstraction)
    ↓
Backend API            ← never call DB or external services directly from frontend
```

**Illegal shortcuts:**
- ❌ Svelte component calling pool.query (obviously wrong but worth stating)
- ❌ Component importing directly from backend service files
- ❌ Two stores with circular reactive dependencies

### Database Conventions

```
Table names:    snake_case, plural, American spelling (organizations not organisations)
Column names:   snake_case
Primary keys:   UUID, always uuid_generate_v4()
Timestamps:     TIMESTAMPTZ, always DEFAULT now()
Soft deletes:   deleted_at TIMESTAMPTZ (not a status enum change)
Foreign keys:   always named [referenced_table_singular]_id
Migrations:     sequential numbers (001–014 exist; next is 015)
                always include a matching _rollback.sql
```

---

## Step-by-Step Behaviour

### Step 1 — Identify the Layer

Before writing code, state which layer the new code belongs to:

```
New code: subscriptionService.checkTenderQuota()
Layer: Service (business logic)
Correct location: backend/src/services/subscription.service.ts ✅
```

If the code spans layers (e.g., a controller that also does DB queries), flag it before writing:

```
⚠ Architecture violation detected: the proposed implementation puts a raw pool.query
inside tender.controller.ts. This must move to a service method.
```

### Step 2 — Check Import Direction

Before adding any import, verify it flows in the correct direction (top → down only):

```
subscription.service.ts imports:
✅ pool from '../config/database'       — service → DB (correct)
✅ redisClient from '../config/redis'   — service → infrastructure (correct)
✅ auditService from './audit.service'  — service → service (allowed, not circular)
❌ tenderController from '../controllers/tender.controller' — service → controller (VIOLATION)
```

If a circular dependency would result, stop and redesign before proceeding. Common fix: extract the shared logic into a third, lower-level service that both can import.

### Step 3 — Reuse Before Creating

Before creating any new utility, helper, or abstraction, search the codebase:

```bash
# Search for existing error classes
grep -rn "class.*Error extends" backend/src/

# Search for existing Redis usage pattern
grep -rn "redisClient" backend/src/

# Search for existing audit logging calls
grep -rn "auditService.log" backend/src/
```

If the thing you need already exists, use it. If it almost fits, extend it using `surgical_execution`. Only create new abstractions if nothing close exists.

### Step 4 — Flag Violations Instead of Fixing Silently

If you encounter an existing violation while doing your task, **do not fix it silently**. Report it:

```
⚠ Architecture note (not fixing now):
Found that bid.controller.ts directly calls pool.query on line 88, bypassing the service layer.
This is a pre-existing violation, not introduced by this task.
Logged as a follow-up item. Not touching it in this task.
```

Fixing it silently would:
1. Expand the scope of the current task
2. Risk breaking something that currently works
3. Make the diff harder to review

### Step 5 — Validate Naming Conventions

Before finalising any new file or function name, check against `AGENT_RULES.md` conventions:

```
New file: backend/src/services/subscription.service.ts ✅ (camelCase.service.ts)
New file: backend/src/middleware/quota.middleware.ts ✅ (camelCase.middleware.ts)
New schema: backend/src/schemas/tender-segments/s9-live-tendering.schema.ts ✅
New component: frontend/src/lib/components/StorageMeter.svelte ✅ (PascalCase.svelte)
```

---

## Hard Constraints

| Constraint | Rule |
|-----------|------|
| ❌ No new architectural patterns | Don't introduce a repository layer, event bus, or factory pattern without explicit approval. |
| ❌ No bypassing validation/security layers | Don't add a `skipAuth: true` flag or call a service method that skips Zod validation. |
| ❌ No cross-layer imports | Controllers don't import services from other controllers. Services don't import controllers. |
| ❌ No direct DB access from controllers | All SQL stays in services or dedicated query helpers. |
| ✅ Flag violations, don't fix silently | Document what you found, state it's pre-existing, move on. |
| ✅ Reuse existing patterns | Use `pool.query` with `$1` parameters. Use `auditService.log`. Use existing error classes. |

---

## This Codebase's Specific Patterns (Always Reuse)

### Database queries
```typescript
// ✅ Correct pattern (from existing services)
const { rows } = await pool.query(
  'SELECT * FROM organizations WHERE id = $1',
  [orgId]
);

// ❌ Wrong — string interpolation, SQL injection risk
const { rows } = await pool.query(`SELECT * FROM organizations WHERE id = '${orgId}'`);
```

### Redis usage
```typescript
// ✅ Correct pattern (from tenderTypeSelector.service.ts)
const cached = await redisClient.get(cacheKey);
if (cached) return JSON.parse(cached);
await redisClient.setex(cacheKey, TTL_SECONDS, JSON.stringify(data));
```

### Audit logging
```typescript
// ✅ Correct pattern (from existing controllers/services)
await auditService.log(actorId, 'ACTION_NAME', 'entity_type', entityId, { metadata });
```

### Error throwing
```typescript
// ✅ Correct pattern (from existing middleware/error.middleware.ts)
throw new NotFoundError('Resource not found');
throw new ValidationError('Invalid input', details);
// Or for quota/business errors:
throw { status: 402, code: 'QUOTA_EXCEEDED', message: '...' };
```

---

## Output Format (Architecture Check)

Include this section at the start of any execution that involves new files:

```
## Architecture Check

**Layer:** [which layer this code belongs to]
**Import direction:** [verified correct / violation found — see note]
**Reuse check:** [existing utilities used / new abstractions justified because X]
**Naming:** [all new names verified against AGENT_RULES.md conventions]
**Violations found (pre-existing, not fixing):** [list or "none"]
```
