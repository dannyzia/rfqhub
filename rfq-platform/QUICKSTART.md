# 🚀 Quick Start Guide

Get the RFQ Tendering Platform up and running in 10 minutes!

## 📌 Important: Using Neon & Upstash?

**If you're using Neon PostgreSQL and Upstash Redis (cloud-based services), follow this guide instead:**

👉 **[NEON_UPSTASH_SETUP.md](NEON_UPSTASH_SETUP.md)** - Complete setup guide for cloud services

This QUICKSTART guide is for **local PostgreSQL and Redis installation**. If you're using cloud services, the Neon/Upstash guide will be much easier!

---

## Prerequisites Check (Local Installation)

Ensure you have these installed:

```bash
node --version    # Should be v20.x or higher
psql --version    # Should be v16 or higher
redis-cli --version  # Should be v7 or higher
```

If any are missing, see the [Prerequisites](README.md#prerequisites) section in the main README.

**OR** skip local installation and use cloud services - see [NEON_UPSTASH_SETUP.md](NEON_UPSTASH_SETUP.md)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Setup PostgreSQL Database

**Option A: Using Neon (Recommended - No local install needed)**
- See [NEON_UPSTASH_SETUP.md](NEON_UPSTASH_SETUP.md) for complete instructions

**Option B: Local PostgreSQL**

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE rfq_platform;"

# Import the schema (from project root)
psql -U postgres -d rfq_platform -f ../Instructions/rfq_tendering_platform_schema_v3.sql

# Verify tables were created
psql -U postgres -d rfq_platform -c "\dt"
```

**Windows Users**: You may need to use the full path to psql if it's not in your PATH.

### 3. Generate JWT Secrets

Run these commands and save the output:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Configure Environment Variables

**Backend:**

```bash
cd backend
cp env.example .env
```

Edit `backend/.env` and set these REQUIRED values:

**For Neon PostgreSQL + Upstash Redis:**
```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Upstash Redis
REDIS_URL=rediss://default:password@host.upstash.io:6379

# JWT Secrets (paste the values generated in step 3)
JWT_SECRET=paste_first_generated_secret_here
JWT_REFRESH_SECRET=paste_second_generated_secret_here
```

**For Local PostgreSQL + Redis:**
```env
# Database (update if your postgres password is different)
DB_PASSWORD=postgres

# JWT Secrets (paste the values generated in step 3)
JWT_SECRET=paste_first_generated_secret_here
JWT_REFRESH_SECRET=paste_second_generated_secret_here

# Optional: Update these if using different credentials
DB_USER=postgres
DB_NAME=rfq_platform
```

**Frontend:**

```bash
cd ../frontend
```

Create `frontend/.env`:

```env
PUBLIC_API_URL=http://localhost:3000/api
PUBLIC_APP_NAME=RFQ Tendering Platform
PUBLIC_APP_URL=http://localhost:5173
```

### 5. Start Redis

**Option A: Using Upstash (Recommended - No local install needed)**
- See [NEON_UPSTASH_SETUP.md](NEON_UPSTASH_SETUP.md) for setup
- No need to start anything - it's always running in the cloud!

**Option B: Local Redis**

**Windows:**
```bash
# If using Redis downloaded from GitHub releases
redis-server

# Or if using WSL
wsl redis-server
```

**macOS:**
```bash
redis-server
# Or if installed via Homebrew:
brew services start redis
```

**Linux:**
```bash
sudo systemctl start redis
# Or
redis-server
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should output: PONG
```

### 6. Start the Backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ Database connected successfully (Neon PostgreSQL)
✅ Redis connected successfully (Upstash)
✅ Redis is ready to accept commands
Server running on port 3000
Health check: http://localhost:3000/health
```

**Note:** If using local PostgreSQL/Redis, the messages will say "Database connected successfully" without "(Neon PostgreSQL)" or "(Upstash)".

**Test the backend:**

Open http://localhost:3000/health in your browser. You should see:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 5.123,
  "environment": "development"
}
```

### 7. Start the Frontend

In a **new terminal**:

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open the app:**

Visit http://localhost:5173 in your browser.

## ✅ Verify Everything Works

### Backend Health Check
- URL: http://localhost:3000/health
- Expected: `{"status": "ok", ...}`

### Backend API Info
- URL: http://localhost:3000/api
- Expected: `{"message": "RFQ Tendering Platform API", ...}`

### Frontend
- URL: http://localhost:5173
- Expected: The frontend app loads (will be populated in Phase 7)

### Database Connection
```bash
psql -U postgres -d rfq_platform -c "SELECT COUNT(*) FROM users;"
```
Expected: Returns a count (0 initially)

### Redis Connection
```bash
redis-cli ping
```
Expected: `PONG`

## 🎯 You're Ready!

The platform is now running:
- **Backend API**: http://localhost:3000
- **Frontend App**: http://localhost:5173
- **Database**: PostgreSQL on port 5432
- **Cache**: Redis on port 6379

## 🔄 Daily Development Workflow

### Starting the Platform

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Redis (if not auto-started):**
```bash
redis-server
```

### Stopping the Platform

- Press `Ctrl+C` in each terminal to stop the services
- To stop Redis (if running as service):
  - macOS: `brew services stop redis`
  - Linux: `sudo systemctl stop redis`

## 🐛 Troubleshooting

### "Database connection failed"

```bash
# Check PostgreSQL is running
pg_isready

# Check if database exists
psql -U postgres -l | grep rfq_platform

# If database doesn't exist, create it
psql -U postgres -c "CREATE DATABASE rfq_platform;"
```

### "Redis connection failed"

```bash
# Check Redis is running
redis-cli ping

# If not running, start it
redis-server
```

### "Port 3000 already in use"

```bash
# Find and kill the process using port 3000 (backend)
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

### "Port 5173 already in use"

```bash
# Start frontend on different port
npm run dev -- --port 5174
```

### "Module not found" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database schema import fails

```bash
# Option 1: Use absolute path
psql -U postgres -d rfq_platform -f /full/path/to/rfq_tendering_platform_schema_v3.sql

# Option 2: Navigate to Instructions folder first
cd ../Instructions
psql -U postgres -d rfq_platform -f rfq_tendering_platform_schema_v3.sql
```

### Backend starts but shows errors

1. Check `.env` file exists in `backend/` directory
2. Verify all required environment variables are set
3. Ensure JWT secrets are at least 32 characters
4. Check database credentials are correct

## 📝 Next Steps

Now that your environment is set up:

1. **Review the codebase**: Explore the Phase 1 foundation files
2. **Check task plans**: Review `.rules/TASK_PLAN_PHASE*.md` files
3. **Start Phase 2**: Begin implementing User Management features
4. **Run tests**: Use `npm test` to verify functionality

## 🔗 Useful Links

- [Main README](README.md) - Complete documentation
- [API Endpoints](README.md#api-documentation) - Available API routes
- [Project Structure](README.md#project-structure) - Code organization
- [Development Guide](README.md#development) - Dev workflow and scripts

## 💡 Pro Tips

1. **Use separate terminals**: One for backend, one for frontend, one for logs
2. **Enable auto-save**: Most editors auto-save; backend hot-reloads automatically
3. **Check logs**: Backend logs show in the terminal where you ran `npm run dev`
4. **Use PostgreSQL GUI**: Try pgAdmin or DBeaver for easier database management
5. **Use Redis GUI**: Try RedisInsight for monitoring Redis

## 🆘 Still Stuck?

1. Check the [Troubleshooting](README.md#troubleshooting) section in main README
2. Verify all prerequisites are installed correctly
3. Ensure you're in the correct directory when running commands
4. Check that all services (PostgreSQL, Redis) are running
5. Review the error messages carefully - they often indicate what's wrong

---

**Happy Coding! 🎉**