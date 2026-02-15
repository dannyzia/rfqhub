# PHASE 6: EXPORT, TAX & POLISH
## Micro-Task Execution Plan with Tracking

> **FOR AI CODING AGENT**: Execute tasks IN ORDER. Mark status after each task.
> **PREREQUISITE**: Phase 1, 2, 3, 4, and 5 must be 100% complete before starting Phase 6.

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

CURRENT PHASE: Phase 6 - Export, Tax & Polish
FILES ALREADY EXIST FROM PHASE 1, 2, 3, 4 & 5 - DO NOT RECREATE THEM

You are now ready. Wait for Task 6.1.
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

# TASK 6.1: Create Tax Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.1: Create tax validation schema

Create file: rfq-platform/backend/src/schemas/tax.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const appliesTo = z.enum(['goods', 'works', 'services', 'all']);

export const createTaxRuleSchema = z.object({
  name: z.string().min(2).max(100),
  ratePercent: z.number().min(0).max(100).transform(v => parseFloat(v.toFixed(2))),
  appliesTo: appliesTo,
  isActive: z.boolean().default(true),
});

export const updateTaxRuleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  ratePercent: z.number().min(0).max(100).transform(v => parseFloat(v.toFixed(2))).optional(),
  appliesTo: appliesTo.optional(),
  isActive: z.boolean().optional(),
});

export const taxRuleIdSchema = z.object({
  taxRuleId: z.string().uuid(),
});

export const taxFilterSchema = z.object({
  appliesTo: appliesTo.optional(),
  isActive: z.boolean().optional(),
});

export type AppliesTo = z.infer<typeof appliesTo>;
export type CreateTaxRuleInput = z.infer<typeof createTaxRuleSchema>;
export type UpdateTaxRuleInput = z.infer<typeof updateTaxRuleSchema>;
export type TaxRuleIdInput = z.infer<typeof taxRuleIdSchema>;
export type TaxFilterInput = z.infer<typeof taxFilterSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/tax.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 1 enum, 4 schemas, and 5 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.2: Create Currency Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.2: Create currency validation schema

Create file: rfq-platform/backend/src/schemas/currency.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const currencyCodeSchema = z.string().length(3).regex(/^[A-Z]{3}$/, 'Must be a valid ISO 4217 currency code');

export const currencyRateSchema = z.object({
  baseCurrency: currencyCodeSchema,
  targetCurrency: currencyCodeSchema,
  rate: z.number().positive(),
});

export const convertCurrencySchema = z.object({
  amount: z.number().min(0),
  fromCurrency: currencyCodeSchema,
  toCurrency: currencyCodeSchema,
});

export const currencyFilterSchema = z.object({
  baseCurrency: currencyCodeSchema.optional(),
  targetCurrency: currencyCodeSchema.optional(),
});

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;
export type CurrencyRateInput = z.infer<typeof currencyRateSchema>;
export type ConvertCurrencyInput = z.infer<typeof convertCurrencySchema>;
export type CurrencyFilterInput = z.infer<typeof currencyFilterSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/currency.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 4 schemas and 4 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.3: Create Export Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.3: Create export validation schema

Create file: rfq-platform/backend/src/schemas/export.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const exportFormatEnum = z.enum(['pdf', 'xlsx']);

export const exportTypeEnum = z.enum([
  'tender_summary',
  'bid_comparison',
  'bid_integrity',
  'award_letter',
  'full_data_dump',
]);

export const exportStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed']);

export const requestExportSchema = z.object({
  exportType: exportTypeEnum,
  format: exportFormatEnum,
  tenderId: z.string().uuid(),
  vendorId: z.string().uuid().optional(),
});

export const exportJobIdSchema = z.object({
  jobId: z.string().uuid(),
});

export const exportFilterSchema = z.object({
  status: exportStatusEnum.optional(),
  exportType: exportTypeEnum.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type ExportFormat = z.infer<typeof exportFormatEnum>;
export type ExportType = z.infer<typeof exportTypeEnum>;
export type ExportStatus = z.infer<typeof exportStatusEnum>;
export type RequestExportInput = z.infer<typeof requestExportSchema>;
export type ExportJobIdInput = z.infer<typeof exportJobIdSchema>;
export type ExportFilterInput = z.infer<typeof exportFilterSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/export.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 3 enums, 3 schemas, and 6 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.4: Create Audit Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.4: Create audit log validation schema

Create file: rfq-platform/backend/src/schemas/audit.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const auditActionEnum = z.enum([
  'TENDER_CREATED',
  'TENDER_UPDATED',
  'TENDER_PUBLISHED',
  'TENDER_CANCELLED',
  'TENDER_CLOSED',
  'BID_CREATED',
  'BID_SUBMITTED',
  'BID_WITHDRAWN',
  'ENVELOPE_OPENED',
  'EVALUATION_SUBMITTED',
  'AWARD_ISSUED',
  'VENDOR_APPROVED',
  'VENDOR_REJECTED',
  'VENDOR_SUSPENDED',
  'ADDENDUM_PUBLISHED',
  'CLARIFICATION_ANSWERED',
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_REGISTERED',
  'EXPORT_REQUESTED',
  'EXPORT_COMPLETED',
]);

export const auditEntityTypeEnum = z.enum([
  'tender',
  'bid',
  'vendor',
  'user',
  'addendum',
  'clarification',
  'evaluation',
  'award',
  'export',
]);

export const auditFilterSchema = z.object({
  actorId: z.string().uuid().optional(),
  action: auditActionEnum.optional(),
  entityType: auditEntityTypeEnum.optional(),
  entityId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0),
});

export const createAuditLogSchema = z.object({
  actorId: z.string().uuid().nullable(),
  action: auditActionEnum,
  entityType: auditEntityTypeEnum,
  entityId: z.string().uuid(),
  metadata: z.record(z.unknown()).optional(),
});

export type AuditAction = z.infer<typeof auditActionEnum>;
export type AuditEntityType = z.infer<typeof auditEntityTypeEnum>;
export type AuditFilterInput = z.infer<typeof auditFilterSchema>;
export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/audit.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 2 enums, 2 schemas, and 4 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.5: Create Tax Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.5: Create tax service

Create file: rfq-platform/backend/src/services/tax.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateTaxRuleInput, UpdateTaxRuleInput, TaxFilterInput, AppliesTo } from '../schemas/tax.schema';

interface TaxRuleRow {
  id: string;
  name: string;
  rate_percent: string;
  applies_to: string;
  is_active: boolean;
  created_at: Date;
}

interface TaxRule {
  id: string;
  name: string;
  ratePercent: number;
  appliesTo: AppliesTo;
  isActive: boolean;
  createdAt: Date;
}

interface BidItemTax {
  bidItemId: string;
  taxRuleId: string;
  taxRuleName: string;
  ratePercent: number;
  taxAmount: number;
}

const mapRowToTaxRule = (row: TaxRuleRow): TaxRule => ({
  id: row.id,
  name: row.name,
  ratePercent: parseFloat(row.rate_percent),
  appliesTo: row.applies_to as AppliesTo,
  isActive: row.is_active,
  createdAt: row.created_at,
});

export const taxService = {
  async createTaxRule(input: CreateTaxRuleInput): Promise<TaxRule> {
    const id = uuidv4();
    const { name, ratePercent, appliesTo, isActive } = input;

    const result = await pool.query<TaxRuleRow>(
      `INSERT INTO tax_rules (id, name, rate_percent, applies_to, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [id, name, ratePercent, appliesTo, isActive]
    );

    logger.info({ taxRuleId: id, name }, 'Tax rule created');
    return mapRowToTaxRule(result.rows[0]);
  },

  async updateTaxRule(taxRuleId: string, input: UpdateTaxRuleInput): Promise<TaxRule> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.ratePercent !== undefined) {
      updates.push(`rate_percent = $${paramIndex++}`);
      values.push(input.ratePercent);
    }
    if (input.appliesTo !== undefined) {
      updates.push(`applies_to = $${paramIndex++}`);
      values.push(input.appliesTo);
    }
    if (input.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(input.isActive);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(taxRuleId);
    const result = await pool.query<TaxRuleRow>(
      `UPDATE tax_rules SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Tax rule not found');
    }

    logger.info({ taxRuleId }, 'Tax rule updated');
    return mapRowToTaxRule(result.rows[0]);
  },

  async getTaxRuleById(taxRuleId: string): Promise<TaxRule | null> {
    const result = await pool.query<TaxRuleRow>(
      'SELECT * FROM tax_rules WHERE id = $1',
      [taxRuleId]
    );
    return result.rows[0] ? mapRowToTaxRule(result.rows[0]) : null;
  },

  async listTaxRules(filter: TaxFilterInput): Promise<TaxRule[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filter.appliesTo) {
      conditions.push(`(applies_to = $${paramIndex++} OR applies_to = 'all')`);
      values.push(filter.appliesTo);
    }
    if (filter.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      values.push(filter.isActive);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query<TaxRuleRow>(
      `SELECT * FROM tax_rules ${whereClause} ORDER BY name ASC`,
      values
    );

    return result.rows.map(mapRowToTaxRule);
  },

  async getActiveTaxRulesForProcurementType(procurementType: string): Promise<TaxRule[]> {
    const result = await pool.query<TaxRuleRow>(
      `SELECT * FROM tax_rules 
       WHERE is_active = true 
       AND (applies_to = $1 OR applies_to = 'all')
       ORDER BY name ASC`,
      [procurementType]
    );
    return result.rows.map(mapRowToTaxRule);
  },

  async calculateBidItemTaxes(
    bidId: string,
    tenderId: string
  ): Promise<{ taxes: BidItemTax[]; totalTax: number }> {
    // Get tender procurement type
    const tenderResult = await pool.query<{ procurement_type: string }>(
      'SELECT procurement_type FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tenderResult.rows.length === 0) {
      throw new Error('Tender not found');
    }

    const procurementType = tenderResult.rows[0].procurement_type;

    // Get active tax rules for this procurement type
    const taxRules = await this.getActiveTaxRulesForProcurementType(procurementType);

    if (taxRules.length === 0) {
      return { taxes: [], totalTax: 0 };
    }

    // Get bid items with their totals
    const bidItemsResult = await pool.query<{ id: string; item_total_price: string }>(
      `SELECT id, item_total_price FROM bid_items 
       WHERE bid_id = $1 AND item_total_price IS NOT NULL`,
      [bidId]
    );

    const taxes: BidItemTax[] = [];
    let totalTax = 0;

    for (const bidItem of bidItemsResult.rows) {
      const itemTotal = parseFloat(bidItem.item_total_price);

      for (const taxRule of taxRules) {
        const taxAmount = parseFloat((itemTotal * (taxRule.ratePercent / 100)).toFixed(2));
        totalTax += taxAmount;

        taxes.push({
          bidItemId: bidItem.id,
          taxRuleId: taxRule.id,
          taxRuleName: taxRule.name,
          ratePercent: taxRule.ratePercent,
          taxAmount,
        });

        // Insert into bid_item_taxes
        await pool.query(
          `INSERT INTO bid_item_taxes (bid_item_id, tax_rule_id, tax_amount)
           VALUES ($1, $2, $3)
           ON CONFLICT (bid_item_id, tax_rule_id) DO UPDATE SET tax_amount = $3`,
          [bidItem.id, taxRule.id, taxAmount]
        );
      }
    }

    logger.info({ bidId, totalTax, taxCount: taxes.length }, 'Bid taxes calculated');
    return { taxes, totalTax: parseFloat(totalTax.toFixed(2)) };
  },

  async deleteTaxRule(taxRuleId: string): Promise<void> {
    // Soft delete by setting is_active = false
    const result = await pool.query(
      'UPDATE tax_rules SET is_active = false WHERE id = $1',
      [taxRuleId]
    );

    if (result.rowCount === 0) {
      throw new Error('Tax rule not found');
    }

    logger.info({ taxRuleId }, 'Tax rule deactivated');
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/tax.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports taxService object with 7 methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.6: Create Currency Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.6: Create currency service

Create file: rfq-platform/backend/src/services/currency.service.ts

Content (copy EXACTLY):
import { pool, logger, redis } from '../config';
import type { CurrencyRateInput, ConvertCurrencyInput, CurrencyFilterInput } from '../schemas/currency.schema';

interface CurrencyRateRow {
  base_currency: string;
  target_currency: string;
  rate: string;
  fetched_at: Date;
}

interface CurrencyRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  fetchedAt: Date;
}

interface FXApiResponse {
  success: boolean;
  base: string;
  rates: Record<string, number>;
}

const CACHE_KEY_PREFIX = 'fx_rate:';
const CACHE_TTL_SECONDS = 3600; // 1 hour
const BASE_CURRENCY = 'USD';

const mapRowToRate = (row: CurrencyRateRow): CurrencyRate => ({
  baseCurrency: row.base_currency,
  targetCurrency: row.target_currency,
  rate: parseFloat(row.rate),
  fetchedAt: row.fetched_at,
});

export const currencyService = {
  async fetchAndCacheRates(): Promise<number> {
    try {
      // Fetch from free FX API
      const response = await fetch(`https://api.exchangerate.host/latest?base=${BASE_CURRENCY}`);
      const data = (await response.json()) as FXApiResponse;

      if (!data.success || !data.rates) {
        throw new Error('Failed to fetch exchange rates from API');
      }

      let updatedCount = 0;

      for (const [targetCurrency, rate] of Object.entries(data.rates)) {
        // Upsert into database
        await pool.query(
          `INSERT INTO currency_rates (base_currency, target_currency, rate, fetched_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (base_currency, target_currency) 
           DO UPDATE SET rate = $3, fetched_at = NOW()`,
          [BASE_CURRENCY, targetCurrency, rate]
        );

        // Cache in Redis
        const cacheKey = `${CACHE_KEY_PREFIX}${BASE_CURRENCY}:${targetCurrency}`;
        await redis.set(cacheKey, rate.toString(), 'EX', CACHE_TTL_SECONDS);

        updatedCount++;
      }

      logger.info({ updatedCount, base: BASE_CURRENCY }, 'Currency rates updated');
      return updatedCount;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch currency rates');
      throw error;
    }
  },

  async getRate(baseCurrency: string, targetCurrency: string): Promise<CurrencyRate | null> {
    // Check Redis cache first
    const cacheKey = `${CACHE_KEY_PREFIX}${baseCurrency}:${targetCurrency}`;
    const cachedRate = await redis.get(cacheKey);

    if (cachedRate) {
      return {
        baseCurrency,
        targetCurrency,
        rate: parseFloat(cachedRate),
        fetchedAt: new Date(),
      };
    }

    // Fallback to database
    const result = await pool.query<CurrencyRateRow>(
      'SELECT * FROM currency_rates WHERE base_currency = $1 AND target_currency = $2',
      [baseCurrency, targetCurrency]
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Cache for future requests
    const rate = result.rows[0];
    await redis.set(cacheKey, rate.rate, 'EX', CACHE_TTL_SECONDS);

    return mapRowToRate(rate);
  },

  async convertCurrency(input: ConvertCurrencyInput): Promise<{ convertedAmount: number; rate: number }> {
    const { amount, fromCurrency, toCurrency } = input;

    if (fromCurrency === toCurrency) {
      return { convertedAmount: amount, rate: 1 };
    }

    // If converting from non-USD, we need to go through USD
    let rate: number;

    if (fromCurrency === BASE_CURRENCY) {
      const rateData = await this.getRate(BASE_CURRENCY, toCurrency);
      if (!rateData) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }
      rate = rateData.rate;
    } else if (toCurrency === BASE_CURRENCY) {
      const rateData = await this.getRate(BASE_CURRENCY, fromCurrency);
      if (!rateData) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }
      rate = 1 / rateData.rate;
    } else {
      // Convert through USD: fromCurrency -> USD -> toCurrency
      const fromRate = await this.getRate(BASE_CURRENCY, fromCurrency);
      const toRate = await this.getRate(BASE_CURRENCY, toCurrency);

      if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }

      rate = toRate.rate / fromRate.rate;
    }

    const convertedAmount = parseFloat((amount * rate).toFixed(2));

    logger.debug({ amount, fromCurrency, toCurrency, rate, convertedAmount }, 'Currency converted');
    return { convertedAmount, rate };
  },

  async listRates(filter: CurrencyFilterInput): Promise<CurrencyRate[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filter.baseCurrency) {
      conditions.push(`base_currency = $${paramIndex++}`);
      values.push(filter.baseCurrency);
    }
    if (filter.targetCurrency) {
      conditions.push(`target_currency = $${paramIndex++}`);
      values.push(filter.targetCurrency);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query<CurrencyRateRow>(
      `SELECT * FROM currency_rates ${whereClause} ORDER BY target_currency ASC`,
      values
    );

    return result.rows.map(mapRowToRate);
  },

  async upsertRate(input: CurrencyRateInput): Promise<CurrencyRate> {
    const { baseCurrency, targetCurrency, rate } = input;

    const result = await pool.query<CurrencyRateRow>(
      `INSERT INTO currency_rates (base_currency, target_currency, rate, fetched_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (base_currency, target_currency) 
       DO UPDATE SET rate = $3, fetched_at = NOW()
       RETURNING *`,
      [baseCurrency, targetCurrency, rate]
    );

    // Update cache
    const cacheKey = `${CACHE_KEY_PREFIX}${baseCurrency}:${targetCurrency}`;
    await redis.set(cacheKey, rate.toString(), 'EX', CACHE_TTL_SECONDS);

    logger.info({ baseCurrency, targetCurrency, rate }, 'Currency rate upserted');
    return mapRowToRate(result.rows[0]);
  },

  async getRateAge(baseCurrency: string, targetCurrency: string): Promise<number | null> {
    const result = await pool.query<{ fetched_at: Date }>(
      'SELECT fetched_at FROM currency_rates WHERE base_currency = $1 AND target_currency = $2',
      [baseCurrency, targetCurrency]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const ageMs = Date.now() - result.rows[0].fetched_at.getTime();
    return Math.floor(ageMs / 1000 / 60); // Return age in minutes
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/currency.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports currencyService object with 6 methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.7: Create Export Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.7: Create export service

Create file: rfq-platform/backend/src/services/export.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { pool, logger } from '../config';
import type { RequestExportInput, ExportFilterInput, ExportType, ExportFormat, ExportStatus } from '../schemas/export.schema';

interface ExportJobRow {
  id: string;
  user_id: string;
  export_type: string;
  format: string;
  tender_id: string;
  vendor_id: string | null;
  status: string;
  file_url: string | null;
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
}

interface ExportJob {
  id: string;
  userId: string;
  exportType: ExportType;
  format: ExportFormat;
  tenderId: string;
  vendorId: string | null;
  status: ExportStatus;
  fileUrl: string | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

const mapRowToJob = (row: ExportJobRow): ExportJob => ({
  id: row.id,
  userId: row.user_id,
  exportType: row.export_type as ExportType,
  format: row.format as ExportFormat,
  tenderId: row.tender_id,
  vendorId: row.vendor_id,
  status: row.status as ExportStatus,
  fileUrl: row.file_url,
  errorMessage: row.error_message,
  createdAt: row.created_at,
  completedAt: row.completed_at,
});

export const exportService = {
  async createExportJob(userId: string, input: RequestExportInput): Promise<ExportJob> {
    const id = uuidv4();
    const { exportType, format, tenderId, vendorId } = input;

    const result = await pool.query<ExportJobRow>(
      `INSERT INTO export_jobs (id, user_id, export_type, format, tender_id, vendor_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
       RETURNING *`,
      [id, userId, exportType, format, tenderId, vendorId || null]
    );

    logger.info({ jobId: id, exportType, format }, 'Export job created');
    return mapRowToJob(result.rows[0]);
  },

  async getJobById(jobId: string): Promise<ExportJob | null> {
    const result = await pool.query<ExportJobRow>(
      'SELECT * FROM export_jobs WHERE id = $1',
      [jobId]
    );
    return result.rows[0] ? mapRowToJob(result.rows[0]) : null;
  },

  async listUserJobs(userId: string, filter: ExportFilterInput): Promise<{ jobs: ExportJob[]; total: number }> {
    const conditions: string[] = ['user_id = $1'];
    const values: unknown[] = [userId];
    let paramIndex = 2;

    if (filter.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filter.status);
    }
    if (filter.exportType) {
      conditions.push(`export_type = $${paramIndex++}`);
      values.push(filter.exportType);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM export_jobs ${whereClause}`,
      values
    );

    const result = await pool.query<ExportJobRow>(
      `SELECT * FROM export_jobs ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...values, filter.limit, filter.offset]
    );

    return {
      jobs: result.rows.map(mapRowToJob),
      total: parseInt(countResult.rows[0].count),
    };
  },

  async updateJobStatus(
    jobId: string, 
    status: ExportStatus, 
    fileUrl?: string, 
    errorMessage?: string
  ): Promise<void> {
    const completedAt = status === 'completed' || status === 'failed' ? 'NOW()' : 'NULL';
    
    await pool.query(
      `UPDATE export_jobs 
       SET status = $1, file_url = $2, error_message = $3, completed_at = ${completedAt}
       WHERE id = $4`,
      [status, fileUrl || null, errorMessage || null, jobId]
    );

    logger.info({ jobId, status }, 'Export job status updated');
  },

  async processExportJob(jobId: string): Promise<void> {
    const job = await this.getJobById(jobId);
    if (!job) {
      throw new Error('Export job not found');
    }

    await this.updateJobStatus(jobId, 'processing');

    try {
      let fileUrl: string;

      switch (job.exportType) {
        case 'tender_summary':
          fileUrl = await this.generateTenderSummaryPdf(job.tenderId);
          break;
        case 'bid_comparison':
          fileUrl = job.format === 'pdf' 
            ? await this.generateBidComparisonPdf(job.tenderId)
            : await this.generateBidComparisonXlsx(job.tenderId);
          break;
        case 'bid_integrity':
          fileUrl = await this.generateBidIntegrityPdf(job.tenderId);
          break;
        case 'award_letter':
          if (!job.vendorId) {
            throw new Error('Vendor ID required for award letter');
          }
          fileUrl = await this.generateAwardLetterPdf(job.tenderId, job.vendorId);
          break;
        case 'full_data_dump':
          fileUrl = await this.generateFullDataDumpXlsx(job.tenderId);
          break;
        default:
          throw new Error(`Unknown export type: ${job.exportType}`);
      }

      await this.updateJobStatus(jobId, 'completed', fileUrl);
      logger.info({ jobId, fileUrl }, 'Export job completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateJobStatus(jobId, 'failed', undefined, errorMessage);
      logger.error({ jobId, error }, 'Export job failed');
      throw error;
    }
  },

  async generateTenderSummaryPdf(tenderId: string): Promise<string> {
    const tender = await pool.query(
      `SELECT t.*, o.name as org_name 
       FROM tenders t 
       JOIN organizations o ON t.buyer_org_id = o.id 
       WHERE t.id = $1`,
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw new Error('Tender not found');
    }

    const t = tender.rows[0];
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(20).text('Tender Summary', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Tender Number: ${t.tender_number}`);
    doc.text(`Title: ${t.title}`);
    doc.text(`Organization: ${t.org_name}`);
    doc.text(`Type: ${t.tender_type}`);
    doc.text(`Status: ${t.status}`);
    doc.text(`Visibility: ${t.visibility}`);
    doc.text(`Procurement Type: ${t.procurement_type}`);
    doc.text(`Currency: ${t.currency}`);
    doc.text(`Submission Deadline: ${t.submission_deadline}`);
    doc.text(`Created: ${t.created_at}`);

    doc.end();

    // In production, upload to S3/MinIO and return URL
    // For now, return a placeholder URL
    const fileName = `tender_summary_${tenderId}_${Date.now()}.pdf`;
    return `/exports/${fileName}`;
  },

  async generateBidComparisonPdf(tenderId: string): Promise<string> {
    // Simplified implementation
    const fileName = `bid_comparison_${tenderId}_${Date.now()}.pdf`;
    logger.info({ tenderId, fileName }, 'Generated bid comparison PDF');
    return `/exports/${fileName}`;
  },

  async generateBidComparisonXlsx(tenderId: string): Promise<string> {
    const bids = await pool.query(
      `SELECT b.*, o.name as vendor_name, b.total_amount
       FROM bids b
       JOIN organizations o ON b.vendor_org_id = o.id
       WHERE b.tender_id = $1 AND b.status = 'submitted'
       ORDER BY b.total_amount ASC`,
      [tenderId]
    );

    const workbook = XLSX.utils.book_new();
    const data = bids.rows.map((b, i) => ({
      Rank: i + 1,
      Vendor: b.vendor_name,
      'Total Amount': b.total_amount,
      'Compliance Status': b.compliance_status || 'Pending',
      'Submitted At': b.submitted_at,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comparison');

    const fileName = `bid_comparison_${tenderId}_${Date.now()}.xlsx`;
    // In production, write to file and upload to S3
    return `/exports/${fileName}`;
  },

  async generateBidIntegrityPdf(tenderId: string): Promise<string> {
    const fileName = `bid_integrity_${tenderId}_${Date.now()}.pdf`;
    logger.info({ tenderId, fileName }, 'Generated bid integrity PDF');
    return `/exports/${fileName}`;
  },

  async generateAwardLetterPdf(tenderId: string, vendorId: string): Promise<string> {
    const fileName = `award_letter_${tenderId}_${vendorId}_${Date.now()}.pdf`;
    logger.info({ tenderId, vendorId, fileName }, 'Generated award letter PDF');
    return `/exports/${fileName}`;
  },

  async generateFullDataDumpXlsx(tenderId: string): Promise<string> {
    const fileName = `data_dump_${tenderId}_${Date.now()}.xlsx`;
    logger.info({ tenderId, fileName }, 'Generated full data dump XLSX');
    return `/exports/${fileName}`;
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/export.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports exportService object with 12 methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.8: Create Audit Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.8: Create audit service

Create file: rfq-platform/backend/src/services/audit.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateAuditLogInput, AuditFilterInput, AuditAction, AuditEntityType } from '../schemas/audit.schema';

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

interface AuditLog {
  id: string;
  actorId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

interface AuditLogWithActor extends AuditLog {
  actorName: string | null;
  actorEmail: string | null;
}

const mapRowToLog = (row: AuditLogRow): AuditLog => ({
  id: row.id,
  actorId: row.actor_id,
  action: row.action as AuditAction,
  entityType: row.entity_type as AuditEntityType,
  entityId: row.entity_id,
  metadata: row.metadata,
  createdAt: row.created_at,
});

export const auditService = {
  async log(input: CreateAuditLogInput): Promise<AuditLog> {
    const id = uuidv4();
    const { actorId, action, entityType, entityId, metadata } = input;

    const result = await pool.query<AuditLogRow>(
      `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [id, actorId, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null]
    );

    logger.debug({ auditId: id, action, entityType, entityId }, 'Audit log created');
    return mapRowToLog(result.rows[0]);
  },

  async logTenderCreated(actorId: string, tenderId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log({
      actorId,
      action: 'TENDER_CREATED',
      entityType: 'tender',
      entityId: tenderId,
      metadata,
    });
  },

  async logTenderUpdated(actorId: string, tenderId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log({
      actorId,
      action: 'TENDER_UPDATED',
      entityType: 'tender',
      entityId: tenderId,
      metadata,
    });
  },

  async logTenderPublished(actorId: string, tenderId: string): Promise<void> {
    await this.log({
      actorId,
      action: 'TENDER_PUBLISHED',
      entityType: 'tender',
      entityId: tenderId,
    });
  },

  async logTenderCancelled(actorId: string, tenderId: string, reason?: string): Promise<void> {
    await this.log({
      actorId,
      action: 'TENDER_CANCELLED',
      entityType: 'tender',
      entityId: tenderId,
      metadata: reason ? { reason } : undefined,
    });
  },

  async logBidSubmitted(actorId: string, bidId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log({
      actorId,
      action: 'BID_SUBMITTED',
      entityType: 'bid',
      entityId: bidId,
      metadata,
    });
  },

  async logBidWithdrawn(actorId: string, bidId: string): Promise<void> {
    await this.log({
      actorId,
      action: 'BID_WITHDRAWN',
      entityType: 'bid',
      entityId: bidId,
    });
  },

  async logEnvelopeOpened(
    actorId: string, 
    bidId: string, 
    envelopeType: 'technical' | 'commercial'
  ): Promise<void> {
    await this.log({
      actorId,
      action: 'ENVELOPE_OPENED',
      entityType: 'bid',
      entityId: bidId,
      metadata: { envelopeType },
    });
  },

  async logEvaluationSubmitted(actorId: string, evaluationId: string, bidId: string): Promise<void> {
    await this.log({
      actorId,
      action: 'EVALUATION_SUBMITTED',
      entityType: 'evaluation',
      entityId: evaluationId,
      metadata: { bidId },
    });
  },

  async logAwardIssued(actorId: string, awardId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log({
      actorId,
      action: 'AWARD_ISSUED',
      entityType: 'award',
      entityId: awardId,
      metadata,
    });
  },

  async logVendorStatusChange(
    actorId: string, 
    vendorId: string, 
    oldStatus: string, 
    newStatus: string,
    reason?: string
  ): Promise<void> {
    let action: AuditAction;
    switch (newStatus) {
      case 'approved':
        action = 'VENDOR_APPROVED';
        break;
      case 'rejected':
        action = 'VENDOR_REJECTED';
        break;
      case 'suspended':
        action = 'VENDOR_SUSPENDED';
        break;
      default:
        action = 'VENDOR_APPROVED'; // Default fallback
    }

    await this.log({
      actorId,
      action,
      entityType: 'vendor',
      entityId: vendorId,
      metadata: { oldStatus, newStatus, reason },
    });
  },

  async logUserLogin(userId: string, ipAddress?: string): Promise<void> {
    await this.log({
      actorId: userId,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: userId,
      metadata: ipAddress ? { ipAddress } : undefined,
    });
  },

  async logUserLogout(userId: string): Promise<void> {
    await this.log({
      actorId: userId,
      action: 'USER_LOGOUT',
      entityType: 'user',
      entityId: userId,
    });
  },

  async getLogsForEntity(
    entityType: AuditEntityType, 
    entityId: string
  ): Promise<AuditLogWithActor[]> {
    const result = await pool.query<AuditLogRow & { actor_name: string | null; actor_email: string | null }>(
      `SELECT al.*, u.name as actor_name, u.email as actor_email
       FROM audit_logs al
       LEFT JOIN users u ON al.actor_id = u.id
       WHERE al.entity_type = $1 AND al.entity_id = $2
       ORDER BY al.created_at DESC`,
      [entityType, entityId]
    );

    return result.rows.map(row => ({
      ...mapRowToLog(row),
      actorName: row.actor_name,
      actorEmail: row.actor_email,
    }));
  },

  async searchLogs(filter: AuditFilterInput): Promise<{ logs: AuditLogWithActor[]; total: number }> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filter.actorId) {
      conditions.push(`al.actor_id = $${paramIndex++}`);
      values.push(filter.actorId);
    }
    if (filter.action) {
      conditions.push(`al.action = $${paramIndex++}`);
      values.push(filter.action);
    }
    if (filter.entityType) {
      conditions.push(`al.entity_type = $${paramIndex++}`);
      values.push(filter.entityType);
    }
    if (filter.entityId) {
      conditions.push(`al.entity_id = $${paramIndex++}`);
      values.push(filter.entityId);
    }
    if (filter.startDate) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      values.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      values.push(filter.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM audit_logs al ${whereClause}`,
      values
    );

    const result = await pool.query<AuditLogRow & { actor_name: string | null; actor_email: string | null }>(
      `SELECT al.*, u.name as actor_name, u.email as actor_email
       FROM audit_logs al
       LEFT JOIN users u ON al.actor_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...values, filter.limit, filter.offset]
    );

    return {
      logs: result.rows.map(row => ({
        ...mapRowToLog(row),
        actorName: row.actor_name,
        actorEmail: row.actor_email,
      })),
      total: parseInt(countResult.rows[0].count),
    };
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/audit.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports auditService object with 15 methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.9: Create Tax Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.9: Create tax controller

Create file: rfq-platform/backend/src/controllers/tax.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { taxService } from '../services/tax.service';
import { auditService } from '../services/audit.service';
import { 
  createTaxRuleSchema, 
  updateTaxRuleSchema, 
  taxFilterSchema 
} from '../schemas/tax.schema';
import { logger } from '../config';

export const taxController = {
  async createTaxRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createTaxRuleSchema.parse(req.body);
      const taxRule = await taxService.createTaxRule(validated);

      await auditService.log({
        actorId: req.user!.id,
        action: 'TENDER_CREATED', // Reusing action, ideally add TAX_RULE_CREATED
        entityType: 'tender',
        entityId: taxRule.id,
        metadata: { type: 'tax_rule', name: taxRule.name },
      });

      res.status(201).json(taxRule);
    } catch (error) {
      next(error);
    }
  },

  async updateTaxRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taxRuleId } = req.params;
      const validated = updateTaxRuleSchema.parse(req.body);
      const taxRule = await taxService.updateTaxRule(taxRuleId, validated);

      res.json(taxRule);
    } catch (error) {
      next(error);
    }
  },

  async getTaxRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taxRuleId } = req.params;
      const taxRule = await taxService.getTaxRuleById(taxRuleId);

      if (!taxRule) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Tax rule not found' },
        });
        return;
      }

      res.json(taxRule);
    } catch (error) {
      next(error);
    }
  },

  async listTaxRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = taxFilterSchema.parse(req.query);
      const taxRules = await taxService.listTaxRules(filter);

      res.json({ taxRules });
    } catch (error) {
      next(error);
    }
  },

  async deleteTaxRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taxRuleId } = req.params;
      await taxService.deleteTaxRule(taxRuleId);

      res.json({ message: 'Tax rule deactivated' });
    } catch (error) {
      next(error);
    }
  },

  async calculateTaxesForBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bidId } = req.params;
      const { tenderId } = req.body;

      if (!tenderId) {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'tenderId is required' },
        });
        return;
      }

      const result = await taxService.calculateBidItemTaxes(bidId, tenderId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/tax.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports taxController object with 6 methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.10: Create Currency Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.10: Create currency controller

Create file: rfq-platform/backend/src/controllers/currency.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { currencyService } from '../services/currency.service';
import { 
  currencyRateSchema, 
  convertCurrencySchema, 
  currencyFilterSchema 
} from '../schemas/currency.schema';
import { logger } from '../config';

export const currencyController = {
  async refreshRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedCount = await currencyService.fetchAndCacheRates();

      res.json({ 
        message: 'Currency rates refreshed',
        updatedCount,
      });
    } catch (error) {
      next(error);
    }
  },

  async getRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { baseCurrency, targetCurrency } = req.params;

      const rate = await currencyService.getRate(
        baseCurrency.toUpperCase(),
        targetCurrency.toUpperCase()
      );

      if (!rate) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Exchange rate not found' },
        });
        return;
      }

      res.json(rate);
    } catch (error) {
      next(error);
    }
  },

  async listRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = currencyFilterSchema.parse(req.query);
      const rates = await currencyService.listRates(filter);

      res.json({ rates });
    } catch (error) {
      next(error);
    }
  },

  async convertCurrency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = convertCurrencySchema.parse(req.body);
      const result = await currencyService.convertCurrency(validated);

      res.json({
        ...validated,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async upsertRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = currencyRateSchema.parse(req.body);
      const rate = await currencyService.upsertRate(validated);

      res.json(rate);
    } catch (error) {
      next(error);
    }
  },

  async getRateAge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { baseCurrency, targetCurrency } = req.params;

      const ageMinutes = await currencyService.getRateAge(
        baseCurrency.toUpperCase(),
        targetCurrency.toUpperCase()
      );

      if (ageMinutes === null) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Exchange rate not found' },
        });
        return;
      }

      res.json({ 
        baseCurrency: baseCurrency.toUpperCase(),
        targetCurrency: targetCurrency.toUpperCase(),
        ageMinutes,
        isStale: ageMinutes > 1440, // More than 24 hours old
      });
    } catch (error) {
      next(error);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/currency.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports currencyController object with 6 methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.11: Create Export Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.11: Create export controller

Create file: rfq-platform/backend/src/controllers/export.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { exportService } from '../services/export.service';
import { auditService } from '../services/audit.service';
import { notificationService } from '../services/notification.service';
import { requestExportSchema, exportFilterSchema } from '../schemas/export.schema';
import { logger } from '../config';

export const exportController = {
  async requestExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = requestExportSchema.parse(req.body);
      const userId = req.user!.id;

      // Validate permissions based on export type
      if (validated.exportType === 'full_data_dump') {
        const isAdmin = req.user!.roles.includes('admin');
        if (!isAdmin) {
          res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'Only admins can request full data dumps' },
          });
          return;
        }
      }

      const job = await exportService.createExportJob(userId, validated);

      await auditService.log({
        actorId: userId,
        action: 'EXPORT_REQUESTED',
        entityType: 'export',
        entityId: job.id,
        metadata: { exportType: validated.exportType, format: validated.format },
      });

      // Process export asynchronously
      setImmediate(async () => {
        try {
          await exportService.processExportJob(job.id);
          
          // Send notification when complete
          await notificationService.createNotification({
            recipientId: userId,
            notificationType: 'bid_submitted', // Reusing type, ideally add EXPORT_READY
            channel: 'in_app',
            payload: { 
              message: `Your ${validated.exportType} export is ready for download`,
              jobId: job.id,
            },
          });

          await auditService.log({
            actorId: null,
            action: 'EXPORT_COMPLETED',
            entityType: 'export',
            entityId: job.id,
          });
        } catch (error) {
          logger.error({ jobId: job.id, error }, 'Export processing failed');
        }
      });

      res.status(202).json({
        message: 'Export job created. You will be notified when it is ready.',
        job,
      });
    } catch (error) {
      next(error);
    }
  },

  async getExportJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await exportService.getJobById(jobId);

      if (!job) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Export job not found' },
        });
        return;
      }

      // Users can only view their own export jobs (unless admin)
      if (job.userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
        return;
      }

      res.json(job);
    } catch (error) {
      next(error);
    }
  },

  async listMyExports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = exportFilterSchema.parse(req.query);
      const userId = req.user!.id;

      const result = await exportService.listUserJobs(userId, filter);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async downloadExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await exportService.getJobById(jobId);

      if (!job) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Export job not found' },
        });
        return;
      }

      // Users can only download their own exports (unless admin)
      if (job.userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
        return;
      }

      if (job.status !== 'completed' || !job.fileUrl) {
        res.status(400).json({
          error: { code: 'BUSINESS_RULE_VIOLATION', message: 'Export is not ready for download' },
        });
        return;
      }

      // In production, redirect to signed S3 URL or stream the file
      res.json({ downloadUrl: job.fileUrl });
    } catch (error) {
      next(error);
    }
  },

  async retryExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await exportService.getJobById(jobId);

      if (!job) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Export job not found' },
        });
        return;
      }

      if (job.userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
        return;
      }

      if (job.status !== 'failed') {
        res.status(400).json({
          error: { code: 'BUSINESS_RULE_VIOLATION', message: 'Only failed exports can be retried' },
        });
        return;
      }

      // Reset status and reprocess
      await exportService.updateJobStatus(jobId, 'pending');

      setImmediate(async () => {
        try {
          await exportService.processExportJob(jobId);
        } catch (error) {
          logger.error({ jobId, error }, 'Export retry failed');
        }
      });

      res.json({ message: 'Export retry initiated' });
    } catch (error) {
      next(error);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/export.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports exportController object with 5 methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.12: Create Audit Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.12: Create audit controller

Create file: rfq-platform/backend/src/controllers/audit.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';
import { auditFilterSchema } from '../schemas/audit.schema';
import { logger } from '../config';

export const auditController = {
  async searchLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Only admins can search all audit logs
      if (!req.user!.roles.includes('admin')) {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Admin access required' },
        });
        return;
      }

      const filter = auditFilterSchema.parse(req.query);
      const result = await auditService.searchLogs(filter);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getLogsForTender(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;

      // Buyers can view logs for their own tenders, admins can view all
      // In production, add ownership check here
      const logs = await auditService.getLogsForEntity('tender', tenderId);

      res.json({ logs });
    } catch (error) {
      next(error);
    }
  },

  async getLogsForBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bidId } = req.params;

      // Vendors can view logs for their own bids, buyers for bids on their tenders
      // In production, add ownership check here
      const logs = await auditService.getLogsForEntity('bid', bidId);

      res.json({ logs });
    } catch (error) {
      next(error);
    }
  },

  async getLogsForVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vendorId } = req.params;

      // Vendors can view their own logs, admins can view all
      const isOwnOrg = req.user!.orgId === vendorId;
      const isAdmin = req.user!.roles.includes('admin');

      if (!isOwnOrg && !isAdmin) {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
        return;
      }

      const logs = await auditService.getLogsForEntity('vendor', vendorId);

      res.json({ logs });
    } catch (error) {
      next(error);
    }
  },

  async getMyActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = auditFilterSchema.parse(req.query);
      
      // Override filter to only show user's own activity
      const userFilter = {
        ...filter,
        actorId: req.user!.id,
      };

      const result = await auditService.searchLogs(userFilter);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getEntityTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, entityId } = req.params;

      // Validate entity type
      const validTypes = ['tender', 'bid', 'vendor', 'user', 'addendum', 'clarification', 'evaluation', 'award', 'export'];
      if (!validTypes.includes(entityType)) {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid entity type' },
        });
        return;
      }

      const logs = await auditService.getLogsForEntity(
        entityType as any,
        entityId
      );

      // Transform logs into timeline format
      const timeline = logs.map(log => ({
        id: log.id,
        action: log.action,
        actor: log.actorName || 'System',
        timestamp: log.createdAt,
        details: log.metadata,
      }));

      res.json({ timeline });
    } catch (error) {
      next(error);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/audit.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports auditController object with 6 methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.13: Create Admin Routes

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.13: Create admin routes for tax, currency, and audit

Create file: rfq-platform/backend/src/routes/admin.routes.ts

Content (copy EXACTLY):
import { Router } from 'express';
import { taxController } from '../controllers/tax.controller';
import { currencyController } from '../controllers/currency.controller';
import { auditController } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Tax Rules (Admin only)
router.post('/tax-rules', authorize('admin'), taxController.createTaxRule);
router.get('/tax-rules', authorize('admin', 'buyer'), taxController.listTaxRules);
router.get('/tax-rules/:taxRuleId', authorize('admin', 'buyer'), taxController.getTaxRule);
router.put('/tax-rules/:taxRuleId', authorize('admin'), taxController.updateTaxRule);
router.delete('/tax-rules/:taxRuleId', authorize('admin'), taxController.deleteTaxRule);

// Currency Rates
router.post('/currency/refresh', authorize('admin'), currencyController.refreshRates);
router.get('/currency/rates', currencyController.listRates);
router.get('/currency/rates/:baseCurrency/:targetCurrency', currencyController.getRate);
router.get('/currency/rates/:baseCurrency/:targetCurrency/age', currencyController.getRateAge);
router.post('/currency/rates', authorize('admin'), currencyController.upsertRate);
router.post('/currency/convert', currencyController.convertCurrency);

// Audit Logs (Admin only for full search)
router.get('/audit/search', authorize('admin'), auditController.searchLogs);
router.get('/audit/my-activity', auditController.getMyActivityLogs);
router.get('/audit/timeline/:entityType/:entityId', auditController.getEntityTimeline);

export { router as adminRoutes };

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/routes/admin.routes.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports adminRoutes router
- [ ] Contains 14 route definitions

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.14: Create Export Routes

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.14: Create export routes

Create file: rfq-platform/backend/src/routes/export.routes.ts

Content (copy EXACTLY):
import { Router } from 'express';
import { exportController } from '../controllers/export.controller';
import { auditController } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All export routes require authentication
router.use(authenticate);

// Export Jobs
router.post('/exports', authorize('buyer', 'evaluator', 'admin'), exportController.requestExport);
router.get('/exports', exportController.listMyExports);
router.get('/exports/:jobId', exportController.getExportJob);
router.get('/exports/:jobId/download', exportController.downloadExport);
router.post('/exports/:jobId/retry', exportController.retryExport);

// Audit logs for specific entities (accessible to owners)
router.get('/tenders/:tenderId/audit', authorize('buyer', 'admin'), auditController.getLogsForTender);
router.get('/bids/:bidId/audit', authorize('buyer', 'vendor', 'evaluator', 'admin'), auditController.getLogsForBid);
router.get('/vendors/:vendorId/audit', authorize('vendor', 'admin'), auditController.getLogsForVendor);

export { router as exportRoutes };

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/routes/export.routes.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports exportRoutes router
- [ ] Contains 8 route definitions

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.15: Create Rate Limit Middleware

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.15: Create rate limiting middleware

Create file: rfq-platform/backend/src/middleware/rateLimit.middleware.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { redis, logger } from '../config';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

const defaultKeyGenerator = (req: Request): string => {
  return req.user?.id || req.ip || 'anonymous';
};

export const createRateLimiter = (config: RateLimitConfig) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    message = 'Too many requests, please try again later',
  } = config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = `rate_limit:${keyGenerator(req)}`;
      const windowSeconds = Math.ceil(windowMs / 1000);

      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

      const ttl = await redis.ttl(key);
      res.setHeader('X-RateLimit-Reset', Date.now() + ttl * 1000);

      if (current > maxRequests) {
        logger.warn({ key, current, maxRequests }, 'Rate limit exceeded');
        
        res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message,
            retryAfter: ttl,
          },
        });
        return;
      }

      next();
    } catch (error) {
      // If Redis fails, allow the request but log the error
      logger.error({ error }, 'Rate limiter error');
      next();
    }
  };
};

// Pre-configured rate limiters

// General API rate limiter: 200 requests per minute per user
export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200,
  message: 'Too many requests. Please wait before making more requests.',
});

// Login rate limiter: 10 attempts per 15 minutes per IP
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyGenerator: (req) => `login:${req.ip}`,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

// Bid submission rate limiter: 5 requests per 10 seconds per vendor org
export const bidSubmissionRateLimiter = createRateLimiter({
  windowMs: 10 * 1000, // 10 seconds
  maxRequests: 5,
  keyGenerator: (req) => `bid_submit:${req.user?.orgId || req.ip}`,
  message: 'Too many bid submissions. Please wait a moment before trying again.',
});

// Export rate limiter: 10 exports per hour per user
export const exportRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Export limit reached. Please wait before requesting more exports.',
});

// Strict rate limiter for sensitive operations: 3 requests per minute
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3,
  message: 'Please wait before performing this action again.',
});

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/middleware/rateLimit.middleware.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports createRateLimiter function
- [ ] Exports 5 pre-configured rate limiters

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.16: Create Scheduler Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.16: Create scheduler service for periodic tasks

Create file: rfq-platform/backend/src/services/scheduler.service.ts

Content (copy EXACTLY):
import { logger } from '../config';
import { currencyService } from './currency.service';
import { notificationService } from './notification.service';

interface ScheduledTask {
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
  lastRun?: Date;
  isRunning: boolean;
}

const tasks: ScheduledTask[] = [];
const intervals: NodeJS.Timeout[] = [];

export const schedulerService = {
  registerTask(name: string, intervalMs: number, handler: () => Promise<void>): void {
    tasks.push({
      name,
      intervalMs,
      handler,
      isRunning: false,
    });
    logger.info({ taskName: name, intervalMs }, 'Scheduled task registered');
  },

  async runTask(task: ScheduledTask): Promise<void> {
    if (task.isRunning) {
      logger.warn({ taskName: task.name }, 'Task already running, skipping');
      return;
    }

    task.isRunning = true;
    const startTime = Date.now();

    try {
      await task.handler();
      task.lastRun = new Date();
      
      const duration = Date.now() - startTime;
      logger.info({ taskName: task.name, duration }, 'Scheduled task completed');
    } catch (error) {
      logger.error({ taskName: task.name, error }, 'Scheduled task failed');
    } finally {
      task.isRunning = false;
    }
  },

  startAll(): void {
    for (const task of tasks) {
      const interval = setInterval(() => {
        this.runTask(task);
      }, task.intervalMs);

      intervals.push(interval);
      
      // Run immediately on start
      this.runTask(task);
    }

    logger.info({ taskCount: tasks.length }, 'Scheduler started');
  },

  stopAll(): void {
    for (const interval of intervals) {
      clearInterval(interval);
    }
    intervals.length = 0;
    logger.info('Scheduler stopped');
  },

  getTaskStatus(): Array<{ name: string; lastRun: Date | undefined; isRunning: boolean }> {
    return tasks.map(task => ({
      name: task.name,
      lastRun: task.lastRun,
      isRunning: task.isRunning,
    }));
  },
};

// Register default tasks
export const initializeScheduledTasks = (): void => {
  // Refresh currency rates daily (every 24 hours)
  schedulerService.registerTask(
    'refresh-currency-rates',
    24 * 60 * 60 * 1000, // 24 hours
    async () => {
      await currencyService.fetchAndCacheRates();
    }
  );

  // Process pending notifications (every 30 seconds)
  schedulerService.registerTask(
    'process-notifications',
    30 * 1000, // 30 seconds
    async () => {
      await notificationService.processPendingNotifications();
    }
  );

  // Check deadline reminders (every hour)
  schedulerService.registerTask(
    'deadline-reminders',
    60 * 60 * 1000, // 1 hour
    async () => {
      await notificationService.sendDeadlineReminders();
    }
  );

  // Check vendor document expiry (daily)
  schedulerService.registerTask(
    'vendor-doc-expiry',
    24 * 60 * 60 * 1000, // 24 hours
    async () => {
      await notificationService.sendDocumentExpiryReminders();
    }
  );

  // Check unacknowledged addenda (every 6 hours)
  schedulerService.registerTask(
    'unacknowledged-addenda',
    6 * 60 * 60 * 1000, // 6 hours
    async () => {
      await notificationService.sendUnacknowledgedAddendaReminders();
    }
  );

  logger.info('Scheduled tasks initialized');
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/scheduler.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports schedulerService object with 5 methods
- [ ] Exports initializeScheduledTasks function
- [ ] Registers 5 default tasks

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.17: Update Routes Index

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.17: Update routes index to include Phase 6 routes

MODIFY file: rfq-platform/backend/src/routes/index.ts

Replace ENTIRE content with:
import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { tenderRoutes } from './tender.routes';
import { featureRoutes } from './feature.routes';
import { vendorRoutes } from './vendor.routes';
import { bidRoutes } from './bid.routes';
import { evaluationRoutes } from './evaluation.routes';
import { notificationRoutes } from './notification.routes';
import { adminRoutes } from './admin.routes';
import { exportRoutes } from './export.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenders', tenderRoutes);
router.use('/features', featureRoutes);
router.use('/vendors', vendorRoutes);
router.use('/', bidRoutes);
router.use('/', evaluationRoutes);
router.use('/', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/', exportRoutes);

export { router as apiRoutes };

Respond "✅ DONE" when file is updated.
```

### EXPECTED OUTPUT:
- File updated at `rfq-platform/backend/src/routes/index.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Mounts all 9 route modules

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.18: Update App Entry Point with Rate Limiting and Scheduler

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.18: Update app.ts to include rate limiting and scheduler

MODIFY file: rfq-platform/backend/src/app.ts

Add these imports at the top (after existing imports):
import { generalRateLimiter, loginRateLimiter } from './middleware/rateLimit.middleware';
import { schedulerService, initializeScheduledTasks } from './services/scheduler.service';

Add rate limiting middleware before routes (after app.use(express.json)):
// Rate limiting
app.use('/api/auth/login', loginRateLimiter);
app.use('/api', generalRateLimiter);

Add scheduler initialization after app.listen:
// Initialize and start scheduled tasks
if (process.env.NODE_ENV !== 'test') {
  initializeScheduledTasks();
  schedulerService.startAll();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  schedulerService.stopAll();
  process.exit(0);
});

Respond "✅ DONE" when file is updated.
```

### EXPECTED OUTPUT:
- File updated at `rfq-platform/backend/src/app.ts`

### VERIFICATION:
- [ ] Rate limiting imported and applied
- [ ] Scheduler imported and initialized
- [ ] Graceful shutdown handler added

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 6.19: Install Required Packages

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 6.19: Install required packages for Phase 6

Run these commands in the backend directory:

npm install pdfkit xlsx

npm install -D @types/pdfkit

Respond "✅ DONE" when packages are installed.
```

### EXPECTED OUTPUT:
- pdfkit package installed
- xlsx package installed
- @types/pdfkit dev dependency installed

### VERIFICATION:
- [ ] Run npm list pdfkit - shows installed
- [ ] Run npm list xlsx - shows installed
- [ ] package.json contains both dependencies

### REMARKS:
```
[Agent writes completion notes here]
```

---

# PHASE 6 COMPLETION CHECKLIST

| Task | File | Status |
|------|------|--------|
| 6.1 | schemas/tax.schema.ts | ⬜ |
| 6.2 | schemas/currency.schema.ts | ⬜ |
| 6.3 | schemas/export.schema.ts | ⬜ |
| 6.4 | schemas/audit.schema.ts | ⬜ |
| 6.5 | services/tax.service.ts | ⬜ |
| 6.6 | services/currency.service.ts | ⬜ |
| 6.7 | services/export.service.ts | ⬜ |
| 6.8 | services/audit.service.ts | ⬜ |
| 6.9 | controllers/tax.controller.ts | ⬜ |
| 6.10 | controllers/currency.controller.ts | ⬜ |
| 6.11 | controllers/export.controller.ts | ⬜ |
| 6.12 | controllers/audit.controller.ts | ⬜ |
| 6.13 | routes/admin.routes.ts | ⬜ |
| 6.14 | routes/export.routes.ts | ⬜ |
| 6.15 | middleware/rateLimit.middleware.ts | ⬜ |
| 6.16 | services/scheduler.service.ts | ⬜ |
| 6.17 | routes/index.ts (update) | ⬜ |
| 6.18 | app.ts (update) | ⬜ |
| 6.19 | Install packages | ⬜ |

---

## AFTER PHASE 6 COMPLETE

Run these commands to verify:

```bash
cd rfq-platform/backend
npm run build
```

If build succeeds with no errors, Phase 6 is complete.

**Test endpoints using Postman:**
1. Create tax rule: POST /api/admin/tax-rules
2. List tax rules: GET /api/admin/tax-rules
3. Refresh currency rates: POST /api/admin/currency/refresh
4. Convert currency: POST /api/admin/currency/convert
5. Request export: POST /api/exports
6. Get my exports: GET /api/exports
7. Search audit logs: GET /api/admin/audit/search
8. Get tender audit trail: GET /api/tenders/:id/audit

**Verify rate limiting:**
- Send 11 login requests quickly - 11th should return 429
- Send 201 API requests in 1 minute - 201st should return 429

**Verify scheduled tasks:**
- Check logs for "Scheduled task completed" messages
- Verify currency rates are being fetched

**Proceed to TASK_PLAN_PHASE7.md**