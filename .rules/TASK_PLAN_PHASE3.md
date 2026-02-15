# PHASE 3: VENDOR & BID ENGINE
## Micro-Task Execution Plan with Tracking

> **FOR AI CODING AGENT**: Execute tasks IN ORDER. Mark status after each task.
> **PREREQUISITE**: Phase 1 and Phase 2 must be 100% complete before starting Phase 3.

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

CURRENT PHASE: Phase 3 - Vendor & Bid Engine
FILES ALREADY EXIST FROM PHASE 1 & 2 - DO NOT RECREATE THEM

You are now ready. Wait for Task 3.1.
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

# TASK 3.1: Create Vendor Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 3.1: Create vendor validation schema

Create file: rfq-platform/backend/src/schemas/vendor.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const createVendorProfileSchema = z.object({
  legalName: z.string().min(2).max(200),
  taxId: z.string().max(50).optional(),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  website: z.string().url().optional(),
});

export const updateVendorProfileSchema = createVendorProfileSchema.partial();

export const vendorStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended']),
  rejectionReason: z.string().max(500).optional(),
});

export const uploadDocumentSchema = z.object({
  documentType: z.enum(['trade_license', 'vat_certificate', 'iso_cert', 'other']),
  fileUrl: z.string().url(),
  issuedDate: z.string().date().optional(),
  expiryDate: z.string().date().optional(),
});

export const addCategorySchema = z.object({
  categoryId: z.string().uuid(),
});

export type CreateVendorProfileInput = z.infer<typeof createVendorProfileSchema>;
export type UpdateVendorProfileInput = z.infer<typeof updateVendorProfileSchema>;
export type VendorStatusInput = z.infer<typeof vendorStatusSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type AddCategoryInput = z.infer<typeof addCategorySchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/vendor.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 5 schemas and 5 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 3.2: Create Bid Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 3.2: Create bid validation schema

Create file: rfq-platform/backend/src/schemas/bid.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const createBidSchema = z.object({
  tenderId: z.string().uuid(),
});

export const bidItemSchema = z.object({
  tenderItemId: z.string().uuid(),
  envelopeType: z.enum(['technical', 'commercial']),
  unitPrice: z.number().positive().optional(),
  compliance: z.enum(['compliant', 'non_compliant', 'partial']).optional(),
  nonComplianceRemarks: z.string().max(1000).optional(),
  brandMake: z.string().max(200).optional(),
});

export const bidItemFeatureValueSchema = z.object({
  featureId: z.string().uuid(),
  optionId: z.string().uuid().optional(),
  textValue: z.string().max(1000).optional(),
  numericValue: z.number().optional(),
});

export const updateBidSchema = z.object({
  items: z.array(bidItemSchema),
  featureValues: z.array(bidItemFeatureValueSchema).optional(),
});

export const submitBidSchema = z.object({
  confirmSubmission: z.literal(true),
});

export const bidIdSchema = z.object({
  bidId: z.string().uuid(),
});

export type CreateBidInput = z.infer<typeof createBidSchema>;
export type BidItemInput = z.infer<typeof bidItemSchema>;
export type BidItemFeatureValueInput = z.infer<typeof bidItemFeatureValueSchema>;
export type UpdateBidInput = z.infer<typeof updateBidSchema>;
export type SubmitBidInput = z.infer<typeof submitBidSchema>;
export type BidIdInput = z.infer<typeof bidIdSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/bid.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 6 schemas and 6 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 3.3: Create Vendor Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 3.3: Create vendor service

Create file: rfq-platform/backend/src/services/vendor.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type {
  CreateVendorProfileInput,
  UpdateVendorProfileInput,
  VendorStatusInput,
  UploadDocumentInput,
  AddCategoryInput,
} from '../schemas/vendor.schema';

interface VendorProfileRow {
  organization_id: string;
  legal_name: string;
  tax_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  status: string;
  status_changed_at: string;
  status_changed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface VendorDocumentRow {
  id: string;
  vendor_org_id: string;
  document_type: string;
  file_url: string;
  issued_date: string | null;
  expiry_date: string | null;
  uploaded_at: string;
  uploaded_by: string;
}

interface VendorCategoryRow {
  vendor_org_id: string;
  category_id: string;
  added_at: string;
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['approved', 'rejected'],
  approved: ['suspended'],
  rejected: ['pending'],
  suspended: ['approved', 'rejected'],
};

export const vendorService = {
  async createProfile(orgId: string, input: CreateVendorProfileInput): Promise<VendorProfileRow> {
    const { rows } = await pool.query<VendorProfileRow>(
      `INSERT INTO vendor_profiles (
        organization_id, legal_name, tax_id, contact_name,
        contact_email, contact_phone, website, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [
        orgId, input.legalName, input.taxId || null, input.contactName || null,
        input.contactEmail || null, input.contactPhone || null, input.website || null
      ]
    );

    logger.info({ orgId }, 'Vendor profile created');
    return rows[0];
  },

  async findProfileByOrgId(orgId: string): Promise<VendorProfileRow | null> {
    const { rows } = await pool.query<VendorProfileRow>(
      'SELECT * FROM vendor_profiles WHERE organization_id = $1',
      [orgId]
    );
    return rows[0] || null;
  },

  async findAllProfiles(status?: string): Promise<VendorProfileRow[]> {
    let query = 'SELECT * FROM vendor_profiles';
    const params: string[] = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query<VendorProfileRow>(query, params);
    return rows;
  },

  async updateProfile(orgId: string, input: UpdateVendorProfileInput): Promise<VendorProfileRow> {
    const profile = await this.findProfileByOrgId(orgId);
    
    if (!profile) {
      throw Object.assign(new Error('Vendor profile not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      legalName: 'legal_name',
      taxId: 'tax_id',
      contactName: 'contact_name',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      website: 'website',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (key in input) {
        updates.push(`${column} = $${paramIndex}`);
        values.push((input as Record<string, unknown>)[key]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return profile;
    }

    values.push(orgId);

    const { rows } = await pool.query<VendorProfileRow>(
      `UPDATE vendor_profiles SET ${updates.join(', ')} WHERE organization_id = $${paramIndex} RETURNING *`,
      values
    );

    logger.info({ orgId }, 'Vendor profile updated');
    return rows[0];
  },

  async changeStatus(orgId: string, input: VendorStatusInput, changedByUserId: string): Promise<VendorProfileRow> {
    const profile = await this.findProfileByOrgId(orgId);

    if (!profile) {
      throw Object.assign(new Error('Vendor profile not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const allowed = VALID_STATUS_TRANSITIONS[profile.status] || [];
    if (!allowed.includes(input.status)) {
      throw Object.assign(
        new Error(`Cannot transition from ${profile.status} to ${input.status}`),
        { statusCode: 409, code: 'CONFLICT' }
      );
    }

    if (input.status === 'rejected' && !input.rejectionReason) {
      throw Object.assign(
        new Error('Rejection reason is required'),
        { statusCode: 400, code: 'VALIDATION_ERROR' }
      );
    }

    const { rows } = await pool.query<VendorProfileRow>(
      `UPDATE vendor_profiles 
       SET status = $1, status_changed_at = NOW(), status_changed_by = $2, rejection_reason = $3
       WHERE organization_id = $4 
       RETURNING *`,
      [input.status, changedByUserId, input.rejectionReason || null, orgId]
    );

    logger.info({ orgId, oldStatus: profile.status, newStatus: input.status }, 'Vendor status changed');
    return rows[0];
  },

  async uploadDocument(orgId: string, input: UploadDocumentInput, uploadedByUserId: string): Promise<VendorDocumentRow> {
    const id = uuidv4();

    const { rows } = await pool.query<VendorDocumentRow>(
      `INSERT INTO vendor_documents (id, vendor_org_id, document_type, file_url, issued_date, expiry_date, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, orgId, input.documentType, input.fileUrl, input.issuedDate || null, input.expiryDate || null, uploadedByUserId]
    );

    logger.info({ documentId: id, orgId, documentType: input.documentType }, 'Vendor document uploaded');
    return rows[0];
  },

  async findDocumentsByOrgId(orgId: string): Promise<VendorDocumentRow[]> {
    const { rows } = await pool.query<VendorDocumentRow>(
      'SELECT * FROM vendor_documents WHERE vendor_org_id = $1 ORDER BY uploaded_at DESC',
      [orgId]
    );
    return rows;
  },

  async deleteDocument(orgId: string, documentId: string): Promise<void> {
    const result = await pool.query(
      'DELETE FROM vendor_documents WHERE id = $1 AND vendor_org_id = $2',
      [documentId, orgId]
    );

    if (result.rowCount === 0) {
      throw Object.assign(new Error('Document not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    logger.info({ documentId, orgId }, 'Vendor document deleted');
  },

  async addCategory(orgId: string, input: AddCategoryInput): Promise<VendorCategoryRow> {
    const { rows } = await pool.query<VendorCategoryRow>(
      `INSERT INTO vendor_categories (vendor_org_id, category_id)
       VALUES ($1, $2)
       ON CONFLICT (vendor_org_id, category_id) DO NOTHING
       RETURNING *`,
      [orgId, input.categoryId]
    );

    if (rows.length === 0) {
      const existing = await pool.query<VendorCategoryRow>(
        'SELECT * FROM vendor_categories WHERE vendor_org_id = $1 AND category_id = $2',
        [orgId, input.categoryId]
      );
      return existing.rows[0];
    }

    logger.info({ orgId, categoryId: input.categoryId }, 'Vendor category added');
    return rows[0];
  },

  async findCategoriesByOrgId(orgId: string): Promise<VendorCategoryRow[]> {
    const { rows } = await pool.query<VendorCategoryRow>(
      `SELECT vc.*, cm.name as category_name
       FROM vendor_categories vc
       JOIN categories_master cm ON cm.id = vc.category_id
       WHERE vc.vendor_org_id = $1
       ORDER BY cm.name`,
      [orgId]
    );
    return rows;
  },

  async removeCategory(orgId: string, categoryId: string): Promise<void> {
    await pool.query(
      'DELETE FROM vendor_categories WHERE vendor_org_id = $1 AND category_id = $2',
      [orgId, categoryId]
    );

    logger.info({ orgId, categoryId }, 'Vendor category removed');
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/vendor.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `vendorService` object
- [ ] Has profile, document, and category methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 3.4: Create Bid Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 3.4: Create bid service

Create file: rfq-platform/backend/src/services/bid.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pool, logger } from '../config';
import type { UpdateBidInput, BidItemInput, BidItemFeatureValueInput } from '../schemas/bid.schema';

interface BidRow {
  id: string;
  tender_id: string;
  vendor_org_id: string;
  version: number;
  status: string;
  total_amount: number | null;
  compliance_status: string | null;
  digital_hash: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BidItemRow {
  id: string;
  bid_id: string;
  tender_item_id: string;
  envelope_type: string;
  unit_price: number | null;
  item_total_price: number | null;
  compliance: string | null;
  non_compliance_remarks: string | null;
  brand_make: string | null;
}

interface BidEnvelopeRow {
  id: string;
  bid_id: string;
  envelope_type: string;
  is_open: boolean;
  opened_at: string | null;
  opened_by: string | null;
}

export const bidService = {
  async create(tenderId: string, vendorOrgId: string): Promise<BidRow> {
    const tender = await pool.query(
      'SELECT id, status, submission_deadline FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].status !== 'published' && tender.rows[0].status !== 'clarification') {
      throw Object.assign(new Error('Tender is not open for bidding'), { statusCode: 409, code: 'CONFLICT' });
    }

    const existingBid = await this.findActiveBid(tenderId, vendorOrgId);
    if (existingBid && existingBid.status === 'draft') {
      return existingBid;
    }

    const maxVersion = await pool.query(
      'SELECT COALESCE(MAX(version), 0) as max_version FROM bids WHERE tender_id = $1 AND vendor_org_id = $2',
      [tenderId, vendorOrgId]
    );
    const newVersion = maxVersion.rows[0].max_version + 1;

    const id = uuidv4();

    const { rows } = await pool.query<BidRow>(
      `INSERT INTO bids (id, tender_id, vendor_org_id, version, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [id, tenderId, vendorOrgId, newVersion]
    );

    await pool.query(
      `INSERT INTO bid_envelopes (id, bid_id, envelope_type, is_open) VALUES ($1, $2, 'technical', false)`,
      [uuidv4(), id]
    );
    await pool.query(
      `INSERT INTO bid_envelopes (id, bid_id, envelope_type, is_open) VALUES ($1, $2, 'commercial', false)`,
      [uuidv4(), id]
    );

    logger.info({ bidId: id, tenderId, vendorOrgId, version: newVersion }, 'Bid created');
    return rows[0];
  },

  async findById(bidId: string): Promise<BidRow | null> {
    const { rows } = await pool.query<BidRow>(
      'SELECT * FROM bids WHERE id = $1',
      [bidId]
    );
    return rows[0] || null;
  },

  async findActiveBid(tenderId: string, vendorOrgId: string): Promise<BidRow | null> {
    const { rows } = await pool.query<BidRow>(
      `SELECT * FROM bids 
       WHERE tender_id = $1 AND vendor_org_id = $2 AND status IN ('draft', 'submitted')
       ORDER BY version DESC LIMIT 1`,
      [tenderId, vendorOrgId]
    );
    return rows[0] || null;
  },

  async findByTenderId(tenderId: string): Promise<BidRow[]> {
    const { rows } = await pool.query<BidRow>(
      `SELECT * FROM bids WHERE tender_id = $1 AND status = 'submitted' ORDER BY submitted_at`,
      [tenderId]
    );
    return rows;
  },

  async update(bidId: string, input: UpdateBidInput, vendorOrgId: string): Promise<BidRow> {
    const bid = await this.findById(bidId);

    if (!bid) {
      throw Object.assign(new Error('Bid not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (bid.vendor_org_id !== vendorOrgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (bid.status !== 'draft') {
      throw Object.assign(new Error('Can only update draft bids'), { statusCode: 409, code: 'CONFLICT' });
    }

    for (const item of input.items) {
      await this.upsertBidItem(bidId, item);
    }

    if (input.featureValues) {
      for (const fv of input.featureValues) {
        await this.upsertFeatureValue(bidId, fv);
      }
    }

    await pool.query('UPDATE bids SET updated_at = NOW() WHERE id = $1', [bidId]);

    logger.info({ bidId }, 'Bid updated');
    return (await this.findById(bidId))!;
  },

  async upsertBidItem(bidId: string, item: BidItemInput): Promise<BidItemRow> {
    const id = uuidv4();

    const { rows } = await pool.query<BidItemRow>(
      `INSERT INTO bid_items (id, bid_id, tender_item_id, envelope_type, unit_price, compliance, non_compliance_remarks, brand_make)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (bid_id, tender_item_id, envelope_type) DO UPDATE SET
         unit_price = EXCLUDED.unit_price,
         compliance = EXCLUDED.compliance,
         non_compliance_remarks = EXCLUDED.non_compliance_remarks,
         brand_make = EXCLUDED.brand_make
       RETURNING *`,
      [id, bidId, item.tenderItemId, item.envelopeType, item.unitPrice || null, item.compliance || null, item.nonComplianceRemarks || null, item.brandMake || null]
    );

    return rows[0];
  },

  async upsertFeatureValue(bidId: string, fv: BidItemFeatureValueInput): Promise<void> {
    const bidItems = await pool.query(
      'SELECT id FROM bid_items WHERE bid_id = $1',
      [bidId]
    );

    if (bidItems.rows.length === 0) return;

    const bidItemId = bidItems.rows[0].id;

    await pool.query(
      `INSERT INTO bid_item_feature_values (bid_item_id, feature_id, option_id, text_value, numeric_value)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (bid_item_id, feature_id) DO UPDATE SET
         option_id = EXCLUDED.option_id,
         text_value = EXCLUDED.text_value,
         numeric_value = EXCLUDED.numeric_value`,
      [bidItemId, fv.featureId, fv.optionId || null, fv.textValue || null, fv.numericValue || null]
    );
  },

  async submit(bidId: string, vendorOrgId: string): Promise<BidRow> {
    const bid = await this.findById(bidId);

    if (!bid) {
      throw Object.assign(new Error('Bid not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (bid.vendor_org_id !== vendorOrgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (bid.status !== 'draft') {
      throw Object.assign(new Error('Bid is not in draft status'), { statusCode: 409, code: 'CONFLICT' });
    }

    const tender = await pool.query(
      'SELECT submission_deadline FROM tenders WHERE id = $1',
      [bid.tender_id]
    );

    if (new Date() > new Date(tender.rows[0].submission_deadline)) {
      throw Object.assign(new Error('Submission deadline has passed'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    const unacknowledged = await pool.query(
      `SELECT COUNT(*) as count FROM addendum_acknowledgements aa
       JOIN addenda a ON a.id = aa.addendum_id
       WHERE a.tender_id = $1 AND aa.vendor_org_id = $2 AND aa.acknowledged_at IS NULL`,
      [bid.tender_id, vendorOrgId]
    );

    if (parseInt(unacknowledged.rows[0].count) > 0) {
      throw Object.assign(new Error('Unacknowledged addenda exist'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(
        CASE WHEN bi.unit_price IS NOT NULL AND ti.quantity IS NOT NULL 
        THEN bi.unit_price * ti.quantity ELSE 0 END
      ), 0) as total
       FROM bid_items bi
       JOIN tender_items ti ON ti.id = bi.tender_item_id
       WHERE bi.bid_id = $1 AND bi.envelope_type = 'commercial'`,
      [bidId]
    );

    const totalAmount = parseFloat(totalResult.rows[0].total);

    const bidData = await pool.query(
      `SELECT bi.*, bfv.feature_id, bfv.option_id, bfv.text_value, bfv.numeric_value
       FROM bid_items bi
       LEFT JOIN bid_item_feature_values bfv ON bfv.bid_item_id = bi.id
       WHERE bi.bid_id = $1
       ORDER BY bi.tender_item_id`,
      [bidId]
    );

    const hashPayload = JSON.stringify({
      bidId,
      tenderId: bid.tender_id,
      vendorOrgId: bid.vendor_org_id,
      version: bid.version,
      totalAmount,
      items: bidData.rows,
    });
    const digitalHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const { rows } = await pool.query<BidRow>(
      `UPDATE bids SET 
        status = 'submitted', 
        total_amount = $1, 
        digital_hash = $2, 
        submitted_at = NOW(),
        updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [totalAmount, digitalHash, bidId]
    );

    logger.info({ bidId, totalAmount, digitalHash }, 'Bid submitted');
    return rows[0];
  },

  async withdraw(bidId: string, vendorOrgId: string): Promise<BidRow> {
    const bid = await this.findById(bidId);

    if (!bid) {
      throw Object.assign(new Error('Bid not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (bid.vendor_org_id !== vendorOrgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (bid.status !== 'submitted') {
      throw Object.assign(new Error('Only submitted bids can be withdrawn'), { statusCode: 409, code: 'CONFLICT' });
    }

    const tender = await pool.query(
      'SELECT submission_deadline FROM tenders WHERE id = $1',
      [bid.tender_id]
    );

    if (new Date() > new Date(tender.rows[0].submission_deadline)) {
      throw Object.assign(new Error('Cannot withdraw after submission deadline'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    const { rows } = await pool.query<BidRow>(
      `UPDATE bids SET status = 'withdrawn', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [bidId]
    );

    logger.info({ bidId }, 'Bid withdrawn');
    return rows[0];
  },

  async findBidItems(bidId: string): Promise<BidItemRow[]> {
    const { rows } = await pool.query<BidItemRow>(
      'SELECT * FROM bid_items WHERE bid_id = $1 ORDER BY tender_item_id',
      [bidId]
    );
    return rows;
  },

  async findBidEnvelopes(bidId: string): Promise<BidEnvelopeRow[]> {
    const { rows } = await pool.query<BidEnvelopeRow>(
      'SELECT * FROM bid_envelopes WHERE bid_id = $1',
      [bidId]
    );
    return rows;
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/bid.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `bidService` object
- [ ] Has create, update, submit, withdraw methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 3.5: Create Vendor Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 3.5: Create vendor controller

Create file: rfq-platform/backend/src/controllers/vendor.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { vendorService } from '../services/vendor.service';
import type {
  CreateVendorProfileInput,
  UpdateVendorProfileInput,
  VendorStatusInput,
  UploadDocumentInput,
  AddCategoryInput,
} from '../schemas/vendor.schema';

export const vendorController = {
  async createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateVendorProfileInput;
      const profile = await vendorService.createProfile(req.user!.orgId, input);
      res.status(201).json({ data: profile });
    } catch (err) {
      next(err);
    }
  },

  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await vendorService.findProfileByOrgId(req.user!.orgId);
      
      if (!profile) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vendor profile not found' } });
        return;
      }

      const documents = await vendorService.findDocumentsByOrgId(req.user!.orgId);
      const categories = await vendorService.findCategoriesByOrgId(req.user!.orgId);

      res.status(200).json({ data: { ...profile, documents, categories } });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateVendorProfileInput;
      const profile = await vendorService.updateProfile(req.user!.orgId, input);
      res.status(200).json({ data: profile });
    } catch (err) {
      next(err);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const profiles = await vendorService.findAllProfiles(status);
      res.status(200).json({ data: profiles });
    } catch (err) {
      next(err);
    }
  },

  async findByOrgId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orgId } = req.params;
      const profile = await vendorService.findProfileByOrgId(orgId);

      if (!profile) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vendor profile not found' } });
        return;
      }

      const documents = await vendorService.findDocumentsByOrgId(orgId);
      const categories = await vendorService.findCategoriesByOrgId(orgId);

      res.status(200).json({ data: { ...profile, documents, categories } });
    } catch (err) {
      next(err);
    }
  },

  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orgId } = req.params;
      const input = req.body as VendorStatusInput;
      const profile = await vendorService.changeStatus(orgId, input, req.user!.id);
      res.status(200).json({ data: profile });
    } catch (err) {
      next(err);
    }
  },

  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UploadDocumentInput;
      const document = await vendorService.uploadDocument(req.user!.orgId, input, req.user!.id);
      res.status(201).json({ data: document });
    } catch (err) {
      next(err);
    }
  },

  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentId } = req.params;
      await vendorService.deleteDocument(req.user!.orgId, documentId);
      res.status(200).json({ data: { message: 'Document deleted' } });
    } catch (err) {
      next(err);
    }
  },

  async addCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as AddCategoryInput;
      const category = await vendorService.addCategory(req.user!.orgId, input);
      res.status(201).json({ data: category });
    } catch (err) {
      next(err);
    }
  },

  async removeCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      await vendorService.removeCategory(req.user!.orgId, categoryId);
      res.status(200).json({ data: { message: 'Category removed' } });
    } catch (err) {
      next(err);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/vendor.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `vendorController` object
- [ ] Has profile, document, and category methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 3.6: Create Bid Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 3.6: Create bid controller

Create file: rfq-platform/backend/src/controllers/bid.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { bidService } from '../services/bid.service';
import type { UpdateBidInput } from '../schemas/bid.schema';

export const bidController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const bid = await bidService.create(tenderId, req.user!.orgId);
      res.status(201).json({ data: bid });
    } catch (err) {
      next(err);
    }
  },

  async getMyBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const bid = await bidService.findActiveBid(tenderId, req.user!.orgId);

      if (!bid) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No active bid found' } });
        return;
      }

      const items = await bidService.findBidItems(bid.id);
      const envelopes = await bidService.findBidEnvelopes(bid.id);

      res.status(200).json({ data: { ...bid, items, envelopes } });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bidId } = req.params;
      const input = req.body as UpdateBidInput;
      const bid = await bidService.update(bidId, input, req.user!.orgId);
      res.status(200).json({ data: bid });
    } catch (err) {
      next(err);
    }
  },

  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bidId } = req.params;
      const bid = await bidService.submit(bidId, req.user!.orgId);
      res.status(200).json({ data: bid });
    } catch (err) {
      next(err);
    }
  },

  async withdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bidId } = req.params;
      const bid = await bidService.withdraw(bidId, req.user!.orgId);
      res.status(200).json({ data: bid });
    } catch (err) {
      next(err);
    }
  },

  async findByTenderId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const bids = await bidService.findByTenderId(tenderId);
      res.status(200).json({ data: bids });
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bidId } = req.params;
      const bid = await bidService.findById(bidId);

      if (!bid) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Bid not found' } });
        return;
      }

      const isOwner = bid.vendor_org_id === req.user!.orgId;
      const isBuyer = req.user!.roles.includes('buyer') || req.user!.roles.includes('admin');

      if (!isOwner && !isBuyer) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
        return;
      }

      const items = await bidService.findBidItems(bid.id);
      const envelopes = await bidService.findBidEnvelopes(bid.id);

      if (!isOwner && isBuyer) {
        const technicalEnvelope = envelopes.find(e => e.envelope_type === 'technical');
        const commercialEnvelope = envelopes.find(e => e.envelope_type === 'commercial');

        const filteredItems = items.filter(item => {
          if (item.envelope_type === 'technical') {
            return technicalEnvelope?.is_open;
          }
          if (item.envelope_type === 'commercial') {
            return commercialEnvelope?.is_open;
          }
          return false;
        });

        res.status(200).json({ data: { ...bid, items: filteredItems, envelopes } });
        return;
      }

      res.status(200).json({ data: { ...bid, items, envelopes } });
    } catch (err) {
      next(err);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/bid.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `bidController` object
- [ ] Has create, update, submit, withdraw methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 3.7: Create Vendor Routes

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 3.7: Create vendor routes

Create file: rfq-platform/backend/src/routes/vendor.routes.ts

Content (copy EXACTLY):
import { Router } from 'express';
import { vendorController } from '../controllers/vendor.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createVendorProfileSchema,
  updateVendorProfileSchema,
  vendorStatusSchema,
  uploadDocumentSchema,
  addCategorySchema,
} from '../schemas/vendor.schema';

const router = Router();

router.use(authenticate);

router.post('/profile', authorize('vendor'), validate(createVendorProfileSchema), vendorController.createProfile);
router.get('/profile', authorize('vendor'), vendorController.getMyProfile);
router.put('/profile', authorize('vendor'), validate(updateVendorProfileSchema), vendorController.updateProfile);

router.post('/profile/documents', authorize('vendor'), validate(uploadDocumentSchema), vendorController.uploadDocument);
router.delete('/profile/documents/:documentId', authorize('vendor'), vendorController.deleteDocument);

router.post('/profile/categories', authorize('vendor'), validate(addCategorySchema), vendorController.addCategory);
router.delete('/profile/categories/:categoryId', authorize('vendor'), vendorController.removeCategory);

router.get('/', authorize('buyer', 'admin'), vendorController.findAll);
router.get('/:orgId', authorize('buyer', 'admin'), vendorController.findByOrgId);
router.put('/:orgId/status', authorize('buyer', 'admin'), validate(vendorStatusSchema), vendorController.changeStatus);

export { router as vendorRoutes };

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/routes/vendor.routes.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `vendorRoutes`
- [ ] Has profile, document, category, and admin routes

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 3.8: Create Bid Routes

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 3.8: Create bid routes

Create file: rfq-platform/backend/src/routes/bid.routes.ts

Content (copy EXACTLY):
import { Router } from 'express';
import { bidController } from '../controllers/bid.controller';
import { authenticate, authorize, validate } from '../middleware';
import { updateBidSchema, submitBidSchema } from '../schemas/bid.schema';

const router = Router();

router.use(authenticate);

router.post('/tenders/:tenderId/bids', authorize('vendor'), bidController.create);
router.get('/tenders/:tenderId/bids/my', authorize('vendor'), bidController.getMyBid);
router.get('/tenders/:tenderId/bids', authorize('buyer', 'admin', 'evaluator'), bidController.findByTenderId);

router.get('/bids/:bidId', bidController.findById);
router.put('/bids/:bidId', authorize('vendor'), validate(updateBidSchema), bidController.update);
router.post('/bids/:bidId/submit', authorize('vendor'), validate(submitBidSchema), bidController.submit);
router.post('/bids/:bidId/withdraw', authorize('vendor'), bidController.withdraw);

export { router as bidRoutes };

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/routes/bid.routes.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `bidRoutes`
- [ ] Has bid CRUD and submission routes

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 3.9: Update Routes Index

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 3.9: Update routes index to include vendor and bid routes

MODIFY file: rfq-platform/backend/src/routes/index.ts

Replace ENTIRE content with:
import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { tenderRoutes } from './tender.routes';
import { featureRoutes } from './feature.routes';
import { vendorRoutes } from './vendor.routes';
import { bidRoutes } from './bid.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenders', tenderRoutes);
router.use('/features', featureRoutes);
router.use('/vendors', vendorRoutes);
router.use('/', bidRoutes);

export { router as apiRoutes };

Respond "✅ DONE" when file is updated.
```

### EXPECTED OUTPUT:
- File updated at `rfq-platform/backend/src/routes/index.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Mounts all 5 route modules

### REMARKS:
```
[Agent writes completion notes here]
```

---

# PHASE 3 COMPLETION CHECKLIST

| Task | File | Status |
|------|------|--------|
| 3.1 | schemas/vendor.schema.ts | ⬜ |
| 3.2 | schemas/bid.schema.ts | ⬜ |
| 3.3 | services/vendor.service.ts | ⬜ |
| 3.4 | services/bid.service.ts | ⬜ |
| 3.5 | controllers/vendor.controller.ts | ⬜ |
| 3.6 | controllers/bid.controller.ts | ⬜ |
| 3.7 | routes/vendor.routes.ts | ⬜ |
| 3.8 | routes/bid.routes.ts | ⬜ |
| 3.9 | routes/index.ts (update) | ⬜ |

---

## AFTER PHASE 3 COMPLETE

Run these commands to verify:

```bash
cd rfq-platform/backend
npm run build
```

If build succeeds with no errors, Phase 3 is complete.

**Test endpoints using Postman:**
1. Create vendor profile: POST /api/vendors/profile
2. Upload document: POST /api/vendors/profile/documents
3. Create bid: POST /api/tenders/:id/bids
4. Update bid: PUT /api/bids/:id
5. Submit bid: POST /api/bids/:id/submit

**Proceed to TASK_PLAN_PHASE4.md**