# RFQ Buddy Project-Specific Rules

> **These rules supplement the generic [rules.md](rules.md), [openspec/AGENTS.md](openspec/AGENTS.md), and [skills/](skills/) with RFQ Buddy-specific requirements.**

---

## OpenSpec Integration

**MANDATORY**: All feature development must follow the OpenSpec spec-driven workflow.

### Feature Request Process
1. **Initiation**: Start with `/openspec:proposal` followed by feature description
2. **Specification**: Create comprehensive proposal in `openspec/proposals/`
3. **Review**: Get approval from stakeholders
4. **Implementation**: Follow approved specification exactly
5. **Documentation**: Update proposal with implementation status

### RFQ Buddy Specific Requirements
- **Database Changes**: Must include migration scripts in proposals
- **API Changes**: Must include endpoint specifications and testing strategy
- **Frontend Changes**: Must include component design and user flow
- **Security**: Must include security considerations for high-risk domains

### Proposal Templates
- Use `openspec/proposals/template.md` for new proposals
- Check existing proposals in `openspec/proposals/` before creating new ones
- Follow RFQ Buddy tech stack requirements in all proposals

---

## Tech Stack (Production Choices)

| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| Frontend | SvelteKit | 2.x | Modern, fast, excellent DX |
| Language | TypeScript | 5.x | Type safety, required |
| Styling | Tailwind CSS | 3.x | Utility-first, consistent |
| Backend | Node.js + Express | 20.x LTS | Stable, mature |
| Database | PostgreSQL | 16+ | ACID compliance, robust |
| Cache | Redis | 7.x | Industry standard |
| Validation | Zod | 3.x | Type-safe validation |
| Logging | Winston | 3.x | Mature, extensive transports |
| Testing | Jest | 29.x | Battle-tested, great mocking |

**Engineering Decisions:**
- Winston over Pino: better ecosystem, transports, TypeScript support
- Jest over Vitest: more stable for Node.js backends, better mocking
- Cloud-ready: Neon PostgreSQL + Upstash Redis support built-in

---

## Critical Project Facts

### Database Naming Convention

**ALWAYS use American spelling:**

```typescript
✅ organizations, organization_id
✅ organizations.created_at

❌ organisations, organisation_id  // WRONG - will cause SQL errors
```

This is **not negotiable**. The database schema uses American spelling throughout.

### Existing Tables (ALTER only — never recreate)

| Table / Columns | Created In | Notes |
|----------------|------------|-------|
| `tender_type_definitions` | Migration 001 | Core tender types |
| `live_bidding_sessions` | Migration 010 | Live auction data |
| `limited_tender_vendors` | Migration 010 | Vendor restrictions |
| `live_bid_updates` | Migration 010 | Real-time bid events |
| `tenders.is_live_tendering`, `tenders.live_session_id` | Migration 010 | Live tender flags |
| `tenders.tender_mode`, `tenders.is_govt_tender`, `tenders.api_version` | Migration 011 | Tender metadata |
| `tenders.current_workflow_role` | Migration 014 | Workflow state |
| `tender_role_assignments`, `tender_workflow_log` | Migration 014 | Workflow tracking |
| `subscription_packages`, `organization_subscriptions`, `organization_storage_usage`, `tender_quota_usage`, `file_uploads` | Migration 013 | Subscription system |

**Next migration number:** 015  
**Requirement:** Every migration MUST include a matching `_rollback.sql`

### Protected Services (extend only)

**`backend/src/services/tenderTypeSelector.service.ts`**
- ✅ Add new exported functions
- ❌ Do NOT rewrite or restructure
- ❌ Do NOT change existing function signatures

### Protected Routes (extend only)

Frontend routes that must remain compatible:
- `/tenders/new/simple-rfq/+page.svelte`
- `/tenders/new/+page.svelte`
- `/tenders/[id]/+page.svelte`
- `/tenders/[id]/live-dashboard/+page.svelte`

---

## File Naming Conventions

### Backend (Express + TypeScript)

```
backend/src/
├── controllers/       → camelCase.controller.ts
├── services/          → camelCase.service.ts
├── routes/            → camelCase.routes.ts
├── middleware/        → camelCase.middleware.ts
├── schemas/           → camelCase.schema.ts
├── config/            → camelCase.ts
└── utils/             → camelCase.ts
```

### Frontend (SvelteKit)

```
frontend/src/
├── routes/            → +page.svelte, +page.ts, +server.ts
├── lib/
│   ├── components/    → PascalCase.svelte
│   ├── stores/        → camelCase.ts
│   ├── utils/         → camelCase.ts
│   ├── schemas/       → camelCase.schema.ts
│   └── types/         → camelCase.types.ts
```

---

## File Organization & Output Rules

**AI agents creating documentation/reports must follow these directory conventions:**

### Where to Put Generated Files

| File Type | Location | Examples |
|-----------|----------|----------|
| Phase completion reports | `/plans/phases/` | PHASE_*_COMPLETION_REPORT.md |
| Testing reports | `/plans/testing/` | TEST_*.md, TESTING_*.md |
| Analysis/investigation | `/plans/reports/` | *_ANALYSIS.md, *_FIX_REPORT.md |
| Planning documents | `/plans/` | PRDs, coding plans, roadmaps |
| Test code/fixtures | `/tests/` | Actual executable test files |
| Database documentation | `/database/` | Schema guides, migration docs |

### Rules for AI Agents

**✅ DO:**
- Create phase/completion reports in `/plans/phases/`
- Create testing summaries in `/plans/testing/`
- Create analysis documents in `/plans/reports/`
- Put test code (`.test.ts`, fixtures) in `/tests/`
- Update existing documentation when appropriate

**❌ DO NOT:**
- Create `.md` files in root directory (except README.md if needed)
- Put documentation in `/tests/` (only executable test code belongs there)
- Create duplicate reports across multiple locations
- Mix documentation with production code

### Rationale

**Root directory** should contain only:
- Essential config files (package.json, tsconfig.json, etc.)
- Core rules (rules.md, rfq-buddy-rules.md, RULES_AND_SKILLS.md)
- Critical README files

**All other documentation** goes in organized subdirectories to keep the project navigable.

---

## Architecture (Canonical Flow)

**Backend Layering (strict top-down only):**

```
Routes → Middleware → Controllers → Services → Database
```

**Illegal shortcuts:**
- ❌ Controller querying database directly (bypass service)
- ❌ Service importing controller (wrong direction)
- ❌ Route handler containing business logic
- ❌ Middleware calling services in circular chains
- ❌ Two services importing each other

**Frontend Layering:**

```
+page.svelte → $lib/stores → $lib/utils/api.ts → Backend
```

**Illegal shortcuts:**
- ❌ Component calling pool.query
- ❌ Component importing backend service files
- ❌ Circular store dependencies

---

## High-Risk Domains (Require `high_risk_change_guard` skill)

These domains trigger mandatory extra scrutiny:

| Domain | Why High-Risk |
|--------|---------------|
| Authentication & JWT | User security, session integrity |
| Tender bidding logic | Financial accuracy, fairness |
| Bid opening/envelope unsealing | Commercial secrecy compliance |
| Subscription quotas | Revenue protection, abuse prevention |
| Procurement workflow forwarding | Audit trail, compliance |
| Database migrations | Data integrity, rollback complexity |
| Audit logs | Legal compliance, immutability |

---

## Security Requirements

### Authentication
- ✅ bcrypt password hashing (cost factor 12+)
- ✅ JWT: 15min access token, 7d refresh token
- ✅ httpOnly cookies for web sessions
- ✅ Role-based access control (RBAC)

### Input Validation
- ✅ All inputs validated with Zod schemas
- ✅ Parameterized queries only (never string concatenation)
- ✅ File upload validation (type, size, content)

### Headers
- ✅ Helmet security headers
- ✅ CORS with specific origins (no wildcards in production)
- ✅ CSP headers
- ✅ HSTS for HTTPS

### Rate Limiting
- ✅ All public endpoints rate limited
- ✅ Stricter limits on auth endpoints
- ✅ Redis-based distributed limiting
- ✅ 429 responses with Retry-After header

---

## Code Quality Standards

### TypeScript
- ✅ Strict mode enabled
- ✅ No `any` types (use `unknown` if necessary)
- ✅ No `@ts-ignore` (fix the issue)
- ✅ Type exports from schemas via `z.infer`

### Linting & Formatting
- ✅ ESLint configured with TypeScript support
- ✅ Prettier for consistent formatting
- ✅ `npm run lint` must pass with 0 errors (warnings acceptable)
- ✅ `npm run build` must compile successfully

### Naming
- ✅ `camelCase` for variables, functions, methods
- ✅ `PascalCase` for classes, interfaces, types, components
- ✅ `SCREAMING_SNAKE_CASE` for constants
- ✅ Booleans start with `is`, `has`, `should`, `can`

---

## Testing Requirements

### Backend (Jest)
```typescript
// backend/__tests__/unit/service.test.ts
describe('serviceName.methodName', () => {
  it('should return data when found', async () => {
    // Arrange, Act, Assert
  });
});
```

### Frontend (Playwright)
```typescript
// frontend/tests/e2e/tender.spec.ts
test('should create simple RFQ', async ({ page }) => {
  // Test flow
});
```

---

## Phase 7 — Testing (Current Phase)

**The project is currently in Phase 7: Comprehensive Testing & Stabilization.**
All AI agents working on this project MUST follow the instructions in this section before making any test-related changes.

### Test Plan Files

The full testing plan is split across numbered files. Read the relevant file BEFORE working on any test area:

| Files | Coverage |
|-------|----------|
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_01.md` | Test strategy overview, testing pyramid, scope |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_02.md` | Test infrastructure & configuration (Jest, Vitest, Playwright) |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_03.md` | Test data management, seed scripts, cleanup strategy |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_04.md` | Backend unit tests — all 28 services, controllers, middleware |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_05.md` | Backend integration tests — all API endpoint test cases |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_06.md` | Frontend unit tests — stores, components, utilities |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_07.md` | Frontend E2E tests — full user flow scenarios |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_08.md` | Manual QA test cases |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_09.md` | Performance tests |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_10.md` — `_37.md` | Security, accessibility, and advanced testing domains |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_APPENDIX_A.md` | Backend integration test execution logs and details |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_APPENDIX_B.md` | Frontend test execution analysis and component status |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_APPENDIX_C.md` | CI/CD readiness assessment and Jest diagnostics |
| `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_APPENDIX_D.md` | Database schema completeness and migration requirements |

### How AI Agents Must Work During Phase 7

**Step 1 — Identify the test area**
Determine which part of the system the task relates to (backend unit, backend integration, frontend unit, E2E, etc.).

**Step 2 — Read the relevant plan file first**
Open and read the corresponding `PHASE_7_MASTER_TESTING_PLAN_REVISED_XX.md` file before writing or fixing any test code. Do not guess at test structure or expected behaviour — the plan files define it.

**Step 3 — Check the status section at the bottom of that file**
Each plan file has a `CONTINUATION SESSION UPDATE` section appended at the end. Read it to understand:
- What is currently passing or failing
- What blockers exist
- What action is required (if any)

**Step 4 — Select the correct skill(s)**

| Testing Task | Required Skills |
|-------------|----------------|
| Fixing a failing test | `root_cause_debugging` + `surgical_execution` |
| Writing new test cases | `plan_before_code` + `architecture_respect` |
| Fixing a test that touches auth, migrations, billing, or bids | + `high_risk_change_guard` (mandatory) |
| Debugging Jest crashes or environment issues | `root_cause_debugging` |
| Creating or modifying seed data | `high_risk_change_guard` + `surgical_execution` |

**Step 5 — Fix at the root cause, not the test**
- ❌ Do NOT modify a test to make it pass if the code is wrong
- ✅ Fix the source code, then verify the test passes naturally
- ❌ Do NOT skip or comment out failing tests
- ✅ Document any test that cannot be fixed yet with a clear reason

**Step 6 — Verify after every change**
```bash
cd backend
npm run build    # Must pass (0 errors)
npm run lint     # Must pass (0 errors)
npm test         # Run affected suite only, then full suite

cd frontend
npm run build    # Must pass
npm run check    # Must pass
```

**Step 7 — Update the plan file**
After completing work on a test area, append a brief status update to the bottom of the relevant plan file. Do NOT create a separate report file.

### Test Execution Commands

```bash
# Run a single backend integration suite
npm test -- vendor.api.test.ts --maxWorkers=1

# Run all backend integration tests
npm test -- --testPathPattern=integration --maxWorkers=2

# Run backend unit tests (use if Jest crashes occur)
NODE_OPTIONS=--max-old-space-size=4096 npm test -- --maxWorkers=1 --testTimeout=30000

# Run frontend unit tests
cd frontend && npm test

# Run frontend unit tests with coverage
cd frontend && npm test -- --coverage
```

### What Agents Must NOT Do During Testing

- ❌ Do NOT create new standalone report `.md` files to summarise test results — update the relevant plan file instead
- ❌ Do NOT rewrite test files from scratch — follow the test cases already defined in the plan files
- ❌ Do NOT change test configuration (jest.config.js, vitest.config.ts) without `plan_before_code` approval
- ❌ Do NOT modify the database schema during testing without creating a numbered migration with rollback (next: **015**)
- ❌ Do NOT touch `tenderTypeSelector.service.ts` — it is a protected file

---

## Import Order

```typescript
// 1. Node built-ins
import path from 'path';

// 2. External packages (alphabetical)
import express from 'express';
import { z } from 'zod';

// 3. Framework imports
import { json } from '@sveltejs/kit';

// 4. Internal absolute imports (alphabetical)
import { config } from '$lib/config';

// 5. Internal relative imports
import { Component } from './Component.svelte';

// 6. Types (always last)
import type { TypeName } from '$lib/types';
```

---

## Deployment Targets

### Supported Platforms
- Vercel (primary)
- Netlify (alternative)
- Cloudflare Pages (alternative)
- Node.js server (self-hosted)

### Database Providers
- Neon (serverless PostgreSQL) — primary
- Supabase (alternative)
- Standard PostgreSQL (self-hosted)

### Redis Providers
- Upstash (serverless Redis) — primary
- Redis Labs (alternative)
- Standard Redis (self-hosted)

---

## Forbidden Practices

Never:
- ❌ Use `var` (use `const`/`let`)
- ❌ Use `any` type
- ❌ Use `console.log` in production (use Winston logger)
- ❌ Ignore linting errors
- ❌ Hardcode credentials
- ❌ Use `eval()` or unsafe functions
- ❌ Trust user input without validation
- ❌ Expose stack traces in production
- ❌ Use British spelling for database tables

---

## Verification Checklist

After any code change:

```bash
cd backend
npm run build    # ✅ Must pass (0 errors)
npm run lint     # ✅ Must pass (0 errors, warnings OK)
npm test         # ✅ All tests passing
```

```bash
cd frontend
npm run build    # ✅ Must pass
npm run check    # ✅ SvelteKit checks passing
```

---

## Project Structure Reference

See [.rules/PROJECT_STRUCTURE.md](.rules/PROJECT_STRUCTURE.md) for complete directory layout.

---

## Phase Development & Planning

**Current Status:** Phase 1-2 complete, Phase 6 complete, Phase 7 testing in progress

**Documentation Locations:**
- Phase completion reports → `/plans/phases/`
- Testing reports → `/plans/testing/`
- Planning documents → `/plans/`
- Project structure → `.rules/PROJECT_STRUCTURE.md`
- Quick reference → `.rules/QUICK_REFERENCE.md`

**Phase Tracking:**
- Phase 1: ✅ Complete ([report](plans/phases/PHASE_1_COMPLETION_REPORT.md))
- Phase 2: ✅ Complete ([report](plans/phases/PHASE_2_COMPLETION_REPORT.md))
- Phase 6: ✅ Complete ([report](plans/phases/PHASE_6_COMPREHENSIVE_TESTING_REPORT.md))
- Phase 7: ⏳ In Progress — Testing & Stabilisation (see `plans/phases/PHASE_7_MASTER_TESTING_PLAN_REVISED_01.md`)

---

## For Multi-Agent Coordination

When multiple AI agents work on this project:

1. **All agents** must read both `rules.md` (generic) AND this file (project-specific)
2. **Planner agents** select skills from `/skills/` and apply project constraints from this file
3. **Executor agents** follow approved plans using project tech stack and patterns
4. **Reviewer agents** verify against both generic skills and project-specific rules

---

**Last Updated:** 2026-02-22  
**Status:** Phases 1-2-6 complete, Phase 7 testing in progress  
**Documentation:** Organized in `/plans/` subdirectories (phases, testing, reports)
