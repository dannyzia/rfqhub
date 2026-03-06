import { v4 as uuidv4 } from "uuid";
import { pool, logger, redisClient } from "../config";
import { auditService } from "./audit.service";
import type {
  CreateTaxRuleInput,
  UpdateTaxRuleInput,
  TaxFilterInput,
  AppliesTo,
  CreateTaxRateInput,
  UpdateTaxRateInput,
  TaxRateFilterInput,
  CalculateTaxInput,
} from "../schemas/tax.schema";

// ============================================================================
// TAX RULES (existing - for procurement type-based tax rules)
// ============================================================================

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

// ============================================================================
// TAX RATES (new - for jurisdiction-based tax rates with Redis caching)
// ============================================================================

interface TaxRateRow {
  id: string;
  country_code: string;
  state_code: string | null;
  tax_type: string;
  rate: string;
  effective_date: Date;
  expiry_date: Date | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
}

interface TaxRate {
  id: string;
  countryCode: string;
  stateCode: string | null;
  taxType: string;
  rate: number;
  effectiveDate: Date;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

interface TaxCalculationResult {
  amount: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number;
  countryCode: string;
  taxType: string;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

const mapRowToTaxRule = (row: TaxRuleRow): TaxRule => ({
  id: row.id,
  name: row.name,
  ratePercent: parseFloat(row.rate_percent),
  appliesTo: row.applies_to as AppliesTo,
  isActive: row.is_active,
  createdAt: row.created_at,
});

const mapRowToTaxRate = (row: TaxRateRow): TaxRate => ({
  id: row.id,
  countryCode: row.country_code,
  stateCode: row.state_code,
  taxType: row.tax_type,
  rate: parseFloat(row.rate),
  effectiveDate: row.effective_date,
  expiryDate: row.expiry_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
});

// ============================================================================
// REDIS CACHE KEYS
// ============================================================================

const TAX_RATE_CACHE_PREFIX = "tax_rate:";

/**
 * Time-to-live (TTL) for tax rate cache entries in seconds.
 * Can be overridden via TAX_RATE_CACHE_TTL environment variable.
 * Defaults to 86400 seconds (24 hours) if not specified or invalid.
 */
const TAX_RATE_CACHE_TTL: number = (() => {
  const ttl = parseInt(process.env.TAX_RATE_CACHE_TTL || '86400', 10);
  if (isNaN(ttl) || ttl <= 0) {
    logger.warn('Invalid TAX_RATE_CACHE_TTL, using default 86400');
    return 86400;
  }
  return ttl;
})();

const getTaxRateCacheKey = (countryCode: string, stateCode?: string, taxType?: string): string => {
  const parts = [TAX_RATE_CACHE_PREFIX, countryCode];
  if (stateCode) parts.push(stateCode);
  if (taxType) parts.push(taxType);
  return parts.join(":");
};

// ============================================================================
// TAX RULES SERVICE (existing functionality)
// ============================================================================

export const taxService = {
  // ------------------------------------------------------------------------
  // TAX RULES METHODS (existing - procurement type-based)
  // ------------------------------------------------------------------------

  async createTaxRule(input: CreateTaxRuleInput): Promise<TaxRule> {
    const id = uuidv4();
    const { name, ratePercent, appliesTo, isActive } = input;

    const result = await pool.query<TaxRuleRow>(
      `INSERT INTO tax_rules (id, name, rate_percent, applies_to, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [id, name, ratePercent, appliesTo, isActive],
    );

    logger.info("Tax rule created", { taxRuleId: id, name });
    return mapRowToTaxRule(result.rows[0]);
  },

  async updateTaxRule(
    taxRuleId: string,
    input: UpdateTaxRuleInput,
  ): Promise<TaxRule> {
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
      throw new Error("No fields to update");
    }

    values.push(taxRuleId);
    const result = await pool.query<TaxRuleRow>(
      `UPDATE tax_rules SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    if (result.rows.length === 0) {
      throw new Error("Tax rule not found");
    }

    logger.info("Tax rule updated", { taxRuleId });
    return mapRowToTaxRule(result.rows[0]);
  },

  async getTaxRuleById(taxRuleId: string): Promise<TaxRule | null> {
    const result = await pool.query<TaxRuleRow>(
      "SELECT * FROM tax_rules WHERE id = $1",
      [taxRuleId],
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

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query<TaxRuleRow>(
      `SELECT * FROM tax_rules ${whereClause} ORDER BY name ASC`,
      values,
    );

    return result.rows.map(mapRowToTaxRule);
  },

  async getActiveTaxRulesForProcurementType(
    procurementType: string,
  ): Promise<TaxRule[]> {
    const result = await pool.query<TaxRuleRow>(
      `SELECT * FROM tax_rules
       WHERE is_active = true
       AND (applies_to = $1 OR applies_to = 'all')
       ORDER BY name ASC`,
      [procurementType],
    );
    return result.rows.map(mapRowToTaxRule);
  },

  async calculateBidItemTaxes(
    bidId: string,
    tenderId: string,
  ): Promise<{ taxes: BidItemTax[]; totalTax: number }> {
    const tenderResult = await pool.query<{ procurement_type: string }>(
      "SELECT procurement_type FROM tenders WHERE id = $1",
      [tenderId],
    );

    if (tenderResult.rows.length === 0) {
      throw new Error("Tender not found");
    }

    const procurementType = tenderResult.rows[0].procurement_type;

    const taxRules =
      await this.getActiveTaxRulesForProcurementType(procurementType);

    if (taxRules.length === 0) {
      return { taxes: [], totalTax: 0 };
    }

    const bidItemsResult = await pool.query<{
      id: string;
      item_total_price: string;
    }>(
      `SELECT id, item_total_price FROM bid_items
       WHERE bid_id = $1 AND item_total_price IS NOT NULL`,
      [bidId],
    );

    const taxes: BidItemTax[] = [];
    let totalTax = 0;

    for (const bidItem of bidItemsResult.rows) {
      const itemTotal = parseFloat(bidItem.item_total_price);

      for (const taxRule of taxRules) {
        const taxAmount = parseFloat(
          (itemTotal * (taxRule.ratePercent / 100)).toFixed(2),
        );
        totalTax += taxAmount;

        taxes.push({
          bidItemId: bidItem.id,
          taxRuleId: taxRule.id,
          taxRuleName: taxRule.name,
          ratePercent: taxRule.ratePercent,
          taxAmount,
        });

        await pool.query(
          `INSERT INTO bid_item_taxes (bid_item_id, tax_rule_id, tax_amount)
           VALUES ($1, $2, $3)
           ON CONFLICT (bid_item_id, tax_rule_id) DO UPDATE SET tax_amount = $3`,
          [bidItem.id, taxRule.id, taxAmount],
        );
      }
    }

    logger.info("Bid taxes calculated", {
      bidId,
      totalTax,
      taxCount: taxes.length,
    });
    return { taxes, totalTax: parseFloat(totalTax.toFixed(2)) };
  },

  async deleteTaxRule(taxRuleId: string): Promise<void> {
    const result = await pool.query(
      "UPDATE tax_rules SET is_active = false WHERE id = $1",
      [taxRuleId],
    );

    if (result.rowCount === 0) {
      throw new Error("Tax rule not found");
    }

    logger.info("Tax rule deactivated", { taxRuleId });
  },

  // ------------------------------------------------------------------------
  // TAX RATES METHODS (new - jurisdiction-based with Redis caching)
  // ------------------------------------------------------------------------

  async createTaxRate(input: CreateTaxRateInput, actorId?: string): Promise<TaxRate> {
    const id = uuidv4();
    const { countryCode, stateCode, taxType, rate, effectiveDate, expiryDate } = input;

    const result = await pool.query<TaxRateRow>(
      `INSERT INTO tax_rates (id, country_code, state_code, tax_type, rate, effective_date, expiry_date, created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8)
       RETURNING *`,
      [id, countryCode, stateCode || null, taxType, rate, effectiveDate, expiryDate || null, actorId || null],
    );

    const taxRate = mapRowToTaxRate(result.rows[0]);

    // Invalidate cache for this jurisdiction
    await this.invalidateTaxRateCache(countryCode, stateCode, taxType);

    // Audit log
    await auditService.log({
      actorId: actorId || "system",
      action: "TAX_RATE_CREATED",
      entityType: "tax_rate",
      entityId: id,
      metadata: {
        countryCode,
        stateCode,
        taxType,
        rate,
        effectiveDate,
        expiryDate,
      },
    });

    logger.info("Tax rate created", { taxRateId: id, countryCode, stateCode, taxType, rate });
    return taxRate;
  },

  async updateTaxRate(
    taxRateId: string,
    input: UpdateTaxRateInput,
    actorId?: string,
  ): Promise<TaxRate> {
    const updates: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.countryCode !== undefined) {
      updates.push(`country_code = $${paramIndex++}`);
      values.push(input.countryCode);
    }
    if (input.stateCode !== undefined) {
      updates.push(`state_code = $${paramIndex++}`);
      values.push(input.stateCode);
    }
    if (input.taxType !== undefined) {
      updates.push(`tax_type = $${paramIndex++}`);
      values.push(input.taxType);
    }
    if (input.rate !== undefined) {
      updates.push(`rate = $${paramIndex++}`);
      values.push(input.rate);
    }
    if (input.effectiveDate !== undefined) {
      updates.push(`effective_date = $${paramIndex++}`);
      values.push(input.effectiveDate);
    }
    if (input.expiryDate !== undefined) {
      updates.push(`expiry_date = $${paramIndex++}`);
      values.push(input.expiryDate);
    }

    if (updates.length === 1) { // Only updated_at
      throw new Error("No fields to update");
    }

    values.push(taxRateId);
    const result = await pool.query<TaxRateRow>(
      `UPDATE tax_rates SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    if (result.rows.length === 0) {
      throw new Error("Tax rate not found");
    }

    const taxRate = mapRowToTaxRate(result.rows[0]);

    // Invalidate cache for this jurisdiction
    await this.invalidateTaxRateCache(
      taxRate.countryCode,
      taxRate.stateCode || undefined,
      taxRate.taxType || undefined,
    );

    // Audit log
    await auditService.log({
      actorId: actorId || "system",
      action: "TAX_RATE_UPDATED",
      entityType: "tax_rate",
      entityId: taxRateId,
      metadata: {
        countryCode: taxRate.countryCode,
        stateCode: taxRate.stateCode,
        taxType: taxRate.taxType,
        rate: taxRate.rate,
        effectiveDate: taxRate.effectiveDate,
        expiryDate: taxRate.expiryDate,
      },
    });

    logger.info("Tax rate updated", { taxRateId, countryCode: taxRate.countryCode, stateCode: taxRate.stateCode, taxType: taxRate.taxType });
    return taxRate;
  },

  async getTaxRateById(taxRateId: string): Promise<TaxRate | null> {
    const result = await pool.query<TaxRateRow>(
      "SELECT * FROM tax_rates WHERE id = $1",
      [taxRateId],
    );
    return result.rows[0] ? mapRowToTaxRate(result.rows[0]) : null;
  },

  async listTaxRates(filter: TaxRateFilterInput): Promise<TaxRate[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filter.countryCode) {
      conditions.push(`country_code = $${paramIndex++}`);
      values.push(filter.countryCode);
    }
    if (filter.stateCode) {
      conditions.push(`state_code = $${paramIndex++}`);
      values.push(filter.stateCode);
    }
    if (filter.taxType) {
      conditions.push(`tax_type = $${paramIndex++}`);
      values.push(filter.taxType);
    }
    if (filter.activeOnly !== undefined && filter.activeOnly) {
      conditions.push(`(expiry_date IS NULL OR expiry_date > NOW())`);
      conditions.push(`effective_date <= NOW()`);
    }
    if (filter.effectiveDate) {
      conditions.push(`effective_date >= $${paramIndex++}`);
      values.push(filter.effectiveDate);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query<TaxRateRow>(
      `SELECT * FROM tax_rates ${whereClause} ORDER BY country_code, state_code, tax_type, effective_date DESC`,
      values,
    );

    return result.rows.map(mapRowToTaxRate);
  },

  async getTaxRateForJurisdiction(
    countryCode: string,
    stateCode?: string,
    taxType?: string,
  ): Promise<TaxRate | null> {
    // Try cache first
    const cacheKey = getTaxRateCacheKey(countryCode, stateCode, taxType);
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug("Tax rate cache hit", { cacheKey });
        return JSON.parse(cached) as TaxRate;
      }
    } catch (error) {
      logger.warn("Redis cache read error", { error, cacheKey });
      // Continue to database query
    }

    // Cache miss - query database
    const conditions: string[] = ["country_code = $1", "effective_date <= NOW()", "(expiry_date IS NULL OR expiry_date > NOW())"];
    const values: unknown[] = [countryCode];
    let paramIndex = 2;

    if (stateCode !== undefined) {
      conditions.push(`state_code = $${paramIndex++}`);
      values.push(stateCode);
    }
    if (taxType !== undefined) {
      conditions.push(`tax_type = $${paramIndex++}`);
      values.push(taxType);
    }

    const result = await pool.query<TaxRateRow>(
      `SELECT * FROM tax_rates WHERE ${conditions.join(" AND ")} ORDER BY effective_date DESC LIMIT 1`,
      values,
    );

    if (result.rows.length === 0) {
      return null;
    }

    const taxRate = mapRowToTaxRate(result.rows[0]);

    // Store in cache
    try {
      await redisClient.setex(cacheKey, TAX_RATE_CACHE_TTL, JSON.stringify(taxRate));
      logger.debug("Tax rate cached", { cacheKey, ttl: TAX_RATE_CACHE_TTL });
    } catch (error) {
      logger.warn("Redis cache write error", { error, cacheKey });
      // Continue - cache failure is acceptable
    }

    return taxRate;
  },

  async calculateTax(input: CalculateTaxInput): Promise<TaxCalculationResult> {
    const { amount, countryCode, stateCode, taxType } = input;

    // Get applicable tax rate
    const taxRate = await this.getTaxRateForJurisdiction(countryCode, stateCode, taxType);

    if (!taxRate) {
      // No tax rate found - return zero tax
      return {
        amount,
        taxAmount: 0,
        totalAmount: amount,
        taxRate: 0,
        countryCode,
        taxType: taxType || "Unknown",
      };
    }

    const taxAmount = parseFloat((amount * (taxRate.rate / 100)).toFixed(2));
    const totalAmount = parseFloat((amount + taxAmount).toFixed(2));

    logger.info("Tax calculated", {
      amount,
      taxAmount,
      totalAmount,
      taxRate: taxRate.rate,
      countryCode,
      stateCode,
      taxType: taxRate.taxType,
    });

    return {
      amount,
      taxAmount,
      totalAmount,
      taxRate: taxRate.rate,
      countryCode,
      taxType: taxRate.taxType,
    };
  },

  async deleteTaxRate(taxRateId: string, actorId?: string): Promise<void> {
    // Get tax rate before deletion for audit
    const existing = await this.getTaxRateById(taxRateId);
    if (!existing) {
      throw new Error("Tax rate not found");
    }

    // Invalidate cache BEFORE database delete to prevent race condition
    // This ensures no concurrent request can read stale cached data
    await this.invalidateTaxRateCache(
      existing.countryCode,
      existing.stateCode || undefined,
      existing.taxType || undefined,
    );

    const result = await pool.query(
      "DELETE FROM tax_rates WHERE id = $1",
      [taxRateId],
    );

    if (result.rowCount === 0) {
      throw new Error("Tax rate not found");
    }

    // Audit log
    await auditService.log({
      actorId: actorId || "system",
      action: "TAX_RATE_DELETED",
      entityType: "tax_rate",
      entityId: taxRateId,
      metadata: {
        countryCode: existing.countryCode,
        stateCode: existing.stateCode,
        taxType: existing.taxType,
        rate: existing.rate,
        effectiveDate: existing.effectiveDate,
        expiryDate: existing.expiryDate,
      },
    });

    logger.info("Tax rate deleted", { taxRateId, countryCode: existing.countryCode, stateCode: existing.stateCode, taxType: existing.taxType });
  },

  async invalidateTaxRateCache(countryCode: string, stateCode?: string | undefined, taxType?: string | undefined): Promise<void> {
    const cacheKey = getTaxRateCacheKey(countryCode, stateCode, taxType);
    try {
      await redisClient.del(cacheKey);
      logger.debug("Tax rate cache invalidated", { cacheKey });
    } catch (error) {
      logger.warn("Redis cache invalidate error", { error, cacheKey });
      // Continue - cache failure is acceptable
    }
  },
};
