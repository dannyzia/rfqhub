# 📖 Neon Manual Schema Import Guide

## 🎯 Problem

Neon SQL Editor has a limit of **~187 lines per execution**, but our schema file is **547 lines**. We need to split it into manageable chunks.

## ✅ Solution: Copy-Paste in Sections

Follow this guide to import the schema in **3 easy parts** using Neon's SQL Editor.

---

## ⚠️ Already Have Data? Need to Reset?

If you already ran the schema import and want to start fresh (clean slate):

👉 **See:** [RESET_DATABASE.md](RESET_DATABASE.md) - Complete guide to reset your database

**Quick Reset Command:**
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO neondb_owner;
```

Then continue with the import steps below.

---

## 📋 Prerequisites

- [ ] Neon account created
- [ ] Neon project created
- [ ] Schema file location: `RFQ_Buddy/Instructions/rfq_tendering_platform_schema_v3.sql`
- [ ] Text editor open (VS Code, Notepad++, etc.)
- [ ] Database is clean (no existing tables - see [RESET_DATABASE.md](RESET_DATABASE.md) if needed)

---

## 🚀 Part 1: Extensions, Companies & Users (Lines 1-187)

### Step 1: Open Schema File

Open `rfq_tendering_platform_schema_v3.sql` in your text editor.

### Step 2: Copy Lines 1-187

**Start from:** Line 1 (the very beginning)  
**Stop at:** The line BEFORE the first `CREATE TABLE rfqs` statement

**What to copy:**
- `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- All company-related tables (`companies`, `company_profiles`)
- All user-related tables (`users`, `user_profiles`, `user_sessions`)
- Stop BEFORE `CREATE TABLE rfqs`

### Step 3: Paste and Execute in Neon

1. Go to Neon Console: https://console.neon.tech
2. Click **"SQL Editor"**
3. Paste the copied content
4. Click **"Run"** (or press `Ctrl+Enter`)
5. Wait for **"Success"** message

### Expected Result
✅ Tables created:
- `companies`
- `company_profiles`
- `users`
- `user_profiles`
- `user_sessions`

---

## 🚀 Part 2: RFQs, Quotations & Documents (Lines 188-374)

### Step 1: Find Starting Point

In the schema file, find the line that says:
```sql
-- 3. RFQ MANAGEMENT
-- or
CREATE TABLE rfqs
```

### Step 2: Copy Lines 188-374

**Start from:** `CREATE TABLE rfqs` (or the RFQ section comment)  
**Stop at:** Just BEFORE `CREATE TABLE notifications`

**What to copy:**
- All RFQ tables (`rfqs`, `rfq_items`, `rfq_attachments`)
- All quotation tables (`quotations`, `quotation_items`)
- Supplier invitations table
- Documents/attachments tables
- Stop BEFORE notifications table

### Step 3: Paste and Execute in Neon

1. Clear the SQL Editor
2. Paste the copied content
3. Click **"Run"**
4. Wait for success

### Expected Result
✅ Tables created:
- `rfqs`
- `rfq_items`
- `quotations`
- `quotation_items`
- `supplier_invitations`
- `documents`

---

## 🚀 Part 3: Notifications, Audit & Indexes (Lines 375-547)

### Step 1: Find Starting Point

Find the line that says:
```sql
-- 6. NOTIFICATIONS
-- or
CREATE TABLE notifications
```

### Step 2: Copy Lines 375-547

**Start from:** `CREATE TABLE notifications`  
**Stop at:** End of file

**What to copy:**
- Notifications table
- Activity logs
- Audit logs
- All `CREATE INDEX` statements
- All triggers and functions
- Everything until the end of the file

### Step 3: Paste and Execute in Neon

1. Clear the SQL Editor
2. Paste the copied content
3. Click **"Run"**
4. Wait for success

### Expected Result
✅ Tables created:
- `notifications`
- `activity_logs`
- `audit_logs`

✅ Indexes created on all tables  
✅ Triggers set up

---

## ✅ Verification

After completing all 3 parts, verify everything is set up:

### Check Table Count

Run this in Neon SQL Editor:
```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';
```

**Expected:** 15-20 tables

### List All Tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables:**
- activity_logs
- audit_logs
- companies
- company_profiles
- documents
- notifications
- quotation_items
- quotations
- rfq_items
- rfqs
- supplier_invitations
- user_profiles
- user_sessions
- users
- (and possibly more)

### Test a Query

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

Should show all columns in the users table.

---

## 🔄 Need to Start Over?

If something went wrong or you want to reset:

👉 **See:** [RESET_DATABASE.md](RESET_DATABASE.md)

**Quick Reset and Restart:**
1. Run reset command in Neon SQL Editor
2. Verify clean state (0 tables)
3. Start from Part 1 above
4. Complete all 3 parts
5. Verify final table count

---

## 📝 Alternative: Exact Line Numbers Method

If you want to be super precise, here are the EXACT sections:

### Part 1: Lines 1-200
Copy from **start** to the line containing `-- 3. RFQ MANAGEMENT` or similar

### Part 2: Lines 201-400
Copy from **RFQ section** to just before notifications

### Part 3: Lines 401-547
Copy from **notifications** to **end of file**

---

## 🔍 Smart Splitting Strategy

Instead of counting lines, split by **table groups**:

### Chunk 1: Foundation
```
✅ Extensions
✅ Companies & company_profiles
✅ Users & user_profiles
✅ User_sessions
```

### Chunk 2: Core Business
```
✅ RFQs & rfq_items
✅ Quotations & quotation_items
✅ Supplier_invitations
✅ Documents
```

### Chunk 3: Supporting Systems
```
✅ Notifications
✅ Activity_logs
✅ Audit_logs
✅ All CREATE INDEX statements
✅ All triggers
```

---

## ❌ Troubleshooting

### Error: "relation already exists"

**Cause:** You already ran this part before, or have old data

**Solution:**
- **Option A:** Skip to the next part
- **Option B:** Reset and start fresh

👉 **See:** [RESET_DATABASE.md](RESET_DATABASE.md) for complete reset instructions

**Quick Reset:**
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO neondb_owner;
```

Then start from Part 1 again.

### Error: "syntax error at or near..."

**Solution:**
- You didn't copy a complete CREATE TABLE statement
- Make sure you copied from `CREATE TABLE` to the ending semicolon `;`
- Check you didn't cut off in the middle of a table definition

### Error: "column does not exist"

**Solution:**
- You skipped a part or ran them out of order
- Foreign keys need their referenced tables to exist first
- Start fresh and run parts in order: 1 → 2 → 3

### Error: "line limit exceeded"

**Solution:**
- Your chunk is too big (>187 lines)
- Split it into smaller pieces
- Find a natural break point (between tables)
- Run the first half, then the second half

---

## 💡 Pro Tips

### Tip 1: Use "Find" Feature
Most text editors have line numbers. Use `Ctrl+G` (VS Code) to jump to specific lines.

### Tip 2: Look for Comments
The schema file has section comments like:
- `-- 1. ORGANIZATIONS & USERS`
- `-- 3. RFQ MANAGEMENT`

Use these as natural split points!

### Tip 3: Split at Table Boundaries
Always start and end your copy at a complete `CREATE TABLE ... ;` statement.

### Tip 4: Save Your Progress
After each successful part, you can verify:
```sql
\dt  -- List tables (if using psql)
-- or in Neon SQL Editor:
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

---

## 🎯 Quick Reference: Where to Split

### Split Point 1: After Users, Before RFQs
**Look for:**
```sql
-- End of user-related tables
);

-- Beginning of RFQ section
CREATE TABLE rfqs (
```

### Split Point 2: After Quotations, Before Notifications
**Look for:**
```sql
-- End of quotation/document tables
);

-- Beginning of notifications
CREATE TABLE notifications (
```

---

## ✅ Completion Checklist

- [ ] Part 1 executed successfully
- [ ] Part 2 executed successfully  
- [ ] Part 3 executed successfully
- [ ] Table count verified (15-20 tables)
- [ ] Can query `users` table
- [ ] Can query `rfqs` table
- [ ] Can query `quotations` table
- [ ] No errors in Neon SQL Editor

---

## 🎉 Success!

Once all parts are executed:
- ✅ Your database schema is complete
- ✅ All tables are created
- ✅ All indexes are set up
- ✅ All triggers are active
- ✅ Ready to connect your backend application

**Next Steps:**
1. Update your `.env` file with the Neon connection string
2. Start your backend: `npm run dev`
3. Verify connection in the console logs

---

## 📞 Alternative Methods

### Method A: Use psql Command Line (No splitting needed!)

If you have `psql` installed locally:
```bash
psql "your-neon-connection-string" -f rfq_tendering_platform_schema_v3.sql
```

This runs the entire file at once!

### Method B: Use Neon's Database Branching

1. Create a test branch in Neon
2. Try importing the schema there first
3. If successful, merge or copy to main branch

### Method C: Use a PostgreSQL Client

Tools like **DBeaver**, **pgAdmin**, or **TablePlus** don't have line limits:
1. Connect to your Neon database
2. Open the SQL file
3. Execute all at once

---

**Last Updated:** Phase 1 Completion  
**Schema Version:** v3.0  
**Total Lines:** 547  
**Recommended Parts:** 3  
**Neon Line Limit:** ~187 lines per execution

---

## 🔗 Related Guides

- [RESET_DATABASE.md](RESET_DATABASE.md) - Reset database to clean slate
- [README.md](README.md) - Database directory overview
- [../NEON_UPSTASH_SETUP.md](../NEON_UPSTASH_SETUP.md) - Complete Neon setup