# 🚀 Quick Reference - Database Operations

## 🔥 Most Common Commands

### Reset Database (Clean Slate)
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO neondb_owner;
GRANT ALL ON SCHEMA public TO public;
```

### Check Table Count
```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

### List All Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

### Check Current Database
```sql
SELECT current_database();
```

### Delete All Data (Keep Tables)
```sql
DO $$ 
DECLARE r RECORD;
BEGIN
    SET session_replication_role = replica;
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    SET session_replication_role = DEFAULT;
END $$;
```

---

## 📖 Common Tasks

### Task: Import Schema (Neon SQL Editor)
**Problem:** Schema is 547 lines, Neon limit is 187 lines

**Solution:** Split into 3 parts
1. Lines 1-200 (Companies, Users)
2. Lines 201-400 (RFQs, Quotations)
3. Lines 401-547 (Notifications, Indexes)

📖 **Full Guide:** [NEON_MANUAL_IMPORT.md](NEON_MANUAL_IMPORT.md)

---

### Task: Import Schema (Command Line)
```bash
cd RFQ_Buddy/Instructions
psql "postgresql://user:pass@host.neon.tech/db?sslmode=require" \
  -f rfq_tendering_platform_schema_v3.sql
```

---

### Task: Reset and Re-import
```sql
-- 1. Reset
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO neondb_owner;

-- 2. Verify clean (should return 0)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- 3. Then import schema (see NEON_MANUAL_IMPORT.md)
```

---

### Task: Check Schema is Complete
```sql
-- Should return 15-20 tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- List tables to verify
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

Expected tables:
- companies
- company_profiles
- users
- user_profiles
- user_sessions
- rfqs
- rfq_items
- quotations
- quotation_items
- supplier_invitations
- documents
- notifications
- activity_logs
- audit_logs

---

### Task: Check Table Structure
```sql
-- See columns in users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- See all indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' ORDER BY tablename;
```

---

### Task: Test Data Queries
```sql
-- Count rows in each table
SELECT 'users' as table, COUNT(*) as rows FROM users
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'rfqs', COUNT(*) FROM rfqs
UNION ALL
SELECT 'quotations', COUNT(*) FROM quotations;
```

---

## 🔗 Documentation Quick Links

| Need to... | See Document |
|------------|--------------|
| Reset database | [RESET_DATABASE.md](RESET_DATABASE.md) |
| Import schema manually | [NEON_MANUAL_IMPORT.md](NEON_MANUAL_IMPORT.md) |
| Overview of solutions | [README.md](README.md) |
| Setup Neon & Upstash | [../NEON_UPSTASH_SETUP.md](../NEON_UPSTASH_SETUP.md) |

---

## 🆘 Troubleshooting

### "relation already exists"
**Fix:** Reset database first
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO neondb_owner;
```

### "line limit exceeded" in Neon
**Fix:** Use manual splitting guide - [NEON_MANUAL_IMPORT.md](NEON_MANUAL_IMPORT.md)

### "syntax error"
**Fix:** Make sure you copied complete SQL statements (from CREATE to semicolon)

### Backend can't connect
**Fix:** Check DATABASE_URL in .env
```env
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
```

---

## 💡 Pro Tips

1. **Always verify clean state before importing**
   ```sql
   SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
   ```

2. **Use psql for fastest import** (no splitting needed)
   ```bash
   psql "connection-string" -f schema.sql
   ```

3. **Check connection string format**
   - Must end with `?sslmode=require`
   - Must use `postgresql://` (not `postgres://`)

4. **After reset, restart your backend**
   ```bash
   npm run dev
   ```

---

## 📋 Verification Checklist

After import:
- [ ] Table count is 15-20
- [ ] Can list all tables
- [ ] Can query: `SELECT * FROM users LIMIT 1;`
- [ ] Can query: `SELECT * FROM companies LIMIT 1;`
- [ ] Backend connects successfully
- [ ] No errors in console

---

**Quick Access:**
- Reset: [RESET_DATABASE.md](RESET_DATABASE.md)
- Import: [NEON_MANUAL_IMPORT.md](NEON_MANUAL_IMPORT.md)
- Overview: [README.md](README.md)