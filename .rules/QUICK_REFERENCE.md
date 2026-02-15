# .rules FOLDER - QUICK REFERENCE

**Last Updated:** 2025-02-01  
**Status:** Phase 1 Complete ✅

---

## 🎯 WHAT'S IN THIS FOLDER

| File | Purpose | When to Read |
|------|---------|--------------|
| **AGENT_RULES.md** | Core engineering philosophy & code standards | Every session start |
| **README.md** | Folder overview & workflows | First time setup |
| **PROJECT_STRUCTURE.md** | Complete file/folder structure | When creating files |
| **TASK_PLAN_PHASE1.md** | Phase 1 tasks (✅ COMPLETE) | Reference for patterns |
| **TASK_PLAN_PHASE2.md** | Phase 2 tasks (next) | Starting Phase 2 |
| **PLAN_UPDATES.md** | Detailed changelog | Understanding changes |
| **UPDATES_SUMMARY.md** | Summary of all updates | Quick overview |
| **QUICK_REFERENCE.md** | This file | Quick lookup |

---

## ⚡ QUICK START FOR AGENTS

### Before Starting Any Task:
1. ✅ Read `AGENT_RULES.md` - understand engineering philosophy
2. ✅ Check current phase task plan
3. ✅ Review Phase 1 patterns for reference

### Core Philosophy:
**BETTER ENGINEERING** over strict copying
- Choose superior technologies
- Apply industry best practices  
- Write production-ready code
- Document engineering decisions

### Tech Stack (Production Choices):
- **Backend:** Node.js 20 + Express + TypeScript
- **Database:** PostgreSQL 16+ (Neon-ready)
- **Cache:** Redis 7+ (Upstash-ready)
- **Logging:** Winston 3.x
- **Testing:** Jest 29.x
- **Validation:** Zod 3.x

---

## 📋 PHASE 1 STATUS

**Status:** ✅ COMPLETE  
**Build:** ✅ PASSING (0 errors)  
**Lint:** ✅ PASSING (0 errors, 70 acceptable warnings)  
**Production Ready:** ✅ YES

### Completed:
- [x] All 20 core tasks
- [x] ESLint + Prettier configuration
- [x] Winston logging
- [x] Jest testing framework
- [x] Cloud-ready configs (Neon, Upstash)
- [x] Phase 2-6 services/controllers/routes scaffolded
- [x] Comprehensive error handling
- [x] Security middleware (Helmet, CORS, rate limiting)

### Engineering Decisions:
- Winston over Pino (better transports)
- Jest over Vitest (more stable for backend)
- Cloud-ready from day one
- Split app.ts/server.ts (better testability)
- Comprehensive error class hierarchy
- All phases scaffolded (consistency)

---

## 🔧 CODE QUALITY CHECKLIST

After completing any task, verify:

```bash
# Must pass:
npm run build   # ✅ 0 errors
npm run lint    # ✅ 0 errors (warnings OK)

# Should check:
- [ ] TypeScript strict mode types
- [ ] Error handling comprehensive
- [ ] Security best practices applied
- [ ] Logging added appropriately
- [ ] Input validation with Zod
- [ ] No hardcoded secrets
- [ ] Code formatted (Prettier)
```

---

## 📐 FILE NAMING CONVENTIONS

```
Backend:
src/services/       → camelCase.service.ts
src/controllers/    → camelCase.controller.ts
src/routes/         → camelCase.routes.ts
src/schemas/        → camelCase.schema.ts
src/middleware/     → camelCase.middleware.ts
src/config/         → camelCase.ts

Frontend (SvelteKit):
src/routes/         → +page.svelte, +page.ts, +server.ts
src/lib/components/ → PascalCase.svelte
src/lib/stores/     → camelCase.ts
src/lib/utils/      → camelCase.ts
src/lib/types/      → camelCase.types.ts
```

---

## 🛡️ SECURITY CHECKLIST

Always apply:
- [x] Validate ALL inputs with Zod
- [x] Use parameterized queries (never concat)
- [x] Hash passwords with bcrypt (cost 12+)
- [x] Implement JWT properly (15min access, 7d refresh)
- [x] Apply Helmet security headers
- [x] Configure CORS (no wildcards in prod)
- [x] Add rate limiting
- [x] Never log sensitive data

---

## 🧪 TESTING PATTERN

```typescript
// Unit Test (Jest)
describe('serviceName.methodName', () => {
  it('should return data when found', async () => {
    // Arrange, Act, Assert
  });
});

// Integration Test (Supertest)
describe('GET /api/resource', () => {
  it('should return 200 with valid token', async () => {
    // Test endpoint
  });
});
```

---

## ❌ FORBIDDEN PRACTICES

Never:
- ❌ Use `var` (use `const`/`let`)
- ❌ Use `any` type (use `unknown` or proper types)
- ❌ Ignore linting errors
- ❌ Use `console.log` in production (use logger)
- ❌ Hardcode credentials
- ❌ Ignore TypeScript errors with `@ts-ignore`
- ❌ Trust user input without validation

---

## 📊 TASK COMPLETION FORMAT

```
✅ TASK COMPLETE

Engineering Decisions:
- Used Winston instead of Pino for better transport support
- Added comprehensive error handling beyond spec

Files created/modified:
- backend/src/config/logger.ts
- backend/src/middleware/error.middleware.ts

Verification:
✅ Build: PASSING
✅ Lint: PASSING  
✅ Types: 100% typed
✅ Security: Applied

Ready for next task.
```

---

## 🎓 REFERENCE PATTERNS

### Service Pattern:
```typescript
export const serviceName = {
  async methodName(input: InputType): Promise<OutputType> {
    // Implementation
  }
};
```

### Controller Pattern:
```typescript
export const controllerName = {
  async actionName(req, res, next): Promise<void> {
    try {
      // Logic
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
};
```

### Route Pattern:
```typescript
router.post(
  '/endpoint',
  authenticate,
  authorize('buyer'),
  validate(schema),
  controller.method
);
```

---

## 🚀 NEXT: PHASE 2

Ready to implement:
- User management endpoints
- Company/organization management
- Profile management
- User roles and permissions

All services/controllers/routes already scaffolded!

---

**For detailed information, see full documents in this folder.**
