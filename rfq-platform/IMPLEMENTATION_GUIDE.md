# Multi-Tender Type & Live Tendering System - Implementation Guide

## Overview

This guide documents the implementation of the multi-tender type and live tendering system for the RFQ Buddy platform. The system supports both government and non-government organizations with distinct tender types and real-time auction capabilities.

## System Architecture

### Core Components

1. **Organization Type System**
   - Database field `organization_type` (government/non-government)
   - JWT token integration with organization type
   - Dashboard filtering based on organization type

2. **Tender Type System**
   - Government types: PG1-PG9A, PW1-PW3, PPS2-PPS6 (Bangladesh e-GP)
   - Non-government types: NRQ1-NRQ3 (Simple RFQ)
   - Value-based validation and suggestions

3. **Live Tendering System**
   - Real-time auction sessions with SSE streaming
   - Multiple bidding types: sealed, open reverse, open auction
   - Limited vendor access control
   - Session management and monitoring

### Database Schema

#### Key Tables

1. **organizations**
   - `organization_type` field added
   - Index on organization_type for fast filtering

2. **tender_type_definitions**
   - `is_govt_type` field to distinguish government vs non-government types
   - Value ranges and validation rules

3. **live_bidding_sessions**
   - Session lifecycle management
   - Bidding configuration and settings

4. **limited_tender_vendors**
   - Restricted access control for limited tenders

5. **live_bid_updates**
   - Real-time bid event tracking

### API Endpoints

#### Organization & Tender Type Endpoints

- `GET /tender-types` - List tender types filtered by organization type
- `POST /tender-types/suggest` - Get suggestions based on parameters
- `GET /tender-types/value-ranges` - Get value ranges for procurement types

#### Live Tendering Endpoints

- `POST /live-tendering/sessions` - Create live auction session
- `GET /live-tendering/sessions/:id` - Get session details
- `POST /live-tendering/sessions/:id/start` - Start session
- `POST /live-tendering/sessions/:id/end` - End session
- `GET /live-tendering/sessions/:id/stream` - SSE stream for updates
- `POST /live-tendering/bids` - Submit bid
- `GET /live-tendering/sessions/:id/access/:vendorId` - Check access

#### Migration Endpoints

- `POST /tender-migration/migrate` - Migrate tender to new mode
- `GET /tender-migration/history/:tenderId` - Get migration history
- `GET /tender-migration/stats` - Get system statistics

## Implementation Details

### Phase 1: Organization Type Foundation

**Files Modified:**
- `database/migrations/008_add_organization_type.sql`
- `backend/src/types/organization.types.ts`
- `backend/src/services/auth.service.ts`
- `frontend/src/routes/(app)/dashboard/+page.svelte`

**Key Changes:**
- Added `organization_type` column to organizations table
- Updated auth service to include organization type in JWT
- Replaced dashboard heuristic with database field

### Phase 2: Non-Government Tender Types

**Files Modified:**
- `database/migrations/009_seed_nongovt_tender_types.sql`
- `backend/src/services/tenderTypeSelector.service.ts`
- `backend/src/middleware/organizationType.middleware.ts`

**Key Changes:**
- Seeded NRQ1, NRQ2, NRQ3 tender types
- Added organization type filtering to services
- Created validation middleware

### Phase 3: Simple RFQ Integration

**Files Modified:**
- `frontend/src/routes/(app)/tenders/new/simple-rfq/+page.svelte`
- `backend/src/services/simpleRfq.service.ts`
- `backend/src/controllers/simpleRfqController.ts`
- `backend/src/schemas/tenderMode.schema.ts`

**Key Changes:**
- Enhanced Simple RFQ form with tender type selection
- Added value validation for NRQ types
- Updated API endpoints with validation

### Phase 4: Live Tendering Infrastructure

**Files Modified:**
- `database/migrations/010_live_tendering.sql`
- `backend/src/services/liveTendering.service.ts`
- `backend/src/controllers/liveTendering.controller.ts`

**Key Changes:**
- Complete live tendering database schema
- Session management service with Redis caching
- Advanced configuration and settings

### Phase 5: Live Tendering UI

**Files Modified:**
- `frontend/src/routes/(app)/tenders/new/live-auction/+page.svelte`
- `frontend/src/routes/(app)/tenders/[id]/live-dashboard/+page.svelte`

**Key Changes:**
- Live auction creation form with timing and settings
- Real-time bidding dashboard with SSE streaming
- Countdown timers and bid history

### Phase 6: Integration & Testing

**Files Modified:**
- `database/migrations/011_tender_mode_migration.sql`
- `backend/src/middleware/limitedTenderAccess.middleware.ts`
- `backend/src/services/tenderMigration.service.ts`
- `tests/integration/tenderTypes.test.ts`

**Key Changes:**
- Limited tendering access control middleware
- Tender mode migration support
- Comprehensive testing framework

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/rfq_platform

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# SSE Configuration
SSE_HEARTBEAT_INTERVAL=30000  # 30 seconds
```

### Redis Setup

The system uses Redis for:
- Session caching
- SSE event streaming
- Bid update notifications
- Performance optimization

```bash
# Install Redis
npm install redis

# Configure Redis connection
const redisClient = createClient({
  url: process.env.REDIS_URL
});
```

## Deployment

### Database Migration

Run migrations in order:

```bash
# Phase 1: Organization Type
psql -U postgres -d rfq_platform -f database/migrations/008_add_organization_type.sql

# Phase 2: Non-Government Tender Types
psql -U postgres -d rfq_platform -f database/migrations/009_seed_nongovt_tender_types.sql

# Phase 4: Live Tendering
psql -U postgres -d rfq_platform -f database/migrations/010_live_tendering.sql

# Phase 6: Migration Support
psql -U postgres -d rfq_platform -f database/migrations/011_tender_mode_migration.sql
```

### Backend Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server
npm start
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/integration/tenderTypes.test.ts
```

### Integration Tests

```bash
# Test tender type suggestions
curl -X POST http://localhost:3000/tender-types/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "procurementType": "goods",
    "estimatedValue": 500000,
    "currency": "BDT",
    "organizationType": "non-government"
  }'

# Test live session creation
curl -X POST http://localhost:3000/live-tendering/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "tenderId": "tender-uuid",
    "scheduledStart": "2026-02-12T10:00:00Z",
    "scheduledEnd": "2026-02-12T10:30:00Z",
    "biddingType": "open_auction",
    "settings": {
      "minBidIncrement": 1000,
      "bidVisibility": "hidden"
    }
  }'
```

## Monitoring & Maintenance

### Performance Monitoring

1. **Database Performance**
   - Monitor query performance on tender type filtering
   - Check index usage on organization_type and is_govt_type
   - Monitor live bidding session table growth

2. **Redis Performance**
   - Monitor memory usage for session caching
   - Check SSE connection counts
   - Monitor pub/sub message rates

3. **Application Performance**
   - Monitor API response times
   - Check SSE connection stability
   - Monitor bid submission latency

### Maintenance Tasks

1. **Database Maintenance**
   - Regular cleanup of old live bidding sessions
   - Update tender type definitions as needed
   - Monitor and optimize slow queries

2. **Redis Maintenance**
   - Regular cache cleanup
   - Monitor memory usage and eviction policies
   - Check connection pool health

3. **Application Maintenance**
   - Update dependencies regularly
   - Monitor error logs
   - Review and update validation rules

## Troubleshooting

### Common Issues

1. **Tender Type Not Found**
   - Check organization_type field in organizations table
   - Verify tender type definitions are seeded
   - Check middleware validation

2. **Live Session Not Starting**
   - Verify scheduled start time is in future
   - Check Redis connection for event streaming
   - Monitor session status updates

3. **SSE Connection Issues**
   - Check Redis pub/sub configuration
   - Verify CORS settings
   - Monitor heartbeat intervals

### Debug Commands

```bash
# Check organization types
SELECT organization_type, COUNT(*) FROM organizations GROUP BY organization_type;

# Check tender type definitions
SELECT code, name, is_govt_type FROM tender_type_definitions WHERE is_active = true;

# Check live sessions
SELECT id, status, scheduled_start, scheduled_end FROM live_bidding_sessions ORDER BY scheduled_start;

# Check Redis connections
redis-cli info clients
```

## Security Considerations

1. **Access Control**
   - Organization type validation on all tender operations
   - Limited tender access control for restricted sessions
   - Proper JWT validation and organization type checking

2. **Data Validation**
   - Comprehensive input validation for all API endpoints
   - Value range validation for tender types
   - Bid amount validation for live sessions

3. **Audit Logging**
   - All tender mode changes are logged
   - Access attempts to limited tenders are tracked
   - Bid submissions are audited

## Future Enhancements

1. **Additional Bidding Types**
   - English auction support
   - Dutch auction support
   - Hybrid bidding systems

2. **Advanced Analytics**
   - Bid pattern analysis
   - Vendor performance metrics
   - Tender success rate tracking

3. **Integration Features**
   - External payment gateway integration
   - Document management system integration
   - Mobile application support

## Support

For technical support or questions about this implementation:

1. Check the troubleshooting section above
2. Review the test files for usage examples
3. Check the error logs for specific issues
4. Consult the database schema documentation

## License

This implementation is part of the RFQ Buddy platform and follows the project's licensing terms.