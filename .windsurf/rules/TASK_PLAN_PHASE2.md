# PHASE 2: TENDER & LINE-ITEM CORE
## Micro-Task Execution Plan with Tracking

> **FOR AI CODING AGENT**: Execute tasks IN ORDER. Mark status after each task.
> **PREREQUISITE**: Phase 1 must be 100% complete before starting Phase 2.

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

CURRENT PHASE: Phase 2 - Tender & Line-Item Core
FILES ALREADY EXIST FROM PHASE 1 - DO NOT RECREATE THEM

You are now ready. Wait for Task 2.1.
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

# TASK 2.1: Create Tender Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.1: Create tender validation schema

Create file: rfq-platform/backend/src/schemas/tender.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const createTenderSchema = z.object({
  title: z.string().min(5).max(255),
  tenderType: z.enum(['RFQ', 'TENDER']),
  visibility: z.enum(['open', 'limited']),
  procurementType: z.enum(['goods', 'works', 'services']),
  currency: z.string().length(3),
  priceBasis: z.enum(['unit_rate', 'lump_sum']).default('unit_rate'),
  fundAllocation: z.number().positive().optional(),
  bidSecurityAmount: z.number().positive().optional(),
  preBidMeetingDate: z.string().datetime().optional(),
  preBidMeetingLink: z.string().url().optional(),
  submissionDeadline: z.string().datetime(),
  bidOpeningTime: z.string().datetime().optional(),
  validityDays: z.number().int().min(1).max(365).default(90),
});

export const updateTenderSchema = createTenderSchema.partial();

export const tenderIdSchema = z.object({
  id: z.string().uuid(),
});

export const publishTenderSchema = z.object({
  invitedVendorIds: z.array(z.string().uuid()).optional(),
});

export type CreateTenderInput = z.infer<typeof createTenderSchema>;
export type UpdateTenderInput = z.infer<typeof updateTenderSchema>;
export type TenderIdInput = z.infer<typeof tenderIdSchema>;
export type PublishTenderInput = z.infer<typeof publishTenderSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/tender.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 4 schemas and 4 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 2.2: Create Item Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.2: Create line item validation schema

Create file: rfq-platform/backend/src/schemas/item.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const createItemSchema = z.object({
  parentItemId: z.string().uuid().nullable().optional(),
  itemType: z.enum(['group', 'item']),
  slNo: z.number().int().min(1),
  itemCode: z.string().max(50).optional(),
  itemName: z.string().min(1).max(200),
  specification: z.string().max(5000).optional(),
  quantity: z.number().min(0),
  uom: z.string().max(20).optional(),
  estimatedCost: z.number().positive().optional(),
});

export const updateItemSchema = createItemSchema.partial().omit({ parentItemId: true });

export const itemIdSchema = z.object({
  id: z.string().uuid(),
  tenderId: z.string().uuid(),
});

export const reorderItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    slNo: z.number().int().min(1),
  })),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ItemIdInput = z.infer<typeof itemIdSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/item.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 4 schemas and 4 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 2.3: Create Feature Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.3: Create feature validation schema

Create file: rfq-platform/backend/src/schemas/feature.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const createFeatureSchema = z.object({
  name: z.string().min(1).max(100),
  featureType: z.enum(['single_select', 'multi_select', 'text', 'numeric', 'boolean']),
  scoringType: z.enum(['binary', 'graded', 'numeric']).default('binary'),
  evaluationWeight: z.number().min(0).max(100).optional(),
  isGlobal: z.boolean().default(false),
});

export const createOptionSchema = z.object({
  optionValue: z.string().min(1).max(150),
  optionScore: z.number().min(0).max(100).default(0),
  sortOrder: z.number().int().min(0).default(0),
});

export const attachFeatureSchema = z.object({
  featureId: z.string().uuid(),
  isMandatory: z.boolean().default(true),
});

export const featureIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type CreateOptionInput = z.infer<typeof createOptionSchema>;
export type AttachFeatureInput = z.infer<typeof attachFeatureSchema>;
export type FeatureIdInput = z.infer<typeof featureIdSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/feature.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 4 schemas and 4 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 2.4: Create Tender Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.4: Create tender service

Create file: rfq-platform/backend/src/services/tender.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateTenderInput, UpdateTenderInput } from '../schemas/tender.schema';

interface TenderRow {
  id: string;
  tender_number: string;
  buyer_org_id: string;
  title: string;
  tender_type: string;
  visibility: string;
  procurement_type: string;
  currency: string;
  price_basis: string;
  fund_allocation: number | null;
  bid_security_amount: number | null;
  pre_bid_meeting_date: string | null;
  pre_bid_meeting_link: string | null;
  submission_deadline: string;
  bid_opening_time: string | null;
  validity_days: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['published', 'cancelled'],
  published: ['clarification', 'closed', 'cancelled'],
  clarification: ['published', 'closed', 'cancelled'],
  closed: ['tech_eval', 'cancelled'],
  tech_eval: ['comm_eval', 'cancelled'],
  comm_eval: ['awarded', 'cancelled'],
  awarded: [],
  cancelled: [],
};

const generateTenderNumber = async (buyerOrgId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM tenders WHERE buyer_org_id = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
    [buyerOrgId, year]
  );
  const count = parseInt(rows[0].count, 10) + 1;
  return `RFQ-${year}-${String(count).padStart(5, '0')}`;
};

export const tenderService = {
  async create(input: CreateTenderInput, userId: string, orgId: string): Promise<TenderRow> {
    const id = uuidv4();
    const tenderNumber = await generateTenderNumber(orgId);

    const { rows } = await pool.query<TenderRow>(
      `INSERT INTO tenders (
        id, tender_number, buyer_org_id, title, tender_type, visibility,
        procurement_type, currency, price_basis, fund_allocation,
        bid_security_amount, pre_bid_meeting_date, pre_bid_meeting_link,
        submission_deadline, bid_opening_time, validity_days, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft', $17)
      RETURNING *`,
      [
        id, tenderNumber, orgId, input.title, input.tenderType, input.visibility,
        input.procurementType, input.currency, input.priceBasis, input.fundAllocation || null,
        input.bidSecurityAmount || null, input.preBidMeetingDate || null,
        input.preBidMeetingLink || null, input.submissionDeadline,
        input.bidOpeningTime || null, input.validityDays, userId
      ]
    );

    logger.info({ tenderId: id, tenderNumber }, 'Tender created');
    return rows[0];
  },

  async findById(id: string): Promise<TenderRow | null> {
    const { rows } = await pool.query<TenderRow>(
      'SELECT * FROM tenders WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findAll(orgId: string, role: string): Promise<TenderRow[]> {
    let query: string;
    let params: string[];

    if (role === 'buyer' || role === 'admin') {
      query = 'SELECT * FROM tenders WHERE buyer_org_id = $1 ORDER BY created_at DESC';
      params = [orgId];
    } else {
      query = `SELECT t.* FROM tenders t
        LEFT JOIN tender_vendor_invitations tvi ON t.id = tvi.tender_id AND tvi.vendor_org_id = $1
        WHERE (t.visibility = 'open' AND t.status != 'draft')
           OR (t.visibility = 'limited' AND tvi.vendor_org_id IS NOT NULL)
        ORDER BY t.created_at DESC`;
      params = [orgId];
    }

    const { rows } = await pool.query<TenderRow>(query, params);
    return rows;
  },

  async update(id: string, input: UpdateTenderInput, orgId: string): Promise<TenderRow> {
    const tender = await this.findById(id);
    
    if (!tender) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.status !== 'draft') {
      throw Object.assign(new Error('Can only edit draft tenders'), { statusCode: 409, code: 'CONFLICT' });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      title: 'title',
      tenderType: 'tender_type',
      visibility: 'visibility',
      procurementType: 'procurement_type',
      currency: 'currency',
      priceBasis: 'price_basis',
      fundAllocation: 'fund_allocation',
      bidSecurityAmount: 'bid_security_amount',
      preBidMeetingDate: 'pre_bid_meeting_date',
      preBidMeetingLink: 'pre_bid_meeting_link',
      submissionDeadline: 'submission_deadline',
      bidOpeningTime: 'bid_opening_time',
      validityDays: 'validity_days',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (key in input) {
        updates.push(`${column} = $${paramIndex}`);
        values.push((input as Record<string, unknown>)[key]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return tender;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query<TenderRow>(
      `UPDATE tenders SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    logger.info({ tenderId: id }, 'Tender updated');
    return rows[0];
  },

  async transitionStatus(id: string, newStatus: string, orgId: string): Promise<TenderRow> {
    const tender = await this.findById(id);

    if (!tender) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    const allowed = VALID_TRANSITIONS[tender.status] || [];
    if (!allowed.includes(newStatus)) {
      throw Object.assign(
        new Error(`Cannot transition from ${tender.status} to ${newStatus}`),
        { statusCode: 409, code: 'CONFLICT' }
      );
    }

    const { rows } = await pool.query<TenderRow>(
      `UPDATE tenders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newStatus, id]
    );

    logger.info({ tenderId: id, oldStatus: tender.status, newStatus }, 'Tender status changed');
    return rows[0];
  },

  async publish(id: string, orgId: string, invitedVendorIds?: string[]): Promise<TenderRow> {
    const tender = await this.transitionStatus(id, 'published', orgId);

    if (tender.visibility === 'limited' && invitedVendorIds && invitedVendorIds.length > 0) {
      const crypto = await import('crypto');
      
      for (const vendorOrgId of invitedVendorIds) {
        const token = crypto.randomBytes(32).toString('hex');
        await pool.query(
          `INSERT INTO tender_vendor_invitations (tender_id, vendor_org_id, invitation_token, status)
           VALUES ($1, $2, $3, 'sent')
           ON CONFLICT (tender_id, vendor_org_id) DO NOTHING`,
          [id, vendorOrgId, token]
        );
      }
      
      logger.info({ tenderId: id, invitedCount: invitedVendorIds.length }, 'Vendor invitations created');
    }

    return tender;
  },

  async cancel(id: string, orgId: string): Promise<TenderRow> {
    return this.transitionStatus(id, 'cancelled', orgId);
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/tender.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `tenderService` object
- [ ] Has create, findById, findAll, update, transitionStatus, publish, cancel methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 2.5: Create Item Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.5: Create line item service

Create file: rfq-platform/backend/src/services/item.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateItemInput, UpdateItemInput } from '../schemas/item.schema';

interface ItemRow {
  id: string;
  tender_id: string;
  parent_item_id: string | null;
  item_type: string;
  sl_no: number;
  item_code: string | null;
  item_name: string;
  specification: string | null;
  quantity: number;
  uom: string | null;
  estimated_cost: number | null;
  created_at: string;
}

interface ItemTree extends ItemRow {
  children: ItemTree[];
}

export const itemService = {
  async create(tenderId: string, input: CreateItemInput, orgId: string): Promise<ItemRow> {
    const tender = await pool.query(
      'SELECT status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'draft') {
      throw Object.assign(new Error('Can only add items to draft tenders'), { statusCode: 409, code: 'CONFLICT' });
    }

    if (input.itemType === 'group' && input.quantity !== 0) {
      throw Object.assign(new Error('Group items must have quantity 0'), { statusCode: 400, code: 'VALIDATION_ERROR' });
    }

    if (input.itemType === 'item' && input.quantity <= 0) {
      throw Object.assign(new Error('Item quantity must be greater than 0'), { statusCode: 400, code: 'VALIDATION_ERROR' });
    }

    const id = uuidv4();

    const { rows } = await pool.query<ItemRow>(
      `INSERT INTO tender_items (
        id, tender_id, parent_item_id, item_type, sl_no, item_code,
        item_name, specification, quantity, uom, estimated_cost
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id, tenderId, input.parentItemId || null, input.itemType, input.slNo,
        input.itemCode || null, input.itemName, input.specification || null,
        input.quantity, input.uom || null, input.estimatedCost || null
      ]
    );

    logger.info({ itemId: id, tenderId }, 'Item created');
    return rows[0];
  },

  async findByTenderId(tenderId: string): Promise<ItemRow[]> {
    const { rows } = await pool.query<ItemRow>(
      'SELECT * FROM tender_items WHERE tender_id = $1 ORDER BY sl_no',
      [tenderId]
    );
    return rows;
  },

  async findByTenderIdAsTree(tenderId: string): Promise<ItemTree[]> {
    const items = await this.findByTenderId(tenderId);
    
    const itemMap = new Map<string, ItemTree>();
    const roots: ItemTree[] = [];

    for (const item of items) {
      itemMap.set(item.id, { ...item, children: [] });
    }

    for (const item of items) {
      const node = itemMap.get(item.id)!;
      if (item.parent_item_id === null) {
        roots.push(node);
      } else {
        const parent = itemMap.get(item.parent_item_id);
        if (parent) {
          parent.children.push(node);
        }
      }
    }

    return roots;
  },

  async findById(tenderId: string, itemId: string): Promise<ItemRow | null> {
    const { rows } = await pool.query<ItemRow>(
      'SELECT * FROM tender_items WHERE id = $1 AND tender_id = $2',
      [itemId, tenderId]
    );
    return rows[0] || null;
  },

  async update(tenderId: string, itemId: string, input: UpdateItemInput, orgId: string): Promise<ItemRow> {
    const tender = await pool.query(
      'SELECT status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'draft') {
      throw Object.assign(new Error('Can only edit items in draft tenders'), { statusCode: 409, code: 'CONFLICT' });
    }

    const item = await this.findById(tenderId, itemId);
    if (!item) {
      throw Object.assign(new Error('Item not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      itemType: 'item_type',
      slNo: 'sl_no',
      itemCode: 'item_code',
      itemName: 'item_name',
      specification: 'specification',
      quantity: 'quantity',
      uom: 'uom',
      estimatedCost: 'estimated_cost',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (key in input) {
        updates.push(`${column} = $${paramIndex}`);
        values.push((input as Record<string, unknown>)[key]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return item;
    }

    values.push(itemId);

    const { rows } = await pool.query<ItemRow>(
      `UPDATE tender_items SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    logger.info({ itemId, tenderId }, 'Item updated');
    return rows[0];
  },

  async delete(tenderId: string, itemId: string, orgId: string): Promise<void> {
    const tender = await pool.query(
      'SELECT status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'draft') {
      throw Object.assign(new Error('Can only delete items from draft tenders'), { statusCode: 409, code: 'CONFLICT' });
    }

    await pool.query('DELETE FROM tender_items WHERE id = $1 AND tender_id = $2', [itemId, tenderId]);
    
    logger.info({ itemId, tenderId }, 'Item deleted');
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/item.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `itemService` object
- [ ] Has create, findByTenderId, findByTenderIdAsTree, findById, update, delete methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 2.6: Create Feature Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.6: Create feature service

Create file: rfq-platform/backend/src/services/feature.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateFeatureInput, CreateOptionInput, AttachFeatureInput } from '../schemas/feature.schema';

interface FeatureRow {
  id: string;
  name: string;
  feature_type: string;
  scoring_type: string;
  evaluation_weight: number | null;
  is_global: boolean;
}

interface OptionRow {
  id: string;
  feature_id: string;
  option_value: string;
  option_score: number;
  sort_order: number;
}

interface ItemFeatureRow {
  tender_item_id: string;
  feature_id: string;
  is_mandatory: boolean;
}

export const featureService = {
  async createFeature(input: CreateFeatureInput): Promise<FeatureRow> {
    const id = uuidv4();

    const { rows } = await pool.query<FeatureRow>(
      `INSERT INTO feature_definitions (id, name, feature_type, scoring_type, evaluation_weight, is_global)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, input.name, input.featureType, input.scoringType, input.evaluationWeight || null, input.isGlobal]
    );

    logger.info({ featureId: id, name: input.name }, 'Feature created');
    return rows[0];
  },

  async findFeatureById(id: string): Promise<FeatureRow | null> {
    const { rows } = await pool.query<FeatureRow>(
      'SELECT * FROM feature_definitions WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findAllGlobalFeatures(): Promise<FeatureRow[]> {
    const { rows } = await pool.query<FeatureRow>(
      'SELECT * FROM feature_definitions WHERE is_global = true ORDER BY name'
    );
    return rows;
  },

  async createOption(featureId: string, input: CreateOptionInput): Promise<OptionRow> {
    const feature = await this.findFeatureById(featureId);
    if (!feature) {
      throw Object.assign(new Error('Feature not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const id = uuidv4();

    const { rows } = await pool.query<OptionRow>(
      `INSERT INTO feature_options (id, feature_id, option_value, option_score, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, featureId, input.optionValue, input.optionScore, input.sortOrder]
    );

    logger.info({ optionId: id, featureId }, 'Feature option created');
    return rows[0];
  },

  async findOptionsByFeatureId(featureId: string): Promise<OptionRow[]> {
    const { rows } = await pool.query<OptionRow>(
      'SELECT * FROM feature_options WHERE feature_id = $1 ORDER BY sort_order',
      [featureId]
    );
    return rows;
  },

  async attachToItem(tenderId: string, itemId: string, input: AttachFeatureInput, orgId: string): Promise<ItemFeatureRow> {
    const tender = await pool.query(
      'SELECT status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'draft') {
      throw Object.assign(new Error('Can only attach features to items in draft tenders'), { statusCode: 409, code: 'CONFLICT' });
    }

    const item = await pool.query(
      'SELECT id FROM tender_items WHERE id = $1 AND tender_id = $2',
      [itemId, tenderId]
    );

    if (item.rows.length === 0) {
      throw Object.assign(new Error('Item not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const { rows } = await pool.query<ItemFeatureRow>(
      `INSERT INTO tender_item_features (tender_item_id, feature_id, is_mandatory)
       VALUES ($1, $2, $3)
       ON CONFLICT (tender_item_id, feature_id) DO UPDATE SET is_mandatory = $3
       RETURNING *`,
      [itemId, input.featureId, input.isMandatory]
    );

    logger.info({ itemId, featureId: input.featureId }, 'Feature attached to item');
    return rows[0];
  },

  async findFeaturesByItemId(itemId: string): Promise<(FeatureRow & { is_mandatory: boolean; options: OptionRow[] })[]> {
    const { rows: attachments } = await pool.query<ItemFeatureRow & FeatureRow>(
      `SELECT tif.*, fd.*
       FROM tender_item_features tif
       JOIN feature_definitions fd ON fd.id = tif.feature_id
       WHERE tif.tender_item_id = $1`,
      [itemId]
    );

    const result = [];
    for (const att of attachments) {
      const options = await this.findOptionsByFeatureId(att.feature_id);
      result.push({
        id: att.feature_id,
        name: att.name,
        feature_type: att.feature_type,
        scoring_type: att.scoring_type,
        evaluation_weight: att.evaluation_weight,
        is_global: att.is_global,
        is_mandatory: att.is_mandatory,
        options,
      });
    }

    return result;
  },

  async detachFromItem(tenderId: string, itemId: string, featureId: string, orgId: string): Promise<void> {
    const tender = await pool.query(
      'SELECT status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'draft') {
      throw Object.assign(new Error('Can only detach features from items in draft tenders'), { statusCode: 409, code: 'CONFLICT' });
    }

    await pool.query(
      'DELETE FROM tender_item_features WHERE tender_item_id = $1 AND feature_id = $2',
      [itemId, featureId]
    );

    logger.info({ itemId, featureId }, 'Feature detached from item');
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/feature.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `featureService` object
- [ ] Has feature, option, and attachment methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 2.7: Create Tender Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.7: Create tender controller

Create file: rfq-platform/backend/src/controllers/tender.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { tenderService } from '../services/tender.service';
import type { CreateTenderInput, UpdateTenderInput, PublishTenderInput } from '../schemas/tender.schema';

export const tenderController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateTenderInput;
      const tender = await tenderService.create(input, req.user!.id, req.user!.orgId);
      res.status(201).json({ data: tender });
    } catch (err) {
      next(err);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.user!.roles.includes('buyer') ? 'buyer' : 'vendor';
      const tenders = await tenderService.findAll(req.user!.orgId, role);
      res.status(200).json({ data: tenders });
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tender = await tenderService.findById(id);
      
      if (!tender) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Tender not found' } });
        return;
      }

      const isOwner = tender.buyer_org_id === req.user!.orgId;
      const isVendor = req.user!.roles.includes('vendor');

      if (isVendor && !isOwner) {
        const response = { ...tender, fund_allocation: undefined, estimated_cost: undefined };
        res.status(200).json({ data: response });
        return;
      }

      res.status(200).json({ data: tender });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateTenderInput;
      const tender = await tenderService.update(id, input, req.user!.orgId);
      res.status(200).json({ data: tender });
    } catch (err) {
      next(err);
    }
  },

  async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as PublishTenderInput;
      const tender = await tenderService.publish(id, req.user!.orgId, input.invitedVendorIds);
      res.status(200).json({ data: tender });
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tender = await tenderService.cancel(id, req.user!.orgId);
      res.status(200).json({ data: tender });
    } catch (err) {
      next(err);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/tender.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `tenderController` object
- [ ] Has create, findAll, findById, update, publish, cancel methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 2.8: Create Item Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.8: Create item controller

Create file: rfq-platform/backend/src/controllers/item.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { itemService } from '../services/item.service';
import type { CreateItemInput, UpdateItemInput } from '../schemas/item.schema';

export const itemController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as CreateItemInput;
      const item = await itemService.create(tenderId, input, req.user!.orgId);
      res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async findByTenderId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const tree = req.query.tree === 'true';
      
      if (tree) {
        const items = await itemService.findByTenderIdAsTree(tenderId);
        res.status(200).json({ data: items });
      } else {
        const items = await itemService.findByTenderId(tenderId);

        const isVendor = req.user!.roles.includes('vendor') && !req.user!.roles.includes('buyer');
        if (isVendor) {
          const sanitized = items.map(item => ({ ...item, estimated_cost: undefined }));
          res.status(200).json({ data: sanitized });
          return;
        }

        res.status(200).json({ data: items });
      }
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId, id } = req.params;
      const item = await itemService.findById(tenderId, id);
      
      if (!item) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });
        return;
      }

      res.status(200).json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId, id } = req.params;
      const input = req.body as UpdateItemInput;
      const item = await itemService.update(tenderId, id, input, req.user!.orgId);
      res.status(200).json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId, id } = req.params;
      await itemService.delete(tenderId, id, req.user!.orgId);
      res.status(200).json({ data: { message: 'Item deleted' } });
    } catch (err) {
      next(err);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/item.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `itemController` object
- [ ] Has create, findByTenderId, findById, update, delete methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 2.9: Create Feature Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.9: Create feature controller

Create file: rfq-platform/backend/src/controllers/feature.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { featureService } from '../services/feature.service';
import type { CreateFeatureInput, CreateOptionInput, AttachFeatureInput } from '../schemas/feature.schema';

export const featureController = {
  async createFeature(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateFeatureInput;
      const feature = await featureService.createFeature(input);
      res.status(201).json({ data: feature });
    } catch (err) {
      next(err);
    }
  },

  async findAllGlobal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const features = await featureService.findAllGlobalFeatures();
      res.status(200).json({ data: features });
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const feature = await featureService.findFeatureById(id);
      
      if (!feature) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Feature not found' } });
        return;
      }

      const options = await featureService.findOptionsByFeatureId(id);
      res.status(200).json({ data: { ...feature, options } });
    } catch (err) {
      next(err);
    }
  },

  async createOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as CreateOptionInput;
      const option = await featureService.createOption(id, input);
      res.status(201).json({ data: option });
    } catch (err) {
      next(err);
    }
  },

  async attachToItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId, itemId } = req.params;
      const input = req.body as AttachFeatureInput;
      const attachment = await featureService.attachToItem(tenderId, itemId, input, req.user!.orgId);
      res.status(201).json({ data: attachment });
    } catch (err) {
      next(err);
    }
  },

  async findByItemId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { itemId } = req.params;
      const features = await featureService.findFeaturesByItemId(itemId);
      res.status(200).json({ data: features });
    } catch (err) {
      next(err);
    }
  },

  async detachFromItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId, itemId, featureId } = req.params;
      await featureService.detachFromItem(tenderId, itemId, featureId, req.user!.orgId);
      res.status(200).json({ data: { message: 'Feature detached' } });
    } catch (err) {
      next(err);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/feature.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `featureController` object
- [ ] Has feature and option management methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 2.10: Create Tender Routes

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.10: Create tender routes

Create file: rfq-platform/backend/src/routes/tender.routes.ts

Content (copy EXACTLY):
import { Router } from 'express';
import { tenderController } from '../controllers/tender.controller';
import { itemController } from '../controllers/item.controller';
import { featureController } from '../controllers/feature.controller';
import { authenticate, authorize, validate } from '../middleware';
import { createTenderSchema, updateTenderSchema, publishTenderSchema } from '../schemas/tender.schema';
import { createItemSchema, updateItemSchema } from '../schemas/item.schema';
import { attachFeatureSchema } from '../schemas/feature.schema';

const router = Router();

router.use(authenticate);

router.post('/', authorize('buyer', 'admin'), validate(createTenderSchema), tenderController.create);
router.get('/', tenderController.findAll);
router.get('/:id', tenderController.findById);
router.put('/:id', authorize('buyer', 'admin'), validate(updateTenderSchema), tenderController.update);
router.post('/:id/publish', authorize('buyer', 'admin'), validate(publishTenderSchema), tenderController.publish);
router.post('/:id/cancel', authorize('buyer', 'admin'), tenderController.cancel);

router.post('/:tenderId/items', authorize('buyer', 'admin'), validate(createItemSchema), itemController.create);
router.get('/:tenderId/items', itemController.findByTenderId);
router.get('/:tenderId/items/:id', itemController.findById);
router.put('/:tenderId/items/:id', authorize('buyer', 'admin'), validate(updateItemSchema), itemController.update);
router.delete('/:tenderId/items/:id', authorize('buyer', 'admin'), itemController.delete);

router.post('/:tenderId/items/:itemId/features', authorize('buyer', 'admin'), validate(attachFeatureSchema), featureController.attachToItem);
router.get('/:tenderId/items/:itemId/features', featureController.findByItemId);
router.delete('/:tenderId/items/:itemId/features/:featureId', authorize('buyer', 'admin'), featureController.detachFromItem);

export { router as tenderRoutes };

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/routes/tender.routes.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `tenderRoutes`
- [ ] Has routes for tenders, items, and features

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 2.11: Create Feature Routes

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.11: Create feature routes

Create file: rfq-platform/backend/src/routes/feature.routes.ts

Content (copy EXACTLY):
import { Router } from 'express';
import { featureController } from '../controllers/feature.controller';
import { authenticate, authorize, validate } from '../middleware';
import { createFeatureSchema, createOptionSchema } from '../schemas/feature.schema';

const router = Router();

router.use(authenticate);

router.post('/', authorize('buyer', 'admin'), validate(createFeatureSchema), featureController.createFeature);
router.get('/', featureController.findAllGlobal);
router.get('/:id', featureController.findById);
router.post('/:id/options', authorize('buyer', 'admin'), validate(createOptionSchema), featureController.createOption);

export { router as featureRoutes };

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/routes/feature.routes.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `featureRoutes`
- [ ] Has routes for features and options

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 2.12: Update Routes Index

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 2.12: Update routes index to include new routes

MODIFY file: rfq-platform/backend/src/routes/index.ts

Replace ENTIRE content with:
import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { tenderRoutes } from './tender.routes';
import { featureRoutes } from './feature.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenders', tenderRoutes);
router.use('/features', featureRoutes);

export { router as apiRoutes };

Respond "✅ DONE" when file is updated.
```

### EXPECTED OUTPUT:
- File updated at `rfq-platform/backend/src/routes/index.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Mounts authRoutes, tenderRoutes, and featureRoutes

### REMARKS:
```
[Agent writes completion notes here]
```

---

# PHASE 2 COMPLETION CHECKLIST

| Task | File | Status |
|------|------|--------|
| 2.1 | schemas/tender.schema.ts | ⬜ |
| 2.2 | schemas/item.schema.ts | ⬜ |
| 2.3 | schemas/feature.schema.ts | ⬜ |
| 2.4 | services/tender.service.ts | ⬜ |
| 2.5 | services/item.service.ts | ⬜ |
| 2.6 | services/feature.service.ts | ⬜ |
| 2.7 | controllers/tender.controller.ts | ⬜ |
| 2.8 | controllers/item.controller.ts | ⬜ |
| 2.9 | controllers/feature.controller.ts | ⬜ |
| 2.10 | routes/tender.routes.ts | ⬜ |
| 2.11 | routes/feature.routes.ts | ⬜ |
| 2.12 | routes/index.ts (update) | ⬜ |

---

## AFTER PHASE 2 COMPLETE

Run these commands to verify:

```bash
cd rfq-platform/backend
npm run build
```

If build succeeds with no errors, Phase 2 is complete.

**Test endpoints using Postman or curl:**
1. Create a tender: POST /api/tenders
2. Get all tenders: GET /api/tenders
3. Add item to tender: POST /api/tenders/:id/items
4. Publish tender: POST /api/tenders/:id/publish

**Proceed to TASK_PLAN_PHASE3.md**