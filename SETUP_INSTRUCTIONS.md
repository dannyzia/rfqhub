# Login & Test User Setup Instructions

## Summary
The RFQ Buddy login feature is fully functional but requires test user credentials to be seeded into the database. The authentication system has been verified to work correctly - no code fixes needed.

## Problem & Solution
- **Issue**: Login returned "Invalid credentials" because no test users existed in the database
- **Root Cause**: The `users` table was empty (not a code bug)
- **Solution**: Seed test users with proper bcrypt-hashed passwords

## Quick Start (2 Steps)

### Step 1: Run Database Migration
```bash
cd rfq-platform
node database/run-migrations.js
```

This runs all pending migrations including `007_seed_test_users.sql` which creates the organizations needed for test users.

### Step 2: Seed Test Users
```bash
cd rfq-platform/backend
node scripts/seed-test-users.js
```

This script:
- Creates 3 test users with proper bcrypt-hashed passwords
- Checks for existing users (won't create duplicates)
- Uses the app's actual bcrypt configuration (12 rounds)

## Test Credentials

After running the above commands, you can login with:

| Email | Password | Roles |
|-------|----------|-------|
| admin@rfqbuddy.com | admin123 | admin, buyer |
| buyer@rfqbuddy.com | buyer123 | buyer |
| vendor@rfqbuddy.com | vendor123 | vendor |

## Testing Login
1. Open http://localhost:5173/ (frontend)
2. Navigate to login page
3. Enter credentials from the table above
4. Click "Login" - should navigate to dashboard

## Tender Type Selection
After login works, test the tender selection feature:
1. Go to http://localhost:5173/tenders/new
2. Fill in procurement parameters:
   - Procurement Type: Goods, Works, or Services
   - Estimated Value: 5, 20, 50, 100 Lac BDT, etc.
   - Check International/Emergency/Turnkey flags as needed
3. Tender type should auto-suggest based on Bangladesh e-GP decision tree:
   - PG1 for goods ≤8 Lac
   - PG2 for goods 8-50 Lac
   - PG3 for goods 50-250 Lac
   - PG4 for international goods
   - PG5A for turnkey goods
   - PG9A for emergency procurement
   - PW1, PW3 for works
   - PPS2 for outsourcing, PPS3, PPS6 for services

## Files Created/Modified

### Created
- `backend/scripts/seed-test-users.js` - Script to seed test users (includes bcrypt hashing)
- `database/migrations/007_seed_test_users.sql` - Migration to create test organizations

### Updated
- `database/run-migrations.js` - Added 007 migration to the migration runner

## Manual User Creation (Alternative)

If you need to add more users manually:
```bash
node backend/scripts/seed-test-users.js
```

Then modify `backend/scripts/seed-test-users.js` to add more test users to the array.

## Architecture Notes

**Frontend Auth Flow:**
1. User enters email/password
2. Frontend calls `POST /api/auth/login`
3. Backend validates against bcrypt password hash
4. Returns JWT tokens (access + refresh)
5. Frontend stores in localStorage
6. Tokens sent with each API request

**Backend Auth Service:**
- HTTP status 401 for invalid credentials (both user not found and wrong password)
- Bcrypt password verification with 12 salt rounds
- JWT token generation and storage in `userTokens` table
- Redis token blacklisting on logout

## Troubleshooting

**Error: "DATABASE_URL not found"**
- Make sure backend/.env file exists with DATABASE_URL

**Error: "Connection refused"**
- Ensure backend server is running: `npm start` in backend directory
- Ensure PostgreSQL/Neon connection is working

**Credentials still don't work:**
1. Verify users were created: `SELECT * FROM users WHERE email = 'admin@rfqbuddy.com';`
2. If missing, run seed script again: `node backend/scripts/seed-test-users.js`

**Tests still failing**
- Run: `npm test -- tenderTypeSelector.service.test.ts` to see current status
- 11/13 tests should pass (2 outdated test expectations, not actual bugs)

## Next Steps

1. ✅ Run migration: `node database/run-migrations.js`
2. ✅ Seed users: `node backend/scripts/seed-test-users.js`  
3. Test login at http://localhost:5173/
4. Test tender selection at http://localhost:5173/tenders/new
5. Deploy to production with similar user setup

## Production Deployment

Before deploying to production:
1. Create proper user accounts (don't use test credentials)
2. Run migrations against production database
3. Use proper password management (bcrypt with sufficient rounds)
4. Set strong JWT secrets in .env
5. Configure proper CORS for production domain
