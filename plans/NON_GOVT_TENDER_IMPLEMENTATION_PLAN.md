# NON-GOVERNMENT TENDER TYPES & LIVE TENDERING - IMPLEMENTATION PLAN

**Complete guide for implementing organization type separation, non-govt tender types (NRQ1-NRQ3), and optional live tendering**

Based on: Existing Bangladesh e-GP implementation | February 2026

**Summary**: This plan adds proper organization type separation (government vs non-government) to the RFQ platform, creates non-government tender types with formal codes and value ranges, and implements live tendering as an optional feature for any tender type.

---

## CONTINUATION OF REVISED PLAN

See `revised_multi_tender_type_plan.md` for Phases 1-2 (completed above).

## PHASE 3: SIMPLE RFQ INTEGRATION WITH TENDER TYPES

**Goal:** Update the existing Simple RFQ functionality to use formal tender type codes (NRQ1/NRQ2/NRQ3) with value validation.

### **Task 9 — Update Simple RFQ Creation Form with Tender Type Selection**

**Update `rfq-platform/frontend/src/routes/(app)/tenders/new/simple-rfq/+page.svelte`**

Add tender type selection with auto-suggestion based on estimated value:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api';
  
 let tenderTypes = [];
  let selectedTenderType = null;
  let estimatedValue = 0;
  let suggestedType = null;
  
  // Fetch available non-govt tender types
  onMount(async () => {
    const response = await apiClient.get('/api/tender-types?procurementType=goods');
    tenderTypes = response.data;  // Will only show NRQ1, NRQ2, NRQ3 for non-govt users
  });
  
  // Auto-suggest tender type based on estimated value
  async function handleValueChange() {
    if (estimatedValue > 0) {
      const response = await apiClient.post('/api/tender-types/suggest', {
        procurementType: 'goods',
        estimatedValue: estimatedValue
      });
      suggestedType = response.data;
      selectedTenderType = suggestedType.code;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <h1>Create Simple RFQ</h1>
  
  <!-- Estimated Value Input -->
  <div class="form-group">
    <label for="estimatedValue">Estimated Value (USD)</label>
    <input 
      type="number" 
      id="estimatedValue"
      bind:value={estimatedValue}
      on:change={handleValueChange}
      required
    />
  </div>
  
  <!-- Tender Type Selection (auto-selected based on value) -->
  <div class="form-group">
    <label for="tenderType">RFQ Type (auto-selected)</label>
    <select id="tenderType" bind:value={selectedTenderType} required>
      {#each tenderTypes as type}
        <option value={type.code}>
          {type.name}
          {#if type.min_value_bdt && type.max_value_bdt}
            (${type.min_value_bdt/100} - ${type.max_value_bdt/100})
          {:else if type.min_value_bdt}
            (above ${type.min_value_bdt/100})
          {:else}
            (up to ${type.max_value_bdt/100})
          {/if}
        </option>
      {/each}
    </select>
    
    {#if suggestedType}
      <p class="help-text">
        Suggested type based on value: {suggestedType.name}<br/>
        <small>{suggestedType.reasons.join('. ')}</small>
      </p>
    {/if}
  </div>
  
  <!-- Existing Simple RFQ fields -->
  <h2>Buyer Information</h2>
  <!-- ... buyer fields ... -->
  
  <h2>Items</h2>
  <!-- ... item fields ... -->
  
  <h2>Commercial Terms</h2>
  <!-- ... commercial fields ... -->
  
 <button type="submit">Create RFQ</button>
</form>
```

### **Task 10 — Update Simple RFQ Service to Use Tender Types**

**Update `rfq-platform/backend/src/services/simpleRfq.service.ts`**

```typescript
import { pool } from '../config';
import { v4 as uuidv4 } from 'uuid';

export class SimpleRfqService {
  
  async createSimpleRfq(input: SimpleRfqInput, userId: string, orgId: string) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate tender type (must be non-govt type: NRQ1/NRQ2/NRQ3)
      const { rows: tenderTypeRows } = await client.query(
        'SELECT * FROM tender_type_definitions WHERE code = $1 AND is_govt_type = FALSE AND is_active = TRUE',
        [input.tenderType]
      );
      
      if (tenderTypeRows.length === 0) {
        throw new Error(`Invalid tender type for non-government organization: ${input.tenderType}`);
      }
      
      const tenderTypeDef = tenderTypeRows[0];
      
      // Validate estimated value against tender type range
      const valueInBDT = input.estimatedValue * 100; // Convert USD to BDT paisa
      
      if (tenderTypeDef.min_value_bdt && valueInBDT < tenderTypeDef.min_value_bdt) {
        throw new Error(`Estimated value too low for ${tenderTypeDef.name}. Minimum: $${tenderTypeDef.min_value_bdt/100}`);
      }
      
      if (tenderTypeDef.max_value_bdt && valueInBDT > tenderTypeDef.max_value_bdt) {
        throw new Error(`Estimated value too high for ${tenderTypeDef.name}. Maximum: $${tenderTypeDef.max_value_bdt/100}`);
      }
      
      // Calculate securities if required
      let bidSecurityAmount = null;
      if (tenderTypeDef.requires_tender_security) {
        bidSecurityAmount = valueInBDT * (tenderTypeDef.tender_security_percent / 100);
      }
      
      // Generate tender number
      const tenderNumber = `RFQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
      
      const tenderId = uuidv4();
      
      // Insert tender with tender_type
      const { rows } = await client.query(`
        INSERT INTO tenders (
          id, tender_number, buyer_org_id, title,
          tender_type, visibility, procurement_type,
          currency, price_basis, estimated_cost,
          bid_security_amount, submission_deadline, validity_days,
          status, tender_mode, is_govt_tender, extended_data,
          created_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'published', 'simple_rfq', FALSE, $14, $15, NOW()
        )
        RETURNING *
      `, [
        tenderId,
        tenderNumber,
        orgId,
        input.title,
        input.tenderType,  // NRQ1/NRQ2/NRQ3
        input.visibility || 'open',
        input.procurementType || 'goods',
        input.currency || 'USD',
        'unit_rate',
        valueInBDT,
        bidSecurityAmount,
        input.submissionDeadline,
        tenderTypeDef.default_validity_days,
        JSON.stringify({
          buyerInfo: input.buyerInfo,
          rfqDetails: input.rfqDetails,
          commercialTerms: input.commercialTerms
        }),
        userId
      ]);
      
      // Insert items
      for (const item of input.items) {
        await client.query(`
          INSERT INTO tender_items (
            id, tender_id, item_code, description, category,
            quantity, unit, specification, sort_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          uuidv4(),
          tenderId,
          item.code || `ITEM-${Math.random().toString(36).substr(2, 9)}`,
          item.description,
          item.category,
          item.quantity,
          item.unit,
          item.specification,
          item.sortOrder || 0
        ]);
      }
      
      await client.query('COMMIT');
      
      return rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

### **Task 11 — Create Non-Govt Tender Validation Schema**

**Update `rfq-platform/backend/src/schemas/tender.schema.ts`**

```typescript
import { z } from 'zod';

export const nonGovtSimpleRfqSchema = z.object({
  tenderType: z.enum(['NRQ1', 'NRQ2', 'NRQ3'], {
    required_error: 'Tender type is required',
    invalid_type_error: 'Invalid tender type for non-government organization'
  }),
  
  title: z.string().min(5).max(255),
  
  estimatedValue: z.number().positive('Estimated value must be positive'),
  
  currency: z.string().length(3).default('USD'),
  
  procurementType: z.enum(['goods', 'services']).default('goods'),
  
  submissionDeadline: z.string().datetime(),
  
  visibility: z.enum(['open', 'limited']).default('open'),
  
  buyerInfo: z.object({
    buyerName: z.string().min(2),
    companyName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    deliveryCity: z.string()
  }),
  
  rfqDetails: z.object({
    issueDate: z.string().datetime(),
    quoteDeadline: z.string().datetime(),
    rfqType: z.enum(['goods', 'services'])
  }),
  
  items: z.array(z.object({
    description: z.string().min(3),
    category: z.string(),
    quantity: z.number().positive(),
    unit: z.string(),
    specification: z.string().optional()
  })).min(1),
  
  commercialTerms: z.object({
    deliveryDate: z.string().datetime(),
    deliveryLocation: z.string(),
    paymentTerm: z.enum(['advance', 'net_7', 'net_30', 'on_delivery']),
    taxIncluded: z.boolean().default(false)
  })
});
```

---

## PHASE 4: LIVE TENDERING INFRASTRUCTURE

**Goal:** Implement live bidding sessions, real-time bid processing, and SSE streaming for any tender type.

### **Task 12 — Create Live Tendering Database Tables**

**Create migration: `rfq-platform/database/migrations/010_create_live_tendering_tables.sql`**

```sql
-- Live bidding sessions table
CREATE TABLE live_tender_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID UNIQUE NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  
  -- Schedule
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'paused', 'completed', 'cancelled')),
  
  -- Bidding configuration
  bidding_type VARCHAR(20) NOT NULL
    CHECK (bidding_type IN ('sealed', 'open_reverse', 'open_auction')),
  min_bid_increment NUMERIC(18,2),  -- Minimum price change for open auctions
  
  -- Current state
  current_best_bid_id UUID REFERENCES bids(id),
  current_best_amount NUMERIC(18,2),
  total_bids_count INTEGER DEFAULT 0,
  active_bidders_count INTEGER DEFAULT 0,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Live bid events for audit trail
CREATE TABLE live_bid_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES live_tender_sessions(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES bids(id),
  vendor_org_id UUID NOT NULL REFERENCES organizations(id),
  
  event_type VARCHAR(30) NOT NULL
    CHECK (event_type IN ('bid_submitted', 'bid_improved', 'bid_withdrawn', 'outbid', 'session_started', 'session_ended')),
  
  bid_amount NUMERIC(18,2),
  previous_best_amount NUMERIC(18,2),
  is_winning BOOLEAN DEFAULT FALSE,
  
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_live_sessions_tender ON live_tender_sessions(tender_id);
CREATE INDEX idx_live_sessions_status ON live_tender_sessions(status);
CREATE INDEX idx_live_sessions_scheduled ON live_tender_sessions(scheduled_start) 
  WHERE status IN ('scheduled', 'active');

CREATE INDEX idx_live_events_session ON live_bid_events(session_id);
CREATE INDEX idx_live_events_created ON live_bid_events(created_at DESC);
CREATE INDEX idx_live_events_vendor ON live_bid_events(vendor_org_id);

-- Add live tender flags to tenders table (if not already exists from Phase 1)
ALTER TABLE tenders 
ADD COLUMN IF NOT EXISTS is_live_tender BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS live_bidding_type VARCHAR(20)
  CHECK (live_bidding_type IN ('sealed', 'open_reverse', 'open_auction'));

CREATE INDEX IF NOT EXISTS idx_tenders_live ON tenders(is_live_tender) WHERE is_live_tender = TRUE;

COMMENT ON TABLE live_tender_sessions IS 'Live auction sessions with scheduled start/end times and real-time bidding';
COMMENT ON TABLE live_bid_events IS 'Audit trail of all bid events during live sessions';
```

**Rollback: `rfq-platform/database/migrations/010_create_live_tendering_tables_rollback.sql`**

```sql
DROP INDEX IF EXISTS idx_tenders_live;
ALTER TABLE tenders DROP COLUMN IF EXISTS live_bidding_type;
ALTER TABLE tenders DROP COLUMN IF EXISTS is_live_tender;

DROP INDEX IF EXISTS idx_live_events_vendor;
DROP INDEX IF EXISTS idx_live_events_created;
DROP INDEX IF EXISTS idx_live_events_session;
DROP INDEX IF EXISTS idx_live_sessions_scheduled;
DROP INDEX IF EXISTS idx_live_sessions_status;
DROP INDEX IF EXISTS idx_live_sessions_tender;

DROP TABLE IF EXISTS live_bid_events;
DROP TABLE IF EXISTS live_tender_sessions;
```

### **Task 13 — Create Live Tendering TypeScript Types**

**Update `rfq-platform/backend/src/types/tender.types.ts`**

```typescript
export enum LiveSessionStatus {
  Scheduled = 'scheduled',
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export enum LiveBiddingType {
  Sealed = 'sealed',  // Bids hidden until session ends
  OpenReverse = 'open_reverse',  // Reverse auction, prices visible, must beat current best
  OpenAuction = 'open_auction'  // Forward auction, prices visible
}

export interface LiveTenderConfig {
  scheduledStart: Date;
  duration: number;  // minutes
  biddingType: LiveBiddingType;
  minBidIncrement?: number;  // Required for open auctions
  invitedVendorIds?: string[];  // For limited tenders
}

export interface LiveSession {
  id: string;
  tenderId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: LiveSessionStatus;
  biddingType: LiveBiddingType;
  currentBestBidId?: string;
  currentBestAmount?: number;
  totalBidsCount: number;
  activeBiddersCount: number;
  settings: Record<string, any>;
}

export interface LiveBidEvent {
  id: string;
  sessionId: string;
  bidId?: string;
  vendorOrgId: string;
  eventType: string;
  bidAmount?: number;
  previousBestAmount?: number;
  isWinning: boolean;
  eventData: Record<string, any>;
  createdAt: Date;
}
```

### **Task 14 — Create Live Tendering Service**

**Create `rfq-platform/backend/src/services/liveTender.service.ts`**

```typescript
import { pool } from '../config';
import { v4 as uuidv4 } from 'uuid';
import { LiveTenderConfig, LiveSession, LiveSessionStatus, LiveBiddingType } from '../types/tender.types';
import { EventEmitter } from 'events';

export class LiveTenderService extends EventEmitter {
  
  /**
   * Create a live tender session
   */
  async createLiveSession(tenderId: string, config: LiveTenderConfig): Promise<LiveSession> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate schedule
      const now = new Date();
      const scheduledStart = new Date(config.scheduledStart);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      if (scheduledStart < oneHourFromNow) {
        throw new Error('Live session must be scheduled at least 1 hour in advance');
      }
      
      const scheduledEnd = new Date(scheduledStart.getTime() + config.duration * 60 * 1000);
      
      // Validate duration
      if (config.duration < 30 || config.duration > 480) {
        throw new Error('Live session duration must be between 30 and 480 minutes');
      }
      
      // Validate min increment for open auctions
      if (config.biddingType !== LiveBiddingType.Sealed && !config.minBidIncrement) {
        throw new Error('Minimum bid increment is required for open auctions');
      }
      
      const sessionId = uuidv4();
      
      // Create session
      const { rows } = await client.query(`
        INSERT INTO live_tender_sessions (
          id, tender_id, scheduled_start, scheduled_end,
          status, bidding_type, min_bid_increment, settings
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        sessionId,
        tenderId,
        scheduledStart,
        scheduledEnd,
        LiveSessionStatus.Scheduled,
        config.biddingType,
        config.minBidIncrement || null,
        JSON.stringify({ invitedVendorIds: config.invitedVendorIds || [] })
      ]);
      
      // Update tender is_live_tender flag
      await client.query(`
        UPDATE tenders 
        SET is_live_tender = TRUE, live_bidding_type = $1
        WHERE id = $2
      `, [config.biddingType, tenderId]);
      
      // If limited tender, insert vendor invitations
      if (config.invitedVendorIds && config.invitedVendorIds.length > 0) {
        await client.query(`
          UPDATE tenders SET visibility = 'limited' WHERE id = $1
        `, [tenderId]);
        
        for (const vendorId of config.invitedVendorIds) {
          await client.query(`
            INSERT INTO tender_vendor_invitations (
              tender_id, vendor_org_id, invitation_token, status, invited_at
            ) VALUES ($1, $2, $3, 'sent', NOW())
            ON CONFLICT (tender_id, vendor_org_id) DO NOTHING
          `, [
            tenderId,
            vendorId,
            uuidv4() // Generate invitation token
          ]);
        }
      }
      
      await client.query('COMMIT');
      
      return rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Start a live session
   */
  async startSession(sessionId: string): Promise<void> {
    const { rows } = await pool.query(`
      UPDATE live_tender_sessions
      SET status = $1, actual_start = NOW(), updated_at = NOW()
      WHERE id = $2 AND status = 'scheduled'
      RETURNING *
    `, [LiveSessionStatus.Active, sessionId]);
    
    if (rows.length > 0) {
      // Log event
      await pool.query(`
        INSERT INTO live_bid_events (
          id, session_id, vendor_org_id, event_type, event_data
        ) VALUES ($1, $2, $3, 'session_started', $4)
      `, [
        uuidv4(),
        sessionId,
        '00000000-0000-0000-0000-000000000000', // System event
        JSON.stringify({ startedAt: new Date() })
      ]);
      
      this.emit('session_started', rows[0]);
    }
  }
  
  /**
   * End a live session
   */
  async endSession(sessionId: string): Promise<void> {
    const { rows } = await pool.query(`
      UPDATE live_tender_sessions
      SET status = $1, actual_end = NOW(), updated_at = NOW()
      WHERE id = $2 AND status = 'active'
      RETURNING *
    `, [LiveSessionStatus.Completed, sessionId]);
    
    if (rows.length > 0) {
      // Log event
      await pool.query(`
        INSERT INTO live_bid_events (
          id, session_id, vendor_org_id, event_type, event_data
        ) VALUES ($1, $2, $3, 'session_ended', $4)
      `, [
        uuidv4(),
        sessionId,
        '00000000-0000-0000-0000-000000000000',
        JSON.stringify({ 
          endedAt: new Date(),
          winningBidId: rows[0].current_best_bid_id,
          finalAmount: rows[0].current_best_amount
        })
      ]);
      
      this.emit('session_ended', rows[0]);
    }
  }
  
  /**
   * Submit a live bid
   */
  async submitLiveBid(
    sessionId: string,
    vendorOrgId: string,
    bidAmount: number,
    bidData: any
  ): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get session details
      const { rows: sessionRows } = await client.query(
        'SELECT * FROM live_tender_sessions WHERE id = $1 AND status = $2',
        [sessionId, LiveSessionStatus.Active]
      );
      
      if (sessionRows.length === 0) {
        throw new Error('Session not active');
      }
      
      const session = sessionRows[0];
      
      // Validate bid amount based on bidding type
      if (session.bidding_type === LiveBiddingType.OpenReverse) {
        // Reverse auction: new bid must be lower
        if (session.current_best_amount && bidAmount >= session.current_best_amount) {
          throw new Error(`Bid must be lower than current best: ${session.current_best_amount}`);
        }
        
        if (session.min_bid_increment && session.current_best_amount) {
          const requiredBid = session.current_best_amount - session.min_bid_increment;
          if (bidAmount > requiredBid) {
            throw new Error(`Bid must be at least ${session.min_bid_increment} lower than current best`);
          }
        }
      } else if (session.bidding_type === LiveBiddingType.OpenAuction) {
        // Forward auction: new bid must be higher
        if (session.current_best_amount && bidAmount <= session.current_best_amount) {
          throw new Error(`Bid must be higher than current best: ${session.current_best_amount}`);
        }
      }
      
      // Create bid record
      const bidId = uuidv4();
      await client.query(`
        INSERT INTO bids (
          id, tender_id, vendor_org_id, bid_amount, 
          status, is_live_bid, submitted_at
        ) VALUES ($1, $2, $3, $4, 'submitted', TRUE, NOW())
      `, [bidId, session.tender_id, vendorOrgId, bidAmount]);
      
      const previousBest = session.current_best_amount;
      
      // Update session with new best bid
      await client.query(`
        UPDATE live_tender_sessions
        SET 
          current_best_bid_id = $1,
          current_best_amount = $2,
          total_bids_count = total_bids_count + 1,
          updated_at = NOW()
        WHERE id = $3
      `, [bidId, bidAmount, sessionId]);
      
      // Log bid event
      await client.query(`
        INSERT INTO live_bid_events (
          id, session_id, bid_id, vendor_org_id, event_type,
          bid_amount, previous_best_amount, is_winning
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
      `, [
        uuidv4(),
        sessionId,
        bidId,
        vendorOrgId,
        'bid_submitted',
        bidAmount,
        previousBest
      ]);
      
      await client.query('COMMIT');
      
      // Emit event for SSE streaming
      this.emit('bid_submitted', {
        sessionId,
        bidId,
        vendorOrgId,
        bidAmount,
        previousBest,
        timestamp: new Date()
      });
      
      return { bidId, sessionId, bidAmount, isWinning: true };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get live session details
   */
  async getSession(sessionId: string): Promise<LiveSession | null> {
    const { rows } = await pool.query(
      'SELECT * FROM live_tender_sessions WHERE id = $1',
      [sessionId]
    );
    
    return rows.length > 0 ? rows[0] : null;
  }
}

export const liveTenderService = new LiveTenderService();
```

---

This comprehensive plan continues with detailed implementation steps for all remaining phases. Would you like me to complete the entire document with Phases 5 and 6, or would you prefer to review what's been created so far?

