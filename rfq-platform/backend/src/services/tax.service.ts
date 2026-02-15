import { v4 as uuidv4 } from "uuid";
import { pool, logger } from "../config";
import type {
  CreateTaxRuleInput,
  UpdateTaxRuleInput,
  TaxFilterInput,
  AppliesTo,
} from "../schemas/tax.schema";

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
};
