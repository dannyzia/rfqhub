# Setup Checklist

Use this checklist to track your setup progress for the RFQ Tendering Platform.

## Prerequisites Installation

- [ ] Node.js 20 LTS installed (`node --version`)
- [ ] PostgreSQL 16+ installed (`psql --version`)
- [ ] Redis 7+ installed (`redis-cli --version`)
- [ ] Git installed (`git --version`)

## Project Setup

### 1. Dependencies Installation

- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] No installation errors reported

### 2. Database Configuration

- [ ] PostgreSQL server is running (`pg_isready`)
- [ ] Database `rfq_platform` created
- [ ] Schema imported successfully (`psql -U postgres -d rfq_platform -f ../Instructions/rfq_tendering_platform_schema_v3.sql`)
- [ ] Tables verified (`psql -U postgres -d rfq_platform -c "\dt"`)
- [ ] At least 15+ tables visible (users, companies, rfqs, etc.)

### 3. Redis Configuration

- [ ] Redis server is running (`redis-cli ping` returns `PONG`)
- [ ] Redis accessible on default port 6379

### 4. Environment Variables

#### Backend (.env)

- [ ] File `backend/.env` created from `backend/env.example`
- [ ] `DB_PASSWORD` set (your PostgreSQL password)
- [ ] `JWT_SECRET` generated (32+ chars)
- [ ] `JWT_REFRESH_SECRET` generated (32+ chars)
- [ ] `DB_USER` correct (default: postgres)
- [ ] `DB_NAME` correct (default: rfq_platform)
- [ ] `DB_HOST` correct (default: localhost)
- [ ] `DB_PORT` correct (default: 5432)
- [ ] `REDIS_HOST` correct (default: localhost)
- [ ] `REDIS_PORT` correct (default: 6379)
- [ ] `PORT` set (default: 3000)
- [ ] `NODE_ENV` set to development
- [ ] `CORS_ORIGINS` includes frontend URL

#### Frontend (.env)

- [ ] File `frontend/.env` created
- [ ] `PUBLIC_API_URL=http://localhost:3000/api` set
- [ ] `PUBLIC_APP_NAME` set
- [ ] `PUBLIC_APP_URL=http://localhost:5173` set

### 5. JWT Secrets Generation

Run these commands and save output to `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] First secret saved as `JWT_SECRET`
- [ ] Second secret saved as `JWT_REFRESH_SECRET`
- [ ] Both are at least 32 characters long

## Running the Application

### Backend

- [ ] Backend starts without errors (`cd backend && npm run dev`)
- [ ] Console shows "Database connected successfully"
- [ ] Console shows "Redis connected successfully"
- [ ] Console shows "Server running on port 3000"
- [ ] Health endpoint responds: http://localhost:3000/health
- [ ] API info endpoint responds: http://localhost:3000/api

### Frontend

- [ ] Frontend starts without errors (`cd frontend && npm run dev`)
- [ ] Console shows "Local: http://localhost:5173/"
- [ ] Browser loads http://localhost:5173 successfully
- [ ] No console errors in browser developer tools

## Verification Tests

### Backend API Tests

- [ ] GET http://localhost:3000/health returns `{"status": "ok", ...}`
- [ ] GET http://localhost:3000/api returns API info
- [ ] Server responds within 1 second

### Database Tests

```bash
# Test connection
psql -U postgres -d rfq_platform -c "SELECT NOW();"

# Check tables
psql -U postgres -d rfq_platform -c "\dt"

# Check users table structure
psql -U postgres -d rfq_platform -c "\d users"
```

- [ ] Database connection successful
- [ ] All tables present
- [ ] Users table has expected columns

### Redis Tests

```bash
# Test connection
redis-cli ping

# Set and get a test value
redis-cli SET test_key "test_value"
redis-cli GET test_key
redis-cli DEL test_key
```

- [ ] Redis ping returns PONG
- [ ] Can set and retrieve values
- [ ] Redis is accessible from backend

## Common Issues Resolved

- [ ] ✓ Fixed "Database connection failed" error
- [ ] ✓ Fixed "Redis connection failed" error
- [ ] ✓ Fixed "Port already in use" error
- [ ] ✓ Fixed "Module not found" errors
- [ ] ✓ No remaining error messages

## Optional Services (Phase 2+)

- [ ] SMTP server configured (for email notifications)
- [ ] MinIO/S3 configured (for file uploads)
- [ ] PM2 installed globally (for production deployment)

## Development Workflow Ready

- [ ] Can start backend (`npm run dev` in backend/)
- [ ] Can start frontend (`npm run dev` in frontend/)
- [ ] Hot reload working on both services
- [ ] Can view backend logs in terminal
- [ ] Can access app in browser
- [ ] Can modify code and see changes

## Next Steps

Once all checkboxes above are complete:

1. [ ] Review Phase 1 foundation code
   - `backend/src/config/` - Configuration files
   - `backend/src/middleware/` - Middleware (auth, error, validation)
   - `backend/src/app.ts` - Express app setup
   - `backend/src/server.ts` - Server entry point

2. [ ] Read Phase 2 task plan (`.rules/TASK_PLAN_PHASE2.md`)

3. [ ] Begin implementing Phase 2 features:
   - User registration and authentication
   - Company profile management
   - User CRUD operations

4. [ ] Set up testing framework
   - Review `backend/tests/` directory
   - Run `npm test` when tests are added

## Troubleshooting Commands

If you encounter issues, use these commands:

```bash
# Check if PostgreSQL is running
pg_isready

# Check if Redis is running
redis-cli ping

# List all databases
psql -U postgres -l

# Connect to database
psql -U postgres -d rfq_platform

# Check what's using port 3000 (backend)
# Windows:
netstat -ano | findstr :3000
# macOS/Linux:
lsof -i :3000

# Check what's using port 5173 (frontend)
# Windows:
netstat -ano | findstr :5173
# macOS/Linux:
lsof -i :5173

# Restart PostgreSQL
# Windows (Services.msc)
# macOS: brew services restart postgresql
# Linux: sudo systemctl restart postgresql

# Restart Redis
# Windows: restart redis-server
# macOS: brew services restart redis
# Linux: sudo systemctl restart redis
```

## Support Resources

- [ ] Read main [README.md](README.md)
- [ ] Read [QUICKSTART.md](QUICKSTART.md) for detailed steps
- [ ] Reviewed `.rules/TASK_PLAN_PHASE1.md`
- [ ] Familiar with project structure
- [ ] Know where to find API documentation

---

## Setup Status

**Last Updated**: _____________

**Setup Completed By**: _____________

**Date Completed**: _____________

**Notes**:
- 
- 
- 

---

**✅ Setup Complete!** You're ready to start development.