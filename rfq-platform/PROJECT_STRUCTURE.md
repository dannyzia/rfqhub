# 📂 Project Structure

Complete file tree for the RFQ Tendering Platform.

## 🌳 Full Project Tree

```
RFQ_Buddy/
├── .rules/
│   ├── TASK_PLAN_PHASE1.md          # Phase 1: Project Setup & Foundation
│   ├── TASK_PLAN_PHASE2.md          # Phase 2: User Management & Company Profiles
│   ├── TASK_PLAN_PHASE3.md          # Phase 3: RFQ Management (Buyer Side)
│   ├── TASK_PLAN_PHASE4.md          # Phase 4: Quotation Management (Supplier Side)
│   ├── TASK_PLAN_PHASE5.md          # Phase 5: Comparison & Analytics
│   ├── TASK_PLAN_PHASE6.md          # Phase 6: Export, Tax & Polish
│   └── TASK_PLAN_PHASE7.md          # Phase 7: Frontend & Testing
│
├── Instructions/
│   ├── PRD - RFQ Buddy Tendering Platform.md
│   ├── Developer Coding Plan - RFQ Tendering Platform.md
│   └── rfq_tendering_platform_schema_v3.sql
│
└── rfq-platform/
    │
    ├── backend/                      # ✅ Backend API (Node.js + TypeScript)
    │   ├── src/
    │   │   ├── config/              # Configuration files
    │   │   │   ├── database.ts      # ✅ PostgreSQL connection pool
    │   │   │   ├── redis.ts         # ✅ Redis client setup
    │   │   │   ├── logger.ts        # ✅ Winston logger configuration
    │   │   │   └── index.ts         # ✅ Centralized config exports
    │   │   │
    │   │   ├── controllers/         # Request handlers (Phase 2+)
    │   │   │   └── (empty - ready for Phase 2)
    │   │   │
    │   │   ├── middleware/          # Express middleware
    │   │   │   ├── auth.middleware.ts       # ✅ JWT authentication & RBAC
    │   │   │   ├── error.middleware.ts      # ✅ Error handling & custom errors
    │   │   │   ├── logger.middleware.ts     # ✅ Request/response logging
    │   │   │   └── validate.middleware.ts   # ✅ Zod schema validation
    │   │   │
    │   │   ├── routes/              # API route definitions (Phase 2+)
    │   │   │   └── (empty - ready for Phase 2)
    │   │   │
    │   │   ├── schemas/             # Validation schemas
    │   │   │   └── auth.schema.ts   # ✅ Authentication Zod schemas
    │   │   │
    │   │   ├── services/            # Business logic layer (Phase 2+)
    │   │   │   └── (empty - ready for Phase 2)
    │   │   │
    │   │   ├── utils/               # Helper functions (Phase 2+)
    │   │   │   └── (empty - ready for Phase 2)
    │   │   │
    │   │   ├── app.ts               # ✅ Express application setup
    │   │   └── server.ts            # ✅ Server entry point
    │   │
    │   ├── tests/                   # Test files
    │   │   ├── setup.ts             # ✅ Jest test configuration
    │   │   └── health.test.ts       # ✅ Example test suite
    │   │
    │   ├── .gitignore               # ✅ Git ignore rules
    │   ├── env.example              # ✅ Environment variables template
    │   ├── jest.config.js           # ✅ Jest configuration
    │   ├── package.json             # ✅ Dependencies & scripts
    │   └── tsconfig.json            # ✅ TypeScript configuration
    │
    ├── frontend/                    # Frontend app (Phase 7)
    │   └── (empty - will be SvelteKit in Phase 7)
    │
    ├── database/                    # Database scripts
    │   └── (schema available in ../Instructions/)
    │
    ├── README.md                    # ✅ Main documentation (565 lines)
    ├── QUICKSTART.md                # ✅ Quick setup guide (339 lines)
    ├── SETUP_CHECKLIST.md           # ✅ Setup progress tracker (239 lines)
    ├── PHASE1_STATUS.md             # ✅ Phase 1 status report (359 lines)
    ├── DEVELOPER_HANDOFF.md         # ✅ Developer onboarding (509 lines)
    ├── IMPORTANT_NOTES.md           # ✅ TypeScript error notes (207 lines)
    ├── DELIVERY_SUMMARY.md          # ✅ Delivery summary (542 lines)
    └── PROJECT_STRUCTURE.md         # ✅ This file
```

---

## 📊 File Status Legend

- ✅ **Complete** - File created and ready to use
- 🔜 **Ready** - Directory exists, ready for Phase 2+ files
- ⏳ **Pending** - Will be created in future phases

---

## 🗂️ Directory Purposes

### `/backend/src/config/`
**Purpose:** Application configuration and external service connections

- `database.ts` - PostgreSQL connection pool with error handling
- `redis.ts` - Redis client with reconnection logic
- `logger.ts` - Winston logger for structured logging
- `index.ts` - Centralized config object with environment variables

### `/backend/src/controllers/`
**Purpose:** HTTP request handlers (Phase 2+)

**Will contain:**
- `auth.controller.ts` - Authentication endpoints
- `user.controller.ts` - User management
- `company.controller.ts` - Company profiles
- `rfq.controller.ts` - RFQ operations
- `quotation.controller.ts` - Quotation handling

### `/backend/src/middleware/`
**Purpose:** Express middleware functions

- `auth.middleware.ts` - JWT verification, role checks, authorization
- `error.middleware.ts` - Global error handler with custom error classes
- `logger.middleware.ts` - Request/response logging
- `validate.middleware.ts` - Request validation using Zod schemas

### `/backend/src/routes/`
**Purpose:** API route definitions (Phase 2+)

**Will contain:**
- `auth.routes.ts` - Auth endpoints (/api/auth/*)
- `user.routes.ts` - User endpoints (/api/users/*)
- `company.routes.ts` - Company endpoints (/api/companies/*)
- `rfq.routes.ts` - RFQ endpoints (/api/rfqs/*)
- `quotation.routes.ts` - Quotation endpoints (/api/quotations/*)

### `/backend/src/schemas/`
**Purpose:** Zod validation schemas for request validation

- `auth.schema.ts` - Authentication validation (register, login, passwords, etc.)
- **Phase 2+:** user.schema.ts, company.schema.ts, rfq.schema.ts, etc.

### `/backend/src/services/`
**Purpose:** Business logic layer (Phase 2+)

**Will contain:**
- `auth.service.ts` - Authentication logic
- `user.service.ts` - User operations
- `company.service.ts` - Company operations
- `rfq.service.ts` - RFQ business logic
- `quotation.service.ts` - Quotation logic
- `email.service.ts` - Email sending
- `storage.service.ts` - File storage (S3/MinIO)

### `/backend/src/utils/`
**Purpose:** Reusable helper functions (Phase 2+)

**Will contain:**
- `jwt.util.ts` - JWT token helpers
- `email.util.ts` - Email templates
- `validation.util.ts` - Custom validators
- `file.util.ts` - File upload/download helpers
- `date.util.ts` - Date formatting utilities

### `/backend/tests/`
**Purpose:** Test files

- `setup.ts` - Jest configuration and global test utilities
- `health.test.ts` - Example test suite for health endpoints
- **Phase 2+:** auth.test.ts, user.test.ts, rfq.test.ts, etc.

### `/frontend/`
**Purpose:** SvelteKit frontend application (Phase 7)

**Will contain (Phase 7):**
```
frontend/
├── src/
│   ├── routes/              # SvelteKit pages
│   │   ├── +layout.svelte
│   │   ├── +page.svelte     # Home page
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── rfqs/
│   │   └── quotations/
│   ├── lib/
│   │   ├── components/      # Reusable components
│   │   ├── stores/          # Svelte stores
│   │   └── utils/           # Frontend utilities
│   └── app.html
├── static/                  # Static assets
├── svelte.config.js
├── tailwind.config.js
└── package.json
```

### `/database/`
**Purpose:** Database scripts and migrations

**Currently:**
- Schema available in `../Instructions/rfq_tendering_platform_schema_v3.sql`

**Future:**
- Migration scripts
- Seed data
- Backup scripts

---

## 📝 Documentation Files

### Root Level Documentation

| File | Lines | Purpose |
|------|-------|---------|
| `README.md` | 565 | Complete project documentation |
| `QUICKSTART.md` | 339 | 10-minute setup guide |
| `SETUP_CHECKLIST.md` | 239 | Interactive setup tracker |
| `PHASE1_STATUS.md` | 359 | Phase 1 completion status |
| `DEVELOPER_HANDOFF.md` | 509 | Developer onboarding guide |
| `IMPORTANT_NOTES.md` | 207 | TypeScript error explanations |
| `DELIVERY_SUMMARY.md` | 542 | Delivery summary |
| `PROJECT_STRUCTURE.md` | This | Visual project structure |

**Total Documentation:** ~2,700+ lines

---

## 🔢 File Statistics

### Phase 1 (Complete)
- Backend source files: 11
- Middleware files: 4
- Config files: 5
- Test files: 3
- Documentation files: 8
- **Total Phase 1:** 31 files

### Phase 2+ (Upcoming)
- Controllers: ~8 files
- Services: ~10 files
- Routes: ~8 files
- Schemas: ~6 files
- Utils: ~5 files
- Tests: ~15 files
- **Estimated Phase 2-6:** ~50 files

### Phase 7 (Frontend)
- SvelteKit pages: ~20 files
- Components: ~30 files
- Stores: ~5 files
- Frontend utils: ~5 files
- **Estimated Phase 7:** ~60 files

### Total Project (All Phases)
**Estimated:** ~140 files when complete

---

## 🎯 Phase Breakdown by Directory

### Phase 1 ✅ (Current)
```
✅ backend/src/config/       (4 files)
✅ backend/src/middleware/   (4 files)
✅ backend/src/schemas/      (1 file)
✅ backend/src/app.ts
✅ backend/src/server.ts
✅ backend/tests/            (2 files)
✅ All documentation files
```

### Phase 2 🔜 (Next)
```
🔜 backend/src/controllers/  (auth.controller.ts, user.controller.ts)
🔜 backend/src/services/     (auth.service.ts, user.service.ts)
🔜 backend/src/routes/       (auth.routes.ts, user.routes.ts)
🔜 backend/src/schemas/      (user.schema.ts, company.schema.ts)
🔜 backend/src/utils/        (jwt.util.ts, email.util.ts)
🔜 backend/tests/            (auth.test.ts, user.test.ts)
```

### Phase 3-6 ⏳
```
⏳ backend/src/controllers/  (rfq, quotation, comparison)
⏳ backend/src/services/     (rfq, quotation, analytics, export)
⏳ backend/src/routes/       (rfq, quotation, analytics)
⏳ backend/src/schemas/      (rfq, quotation, comparison)
⏳ backend/src/utils/        (file, pdf, excel, tax)
```

### Phase 7 ⏳
```
⏳ frontend/src/routes/      (All SvelteKit pages)
⏳ frontend/src/lib/         (Components, stores, utils)
⏳ frontend/static/          (Images, fonts, etc.)
```

---

## 🔗 Import Paths

### Common Imports in Backend Files

```typescript
// Config
import { config } from './config';
import { pool } from './config/database';
import { redisClient } from './config/redis';
import { logger } from './config/logger';

// Middleware
import { authenticate, authorize } from './middleware/auth.middleware';
import { validate } from './middleware/validate.middleware';
import { asyncHandler, AppError } from './middleware/error.middleware';

// Schemas
import { registerSchema, loginSchema } from './schemas/auth.schema';

// Services (Phase 2+)
import * as authService from './services/auth.service';
import * as userService from './services/user.service';
```

---

## 📦 Dependencies by Directory

### `/backend/src/config/`
- `pg` - PostgreSQL driver
- `ioredis` - Redis client
- `winston` - Logger
- `dotenv` - Environment variables

### `/backend/src/middleware/`
- `express` - Web framework
- `jsonwebtoken` - JWT handling
- `zod` - Schema validation
- `helmet` - Security headers
- `cors` - CORS handling

### `/backend/src/schemas/`
- `zod` - Runtime validation

### `/backend/tests/`
- `jest` - Test runner
- `supertest` - HTTP testing
- `ts-jest` - TypeScript support

---

## 🎨 Naming Conventions

### Files
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Routes: `*.routes.ts`
- Schemas: `*.schema.ts`
- Middleware: `*.middleware.ts`
- Utils: `*.util.ts`
- Tests: `*.test.ts`

### Exports
- Named exports preferred over default exports
- Services export functions: `export const getUserById = ...`
- Config exports objects: `export { pool, redisClient, logger }`
- Middleware exports functions: `export const authenticate = ...`

---

## 🚀 Navigation Guide

### New Developers Start Here:
1. `README.md` - Overview
2. `QUICKSTART.md` - Get running
3. `DEVELOPER_HANDOFF.md` - Your first tasks
4. `backend/src/app.ts` - See how it's wired

### Understanding Architecture:
1. `backend/src/server.ts` - Entry point
2. `backend/src/app.ts` - Express setup
3. `backend/src/config/` - Configurations
4. `backend/src/middleware/` - Request pipeline

### Starting Phase 2:
1. `.rules/TASK_PLAN_PHASE2.md` - Task list
2. `backend/src/schemas/auth.schema.ts` - Schema examples
3. `backend/src/middleware/auth.middleware.ts` - Auth patterns
4. `backend/tests/health.test.ts` - Test examples

---

## 📊 Project Metrics

### Code Files
- Configuration: 4 files (~500 lines)
- Middleware: 4 files (~620 lines)
- Schemas: 1 file (~230 lines)
- Core app: 2 files (~184 lines)
- Tests: 2 files (~170 lines)
- **Total Code: 13 files (~1,700 lines)**

### Documentation
- 8 documentation files
- ~2,700+ lines of documentation
- Covers setup, development, architecture, troubleshooting

### Total Project (Phase 1)
- **31 files created**
- **~4,400 lines total**
- **Ready for Phase 2 development**

---

## ✅ Quick Reference

**Find configuration:** `backend/src/config/`  
**Find middleware:** `backend/src/middleware/`  
**Find schemas:** `backend/src/schemas/`  
**Find tests:** `backend/tests/`  
**Find docs:** Root of `rfq-platform/`  
**Find task plans:** `../.rules/`  
**Find database schema:** `../Instructions/`

**Start backend:** `cd backend && npm run dev`  
**Run tests:** `cd backend && npm test`  
**Read docs:** Start with `README.md`

---

**Last Updated:** Phase 1 Completion  
**Status:** ✅ Foundation Complete, Ready for Phase 2