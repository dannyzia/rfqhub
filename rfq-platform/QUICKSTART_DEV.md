# Quick Start Guide - RFQ Buddy Development

This guide will get you up and running with the RFQ Buddy platform in development mode.

## Prerequisites

- ✅ Node.js 20 LTS installed
- ✅ PostgreSQL 16 (or Neon account)
- ✅ Redis 7 (or Upstash account)
- ✅ Git installed

## Step 1: Clone and Install

```bash
# Navigate to project
cd rfq-platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 2: Configure Environment Variables

### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```env
# Database (Use your Neon connection string or local PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/rfq_platform

# Redis (Use your Upstash connection or local Redis)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# JWT Secrets (Generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Server
PORT=3000
NODE_ENV=development
```

**Generate secure JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Step 3: Database Setup

If using local PostgreSQL:

```bash
# Create database
psql -U postgres -c "CREATE DATABASE rfq_platform;"

# Run schema
psql -U postgres -d rfq_platform -f ../database/schema.sql
```

If using Neon, the database and schema should already be set up.

## Step 4: Start Development Servers

### Terminal 1 - Backend

```bash
cd rfq-platform/backend
npm run dev
```

You should see:
```
✅ Redis connected successfully
✅ Database connected successfully
Server running on port 3000
```

### Terminal 2 - Frontend

```bash
cd rfq-platform/frontend
npm run dev
```

You should see:
```
  VITE v7.3.1  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 5: Access the Application

Open your browser and navigate to:

**Frontend**: http://localhost:5173

**Backend API**: http://localhost:3000/api

**Health Check**: http://localhost:3000/health

## Verify Setup

### Test Backend

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-02-01T...",
  "uptime": 123.456
}
```

### Test Frontend

1. Navigate to http://localhost:5173
2. You should see the home page
3. Click "Login" - you should see the login form

## Common Issues & Solutions

### Issue: Port 3000 already in use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill
```

Or change the port in `backend/.env`:
```env
PORT=3001
```

### Issue: TypeScript compilation errors

**Error:** `Property 'user' does not exist on type 'Request'`

**Solution:** This is already fixed! Make sure you have:
1. Latest code with `src/types/express.d.ts`
2. Updated `package.json` with `--files` flag
3. Run `npm install` in backend directory

### Issue: Database connection failed

**Error:** `Error: connect ECONNREFUSED`

**Solutions:**
1. **Local PostgreSQL:** Ensure PostgreSQL is running
   ```bash
   # Windows
   pg_ctl status
   
   # macOS/Linux
   sudo systemctl status postgresql
   ```

2. **Neon:** Verify your `DATABASE_URL` in `.env`
   - Check the connection string is correct
   - Ensure database exists
   - Test connection at https://console.neon.tech

### Issue: Redis connection failed

**Solutions:**
1. **Local Redis:** Ensure Redis is running
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Upstash:** Verify your credentials in `.env`
   - Check `UPSTASH_REDIS_REST_URL`
   - Check `UPSTASH_REDIS_REST_TOKEN`
   - Test at https://console.upstash.com

### Issue: Frontend build errors with Tailwind

**Error:** `Cannot apply unknown utility class`

**Solution:** This is already fixed! The project uses Tailwind CSS v4 with `@tailwindcss/postcss`. If you encounter issues:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue: Module not found

**Solution:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### Making Changes

1. **Backend changes**: Auto-reload with nodemon
   - Edit files in `backend/src/`
   - Server restarts automatically
   - Check terminal for errors

2. **Frontend changes**: Hot Module Replacement (HMR)
   - Edit files in `frontend/src/`
   - Browser updates automatically
   - Check browser console for errors

### Running Tests

```bash
# Backend tests (when available)
cd backend
npm test

# Frontend unit tests
cd frontend
npm run test:unit

# Frontend E2E tests (requires backend running)
npm run test:e2e
```

### Code Quality

```bash
# Backend
cd backend
npm run lint
npm run format

# Frontend
cd frontend
npm run lint
npm run format
npm run check  # TypeScript type checking
```

### Building for Production

```bash
# Backend
cd backend
npm run build
# Output in dist/

# Frontend
cd frontend
npm run build
# Output in .svelte-kit/output/
```

## Project Structure Quick Reference

```
rfq-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── schemas/        # Zod validation schemas
│   │   ├── config/         # Configuration (DB, Redis, Logger)
│   │   ├── types/          # TypeScript type definitions
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Server entry point
│   ├── .env                # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── routes/         # SvelteKit pages
│   │   │   ├── (auth)/     # Login, Register
│   │   │   └── (app)/      # Dashboard, Tenders, etc.
│   │   ├── lib/
│   │   │   ├── stores/     # Svelte stores (auth)
│   │   │   └── utils/      # API client, helpers
│   │   └── tests/          # Test setup and mocks
│   ├── e2e/                # Playwright E2E tests
│   ├── .env                # Environment variables
│   └── package.json
│
└── database/
    └── schema.sql          # Database schema
```

## Next Steps

Now that your development environment is running:

1. **Explore the API**
   - Visit http://localhost:3000/api
   - Try the auth endpoints (`/api/auth/login`, `/api/auth/register`)

2. **Test the Frontend**
   - Register a new user
   - Login with credentials
   - Explore the dashboard

3. **Read the Documentation**
   - `README.md` - Project overview
   - `PHASE7_COMPLETE.md` - Frontend implementation details
   - `TYPESCRIPT_FIX.md` - TypeScript setup notes
   - API documentation (coming soon)

4. **Start Developing**
   - Check `.rules/TASK_PLAN_PHASE*.md` for feature roadmap
   - Pick a task and start coding!
   - Follow the existing code patterns

## Getting Help

- Check the documentation in `/rfq-platform/*.md`
- Review completed phases in `.rules/TASK_PLAN_PHASE*.md`
- Look at existing implementations for patterns
- Check console logs for detailed error messages

## Pro Tips

1. **Keep terminals open**: Run backend and frontend in separate terminal windows
2. **Watch the logs**: Backend logs show database queries, errors, and request info
3. **Use browser DevTools**: React/Svelte DevTools extensions are helpful
4. **Hot reload**: Changes usually reflect immediately; if not, save the file again
5. **Clean install**: If weird errors occur, try deleting `node_modules` and reinstalling

## Status Checks

### Backend Running ✅
- Terminal shows "Server running on port 3000"
- http://localhost:3000/health returns status
- No error messages in terminal

### Frontend Running ✅
- Terminal shows "Local: http://localhost:5173/"
- Browser shows RFQ Buddy homepage
- No errors in browser console

### Database Connected ✅
- Backend logs show "✅ Database connected successfully"
- No connection errors

### Redis Connected ✅
- Backend logs show "✅ Redis connected successfully"
- No connection errors

---

**Happy Coding! 🚀**

If you encounter any issues not covered here, check the troubleshooting section or review the complete documentation in the project root.