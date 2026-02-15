# DEVELOPER CODING PLAN - Multi-Tender Type & Live Tendering System

**Online RFQ & Tendering Platform - Tender Type Expansion**

Step-by-Step Guide for Implementing Simple RFQ, Detailed RFT, and Live Tendering

Based on existing Technical PRD v3.1 | Schema v3.0 | February 2026

**3 Phases • 18 Tasks**

---

## 1. How to Read This Document

This plan extends the existing RFQ platform to support:
- Simple RFQ for non-government organizations
- Detailed RFT/Tender for government compliance
- Live tendering with real-time auction bidding
- Limited tendering with vendor pre-selection

**The Golden Rules**
- Complete one Task at a time in exact order
- Test after every Task
- Never skip validation steps
- All database changes must have migration scripts

---

## 2. Phase Overview Map

| **Phase** | **Name** | **What You Build** | **Unlocks** |
|-----------|----------|-------------------|-------------|
| 1 | Tender Type Selection & Simple RFQ | Dashboard tender type selection, Simple RFQ flow | Fast non-govt procurement |
| 2 | Detailed RFT/Tender | Full government-compliant tendering | Audit-ready govt procurement |
| 3 | Live Tendering | Real-time auction bidding, limited tendering | Dynamic pricing, vendor pre-selection |

---

## PHASE 1: TENDER TYPE SELECTION & SIMPLE RFQ

### **Task 1 — Database Schema Updates for Tender Types**

```sql
ALTER TABLE tenders 
ADD COLUMN tender_mode VARCHAR(20) NOT NULL DEFAULT 'detailed' 
  CHECK (tender_mode IN ('simple_rfq', 'detailed_rft', 'live_auction')),
ADD COLUMN is_govt_tender BOOLEAN DEFAULT true,
ADD COLUMN live_bidding_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN live_bidding_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN live_bidding_duration_minutes INTEGER;

CREATE INDEX idx_tenders_mode ON tenders(tender_mode);
```

---

### **Task 2 — TypeScript Types for Tender Modes**

**Create `backend/src/types/tender.types.ts`**

Key enums: `TenderMode`, `RfqType`, `PaymentTerm`

Interfaces: `SimpleRfqData`, `DetailedRftData`, `LiveTenderingConfig`

---

### **Task 3 — Validation Schemas with Zod**

**Update `backend/src/schemas/tender.schema.ts`**

- `simpleRfqSchema` - validates Simple RFQ inputs
- `detailedRftSchema` - validates Detailed RFT with weightage validation
- `liveTenderingSchema` - validates live tender configuration

---

### **Task 4 — Dashboard Tender Type Selection UI**

**Create `frontend/src/routes/(app)/dashboard/+page.svelte`**

Three card-based options:
1. Simple RFQ - "I just need prices"
2. Detailed RFT - "This must survive audits"
3. Live Tendering - "Real-time auction bidding"

---

### **Task 5 — Simple RFQ Creation Form**

**Create `frontend/src/routes/(app)/tenders/new/simple-rfq/+page.svelte`**

Sections:
- Buyer Information
- RFQ Details
- Items (repeatable)
- Commercial Details

Auto-publishes on creation.

---

### **Task 6 — Simple RFQ Backend Controller**

**Create `backend/src/controllers/simpleRfqController.ts`**

Functions:
- `createSimpleRfq` - handles creation with auto-publish
- `getSimpleRfqResponseForm` - returns vendor quote form

Generates RFQ reference: `RFQ-YYYY-XXXXX`

---

## PHASE 2: DETAILED RFT/TENDER IMPLEMENTATION

### **Task 7 — Database Schema for Detailed RFT Fields**

```sql
ALTER TABLE tenders
ADD COLUMN department VARCHAR(200),
ADD COLUMN funding_source VARCHAR(50),
ADD COLUMN pre_bid_meeting_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN clarification_deadline TIMESTAMP WITH TIME ZONE,
-- ... (20+ additional columns for govt compliance)

CREATE TABLE bid_security_requirements (...);
CREATE TABLE vendor_eligibility_criteria (...);
CREATE TABLE vendor_eligibility_submissions (...);
```

---

### **Task 8 — Detailed RFT Creation Form**

**Create `frontend/src/routes/(app)/tenders/new/detailed-rft/+page.svelte`**

6-step wizard:
1. Procuring Entity Details
2. Tender Timeline
3. Scope of Work
4. Commercial Terms
5. Financial Terms & Bid Security
6. Evaluation Criteria

Validates weightage sum = 100%

---

### **Task 9 — Backend Controller for Detailed RFT**

**Create `backend/src/controllers/detailedRftController.ts`**

Handles:
- Multi-step validation
- Bid security requirements
- Eligibility criteria setup
- Transaction management

---

## PHASE 3: LIVE TENDERING WITH AUCTION-STYLE BIDDING

### **Task 10 — Database Schema for Live Tendering**

```sql
CREATE TABLE live_bidding_sessions (
  id UUID PRIMARY KEY,
  tender_id UUID UNIQUE REFERENCES tenders(id),
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('scheduled', 'active', 'paused', 'completed')),
  bidding_type VARCHAR(20) CHECK (bidding_type IN ('sealed', 'open_reverse', 'open_auction')),
  current_best_bid_id UUID,
  total_bids_submitted INTEGER DEFAULT 0
);

CREATE TABLE live_bid_updates (...);
CREATE TABLE limited_tender_vendors (...);
```

---

### **Task 11 — Live Tendering Configuration Schema**

**Add to `backend/src/schemas/tender.schema.ts`**

Validates:
- Scheduled start time (must be future)
- Duration (30-480 minutes)
- Vendor pre-selection logic
- Bidding type rules

---

### **Task 12 — Backend: Live Tender Creation**

**Create `backend/src/controllers/liveTenderController.ts`**

Functions:
- `createLiveTender` - schedules session, invites vendors
- `checkLimitedTenderAccess` - middleware for access control

Uses Redis sorted set for scheduling: `redis.zadd('live_sessions:scheduled', ...)`

---

### **Task 13 — Backend: Live Session Management**

**Create `backend/src/services/liveSessionService.ts`**

Background service that:
- Polls every 10 seconds for session state changes
- Auto-starts sessions at `scheduled_start`
- Auto-ends sessions at `scheduled_end`
- Publishes events to Redis pub/sub

Methods:
- `start()` - starts polling
- `startScheduledSessions()` - activates sessions
- `endActiveSessions()` - closes sessions
- `submitLiveBid()` - validates and records bids

---

### **Task 14 — Frontend: Live Tender Creation Form**

**Create `frontend/src/routes/(app)/tenders/new/live-auction/+page.svelte`**

Features:
- Date/time picker for scheduled start
- Duration slider
- Bidding type selector (sealed/open reverse/open auction)
- Vendor pre-selection for limited tenders
- Real-time vendor query when limited mode enabled

---

### **Task 15 — Frontend: Live Bidding Dashboard**

**Create `frontend/src/routes/(app)/tenders/[id]/live-dashboard/+page.svelte`**

Real-time components:
- Countdown timer
- Current best bid display
- Bid submission form
- Live bid feed (using SSE)

Uses EventSource API for real-time updates.

---

### **Task 16 — Backend: SSE Stream for Live Updates**

**Add to `backend/src/controllers/liveTenderController.ts`**

`streamLiveUpdates()`:
- Sets SSE headers
- Subscribes to Redis pub/sub channels
- Streams bid updates to connected clients
- Sends heartbeat every 30s
- Cleans up on disconnect

---

### **Task 17 — Testing & Validation**

Test all three tender types end-to-end:

**Simple RFQ:**
- [ ] Create with all fields
- [ ] Auto-publish works
- [ ] Vendor quote submission
- [ ] Buyer comparison view

**Detailed RFT:**
- [ ] Wizard validation
- [ ] All govt fields captured
- [ ] Bid security requirements
- [ ] Evaluation workflow

**Live Tendering:**
- [ ] Schedule future session
- [ ] Auto-start at scheduled time
- [ ] Real-time bid submission
- [ ] SSE updates for all clients
- [ ] Auto-close at end
- [ ] Limited tender access control

---

### **Task 18 — Documentation & Training**

Create user guides:
- `Tender_Type_Selection_Guide.md`
- `Simple_RFQ_Quickstart.md`
- `Detailed_RFT_Compliance_Checklist.md`
- `Live_Tendering_Best_Practices.md`

---

## 3. Quick Reference - All 18 Tasks

| **#** | **Task** | **Phase** | **Key Files** |
|-------|----------|-----------|---------------|
| 1 | Database schema for tender types | 1 | Migration SQL |
| 2 | TypeScript types | 1 | `types/tender.types.ts` |
| 3 | Zod validation schemas | 1 | `schemas/tender.schema.ts` |
| 4 | Dashboard UI | 1 | `routes/(app)/dashboard/+page.svelte` |
| 5 | Simple RFQ form | 1 | `routes/(app)/tenders/new/simple-rfq/+page.svelte` |
| 6 | Simple RFQ controller | 1 | `controllers/simpleRfqController.ts` |
| 7 | Detailed RFT schema | 2 | Migration SQL |
| 8 | Detailed RFT wizard | 2 | `routes/(app)/tenders/new/detailed-rft/+page.svelte` |
| 9 | Detailed RFT controller | 2 | `controllers/detailedRftController.ts` |
| 10 | Live tendering schema | 3 | Migration SQL |
| 11 | Live tender validation | 3 | `schemas/tender.schema.ts` |
| 12 | Live tender creation | 3 | `controllers/liveTenderController.ts` |
| 13 | Session management service | 3 | `services/liveSessionService.ts` |
| 14 | Live tender form | 3 | `routes/(app)/tenders/new/live-auction/+page.svelte` |
| 15 | Live bidding dashboard | 3 | `routes/(app)/tenders/[id]/live-dashboard/+page.svelte` |
| 16 | SSE streaming | 3 | `controllers/liveTenderController.ts` |
| 17 | End-to-end testing | 3 | Test suite |
| 18 | Documentation | 3 | User guides |

---

## 4. Critical Implementation Notes

### Limited Tendering Access Control

```typescript
// Middleware check
const { rows } = await db.query(`
  SELECT t.visibility, ltv.vendor_org_id
  FROM tenders t
  LEFT JOIN limited_tender_vendors ltv ON t.id = ltv.tender_id 
    AND ltv.vendor_org_id = $1
  WHERE t.id = $2
`, [req.user.orgId, tenderId]);

if (rows[0].visibility === 'limited' && !rows[0].vendor_org_id) {
  return res.status(403).json({ error: 'Not invited' });
}
```

### Live Session Auto-Management

Sessions auto-transition based on wall-clock time:
- `scheduled` → `active` when NOW() >= `scheduled_start`
- `active` → `completed` when NOW() >= `scheduled_end`

Background service polls every 10 seconds.

### Real-Time Bid Validation (Open Reverse Auction)

```typescript
// For open reverse auction
const currentBest = 50000; // current lowest bid
const minIncrement = 1000;

// New bid must be:
newBid < currentBest && newBid <= (currentBest - minIncrement)
```

---

## 5. Technology Stack Summary

| **Component** | **Technology** |
|---------------|---------------|
| Database | PostgreSQL 16 |
| Backend | Node.js + Express + TypeScript |
| Real-time | Redis Pub/Sub + Server-Sent Events |
| Frontend | SvelteKit |
| Validation | Zod |
| State Management | TanStack Query |

---

## END OF PLAN
