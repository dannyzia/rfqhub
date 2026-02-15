# Developer Handoff Guide

## 👋 Welcome to the RFQ Tendering Platform

This document will help you get started quickly with the project. If you're taking over development or joining the team, start here!

---

## 🎯 What This Project Does

The RFQ Tendering Platform is a B2B web application that streamlines the Request for Quotation (RFQ) process:

- **Buyers** create RFQs and invite suppliers to quote
- **Suppliers** browse RFQs and submit competitive quotations
- **Both parties** can manage documents, compare offers, and track status
- **Admins** oversee the entire platform

Think of it as a marketplace for business quotations and procurement.

---

## 📚 Essential Documents (Read These First)

### 1. Start Here (5 minutes)
- **[QUICKSTART.md](QUICKSTART.md)** - Get the app running in 10 minutes
- **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** - Track your setup progress

### 2. Understand the Project (15 minutes)
- **[README.md](README.md)** - Comprehensive project documentation
- **[PHASE1_STATUS.md](PHASE1_STATUS.md)** - What's done and what's next

### 3. Development Planning (30 minutes)
- **Instructions/PRD - RFQ Buddy Tendering Platform.md** - Product requirements
- **Instructions/Developer Coding Plan - RFQ Tendering Platform.md** - Technical approach
- **.rules/TASK_PLAN_PHASE*.md** - Detailed task lists for all 7 phases

### 4. Database (10 minutes)
- **Instructions/rfq_tendering_platform_schema_v3.sql** - Database schema

---

## 🚀 Getting Started (Your First Hour)

### Step 1: Prerequisites (10 min)
Install these if you don't have them:
- Node.js 20 LTS
- PostgreSQL 16+
- Redis 7+

### Step 2: Clone & Install (10 min)
```bash
cd rfq-platform/backend
npm install

cd ../frontend
npm install  # (Will have packages after Phase 7)
```

### Step 3: Database Setup (10 min)
```bash
# Create database
psql -U postgres -c "CREATE DATABASE rfq_platform;"

# Import schema
psql -U postgres -d rfq_platform -f ../Instructions/rfq_tendering_platform_schema_v3.sql
```

### Step 4: Environment Config (10 min)
```bash
cd backend
cp env.example .env

# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env and paste the secrets into JWT_SECRET and JWT_REFRESH_SECRET
# Also set DB_PASSWORD to your PostgreSQL password
```

### Step 5: Start Everything (10 min)
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Backend
cd backend
npm run dev

# Verify: http://localhost:3000/health should return {"status": "ok"}
```

### Step 6: Explore the Code (10 min)
Open the project in your IDE and browse:
- `backend/src/config/` - Database, Redis, Logger setup
- `backend/src/middleware/` - Auth, Error handling, Validation
- `backend/src/app.ts` - Express app configuration
- `backend/src/server.ts` - Server entry point

---

## 🏗 Architecture Overview

### Backend Structure
```
backend/src/
├── config/          # Configuration (DB, Redis, Logger)
├── controllers/     # Request handlers (Phase 2+)
├── middleware/      # Auth, validation, error handling ✅
├── routes/          # API endpoint definitions (Phase 2+)
├── schemas/         # Zod validation schemas ✅
├── services/        # Business logic (Phase 2+)
├── utils/           # Helper functions (Phase 2+)
├── app.ts           # Express application ✅
└── server.ts        # Server entry point ✅
```

✅ = Already implemented  
Phase 2+ = Ready for you to build

### Technology Stack
**Backend:**
- Express.js + TypeScript
- PostgreSQL (database)
- Redis (caching/sessions)
- JWT (authentication)
- Zod (validation)
- Winston (logging)
- Jest (testing)

**Frontend:** (Phase 7)
- SvelteKit
- TypeScript
- TailwindCSS
- Svelte 5 Runes

---

## 📋 Development Phases

The project follows a 7-phase plan. **You are starting at Phase 2.**

### ✅ Phase 1: Foundation (COMPLETE)
- Project structure
- Database configuration
- Middleware (auth, error, validation)
- Documentation
- Testing setup

### 🔜 Phase 2: User Management (NEXT - START HERE)
**Your first tasks:**
1. Create `controllers/auth.controller.ts`
2. Create `services/auth.service.ts`
3. Create `routes/auth.routes.ts`
4. Wire up authentication endpoints
5. Test user registration and login

**Read:** `.rules/TASK_PLAN_PHASE2.md` for detailed tasks

### ⏳ Phase 3: RFQ Management
Buyers create and manage RFQs

### ⏳ Phase 4: Quotation Management
Suppliers submit quotations

### ⏳ Phase 5: Comparison & Analytics
Compare quotes, analytics dashboard

### ⏳ Phase 6: Export, Tax & Polish
PDF/Excel export, tax calculations, UX polish

### ⏳ Phase 7: Frontend & Testing
SvelteKit frontend, E2E tests

---

## 🎯 Your First Task: Phase 2

### Goal
Implement user authentication and company profile management.

### Start Here
1. **Read the task plan:** `.rules/TASK_PLAN_PHASE2.md`
2. **Understand the schema:** Check `schemas/auth.schema.ts` (already created)
3. **Create the controller:** `controllers/auth.controller.ts`

### Example: Registration Endpoint

**File:** `backend/src/controllers/auth.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import * as authService from '../services/auth.service';

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.registerUser(req.body);
    
    res.status(201).json({
      message: 'User registered successfully',
      data: result,
    });
  }
);
```

**File:** `backend/src/services/auth.service.ts`

```typescript
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';

export const registerUser = async (data: any) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const result = await pool.query(
    'INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [data.email, hashedPassword, data.firstName, data.lastName, data.role]
  );
  
  return result.rows[0];
};
```

**File:** `backend/src/routes/auth.routes.ts`

```typescript
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);

export default router;
```

**Update:** `backend/src/app.ts` (uncomment these lines)

```typescript
import authRoutes from './routes/auth.routes';
// ...
app.use('/api/auth', authRoutes);
```

---

## 🧪 Testing Your Work

### Run Tests
```bash
cd backend
npm test
```

### Manual Testing
```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "ACME Corp",
    "role": "buyer"
  }'
```

### Write Tests
Create `tests/auth.test.ts`:

```typescript
import request from 'supertest';
import app from '../src/app';

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'Test123!@#',
        firstName: 'Jane',
        lastName: 'Smith',
        companyName: 'Test Corp',
        role: 'supplier',
      })
      .expect(201);

    expect(response.body).toHaveProperty('message');
    expect(response.body.data).toHaveProperty('id');
  });
});
```

---

## 🔍 Code Conventions

### File Naming
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Routes: `*.routes.ts`
- Schemas: `*.schema.ts`
- Middleware: `*.middleware.ts`
- Tests: `*.test.ts`

### Code Style
- **Async/Await**: Always use async/await (no callbacks)
- **Error Handling**: Use `asyncHandler` wrapper for route handlers
- **Validation**: Use Zod schemas for all input validation
- **Types**: Always define TypeScript types/interfaces
- **Logging**: Use Winston logger (imported from `config/logger`)

### Example Service Pattern
```typescript
// services/user.service.ts
import { pool } from '../config/database';
import { NotFoundError } from '../middleware/error.middleware';

export const getUserById = async (id: number) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }
  
  return result.rows[0];
};
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL is running
pg_isready

# Check Redis is running
redis-cli ping

# Check .env file exists
ls backend/.env

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Database connection fails
```bash
# Test database connection
psql -U postgres -d rfq_platform -c "SELECT NOW();"

# Check .env database settings
cat backend/.env | grep DB_
```

### Port already in use
```bash
# Kill process on port 3000 (backend)
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

---

## 📞 Getting Help

### Documentation
1. Check [README.md](README.md) for general questions
2. Check [QUICKSTART.md](QUICKSTART.md) for setup issues
3. Check task plans in `.rules/` for feature requirements

### Code References
- **Middleware examples:** `backend/src/middleware/`
- **Schema examples:** `backend/src/schemas/auth.schema.ts`
- **Test examples:** `backend/tests/health.test.ts`

### Database
- **Schema:** `Instructions/rfq_tendering_platform_schema_v3.sql`
- **Query tool:** Use pgAdmin or DBeaver
- **CLI:** `psql -U postgres -d rfq_platform`

---

## 🎓 Learning Resources

### TypeScript + Express
- Express TypeScript Guide: https://github.com/Microsoft/TypeScript-Node-Starter
- Our middleware patterns are in: `backend/src/middleware/`

### PostgreSQL
- Node-postgres docs: https://node-postgres.com/
- Our database config: `backend/src/config/database.ts`

### Zod Validation
- Zod docs: https://zod.dev/
- Our schemas: `backend/src/schemas/`

### Testing
- Jest docs: https://jestjs.io/
- Supertest docs: https://github.com/visionmedia/supertest
- Our test setup: `backend/tests/setup.ts`

---

## ✅ Checklist: Are You Ready?

- [ ] I've read the QUICKSTART.md
- [ ] Backend is running on http://localhost:3000
- [ ] Health endpoint returns 200: http://localhost:3000/health
- [ ] PostgreSQL database exists with tables imported
- [ ] Redis is running (`redis-cli ping` returns PONG)
- [ ] I've read TASK_PLAN_PHASE2.md
- [ ] I understand the project structure
- [ ] I know where to find the database schema
- [ ] I can write and run tests

---

## 🚀 You're Ready to Code!

### Your Mission: Build Phase 2

**Goals:**
1. Implement user registration and authentication
2. Create company profile management
3. Add user CRUD operations
4. Write comprehensive tests

**Time Estimate:** 2-3 days

**Start Command:**
```bash
# Create your first file
touch backend/src/controllers/auth.controller.ts
```

**Reference:**
- Task Plan: `.rules/TASK_PLAN_PHASE2.md`
- Coding Plan: `Instructions/Developer Coding Plan - RFQ Tendering Platform.md`
- PRD: `Instructions/PRD - RFQ Buddy Tendering Platform.md`

---

## 💡 Pro Tips

1. **Run tests frequently:** `npm test`
2. **Use the logger:** Import from `config/logger` instead of `console.log`
3. **Follow the patterns:** Look at existing middleware for examples
4. **Validate everything:** Create Zod schemas for all endpoints
5. **Write tests as you go:** Easier than writing them all at the end
6. **Commit often:** Small, focused commits are better
7. **Read error messages:** They're usually helpful!

---

## 📊 Project Status at Handoff

| Component | Status | Notes |
|-----------|--------|-------|
| Project Structure | ✅ Complete | Ready for development |
| Backend Config | ✅ Complete | DB, Redis, Logger configured |
| Middleware | ✅ Complete | Auth, Error, Validation ready |
| Auth Schemas | ✅ Complete | Zod schemas for authentication |
| Documentation | ✅ Complete | README, guides, checklists |
| Testing Setup | ✅ Complete | Jest configured with examples |
| Phase 1 | ✅ 95% | Manual setup steps remaining |
| Phase 2 | 🔜 Ready | Your starting point |
| Phases 3-7 | ⏳ Planned | Task plans available |

---

## 🎯 Success Metrics

You'll know you're making progress when:

✅ Backend starts without errors  
✅ Tests pass (`npm test`)  
✅ New endpoints return expected responses  
✅ Database queries work correctly  
✅ Authentication flow works end-to-end  
✅ Code follows the established patterns  
✅ Documentation is updated as needed  

---

**Welcome aboard! Let's build something great! 🚀**

---

_Last Updated: Phase 1 Completion_  
_Next Review: After Phase 2 Completion_