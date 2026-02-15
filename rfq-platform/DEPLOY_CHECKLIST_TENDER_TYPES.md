# Tender Types Deployment Checklist

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Environment**: [ ] Staging [ ] Production  
**Sign-off**: _______________  

---

## Pre-Deployment Verification

### 1. Database Preparation

- [ ] Backup existing production database
  ```bash
  pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] Test migrations on staging database
  - [ ] Migrations run without errors
  - [ ] No data loss
  - [ ] All tables created successfully

- [ ] Verify 14 tender types seeded correctly
  ```sql
  SELECT COUNT(*) FROM tender_type_definitions;  -- Should return 14
  ```

- [ ] Verify document requirements seeded
  ```sql
  SELECT COUNT(*) FROM tender_type_document_requirements;  -- Should return > 20
  ```

- [ ] Check all indexes created (should be 7)
  ```sql
  SELECT COUNT(*) FROM pg_indexes 
  WHERE tablename IN ('tenders', 'tender_type_definitions', 
  'tender_type_document_requirements', 'tender_document_submissions');
  ```

- [ ] Test analytics views return data
  ```sql
  SELECT * FROM v_tender_type_usage LIMIT 1;
  SELECT * FROM v_document_compliance LIMIT 1;
  ```

---

### 2. Backend Preparation

- [ ] All unit tests passing
  ```bash
  npm test
  ```

- [ ] Integration tests passing
  ```bash
  npm test -- integration/tenderType.api.test.ts
  ```

- [ ] Code compiles without errors
  ```bash
  npm run build
  ```

- [ ] Environment variables set correctly in production `.env`:
  ```env
  TENDER_TYPE_CACHE_TTL=86400
  UPLOAD_DIR=/var/uploads/tender-documents
  MAX_FILE_SIZE_MB=10
  ENABLE_TENDER_TYPE_ANALYTICS=true
  NODE_ENV=production
  ```

- [ ] Redis cache configured and tested
  ```bash
  redis-cli PING  # Should return PONG
  ```

- [ ] File upload directory exists and is writable
  ```bash
  mkdir -p /var/uploads/tender-documents
  chmod 755 /var/uploads/tender-documents
  ```

- [ ] Rate limiting configured
  - [ ] Standard endpoints: 100 req/min per user
  - [ ] Suggestion endpoint: 10 req/min per user

---

### 3. Frontend Preparation

- [ ] Build succeeds
  ```bash
  npm run build
  ```

- [ ] No TypeScript errors
  ```bash
  npm run check
  ```

- [ ] Production build works locally
  ```bash
  npm run preview
  ```

- [ ] All components tested:
  - [ ] TenderTypeSelector modal opens and functions
  - [ ] Wizard steps 1-4 work correctly
  - [ ] Suggestions display with correct data
  - [ ] File upload component functional
  - [ ] Error boundaries active

---

### 4. Testing on Staging Environment

- [ ] Create PG1 tender with value 500,000 → SUCCEEDS
- [ ] Create PG2 tender with value 2,000,000 → SUCCEEDS
- [ ] Create PG1 tender with value 10,000,000 → FAILS with validation error
- [ ] Tender type wizard suggests correct types
- [ ] Real-time value validation works
- [ ] Document checklist displays correct requirements
- [ ] File upload works (test with PDF, JPG, DOCX)
- [ ] Bid submission blocked without mandatory documents
- [ ] Security calculations are correct:
  - [ ] PG1: 0% (no security)
  - [ ] PG2: 2% bid security, 5% performance security
  - [ ] PG3: 2% bid security, 5% performance security
- [ ] Suggestion accuracy: Recommended types match user selection 80%+ of time

---

## Deployment Steps

### Step 1: Database Migration (Production)

```bash
# 1. Connect to production server
ssh $PROD_USER@$PROD_HOST

# 2. Verify current database state
psql -h $NEON_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM tenders;"

# 3. Create backup
pg_dump -h $NEON_HOST -U $DB_USER -d $DB_NAME > /backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Run migrations
cd /var/www/rfq-platform/database
chmod +x migrate_tender_types.sh
./migrate_tender_types.sh

# 5. Verify migration success
psql -h $NEON_HOST -U $DB_USER -d $DB_NAME << EOF
SELECT COUNT(*) as tender_types FROM tender_type_definitions;
SELECT COUNT(*) as indexes FROM pg_indexes WHERE tablename IN 
  ('tenders', 'tender_type_definitions', 'tender_type_document_requirements', 'tender_document_submissions');
EOF
```

**Expected Output:**
```
tender_types | 14
indexes      | 20+ (including new 7)
```

### Step 2: Backend Deployment

```bash
cd /var/www/rfq-platform/backend

# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm ci --production

# 3. Run tests one final time
npm test

# 4. Build TypeScript
npm run build

# 5. Stop current service
pm2 stop rfq-backend

# 6. Start with new code
pm2 start ecosystem.config.js

# 7. Verify backend is running
curl -s -H "Authorization: Bearer $TEST_TOKEN" \
  http://localhost:3000/api/tender-types | jq '.data | length'
# Should return: 14
```

### Step 3: Frontend Deployment

```bash
cd /var/www/rfq-platform/frontend

# 1. Pull latest code
git pull origin main

# 2. Install and build
npm ci
npm run build

# 3. Deploy to web server
sudo cp -r build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html

# 4. Or if using PM2:
pm2 restart rfq-frontend

# 5. Clear browser cache (notify users)
```

### Step 4: Clear Caches

```bash
# Redis cache
redis-cli -h $REDIS_HOST FLUSHDB

# If using CDN:
# Invalidate CloudFront distribution
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

---

## Post-Deployment Verification

### Immediate Smoke Tests (First 15 minutes)

- [ ] Homepage loads: `curl https://api.yoursite.com`
- [ ] User login works
- [ ] Create tender page loads
- [ ] Tender type wizard launches and responds
- [ ] API endpoints responding:
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
    https://api.yoursite.com/api/tender-types
  ```
- [ ] Document upload works (test with small file)
- [ ] Existing tenders still display correctly
- [ ] Error pages display properly

### Extended Testing (First hour)

- [ ] No errors in backend logs
  ```bash
  tail -f /var/log/rfq-backend/error.log
  ```
- [ ] Database queries performing normally
  ```bash
  SELECT pg_stat_statements_reset();
  # Run representative queries, then check:
  SELECT query, calls, mean_time FROM pg_stat_statements 
  ORDER BY mean_time DESC LIMIT 10;
  ```
- [ ] Redis cache functional
  ```bash
  redis-cli PING
  redis-cli INFO stats
  ```
- [ ] API response times acceptable:
  - [ ] Cached list types: < 50ms
  - [ ] Cached single type: < 50ms
  - [ ] Suggestion: < 150ms
- [ ] No 5xx errors in access logs
  ```bash
  grep " 5" /var/log/nginx/access.log
  ```

### Production Monitoring (First 24 hours)

- [ ] Monitor error rate (should stay < 1%)
  ```bash
  tail -20 /var/log/rfq-backend/error.log
  ```
- [ ] Monitor slow queries
  ```bash
  # Check if any queries exceed 500ms
  ```
- [ ] Monitor Redis hit rate
  ```bash
  redis-cli INFO stats | grep hits
  ```
- [ ] Check API response time trends
- [ ] Audit logs recording correctly
  ```sql
  SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '1 hour';
  ```
- [ ] User feedback positive (no complaints)
- [ ] No data inconsistencies

---

## Rollback Procedure (If Needed)

**Triggers for rollback:**
- Error rate > 5%
- Database corruption detected
- Critical feature broken
- Data loss or incorrect calculations
- Security vulnerability discovered

**Rollback steps:**

```bash
# 1. Stop current services
pm2 stop all

# 2. Restore database backup
psql -h $NEON_HOST -U $DB_USER -d $DB_NAME < /backups/backup_TIMESTAMP.sql

# 3. Revert code to previous version
git revert HEAD

# 4. Rebuild and restart
npm ci --production
npm run build
pm2 start ecosystem.config.js

# 5. Clear caches
redis-cli FLUSHDB

# 6. Verify rollback successful
curl -s http://localhost:3000/api/tender-types | jq '.data | length'
```

**Estimated rollback time**: 5-10 minutes

---

## Success Criteria

✅ **All statements must be true before considering deployment successful:**

- [ ] All 14 tender types available and queryable
- [ ] Suggestion wizard functional and accurate
- [ ] Value validation working (accepts valid, rejects invalid)
- [ ] Document checklists generated correctly per type
- [ ] File uploads successful (all formats)
- [ ] Bid submission validation enforces all rules
- [ ] Security calculations correct for all types
- [ ] No increase in error rate from baseline
- [ ] API response times meet SLA (< 200ms for cached, < 500ms for uncached)
- [ ] Zero data loss from previous system
- [ ] User feedback positive
- [ ] No performance degradation on database
- [ ] Redis cache functioning (hit rate > 80%)
- [ ] Audit logs recording transactions

---

## Support Contacts

During and after deployment, contact:

| Role | Name | Email | Phone |
|------|------|-------|-------|
| DevOps Lead | _____________ | _____________ | _____________ |
| Database Admin | _____________ | _____________ | _____________ |
| Backend Lead | _____________ | _____________ | _____________ |
| Product Owner | _____________ | _____________ | _____________ |
| Emergency | _____________ | _____________ | _____________ |

---

## Deployment Sign-Off

**Deployment Summary:**
- Database Migrations: [ ] SUCCESS [ ] FAILED
- Backend Deployment: [ ] SUCCESS [ ] FAILED
- Frontend Deployment: [ ] SUCCESS [ ] FAILED
- All Tests Passed: [ ] YES [ ] NO
- Production Verified: [ ] YES [ ] NO

**Decision**: [ ] PROCEED [ ] ROLLBACK [ ] PAUSE

**Approved By**: _______________  Date: _______________

**Deployed By**: _______________  Date: _______________

**Notes**: _____________________________________________________________

---

**End of Deployment Checklist**
