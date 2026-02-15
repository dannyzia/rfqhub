# Production Environment Checklist

## Overview
This checklist validates that your `.env` configuration is production-ready for the Bangladesh e-GP Tender Types system.

**Status**: ✅ Updated with production defaults  
**Date**: February 7, 2026  
**Last Verified**: [Update after verification]

---

## 1. SERVER CONFIGURATION ✅

### Items to Verify:

- [x] **NODE_ENV=production** (Changed from development)
  - ✅ Running in production mode
  - ✅ All optimizations enabled
  
- [ ] **PORT=3000**
  - Verify: Your production server listens on this port
  - Alternative: Use reverse proxy (nginx) or load balancer
  - Recommend: Port 3000 for Node, 80/443 for nginx

- [ ] **CORS_ORIGINS**
  - Current: `https://rfqbuddy.example.com,https://api.rfqbuddy.example.com`
  - **ACTION REQUIRED**: Replace with your actual domain(s)
  - Format: Comma-separated HTTPS URLs only (no localhost)
  - Example: `https://procurement.gov.bd,https://etendering.gov.bd`

---

## 2. DATABASE CONFIGURATION ✅

### Neon PostgreSQL (Current Setup)

- [x] **DATABASE_URL is configured**
  - Current: `postgresql://neondb_owner:npg_fWriGwH68pRF@ep-purple-wind-ah3dk5w1-pooler.c-3.us-east-1.aws.neon.tech/rfq_platform?sslmode=verify-full&channel_binding=require`
  - ✅ Using secure SSL connection
  - ✅ Using connection pooler (recommended for serverless)

### Pre-Deployment Checks:

- [ ] **Database backup created**
  ```bash
  # Create backup
  pg_dump postgresql://user:password@host/rfq_platform > rfq_platform_backup.sql
  ```

- [ ] **Database size verified** (should be < 100MB initially)
  ```bash
  SELECT pg_size_pretty(pg_database_size('rfq_platform'));
  ```

- [ ] **All migrations applied**
  ```bash
  # Run from backend directory
  psql $DATABASE_URL < database/schema.sql
  psql $DATABASE_URL < database/schema_rls_and_triggers.sql
  psql $DATABASE_URL < database/schema_seed.sql
  ```

- [ ] **Tender types seeded (should be 14)**
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM tender_type_definitions;"
  # Expected: 14
  ```

- [ ] **All 7 indexes created**
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('tender_type_definitions', 'tender_type_document_requirements', 'tender_document_submissions');"
  # Expected: 20+ rows
  ```

- [ ] **Row-level security (RLS) enabled**
  ```bash
  psql $DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
  # Expected: Enabled on audit_logs and sensitive tables
  ```

---

## 3. REDIS CACHING ✅

### Upstash Redis (Current Setup)

- [x] **REDIS_URL is configured**
  - Current: `rediss://default:ASYrAAImcDJiMDA2YzA3N2IwNTk0ODE5ODg2ZTRkZWMzYTMyNjJiY3AyOTc3MQ@moved-ringtail-9771.upstash.io:6379`
  - ✅ Using secure TLS encryption (rediss://)
  - ✅ Upstash serverless Redis (recommended)

- [x] **Upstash REST API configured** (for serverless environments)
  - UPSTASH_REDIS_REST_URL ✅
  - UPSTASH_REDIS_REST_TOKEN ✅
  - Used by: Serverless functions, edge workers

### Pre-Deployment Checks:

- [ ] **Redis connectivity verified**
  ```bash
  redis-cli -u "$REDIS_URL" ping
  # Expected: PONG
  ```

- [ ] **Cache TTL configured**
  - Current: **TENDER_TYPE_CACHE_TTL=86400** (24 hours)
  - ✅ Appropriate for tender types (rarely change)

- [ ] **Memory usage monitored**
  ```bash
  redis-cli -u "$REDIS_URL" info memory
  # Check: used_memory_human (should stay <100MB)
  ```

- [ ] **Key expiration working**
  ```bash
  redis-cli -u "$REDIS_URL" TTL tender:type:pg1
  # Expected: ~86400 (or -2 if expired)
  ```

---

## 4. AUTHENTICATION (JWT) ✅

- [x] **JWT_SECRET configured**
  - Current: `2e2e7b2e7c8e4e2b8e2e7b2e7c8e4e2b8e2e7b2e7c8e4e2b` (32 characters)
  - ✅ Meets minimum length requirement
  - ⚠️ **CRITICAL**: This is visible in git. Use different secret in production!

- [x] **JWT_REFRESH_SECRET configured**
  - Current: `8e2e7b2e7c8e4e2b2e2e7b2e7c8e4e2b2e2e7b2e7c8e4e2b`
  - ⚠️ **CRITICAL**: Also visible in git. Generate new!

### Action Required:

1. **Generate new secrets for production** (never reuse demo secrets):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update both secrets in .env**:
   ```
   JWT_SECRET=<your-new-secret-here>
   JWT_REFRESH_SECRET=<your-new-refresh-secret-here>
   ```

3. **Store in secure vault** (never commit to git):
   - Use: AWS Secrets Manager, Vault, 1Password, Azure KeyVault
   - Configure CI/CD to inject during deploy

4. **Expiration times appropriate**:
   - JWT_EXPIRES_IN=15m ✅
   - JWT_REFRESH_EXPIRES_IN=7d ✅

---

## 5. EMAIL CONFIGURATION (SMTP) ⚠️

### Current Setup:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@rfqplatform.com
```

### Action Required:

- [ ] **Gmail SMTP (if using)**:
  1. Enable 2-factor authentication on Gmail account
  2. Generate App Password: https://support.google.com/accounts/answer/185833
  3. Set `SMTP_PASSWORD` to the app password (NOT regular password)
  4. Set `SMTP_USER` to your Gmail address

- [ ] **Production Email Service** (recommended):
  - **Option A**: SendGrid (recommended for high volume)
    ```
    SENDGRID_API_KEY=SG...
    ```
  - **Option B**: AWS SES (if using AWS)
    ```
    AWS_REGION=us-east-1
    ```
  - **Option C**: Mailgun (alternative)
    ```
    MAILGUN_API_KEY=...
    ```

- [ ] **Email verification**:
  ```javascript
  // Test endpoint
  POST /api/test/send-email
  {
    "to": "test@example.com",
    "subject": "Test",
    "body": "Test email"
  }
  ```

---

## 6. FILE STORAGE (S3/MinIO) ⚠️

### Current Setup (Development):
```
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=rfq-documents
S3_REGION=us-east-1
```

### Action Required:

Choose ONE file storage solution:

#### **Option A: AWS S3** (Recommended for Production)

1. **Create S3 bucket**:
   ```bash
   aws s3 mb s3://rfq-prod-documents --region us-east-1
   ```

2. **Create IAM user with S3 access**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::rfq-prod-documents/*"
       }
     ]
   }
   ```

3. **Update .env**:
   ```
   S3_ENDPOINT=https://s3.amazonaws.com
   S3_ACCESS_KEY=<your-access-key>
   S3_SECRET_KEY=<your-secret-key>
   S3_BUCKET=rfq-prod-documents
   S3_REGION=us-east-1
   ```

#### **Option B: MinIO (Self-Hosted)**

1. **Deploy MinIO to production**:
   ```bash
   docker run -d \
     --name minio \
     -p 9000:9000 \
     -p 9001:9001 \
     -e MINIO_ROOT_USER=admin \
     -e MINIO_ROOT_PASSWORD=<strong-password> \
     minio/minio server /data --console-address ":9001"
   ```

2. **Create bucket and user**:
   ```bash
   mc mb minio/rfq-documents
   mc admin user add minio rfq-upload <strong-password>
   mc admin policy attach minio readwrite --user rfq-upload
   ```

3. **Update .env**:
   ```
   S3_ENDPOINT=https://minio.your-domain.com
   S3_ACCESS_KEY=rfq-upload
   S3_SECRET_KEY=<strong-password>
   S3_BUCKET=rfq-documents
   ```

### Upload Directory Permissions (Local Fallback):

- [ ] **Directory created with correct permissions**:
  ```bash
  sudo mkdir -p /var/uploads/tender-documents
  sudo chown -R node:node /var/uploads/tender-documents
  sudo chmod -R 755 /var/uploads/tender-documents
  ```

- [ ] **UPLOAD_DIR configured**:
  - Current: `/var/uploads/tender-documents`
  - ✅ Absolute path (required in production)

- [ ] **MAX_FILE_SIZE_MB appropriate**:
  - Current: `10` (10MB max per file)
  - Suitable for: PDF documents, spreadsheets

---

## 7. RATE LIMITING ✅

- [x] **RATE_LIMIT_WINDOW_MS=900000** (15 minutes)
  - ✅ Standard configuration

- [x] **RATE_LIMIT_MAX_REQUESTS=100** (100 requests per 15 min)
  - ✅ Appropriate for tender API
  - Note: Suggestions endpoint may use lower limit (10 req/15 min)

### Tuning in Production:

```javascript
// Different limits for different endpoints
Suggestions API: 10 requests / 15 minutes
Standard API: 100 requests / 15 minutes
Upload API: 50 requests / 15 minutes
```

---

## 8. LOGGING ✅

- [x] **LOG_LEVEL=info** (Changed from debug)
  - ✅ Appropriate for production
  - Logs: errors, warnings, important info
  - Skips: debug trace, verbose details

### Configure Log Storage:

- [ ] **Centralized logging** (recommended):
  - Option A: ELK Stack (Elasticsearch, Logstash, Kibana)
  - Option B: CloudWatch (AWS)
  - Option C: Datadog / New Relic
  - Option D: Simple file rotation

- [ ] **Log retention policy**:
  - Error logs: 30 days
  - Info logs: 7 days
  - Debug logs: Development only

- [ ] **Monitor for errors**:
  ```bash
  # Check error logs
  tail -f /var/log/rfq-platform/errors.log
  ```

---

## 9. TENDER TYPES SPECIFIC CONFIGURATION ✅

### Cache Configuration:
- [x] **TENDER_TYPE_CACHE_TTL=86400** (24 hours)
  - ✅ Optimal for tender types (rarely change)
  - Fallback: Database query every 24 hours
  - Admin can force refresh: `DELETE FROM redis WHERE key LIKE 'tender:type:*'`

### Document Upload Configuration:
- [x] **UPLOAD_DIR=/var/uploads/tender-documents**
  - ✅ Production path configured
  - Verify directory exists: `ls -la /var/uploads/tender-documents`

- [x] **MAX_FILE_SIZE_MB=10**
  - ✅ Appropriate for tender documents

---

## 10. PRE-DEPLOYMENT VERIFICATION

### Run These Checks Before Going Live:

```bash
# 1. Environment variables loaded correctly
npm run check-env

# 2. Database connectivity
npm run check-db

# 3. All migrations applied
npm run check-schema

# 4. Redis connectivity
redis-cli -u "$REDIS_URL" ping

# 5. Build succeeds
npm run build

# 6. Tests pass
npm test -- --testPathPattern="service.test.ts"

# 7. Tender types accessible
curl http://localhost:3000/api/tender-types
```

---

## 11. CRITICAL CHANGES FOR PRODUCTION

### Must Change Before Deploy:

| Item | Development | Production | Status |
|------|-------------|-----------|--------|
| NODE_ENV | development | **production** | ✅ Changed |
| CORS_ORIGINS | localhost | **your-domain.com** | ⚠️ TODO |
| JWT_SECRET | demo-secret | **generate-new** | ⚠️ TODO |
| JWT_REFRESH_SECRET | demo-secret | **generate-new** | ⚠️ TODO |
| SMTP_PASSWORD | demo | **app-password** | ⚠️ TODO |
| S3 Setup | MinIO localhost | **AWS S3 or prod MinIO** | ⚠️ TODO |
| LOG_LEVEL | debug | **info** | ✅ Changed |
| FRONTEND_URL | localhost:5173 | **your-domain.com** | ⚠️ TODO |

---

## 12. SECURITY CHECKLIST

- [ ] **Secrets not in git**
  ```bash
  # Add to .gitignore
  .env
  .env.production
  .env.local
  ```

- [ ] **Use environment variables in CI/CD**
  - GitHub Actions: Secrets tab
  - GitLab CI: Protected variables
  - Jenkins: Credentials plugin

- [ ] **HTTPS enforced**
  - All CORS_ORIGINS must be HTTPS
  - Redis uses TLS (rediss://)
  - Database uses SSL

- [ ] **Database SSL verification**
  - DATABASE_URL includes `sslmode=verify-full`
  - Prevents man-in-the-middle attacks

- [ ] **Firewall rules configured**
  - Allow port 80/443 (frontend) from internet
  - Allow port 3000 only from load balancer/nginx
  - Allow database access only from app server
  - Allow Redis access only from app server

---

## 13. DEPLOYMENT COMMANDS

### Deploy Backend:

```bash
cd rfq-platform/backend

# Install dependencies
npm ci --production

# Run tests
npm test -- --testPathPattern="service.test.ts"

# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Or with Node
NODE_ENV=production node dist/server.js
```

### Deploy Frontend:

```bash
cd rfq-platform/frontend

# Install and build
npm ci
npm run build

# Deploy to web server
cp -r build/* /var/www/rfqbuddy/

# Or use PM2
pm2 start "npm run preview"
```

---

## 14. POST-DEPLOYMENT VERIFICATION

### Immediate (First 5 minutes):

```bash
# 1. API responds
curl https://your-domain.com/api/tender-types

# 2. Database connection
curl https://your-domain.com/api/status

# 3. Cache working
curl https://your-domain.com/api/tender-types (second request should be <50ms)

# 4. File upload works
curl -X POST https://your-domain.com/api/tenders/123/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"
```

### Extended (First hour):

```bash
# Run from DEPLOY_CHECKLIST_TENDER_TYPES.md
# Section: Post-Deployment Verification

# Example queries
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tender_type_definitions;"
redis-cli -u "$REDIS_URL" INFO stats
```

---

## 15. ROLLBACK PROCEDURE

If something goes wrong:

```bash
# 1. Stop application
pm2 stop rfq-platform-backend

# 2. Restore previous database backup
pg_restore --no-owner --role=postgres \
  -d rfq_platform rfq_platform_backup.sql

# 3. Revert to previous code
git checkout previous-release-tag
npm ci --production
npm run build

# 4. Clear Redis cache
redis-cli -u "$REDIS_URL" FLUSHDB

# 5. Restart
pm2 start ecosystem.config.js

# 6. Verify
curl https://your-domain.com/api/tender-types
```

**Estimated rollback time**: 5-10 minutes

---

## Summary

### ✅ Completed:
- NODE_ENV=production
- LOG_LEVEL=info  
- TENDER_TYPE_CACHE_TTL=86400
- UPLOAD_DIR configured
- JWT expiration times set
- Database SSL enabled
- Redis TLS enabled

### ⚠️ Action Required:
1. Replace CORS_ORIGINS with your domain
2. Replace FRONTEND_URL with your domain
3. Generate new JWT secrets
4. Configure production SMTP
5. Set up AWS S3 or production MinIO
6. Create MongoDB backup
7. Verify all 7 database indexes created
8. Test file upload to storage

### Next Steps:

1. ✅ Review this checklist
2. ⚠️ Complete all "Action Required" items above
3. ✅ Run pre-deployment verification commands
4. ✅ Execute database migrations
5. ✅ Deploy backend and frontend
6. ✅ Run post-deployment verification
7. ✅ Monitor for 24 hours for errors

**Status**: Review required before deployment ⏳

For detailed deployment steps, see: [DEPLOY_CHECKLIST_TENDER_TYPES.md](DEPLOY_CHECKLIST_TENDER_TYPES.md)

For monitoring queries, see: [database/monitoring/tender_type_health.sql](database/monitoring/tender_type_health.sql)
