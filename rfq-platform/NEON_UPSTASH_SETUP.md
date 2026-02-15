# 🚀 Setup Guide for Neon PostgreSQL & Upstash Redis

This guide will help you set up the RFQ Tendering Platform using **Neon** (PostgreSQL) and **Upstash** (Redis) - both are serverless, cloud-based services perfect for development and production.

---

## 🎯 Why Neon & Upstash?

### Neon PostgreSQL
- ✅ Serverless PostgreSQL with generous free tier
- ✅ Autoscaling and automatic backups
- ✅ Branch databases for development
- ✅ No infrastructure management
- ✅ Always-on with instant cold starts

### Upstash Redis
- ✅ Serverless Redis with per-request pricing
- ✅ Global replication available
- ✅ Pay only for what you use
- ✅ REST API included
- ✅ TLS encryption by default

---

## 📋 Prerequisites

- [ ] Node.js 20 LTS installed
- [ ] Git installed
- [ ] A Neon account (free at [neon.tech](https://neon.tech))
- [ ] An Upstash account (free at [upstash.com](https://upstash.com))

---

## 🗄️ Part 1: Setup Neon PostgreSQL

### Step 1: Create Neon Account

1. Go to [https://neon.tech](https://neon.tech)
2. Click **"Sign Up"** (can use GitHub, Google, or email)
3. Verify your email if required

### Step 2: Create a New Project

1. Click **"Create Project"** or **"New Project"**
2. Fill in the details:
   - **Project Name**: `rfq-platform` (or your choice)
   - **Region**: Choose closest to your location
   - **PostgreSQL Version**: 16 (recommended)
3. Click **"Create Project"**

### Step 3: Get Your Connection String

1. After project creation, you'll see the connection details
2. Copy the **Connection String** (it looks like this):
   ```
   postgresql://neondb_owner:AbCdEf123456@ep-cool-name-12345.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
3. **Save this!** You'll need it for your `.env` file

### Step 4: Import Database Schema

⚠️ **IMPORTANT:** The schema file is 547 lines, but Neon SQL Editor has a limit of ~187 lines per execution.

**Option A: Using Neon SQL Editor (Split into 3 parts)**

👉 **Follow the detailed guide:** [database/NEON_MANUAL_IMPORT.md](database/NEON_MANUAL_IMPORT.md)

**Quick Summary:**
1. In your Neon dashboard, click **"SQL Editor"**
2. Open the schema file: `RFQ_Buddy/Instructions/rfq_tendering_platform_schema_v3.sql`
3. **Part 1:** Copy lines 1-200 (Extensions, Companies, Users) → Paste → Run
4. **Part 2:** Copy lines 201-400 (RFQs, Quotations, Documents) → Paste → Run
5. **Part 3:** Copy lines 401-547 (Notifications, Audit, Indexes) → Paste → Run
6. Verify all tables were created (see guide for verification steps)

📖 **Detailed instructions with exact split points:** See `database/NEON_MANUAL_IMPORT.md`

**Option B: Using psql Command Line (Runs entire file at once - Recommended!)**

```bash
# Navigate to the Instructions directory
cd RFQ_Buddy/Instructions

# Run the schema import (replace with your actual connection string)
psql "postgresql://neondb_owner:your-password@your-host.neon.tech/neondb?sslmode=require" -f rfq_tendering_platform_schema_v3.sql
```

**Option C: Using Database Client Tools (No line limits)**

Use tools like **DBeaver**, **pgAdmin**, or **TablePlus**:
1. Connect to your Neon database using the connection string
2. Open the SQL file
3. Execute all at once

### Step 5: Verify Tables

In the Neon SQL Editor, run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see tables like:
- `users`
- `companies`
- `rfqs`
- `rfq_items`
- `quotations`
- `quotation_items`
- And more...

---

## 🔴 Part 2: Setup Upstash Redis

### Step 1: Create Upstash Account

1. Go to [https://upstash.com](https://upstash.com)
2. Click **"Sign Up"** (can use GitHub, Google, or email)
3. Verify your email if required

### Step 2: Create a New Redis Database

1. Click **"Create Database"** or **"Redis"** → **"Create Database"**
2. Fill in the details:
   - **Name**: `rfq-platform-redis` (or your choice)
   - **Type**: Choose **"Regional"** for free tier
   - **Region**: Choose closest to your location (ideally same as Neon)
   - **Eviction**: Choose **"No Eviction"** (recommended)
   - **TLS**: Keep enabled (default)
3. Click **"Create"**

### Step 3: Get Your Connection String

1. After creation, click on your database name
2. Scroll down to **"Connect"** section
3. Select **"Node.js"** or **"ioredis"** tab
4. Copy the **Redis Connection String** (starts with `rediss://`):
   ```
   rediss://default:AbCdEf123456@your-region-12345.upstash.io:6379
   ```
5. **Save this!** You'll need it for your `.env` file

### Step 4: Test Connection (Optional)

In the Upstash dashboard:
1. Go to **"CLI"** tab (or **"Data Browser"**)
2. Try running: `PING`
3. You should get: `PONG`
4. Try: `SET test "hello"` then `GET test`

---

## ⚙️ Part 3: Configure Your Application

### Step 1: Navigate to Backend

```bash
cd rfq-platform/backend
```

### Step 2: Create `.env` File

```bash
# Copy the example environment file
cp env.example .env
```

### Step 3: Edit `.env` File

Open `backend/.env` in your text editor and update these values:

```env
# ==================================
# SERVER CONFIGURATION
# ==================================
NODE_ENV=development
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ==================================
# NEON POSTGRESQL DATABASE
# ==================================
# Paste your Neon connection string here:
DATABASE_URL=postgresql://neondb_owner:your-password@ep-cool-name-12345.us-east-1.aws.neon.tech/neondb?sslmode=require

# ==================================
# UPSTASH REDIS
# ==================================
# Paste your Upstash connection string here:
REDIS_URL=rediss://default:your-password@your-region-12345.upstash.io:6379

# ==================================
# JWT AUTHENTICATION
# ==================================
# Generate these using the command below
JWT_SECRET=paste-generated-secret-here
JWT_REFRESH_SECRET=paste-another-generated-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ==================================
# EMAIL CONFIGURATION (Optional for now)
# ==================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@rfqplatform.com

# ==================================
# FRONTEND CONFIGURATION
# ==================================
FRONTEND_URL=http://localhost:5173

# ==================================
# RATE LIMITING
# ==================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ==================================
# LOGGING
# ==================================
LOG_LEVEL=debug
```

### Step 4: Generate JWT Secrets

Run these commands to generate secure random secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy each output and paste into your `.env` file as `JWT_SECRET` and `JWT_REFRESH_SECRET`.

---

## 📦 Part 4: Install Dependencies

```bash
# Make sure you're in the backend directory
cd backend

# Install all dependencies
npm install
```

This will take 2-5 minutes. Wait for completion.

---

## 🚀 Part 5: Start the Application

### Terminal 1: Start Backend

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

### Verify It's Working

Open your browser and visit:
- **Health Check**: http://localhost:3000/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 5.123,
  "environment": "development"
}
```

### Verify API Info

Visit: http://localhost:3000/api

You should see:
```json
{
  "message": "RFQ Tendering Platform API",
  "version": "1.0.0",
  "documentation": "/api/docs"
}
```

---

## ✅ Verification Checklist

- [ ] Neon project created
- [ ] Database schema imported successfully
- [ ] All tables visible in Neon SQL Editor
- [ ] Upstash Redis database created
- [ ] Can ping Redis in Upstash CLI
- [ ] `.env` file created with correct values
- [ ] `DATABASE_URL` set correctly
- [ ] `REDIS_URL` set correctly
- [ ] JWT secrets generated and set
- [ ] `npm install` completed successfully
- [ ] Backend starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] No connection errors in console

---

## 🔍 Testing Connections

### Test PostgreSQL Connection

Create a test file `test-db.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()')
  .then(res => {
    console.log('✅ Database connected!', res.rows[0]);
    pool.end();
  })
  .catch(err => {
    console.error('❌ Database error:', err.message);
    pool.end();
  });
```

Run: `node test-db.js`

### Test Redis Connection

Create a test file `test-redis.js`:

```javascript
const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: false }
});

redis.ping()
  .then(() => {
    console.log('✅ Redis connected!');
    return redis.set('test', 'Hello from Node.js');
  })
  .then(() => redis.get('test'))
  .then(value => {
    console.log('✅ Redis test value:', value);
    redis.disconnect();
  })
  .catch(err => {
    console.error('❌ Redis error:', err.message);
    redis.disconnect();
  });
```

Run: `node test-redis.js`

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error: "connection refused" or "timeout"**

✅ **Solution:**
1. Check your `DATABASE_URL` is copied correctly
2. Ensure `?sslmode=require` is at the end
3. Verify project is not paused in Neon dashboard
4. Check your IP is not blocked (Neon allows all IPs by default)

**Error: "relation does not exist"**

✅ **Solution:**
1. Database schema not imported
2. Go to Neon SQL Editor and run the schema file
3. Verify tables exist: `\dt` or check Tables tab

**Error: "password authentication failed"**

✅ **Solution:**
1. Connection string password is incorrect
2. Reset password in Neon dashboard
3. Get fresh connection string
4. Update `.env` file

### Redis Connection Issues

**Error: "ECONNREFUSED" or "connection timeout"**

✅ **Solution:**
1. Check your `REDIS_URL` is copied correctly
2. Ensure it starts with `rediss://` (with double 's')
3. Verify database is active in Upstash dashboard
4. Check if you're behind a firewall blocking port 6379

**Error: "invalid password" or "NOAUTH"**

✅ **Solution:**
1. Connection string password is incorrect
2. Regenerate password in Upstash dashboard
3. Get fresh connection string
4. Update `.env` file

### Application Won't Start

**Error: "Cannot find module 'express'"**

✅ **Solution:**
1. Run `npm install` in backend directory
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install` again

**Error: "PORT already in use"**

✅ **Solution:**
1. Another process is using port 3000
2. Change `PORT=3001` in `.env` file
3. Or kill the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   ```

---

## 💡 Pro Tips

### Neon PostgreSQL

1. **Use Branches**: Neon allows you to create branch databases
   - Create a `dev` branch for development
   - Create a `staging` branch for testing
   - Use `main` for production

2. **Monitor Usage**: Check your usage in the Neon dashboard
   - Free tier: 0.5 GB storage, 0.25 vCPU
   - Upgrade if you exceed limits

3. **Connection Pooling**: Neon has built-in connection pooling
   - Your app's pool + Neon's pool = excellent performance

4. **Backups**: Neon automatically backs up your data
   - Point-in-time recovery available
   - No manual backup needed

### Upstash Redis

1. **Global Database**: Upgrade to Global for multi-region
   - Replicate to multiple regions
   - Lower latency worldwide

2. **REST API**: Upstash includes a REST API
   - No connection needed
   - Great for serverless functions

3. **Monitor Usage**: Free tier includes:
   - 10,000 commands/day
   - 256 MB storage
   - Upgrade if needed

4. **Data Browser**: Use built-in data browser
   - View and edit keys
   - Monitor real-time operations

---

## 🚀 Next Steps

Now that your environment is set up:

1. ✅ **Verify everything works**
   - Health check returns 200
   - No errors in console
   - Can query database
   - Can ping Redis

2. 📚 **Read the documentation**
   - [README.md](README.md) - Full project docs
   - [DEVELOPER_HANDOFF.md](DEVELOPER_HANDOFF.md) - Start developing

3. 🔨 **Start Phase 2**
   - Read `.rules/TASK_PLAN_PHASE2.md`
   - Implement authentication endpoints
   - Create user management

4. 🧪 **Run tests**
   - `npm test` in backend directory
   - Write new tests as you build features

---

## 📊 Quick Reference

### Connection Strings Format

**Neon PostgreSQL:**
```
postgresql://user:password@host/database?sslmode=require
```

**Upstash Redis:**
```
rediss://default:password@host:port
```

### Important URLs

- **Neon Dashboard**: https://console.neon.tech
- **Upstash Dashboard**: https://console.upstash.com
- **Local Health Check**: http://localhost:3000/health
- **Local API**: http://localhost:3000/api

### Environment Variables

```env
DATABASE_URL=your-neon-connection-string
REDIS_URL=your-upstash-connection-string
JWT_SECRET=generate-with-crypto
JWT_REFRESH_SECRET=generate-with-crypto
```

---

## 🎉 Success!

You now have:
- ✅ Neon PostgreSQL connected and schema imported
- ✅ Upstash Redis connected and ready
- ✅ Backend running successfully
- ✅ Environment configured correctly
- ✅ Ready to start Phase 2 development

**Your stack is fully serverless and production-ready!** 🚀

---

## 📞 Additional Resources

- **Neon Documentation**: https://neon.tech/docs
- **Upstash Documentation**: https://docs.upstash.com
- **Project README**: [README.md](README.md)
- **Quick Start Guide**: [QUICKSTART.md](QUICKSTART.md)
- **Developer Handoff**: [DEVELOPER_HANDOFF.md](DEVELOPER_HANDOFF.md)

---

## 📌 Important Notes

### Schema Import File Size
The schema file (`rfq_tendering_platform_schema_v3.sql`) is **547 lines**. Neon SQL Editor limits execution to **~187 lines at a time**.

**Solutions:**
1. **Manual splitting** - Follow [database/NEON_MANUAL_IMPORT.md](database/NEON_MANUAL_IMPORT.md) for step-by-step instructions
2. **Use psql** - No line limit (recommended if you have psql installed)
3. **Use database client** - Tools like DBeaver, pgAdmin, or TablePlus have no limits

---

**Last Updated:** Phase 1 Completion  
**Status:** ✅ Ready for Development with Neon & Upstash  
**Schema Import:** See NEON_MANUAL_IMPORT.md for splitting guide