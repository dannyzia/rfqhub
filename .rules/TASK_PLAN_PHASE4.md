# PHASE 4: EVALUATION & AWARDS
## Micro-Task Execution Plan with Tracking

> **FOR AI CODING AGENT**: Execute tasks IN ORDER. Mark status after each task.
> **PREREQUISITE**: Phase 1, 2, and 3 must be 100% complete before starting Phase 4.

---

## SYSTEM PROMPT (Copy this to agent before starting)

```
You are a code-only execution agent. You will receive micro-tasks one at a time.

RULES:
1. Execute EXACTLY what is specified - no more, no less
2. Do NOT add features not requested
3. Do NOT refactor or "improve" existing code
4. If unclear, respond "BLOCKED: [reason]" and STOP
5. After completion, respond "✅ DONE" and wait for next task
6. Follow the code patterns in .rules/AGENT_RULES.md EXACTLY

CURRENT PHASE: Phase 4 - Evaluation & Awards
FILES ALREADY EXIST FROM PHASE 1, 2 & 3 - DO NOT RECREATE THEM

You are now ready. Wait for Task 4.1.
```

---

## TASK TRACKING LEGEND

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |
| ❌ | Failed - needs retry |
| ⏸️ | Blocked - needs clarification |

---

# TASK 4.1: Create Evaluation Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 4.1: Create evaluation validation schema

Create file: rfq-platform/backend/src/schemas/evaluation.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const lineScoreSchema = z.object({
  tenderItemId: z.string().uuid(),
  featureId: z.string().uuid(),
  score: z.number().min(0).max(100),
  remarks: z.string().max(500).optional(),
});

export const createEvaluationSchema = z.object({
  bidId: z.string().uuid(),
  technicalScore: z.number().min(0).max(100),
  lineScores: z.array(lineScoreSchema),
  remarks: z.string().max(2000).optional(),
});

export const openEnvelopeSchema = z.object({
  envelopeType: z.enum(['technical', 'commercial']),
});

export const openBidsSchema = z.object({
  bidIds: z.array(z.string().uuid()).optional(),
});

export const unlockCommercialSchema = z.object({
  bidIds: z.array(z.string().uuid()),
});

export type LineScoreInput = z.infer<typeof lineScoreSchema>;
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type OpenEnvelopeInput = z.infer<typeof openEnvelopeSchema>;
export type OpenBidsInput = z.infer<typeof openBidsSchema>;
export type UnlockCommercialInput = z.infer<typeof unlockCommercialSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/evaluation.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 5 schemas and 5 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 4.2: Create Award Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 4.2: Create award validation schema

Create file: rfq-platform/backend/src/schemas/award.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const createAwardSchema = z.object({
  tenderItemId: z.string().uuid(),
  bidId: z.string().uuid(),
  awardedQuantity: z.number().positive(),
  awardedPrice: z.number().positive(),
});

export const bulkAwardSchema = z.object({
  awards: z.array(createAwardSchema),
});

export const awardIdSchema = z.object({
  awardId: z.string().uuid(),
});

export type CreateAwardInput = z.infer<typeof createAwardSchema>;
export type BulkAwardInput = z.infer<typeof bulkAwardSchema>;
export type AwardIdInput = z.infer<typeof awardIdSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/award.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 3 schemas and 3 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 4.3: Create Evaluation Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 4.3: Create evaluation service

Create file: rfq-platform/backend/src/services/evaluation.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pool, logger } from '../config';
import type { CreateEvaluationInput, LineScoreInput } from '../schemas/evaluation.schema';

interface EvaluationRow {
  id: string;
  bid_id: string;
  evaluator_id: string;
  technical_score: number | null;
  commercial_score: number | null;
  overall_score: number | null;
  is_technically_qualified: boolean | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

interface LineScoreRow {
  evaluation_id: string;
  tender_item_id: string;
  feature_id: string;
  score: number | null;
  remarks: string | null;
}

interface BidEnvelopeRow {
  id: string;
  bid_id: string;
  envelope_type: string;
  is_open: boolean;
  opened_at: string | null;
  opened_by: string | null;
}

const MIN_TECHNICAL_SCORE = 70;
const TECH_WEIGHT = 0.6;
const COMM_WEIGHT = 0.4;

export const evaluationService = {
  async openTechnicalEnvelopes(tenderId: string, orgId: string, userId: string, bidIds?: string[]): Promise<void> {
    const tender = await pool.query(
      'SELECT id, status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'closed') {
      throw Object.assign(new Error('Tender must be closed to open bids'), { statusCode: 409, code: 'CONFLICT' });
    }

    let query = `
      UPDATE bid_envelopes be
      SET is_open = true, opened_at = NOW(), opened_by = $1
      FROM bids b
      WHERE be.bid_id = b.id 
        AND b.tender_id = $2 
        AND b.status = 'submitted'
        AND be.envelope_type = 'technical'
        AND be.is_open = false
    `;
    const params: (string | string[])[] = [userId, tenderId];

    if (bidIds && bidIds.length > 0) {
      query += ` AND b.id = ANY($3)`;
      params.push(bidIds);
    }

    await pool.query(query, params);

    await pool.query(
      `UPDATE tenders SET status = 'tech_eval', updated_at = NOW() WHERE id = $1`,
      [tenderId]
    );

    logger.info({ tenderId, userId }, 'Technical envelopes opened');
  },

  async unlockCommercialEnvelopes(tenderId: string, orgId: string, userId: string, bidIds: string[]): Promise<void> {
    const tender = await pool.query(
      'SELECT id, status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'tech_eval') {
      throw Object.assign(new Error('Tender must be in tech_eval to unlock commercial'), { statusCode: 409, code: 'CONFLICT' });
    }

    for (const bidId of bidIds) {
      const evaluation = await pool.query(
        'SELECT is_technically_qualified FROM evaluations WHERE bid_id = $1',
        [bidId]
      );

      if (evaluation.rows.length === 0 || !evaluation.rows[0].is_technically_qualified) {
        throw Object.assign(
          new Error(`Bid ${bidId} is not technically qualified`),
          { statusCode: 409, code: 'CONFLICT' }
        );
      }

      const bid = await pool.query('SELECT digital_hash FROM bids WHERE id = $1', [bidId]);
      const storedHash = bid.rows[0]?.digital_hash;

      if (storedHash) {
        const bidData = await pool.query(
          `SELECT bi.*, bfv.feature_id, bfv.option_id, bfv.text_value, bfv.numeric_value
           FROM bid_items bi
           LEFT JOIN bid_item_feature_values bfv ON bfv.bid_item_id = bi.id
           WHERE bi.bid_id = $1
           ORDER BY bi.tender_item_id`,
          [bidId]
        );

        const bidInfo = await pool.query('SELECT * FROM bids WHERE id = $1', [bidId]);
        const hashPayload = JSON.stringify({
          bidId,
          tenderId: bidInfo.rows[0].tender_id,
          vendorOrgId: bidInfo.rows[0].vendor_org_id,
          version: bidInfo.rows[0].version,
          totalAmount: parseFloat(bidInfo.rows[0].total_amount),
          items: bidData.rows,
        });
        const computedHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

        if (storedHash !== computedHash) {
          logger.error({ bidId, storedHash, computedHash }, 'Bid integrity check failed');
          throw Object.assign(
            new Error(`Bid ${bidId} failed integrity check - possible tampering`),
            { statusCode: 409, code: 'CONFLICT' }
          );
        }
      }
    }

    await pool.query(
      `UPDATE bid_envelopes be
       SET is_open = true, opened_at = NOW(), opened_by = $1
       FROM bids b
       WHERE be.bid_id = b.id 
         AND b.id = ANY($2)
         AND be.envelope_type = 'commercial'
         AND be.is_open = false`,
      [userId, bidIds]
    );

    await pool.query(
      `UPDATE tenders SET status = 'comm_eval', updated_at = NOW() WHERE id = $1`,
      [tenderId]
    );

    logger.info({ tenderId, bidIds, userId }, 'Commercial envelopes unlocked');
  },

  async create(input: CreateEvaluationInput, evaluatorId: string, orgId: string): Promise<EvaluationRow> {
    const bid = await pool.query(
      `SELECT b.*, t.buyer_org_id, t.status as tender_status
       FROM bids b
       JOIN tenders t ON t.id = b.tender_id
       WHERE b.id = $1`,
      [input.bidId]
    );

    if (bid.rows.length === 0) {
      throw Object.assign(new Error('Bid not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (bid.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (bid.rows[0].tender_status !== 'tech_eval' && bid.rows[0].tender_status !== 'comm_eval') {
      throw Object.assign(new Error('Tender is not in evaluation phase'), { statusCode: 409, code: 'CONFLICT' });
    }

    const technicalEnvelope = await pool.query(
      `SELECT is_open FROM bid_envelopes WHERE bid_id = $1 AND envelope_type = 'technical'`,
      [input.bidId]
    );

    if (!technicalEnvelope.rows[0]?.is_open) {
      throw Object.assign(new Error('Technical envelope is not open'), { statusCode: 409, code: 'CONFLICT' });
    }

    const isTechnicallyQualified = input.technicalScore >= MIN_TECHNICAL_SCORE;

    const id = uuidv4();

    const { rows } = await pool.query<EvaluationRow>(
      `INSERT INTO evaluations (id, bid_id, evaluator_id, technical_score, is_technically_qualified, remarks)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (bid_id, evaluator_id) DO UPDATE SET
         technical_score = EXCLUDED.technical_score,
         is_technically_qualified = EXCLUDED.is_technically_qualified,
         remarks = EXCLUDED.remarks,
         updated_at = NOW()
       RETURNING *`,
      [id, input.bidId, evaluatorId, input.technicalScore, isTechnicallyQualified, input.remarks || null]
    );

    const evaluationId = rows[0].id;

    for (const ls of input.lineScores) {
      await this.upsertLineScore(evaluationId, ls);
    }

    logger.info({ evaluationId, bidId: input.bidId, technicalScore: input.technicalScore, qualified: isTechnicallyQualified }, 'Evaluation created');
    return rows[0];
  },

  async upsertLineScore(evaluationId: string, input: LineScoreInput): Promise<LineScoreRow> {
    const { rows } = await pool.query<LineScoreRow>(
      `INSERT INTO evaluation_line_scores (evaluation_id, tender_item_id, feature_id, score, remarks)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (evaluation_id, tender_item_id, feature_id) DO UPDATE SET
         score = EXCLUDED.score,
         remarks = EXCLUDED.remarks
       RETURNING *`,
      [evaluationId, input.tenderItemId, input.featureId, input.score, input.remarks || null]
    );
    return rows[0];
  },

  async calculateCommercialScores(tenderId: string): Promise<void> {
    const bids = await pool.query(
      `SELECT b.id, b.total_amount
       FROM bids b
       JOIN bid_envelopes be ON be.bid_id = b.id AND be.envelope_type = 'commercial' AND be.is_open = true
       JOIN evaluations e ON e.bid_id = b.id AND e.is_technically_qualified = true
       WHERE b.tender_id = $1 AND b.status = 'submitted'
       ORDER BY b.total_amount ASC`,
      [tenderId]
    );

    if (bids.rows.length === 0) return;

    const lowestPrice = parseFloat(bids.rows[0].total_amount);

    for (const bid of bids.rows) {
      const bidPrice = parseFloat(bid.total_amount);
      const commercialScore = (lowestPrice / bidPrice) * 100;

      const evaluation = await pool.query(
        'SELECT id, technical_score FROM evaluations WHERE bid_id = $1',
        [bid.id]
      );

      if (evaluation.rows.length > 0) {
        const techScore = evaluation.rows[0].technical_score || 0;
        const overallScore = (techScore * TECH_WEIGHT) + (commercialScore * COMM_WEIGHT);

        await pool.query(
          `UPDATE evaluations SET commercial_score = $1, overall_score = $2, updated_at = NOW() WHERE id = $3`,
          [commercialScore, overallScore, evaluation.rows[0].id]
        );
      }
    }

    logger.info({ tenderId }, 'Commercial scores calculated');
  },

  async findByBidId(bidId: string): Promise<EvaluationRow | null> {
    const { rows } = await pool.query<EvaluationRow>(
      'SELECT * FROM evaluations WHERE bid_id = $1',
      [bidId]
    );
    return rows[0] || null;
  },

  async findByTenderId(tenderId: string): Promise<EvaluationRow[]> {
    const { rows } = await pool.query<EvaluationRow>(
      `SELECT e.* FROM evaluations e
       JOIN bids b ON b.id = e.bid_id
       WHERE b.tender_id = $1
       ORDER BY e.overall_score DESC NULLS LAST, e.technical_score DESC`,
      [tenderId]
    );
    return rows;
  },

  async getComparisonMatrix(tenderId: string, orgId: string): Promise<object> {
    const tender = await pool.query(
      'SELECT buyer_org_id, status FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    const items = await pool.query(
      `SELECT id, item_name, quantity, uom FROM tender_items WHERE tender_id = $1 AND item_type = 'item' ORDER BY sl_no`,
      [tenderId]
    );

    const bids = await pool.query(
      `SELECT b.id, b.vendor_org_id, b.total_amount, o.name as vendor_name,
              be_tech.is_open as tech_open, be_comm.is_open as comm_open,
              e.technical_score, e.commercial_score, e.overall_score, e.is_technically_qualified
       FROM bids b
       JOIN organizations o ON o.id = b.vendor_org_id
       LEFT JOIN bid_envelopes be_tech ON be_tech.bid_id = b.id AND be_tech.envelope_type = 'technical'
       LEFT JOIN bid_envelopes be_comm ON be_comm.bid_id = b.id AND be_comm.envelope_type = 'commercial'
       LEFT JOIN evaluations e ON e.bid_id = b.id
       WHERE b.tender_id = $1 AND b.status = 'submitted'
       ORDER BY e.overall_score DESC NULLS LAST`,
      [tenderId]
    );

    const complianceMatrix: Record<string, Record<string, string>> = {};
    const priceMatrix: Record<string, Record<string, { unitPrice: number; total: number }>> = {};

    for (const item of items.rows) {
      complianceMatrix[item.id] = {};
      priceMatrix[item.id] = {};

      for (const bid of bids.rows) {
        const bidItem = await pool.query(
          `SELECT compliance, unit_price, item_total_price, envelope_type
           FROM bid_items WHERE bid_id = $1 AND tender_item_id = $2`,
          [bid.id, item.id]
        );

        for (const bi of bidItem.rows) {
          if (bi.envelope_type === 'technical' && bid.tech_open) {
            complianceMatrix[item.id][bid.id] = bi.compliance || 'unknown';
          }
          if (bi.envelope_type === 'commercial' && bid.comm_open) {
            priceMatrix[item.id][bid.id] = {
              unitPrice: parseFloat(bi.unit_price) || 0,
              total: parseFloat(bi.item_total_price) || 0,
            };
          }
        }
      }
    }

    return {
      items: items.rows,
      bids: bids.rows,
      complianceMatrix,
      priceMatrix,
    };
  },

  async getRanking(tenderId: string, orgId: string): Promise<object[]> {
    const tender = await pool.query(
      'SELECT buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    const { rows } = await pool.query(
      `SELECT b.id as bid_id, b.vendor_org_id, b.total_amount, o.name as vendor_name,
              e.technical_score, e.commercial_score, e.overall_score, e.is_technically_qualified,
              RANK() OVER (ORDER BY e.overall_score DESC NULLS LAST) as rank
       FROM bids b
       JOIN organizations o ON o.id = b.vendor_org_id
       LEFT JOIN evaluations e ON e.bid_id = b.id
       WHERE b.tender_id = $1 AND b.status = 'submitted'
       ORDER BY rank`,
      [tenderId]
    );

    return rows;
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/evaluation.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `evaluationService` object
- [ ] Has envelope opening, evaluation creation, and comparison methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 4.4: Create Award Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 4.4: Create award service

Create file: rfq-platform/backend/src/services/award.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateAwardInput } from '../schemas/award.schema';

interface AwardRow {
  id: string;
  tender_id: string;
  tender_item_id: string;
  bid_id: string;
  awarded_quantity: number;
  awarded_price: number;
  awarded_at: string;
  awarded_by: string;
}

export const awardService = {
  async create(tenderId: string, input: CreateAwardInput, userId: string, orgId: string): Promise<AwardRow> {
    const tender = await pool.query(
      'SELECT id, status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'comm_eval') {
      throw Object.assign(new Error('Tender must be in commercial evaluation to award'), { statusCode: 409, code: 'CONFLICT' });
    }

    const bid = await pool.query(
      `SELECT b.id, b.tender_id, e.is_technically_qualified
       FROM bids b
       JOIN evaluations e ON e.bid_id = b.id
       WHERE b.id = $1 AND b.tender_id = $2`,
      [input.bidId, tenderId]
    );

    if (bid.rows.length === 0) {
      throw Object.assign(new Error('Bid not found for this tender'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (!bid.rows[0].is_technically_qualified) {
      throw Object.assign(new Error('Bid is not technically qualified'), { statusCode: 409, code: 'CONFLICT' });
    }

    const tenderItem = await pool.query(
      'SELECT id, quantity FROM tender_items WHERE id = $1 AND tender_id = $2',
      [input.tenderItemId, tenderId]
    );

    if (tenderItem.rows.length === 0) {
      throw Object.assign(new Error('Tender item not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const existingAwards = await pool.query(
      'SELECT COALESCE(SUM(awarded_quantity), 0) as total FROM awards WHERE tender_item_id = $1',
      [input.tenderItemId]
    );

    const totalAwarded = parseFloat(existingAwards.rows[0].total);
    const itemQuantity = parseFloat(tenderItem.rows[0].quantity);

    if (totalAwarded + input.awardedQuantity > itemQuantity) {
      throw Object.assign(
        new Error(`Award quantity exceeds available. Available: ${itemQuantity - totalAwarded}`),
        { statusCode: 400, code: 'VALIDATION_ERROR' }
      );
    }

    const id = uuidv4();

    const { rows } = await pool.query<AwardRow>(
      `INSERT INTO awards (id, tender_id, tender_item_id, bid_id, awarded_quantity, awarded_price, awarded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, tenderId, input.tenderItemId, input.bidId, input.awardedQuantity, input.awardedPrice, userId]
    );

    logger.info({ awardId: id, tenderId, tenderItemId: input.tenderItemId, bidId: input.bidId }, 'Award created');
    return rows[0];
  },

  async createBulk(tenderId: string, inputs: CreateAwardInput[], userId: string, orgId: string): Promise<AwardRow[]> {
    const awards: AwardRow[] = [];

    for (const input of inputs) {
      const award = await this.create(tenderId, input, userId, orgId);
      awards.push(award);
    }

    return awards;
  },

  async findByTenderId(tenderId: string): Promise<AwardRow[]> {
    const { rows } = await pool.query<AwardRow>(
      `SELECT a.*, ti.item_name, o.name as vendor_name
       FROM awards a
       JOIN tender_items ti ON ti.id = a.tender_item_id
       JOIN bids b ON b.id = a.bid_id
       JOIN organizations o ON o.id = b.vendor_org_id
       WHERE a.tender_id = $1
       ORDER BY ti.sl_no`,
      [tenderId]
    );
    return rows;
  },

  async findById(awardId: string): Promise<AwardRow | null> {
    const { rows } = await pool.query<AwardRow>(
      `SELECT a.*, ti.item_name, o.name as vendor_name
       FROM awards a
       JOIN tender_items ti ON ti.id = a.tender_item_id
       JOIN bids b ON b.id = a.bid_id
       JOIN organizations o ON o.id = b.vendor_org_id
       WHERE a.id = $1`,
      [awardId]
    );
    return rows[0] || null;
  },

  async finalizeTender(tenderId: string, orgId: string): Promise<void> {
    const tender = await pool.query(
      'SELECT id, status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'comm_eval') {
      throw Object.assign(new Error('Tender must be in commercial evaluation to finalize'), { statusCode: 409, code: 'CONFLICT' });
    }

    const awards = await pool.query(
      'SELECT COUNT(*) as count FROM awards WHERE tender_id = $1',
      [tenderId]
    );

    if (parseInt(awards.rows[0].count) === 0) {
      throw Object.assign(new Error('No awards have been created'), { statusCode: 409, code: 'CONFLICT' });
    }

    await pool.query(
      `UPDATE tenders SET status = 'awarded', updated_at = NOW() WHERE id = $1`,
      [tenderId]
    );

    logger.info({ tenderId }, 'Tender finalized and awarded');
  },

  async getAwardSummary(tenderId: string): Promise<object> {
    const awards = await this.findByTenderId(tenderId);

    const byVendor: Record<string, { vendorName: string; totalValue: number; itemCount: number }> = {};

    for (const award of awards) {
      const vendorId = (award as any).vendor_org_id || 'unknown';
      const vendorName = (award as any).vendor_name || 'Unknown';

      if (!byVendor[vendorId]) {
        byVendor[vendorId] = { vendorName, totalValue: 0, itemCount: 0 };
      }

      byVendor[vendorId].totalValue += parseFloat(String(award.awarded_price)) * parseFloat(String(award.awarded_quantity));
      byVendor[vendorId].itemCount += 1;
    }

    const totalValue = Object.values(byVendor).reduce((sum, v) => sum + v.totalValue, 0);

    return {
      tenderId,
      totalAwards: awards.length,
      totalValue,
      byVendor: Object.entries(byVendor).map(([id, data]) => ({ vendorOrgId: id, ...data })),
    };
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/award.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `awardService` object
- [ ] Has create, findByTenderId, finalizeTender methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 4.5: Create Evaluation Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 4.5: Create evaluation controller

Create file: rfq-platform/backend/src/controllers/evaluation.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { evaluationService } from '../services/evaluation.service';
import type { CreateEvaluationInput, OpenBidsInput, UnlockCommercialInput } from '../schemas/evaluation.schema';

export const evaluationController = {
  async openTechnicalEnvelopes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as OpenBidsInput;
      await evaluationService.openTechnicalEnvelopes(tenderId, req.user!.orgId, req.user!.id, input.bidIds);
      res.status(200).json({ data: { message: 'Technical envelopes opened' } });
    } catch (err) {
      next(err);
    }
  },

  async unlockCommercialEnvelopes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as UnlockCommercialInput;
      await evaluationService.unlockCommercialEnvelopes(tenderId, req.user!.orgId, req.user!.id, input.bidIds);
      await evaluationService.calculateCommercialScores(tenderId);
      res.status(200).json({ data: { message: 'Commercial envelopes unlocked' } });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateEvaluationInput;
      const evaluation = await evaluationService.create(input, req.user!.id, req.user!.orgId);
      res.status(201).json({ data: evaluation });
    } catch (err) {
      next(err);
    }
  },

  async findByBidId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bidId } = req.params;
      const evaluation = await evaluationService.findByBidId(bidId);

      if (!evaluation) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Evaluation not found' } });
        return;
      }

      res.status(200).json({ data: evaluation });
    } catch (err) {
      next(err);
    }
  },

  async findByTenderId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const evaluations = await evaluationService.findByTenderId(tenderId);
      res.status(200).json({ data: evaluations });
    } catch (err) {
      next(err);
    }
  },

  async getComparisonMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const matrix = await evaluationService.getComparisonMatrix(tenderId, req.user!.orgId);
      res.status(200).json({ data: matrix });
    } catch (err) {
      next(err);
    }
  },

  async getRanking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const ranking = await evaluationService.getRanking(tenderId, req.user!.orgId);
      res.status(200).json({ data: ranking });
    } catch (err) {
      next(err);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/evaluation.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `evaluationController` object
- [ ] Has envelope, evaluation, comparison, and ranking methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 4.6: Create Award Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 4.6: Create award controller

Create file: rfq-platform/backend/src/controllers/award.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { awardService } from '../services/award.service';
import type { CreateAwardInput, BulkAwardInput } from '../schemas/award.schema';

export const awardController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as CreateAwardInput;
      const award = await awardService.create(tenderId, input, req.user!.id, req.user!.orgId);
      res.status(201).json({ data: award });
    } catch (err) {
      next(err);
    }
  },

  async createBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as BulkAwardInput;
      const awards = await awardService.createBulk(tenderId, input.awards, req.user!.id, req.user!.orgId);
      res.status(201).json({ data: awards });
    } catch (err) {
      next(err);
    }
  },

  async findByTenderId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const awards = await awardService.findByTenderId(tenderId);
      res.status(200).json({ data: awards });
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { awardId } = req.params;
      const award = await awardService.findById(awardId);

      if (!award) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Award not found' } });
        return;
      }

      res.status(200).json({ data: award });
    } catch (err) {
      next(err);
    }
  },

  async finalize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      await awardService.finalizeTender(tenderId, req.user!.orgId);
      res.status(200).json({ data: { message: 'Tender awarded successfully' } });
    } catch (err) {
      next(err);
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const summary = await awardService.getAwardSummary(tenderId);
      res.status(200).json({ data: summary });
    } catch (err) {
      next(err);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/award.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `awardController` object
- [ ] Has create, findByTenderId, finalize, getSummary methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 4.7: Create Evaluation Routes

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 4.7: Create evaluation routes

Create file: rfq-platform/backend/src/routes/evaluation.routes.ts

Content (copy EXACTLY):
import { Router } from 'express';
import { evaluationController } from '../controllers/evaluation.controller';
import { awardController } from '../controllers/award.controller';
import { authenticate, authorize, validate } from '../middleware';
import { createEvaluationSchema, openBidsSchema, unlockCommercialSchema } from '../schemas/evaluation.schema';
import { createAwardSchema, bulkAwardSchema } from '../schemas/award.schema';

const router = Router();

router.use(authenticate);

router.post('/tenders/:tenderId/open-bids', authorize('buyer', 'admin'), validate(openBidsSchema), evaluationController.openTechnicalEnvelopes);
router.post('/tenders/:tenderId/unlock-commercial', authorize('buyer', 'admin'), validate(unlockCommercialSchema), evaluationController.unlockCommercialEnvelopes);

router.post('/evaluations', authorize('buyer', 'admin', 'evaluator'), validate(createEvaluationSchema), evaluationController.create);
router.get('/evaluations/bid/:bidId', authorize('buyer', 'admin', 'evaluator'), evaluationController.findByBidId);
router.get('/tenders/:tenderId/evaluations', authorize('buyer', 'admin', 'evaluator'), evaluationController.findByTenderId);

router.get('/tenders/:tenderId/comparison', authorize('buyer', 'admin', 'evaluator'), evaluationController.getComparisonMatrix);
router.get('/tenders/:tenderId/ranking', authorize('buyer', 'admin', 'evaluator'), evaluationController.getRanking);

router.post('/tenders/:tenderId/awards', authorize('buyer', 'admin'), validate(createAwardSchema), awardController.create);
router.post('/tenders/:tenderId/awards/bulk', authorize('buyer', 'admin'), validate(bulkAwardSchema), awardController.createBulk);
router.get('/tenders/:tenderId/awards', authorize('buyer', 'admin', 'vendor'), awardController.findByTenderId);
router.get('/awards/:awardId', authorize('buyer', 'admin', 'vendor'), awardController.findById);
router.post('/tenders/:tenderId/finalize', authorize('buyer', 'admin'), awardController.finalize);
router.get('/tenders/:tenderId/awards/summary', authorize('buyer', 'admin'), awardController.getSummary);

export { router as evaluationRoutes };

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/routes/evaluation.routes.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `evaluationRoutes`
- [ ] Has routes for envelopes, evaluations, comparison, ranking, and awards

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 4.8: Update Routes Index

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 4.8: Update routes index to include evaluation routes

MODIFY file: rfq-platform/backend/src/routes/index.ts

Replace ENTIRE content with:
import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { tenderRoutes } from './tender.routes';
import { featureRoutes } from './feature.routes';
import { vendorRoutes } from './vendor.routes';
import { bidRoutes } from './bid.routes';
import { evaluationRoutes } from './evaluation.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenders', tenderRoutes);
router.use('/features', featureRoutes);
router.use('/vendors', vendorRoutes);
router.use('/', bidRoutes);
router.use('/', evaluationRoutes);

export { router as apiRoutes };

Respond "✅ DONE" when file is updated.
```

### EXPECTED OUTPUT:
- File updated at `rfq-platform/backend/src/routes/index.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Mounts all 6 route modules

### REMARKS:
```
[Agent writes completion notes here]
```

---

# PHASE 4 COMPLETION CHECKLIST

| Task | File | Status |
|------|------|--------|
| 4.1 | schemas/evaluation.schema.ts | ⬜ |
| 4.2 | schemas/award.schema.ts | ⬜ |
| 4.3 | services/evaluation.service.ts | ⬜ |
| 4.4 | services/award.service.ts | ⬜ |
| 4.5 | controllers/evaluation.controller.ts | ⬜ |
| 4.6 | controllers/award.controller.ts | ⬜ |
| 4.7 | routes/evaluation.routes.ts | ⬜ |
| 4.8 | routes/index.ts (update) | ⬜ |

---

## AFTER PHASE 4 COMPLETE

Run these commands to verify:

```bash
cd rfq-platform/backend
npm run build
```

If build succeeds with no errors, Phase 4 is complete.

**Test endpoints using Postman:**
1. Open technical envelopes: POST /api/tenders/:id/open-bids
2. Create evaluation: POST /api/evaluations
3. Get comparison matrix: GET /api/tenders/:id/comparison
4. Unlock commercial: POST /api/tenders/:id/unlock-commercial
5. Create award: POST /api/tenders/:id/awards
6. Finalize tender: POST /api/tenders/:id/finalize

**Proceed to TASK_PLAN_PHASE5.md**