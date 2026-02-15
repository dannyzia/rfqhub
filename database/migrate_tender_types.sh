#!/bin/bash
# database/migrate_tender_types.sh
# Description: Run all tender type migrations in order
# Phase 7, Task 37

set -e # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection parameters
DB_HOST="${DB_HOST:-your-neon-host.neon.tech}"
DB_USER="${DB_USER:-your-user}"
DB_NAME="${DB_NAME:-rfq_db}"
DB_SSLMODE="${DB_SSLMODE:-require}"

echo -e "${GREEN}🚀 Starting Tender Types Migration...${NC}"
echo -e "${YELLOW}Database: $DB_NAME @ $DB_HOST${NC}"
echo ""

# Check if database is reachable
echo -e "${YELLOW}Checking database connection...${NC}"
if ! psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
  echo -e "${RED}❌ Could not connect to database!${NC}"
  echo "Please check your database credentials."
  exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Migration 1: Tender type definitions table
echo -e "${YELLOW}📋 [1/7] Creating tender_type_definitions table...${NC}"
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/001_create_tender_type_definitions.sql > /dev/null; then
  echo -e "${GREEN}✓ tender_type_definitions table created${NC}"
else
  echo -e "${RED}✗ Failed to create tender_type_definitions table${NC}"
  exit 1
fi

# Migration 2: Document requirements table
echo -e "${YELLOW}📋 [2/7] Creating tender_type_document_requirements table...${NC}"
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/002_create_document_requirements.sql > /dev/null; then
  echo -e "${GREEN}✓ tender_type_document_requirements table created${NC}"
else
  echo -e "${RED}✗ Failed to create delimiter_type_document_requirements table${NC}"
  exit 1
fi

# Migration 3: Seed tender types
echo -e "${YELLOW}📋 [3/7] Seeding 14 tender types...${NC}"
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/003_seed_tender_types.sql > /dev/null; then
  echo -e "${GREEN}✓ Tender types seeded (14 types)${NC}"
else
  echo -e "${RED}✗ Failed to seed tender types${NC}"
  exit 1
fi

# Migration 4: Update tenders table
echo -e "${YELLOW}📋 [4/7] Updating tenders table...${NC}"
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/004_update_tenders_table.sql > /dev/null; then
  echo -e "${GREEN}✓ Tenders table updated${NC}"
else
  echo -e "${RED}✗ Failed to update tenders table${NC}"
  exit 1
fi

# Migration 5: Document submissions table
echo -e "${YELLOW}📋 [5/7] Creating tender_document_submissions table...${NC}"
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/005_create_tender_document_submissions.sql > /dev/null; then
  echo -e "${GREEN}✓ tender_document_submissions table created${NC}"
else
  echo -e "${RED}✗ Failed to create tender_document_submissions table${NC}"
  exit 1
fi

# Migration 6: Performance indexes
echo -e "${YELLOW}📋 [6/7] Adding performance indexes...${NC}"
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/006_add_tender_type_indexes.sql > /dev/null; then
  echo -e "${GREEN}✓ Performance indexes created (7 indexes)${NC}"
else
  echo -e "${RED}✗ Failed to create performance indexes${NC}"
  exit 1
fi

# Migration 7: Analytics views
echo -e "${YELLOW}📋 [7/7] Creating analytics views...${NC}"
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f views/tender_type_analytics.sql > /dev/null; then
  echo -e "${GREEN}✓ Analytics views created${NC}"
else
  echo -e "${RED}✗ Failed to create analytics views${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All migrations completed successfully!${NC}"
echo ""

# Verification
echo -e "${YELLOW}📊 Verification:${NC}"
echo ""
echo "Tender Types in database:"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  -c "SELECT code, name FROM tender_type_definitions ORDER BY code;" \
  --tuples-only --quiet

echo ""
echo "Database statistics:"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  -c "SELECT 
    (SELECT count(*) FROM tender_type_definitions) as tender_types,
    (SELECT count(*) FROM tender_type_document_requirements) as document_requirements,
    (SELECT count(*) FROM pg_indexes WHERE tablename IN ('tenders', 'tender_type_definitions', 'tender_type_document_requirements', 'tender_document_submissions')) as indexes_created;"

echo ""
echo -e "${GREEN}🎉 Tender Types system ready for use!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure .env with TENDER_TYPE_CACHE_TTL and other settings"
echo "2. Start the backend server: npm start"
echo "3. Test the APIs with Postman or curl"
echo "4. Monitor analytics views with: psql ... -c 'SELECT * FROM v_tender_type_usage;'"
