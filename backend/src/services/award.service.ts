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

    logger.info('Award created');
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

    logger.info('Tender finalized and awarded');
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
