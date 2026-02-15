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

    logger.info('Technical envelopes opened', { tenderId, userId });
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
          logger.error('Bid integrity check failed', { bidId, storedHash, computedHash });
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

    logger.info('Commercial envelopes unlocked', { tenderId, bidIds, userId });
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

    logger.info('Evaluation created', { evaluationId, bidId: input.bidId, technicalScore: input.technicalScore, qualified: isTechnicallyQualified });
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

    logger.info('Commercial scores calculated', { tenderId });
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
