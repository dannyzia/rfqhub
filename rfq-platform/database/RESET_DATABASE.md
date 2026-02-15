# 🔄 Reset Neon Database to Clean Slate

## ⚠️ WARNING

**This will DELETE ALL DATA in your database!**

- All tables will be dropped
- All data will be lost
- This cannot be undone (unless you have a backup)

**Only do this if you want to start completely fresh.**

---

## 🎯 When to Use This

- You have old/test data you want to remove
- Schema import failed and you want to retry
- You want a clean database for development
- You're getting "relation already exists" errors

---

## 🚀 Method 1: Drop and Recreate Schema (Recommended)

This is the **safest and cleanest** method.

### Step 1: Open Neon SQL Editor

1. Go to https://console.neon.tech
2. Select your project
3. Click **"SQL Editor"**

### Step 2: Drop Everything

Copy and paste this command:

```sql
-- ⚠️ THIS WILL DELETE EVERYTHING!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Grant permissions (if needed)
GRANT ALL ON SCHEMA public TO neondb_owner;
GRANT ALL ON SCHEMA public TO public;
```

### Step 3: Click Run

- Click **"Run"** or press `Ctrl+Enter`
- You should see: "DROP SCHEMA" and "CREATE SCHEMA" success messages

### Step 4: Verify Clean State

```sql
-- Should return 0 tables
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';
```

**Expected result:** `table_count: 0`

### Step 5: Re-import Schema

Now follow the import guide:
- Manual: [NEON_MANUAL_IMPORT.md](NEON_MANUAL_IMPORT.md)
- Or use psql/database client

---

## 🚀 Method 2: Drop Individual Tables

If you only want to remove tables (keep other schema objects):

### List All Tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Drop All Tables at Once

```sql
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
    
    -- Drop all views
    FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;
END $$;
```

### Verify

```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

**Expected:** `0`

---

## 🚀 Method 3: Drop Specific Tables (Selective)

If you only want to drop certain tables:

```sql
-- Drop tables in correct order (reverse of creation order)
-- Drop dependent tables first to avoid foreign key issues

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS rfq_items CASCADE;
DROP TABLE IF EXISTS rfqs CASCADE;
DROP TABLE IF EXISTS supplier_invitations CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS company_profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Add any other tables you have
```

---

## 🚀 Method 4: Delete Data Only (Keep Tables)

If you want to keep the table structure but remove all data:

### Delete All Data from All Tables

```sql
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Disable triggers temporarily
    SET session_replication_role = replica;
    
    -- Truncate all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Re-enable triggers
    SET session_replication_role = DEFAULT;
END $$;
```

### Verify Data Deleted

```sql
-- Check users table (should be 0)
SELECT COUNT(*) FROM users;

-- Check companies table (should be 0)
SELECT COUNT(*) FROM companies;
```

---

## 🚀 Method 5: Neon Database Reset (Easiest)

Neon provides a built-in way to reset your database.

### Option A: Delete and Recreate Project

1. Go to Neon Console: https://console.neon.tech
2. Select your project
3. Click **"Settings"** → **"Delete"**
4. Create a new project
5. Import schema fresh

### Option B: Create New Branch

1. In Neon Console, go to your project
2. Click **"Branches"**
3. Create a new branch (e.g., "clean-start")
4. Use this branch for your fresh start
5. Update your `DATABASE_URL` in `.env`

---

## ✅ After Reset: Re-import Schema

Once you have a clean database, re-import the schema:

### Using Neon SQL Editor (3 parts)

Follow: [NEON_MANUAL_IMPORT.md](NEON_MANUAL_IMPORT.md)

### Using psql (All at once)

```bash
psql "postgresql://user:pass@host.neon.tech/db?sslmode=require" \
  -f ../Instructions/rfq_tendering_platform_schema_v3.sql
```

### Using Database Client

1. Connect to Neon
2. Open schema file
3. Execute all

---

## 🔍 Verification After Reset

### Check Clean State

```sql
-- Should return 0
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

### After Re-import

```sql
-- Should return 15-20
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

### Test Basic Queries

```sql
-- Should work without errors (but return 0 rows)
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM rfqs;
```

---

## ❌ Troubleshooting

### Error: "cannot drop schema public because other objects depend on it"

**Solution:** Use `CASCADE`:
```sql
DROP SCHEMA public CASCADE;
```

### Error: "must be owner of schema public"

**Solution:** You might not have permission. Try:
```sql
-- Check your role
SELECT current_user;

-- If not owner, contact Neon support or use a different method
```

### Error: "relation does not exist" after reset

**Cause:** Schema not re-imported  
**Solution:** Follow the import steps again

---

## 💡 Best Practices

### Before Reset

1. **Backup data** if you need it:
   ```sql
   -- Export specific data
   COPY (SELECT * FROM users) TO '/tmp/users_backup.csv' CSV HEADER;
   ```

2. **Confirm you're on the right database**:
   ```sql
   SELECT current_database();
   ```

3. **Double-check connection string** in `.env`

### After Reset

1. **Verify clean state** before re-importing
2. **Import schema immediately** after reset
3. **Test connection** from your backend app
4. **Restart your backend** to clear any cached connections

---

## 🎯 Recommended Workflow

**For Development:**

```
1. Reset database (Method 1 - Drop Schema)
2. Re-import schema (Neon Manual Import or psql)
3. Verify tables created
4. Update .env if needed
5. Restart backend: npm run dev
6. Verify connection in console logs
```

**For Production:**

⚠️ **NEVER reset production database!**
- Use migrations instead
- Create backups first
- Test in staging/development first

---

## 🔗 Related Guides

- [NEON_MANUAL_IMPORT.md](NEON_MANUAL_IMPORT.md) - How to import schema
- [NEON_UPSTASH_SETUP.md](../NEON_UPSTASH_SETUP.md) - Complete setup guide
- [README.md](README.md) - Database directory overview

---

## 📋 Quick Command Reference

### Complete Reset (Start Fresh)
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO neondb_owner;
GRANT ALL ON SCHEMA public TO public;
```

### Verify Clean
```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Should return 0
```

### After Import Verification
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
-- Should list all tables (15-20)
```

---

## ⚠️ Final Warning

**Double-check before running reset commands!**

- [ ] I understand this will delete all data
- [ ] I have backups if needed
- [ ] I'm connected to the correct database
- [ ] I'm ready to re-import the schema after reset
- [ ] This is NOT a production database

---

**Last Updated:** Phase 1 Completion  
**Status:** ✅ Multiple reset methods provided  
**Recommendation:** Use Method 1 (Drop Schema) for cleanest reset