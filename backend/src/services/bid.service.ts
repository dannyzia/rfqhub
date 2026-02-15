import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { pool, logger } from "../config";
import type {
  UpdateBidInput,
  BidItemInput,
  BidItemFeatureValueInput,
} from "../schemas/bid.schema";

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
      "SELECT id, status, submission_deadline FROM tenders WHERE id = $1",
      [tenderId],
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error("Tender not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    if (
      tender.rows[0].status !== "published" &&
      tender.rows[0].status !== "clarification"
    ) {
      throw Object.assign(new Error("Tender is not open for bidding"), {
        statusCode: 409,
        code: "CONFLICT",
      });
    }

    const existingBid = await this.findActiveBid(tenderId, vendorOrgId);
    if (existingBid && existingBid.status === "draft") {
      return existingBid;
    }

    const maxVersion = await pool.query(
      "SELECT COALESCE(MAX(version), 0) as max_version FROM bids WHERE tender_id = $1 AND vendor_org_id = $2",
      [tenderId, vendorOrgId],
    );
    const newVersion = maxVersion.rows[0].max_version + 1;

    const id = uuidv4();

    const { rows } = await pool.query<BidRow>(
      `INSERT INTO bids (id, tender_id, vendor_org_id, version, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [id, tenderId, vendorOrgId, newVersion],
    );

    await pool.query(
      `INSERT INTO bid_envelopes (id, bid_id, envelope_type, is_open) VALUES ($1, $2, 'technical', false)`,
      [uuidv4(), id],
    );
    await pool.query(
      `INSERT INTO bid_envelopes (id, bid_id, envelope_type, is_open) VALUES ($1, $2, 'commercial', false)`,
      [uuidv4(), id],
    );

    logger.info(
      `Bid created: ${id} for tender ${tenderId} by ${vendorOrgId} (version ${newVersion})`,
    );
    return rows[0];
  },

  async findById(bidId: string): Promise<BidRow | null> {
    const { rows } = await pool.query<BidRow>(
      "SELECT * FROM bids WHERE id = $1",
      [bidId],
    );
    return rows[0] || null;
  },

  async findActiveBid(
    tenderId: string,
    vendorOrgId: string,
  ): Promise<BidRow | null> {
    const { rows } = await pool.query<BidRow>(
      `SELECT * FROM bids
       WHERE tender_id = $1 AND vendor_org_id = $2 AND status IN ('draft', 'submitted')
       ORDER BY version DESC LIMIT 1`,
      [tenderId, vendorOrgId],
    );
    return rows[0] || null;
  },

  async findByTenderId(tenderId: string): Promise<BidRow[]> {
    const { rows } = await pool.query<BidRow>(
      `SELECT * FROM bids WHERE tender_id = $1 AND status = 'submitted' ORDER BY submitted_at`,
      [tenderId],
    );
    return rows;
  },

  async update(
    bidId: string,
    input: UpdateBidInput,
    vendorOrgId: string,
  ): Promise<BidRow> {
    const bid = await this.findById(bidId);

    if (!bid) {
      throw Object.assign(new Error("Bid not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    if (bid.vendor_org_id !== vendorOrgId) {
      throw Object.assign(new Error("Not authorized"), {
        statusCode: 403,
        code: "FORBIDDEN",
      });
    }

    if (bid.status !== "draft") {
      throw Object.assign(new Error("Can only update draft bids"), {
        statusCode: 409,
        code: "CONFLICT",
      });
    }

    for (const item of input.items) {
      await this.upsertBidItem(bidId, item);
    }

    if (input.featureValues) {
      for (const fv of input.featureValues) {
        await this.upsertFeatureValue(bidId, fv);
      }
    }

    await pool.query("UPDATE bids SET updated_at = NOW() WHERE id = $1", [
      bidId,
    ]);

    logger.info(`Bid updated: ${bidId}`);
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
      [
        id,
        bidId,
        item.tenderItemId,
        item.envelopeType,
        item.unitPrice || null,
        item.compliance || null,
        item.nonComplianceRemarks || null,
        item.brandMake || null,
      ],
    );

    return rows[0];
  },

  async upsertFeatureValue(
    bidId: string,
    fv: BidItemFeatureValueInput,
  ): Promise<void> {
    const bidItems = await pool.query(
      "SELECT id FROM bid_items WHERE bid_id = $1",
      [bidId],
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
      [
        bidItemId,
        fv.featureId,
        fv.optionId || null,
        fv.textValue || null,
        fv.numericValue || null,
      ],
    );
  },

  async submit(bidId: string, vendorOrgId: string): Promise<BidRow> {
    const bid = await this.findById(bidId);

    if (!bid) {
      throw Object.assign(new Error("Bid not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    if (bid.vendor_org_id !== vendorOrgId) {
      throw Object.assign(new Error("Not authorized"), {
        statusCode: 403,
        code: "FORBIDDEN",
      });
    }

    if (bid.status !== "draft") {
      throw Object.assign(new Error("Bid is not in draft status"), {
        statusCode: 409,
        code: "CONFLICT",
      });
    }

    const tender = await pool.query(
      "SELECT submission_deadline FROM tenders WHERE id = $1",
      [bid.tender_id],
    );

    if (new Date() > new Date(tender.rows[0].submission_deadline)) {
      throw Object.assign(new Error("Submission deadline has passed"), {
        statusCode: 403,
        code: "FORBIDDEN",
      });
    }

    const unacknowledged = await pool.query(
      `SELECT COUNT(*) as count FROM addendum_acknowledgements aa
       JOIN addenda a ON a.id = aa.addendum_id
       WHERE a.tender_id = $1 AND aa.vendor_org_id = $2 AND aa.acknowledged_at IS NULL`,
      [bid.tender_id, vendorOrgId],
    );

    if (parseInt(unacknowledged.rows[0].count) > 0) {
      throw Object.assign(new Error("Unacknowledged addenda exist"), {
        statusCode: 403,
        code: "FORBIDDEN",
      });
    }

    // Step 2B: Check mandatory documents
    const tenderTypeQuery = await pool.query(
      `SELECT tender_type FROM tenders WHERE id = $1`,
      [bid.tender_id]
    );
    
    if (tenderTypeQuery.rows.length > 0) {
      const tenderType = tenderTypeQuery.rows[0].tender_type;
      
      // Get required documents for this tender type
      const requiredDocsQuery = await pool.query(
        `SELECT id, document_code, document_name, is_mandatory 
         FROM tender_type_document_requirements 
         WHERE tender_type_code = $1 AND is_mandatory = TRUE`,
        [tenderType]
      );
      
      if (requiredDocsQuery.rows.length > 0) {
        // Check if all mandatory documents are submitted and approved
        const submittedDocsQuery = await pool.query(
          `SELECT COUNT(DISTINCT doc_req_id) as submitted_count
           FROM tender_document_submissions
           WHERE tender_id = $1 AND vendor_org_id = $2 AND status = 'approved'`,
          [bid.tender_id, vendorOrgId]
        );
        
        const submittedCount = parseInt(submittedDocsQuery.rows[0].submitted_count || 0);
        const requiredCount = requiredDocsQuery.rows.length;
        
        if (submittedCount < requiredCount) {
          const missingDocs = requiredDocsQuery.rows
            .filter((_, index) => index >= submittedCount)
            .map(d => d.document_name);
          
          throw Object.assign(new Error(
            `Cannot submit bid: ${requiredCount - submittedCount} required documents missing (${missingDocs.join(', ')})`
          ), {
            statusCode: 400,
            code: 'MISSING_REQUIRED_DOCUMENTS',
            details: {
              missing: missingDocs,
              submitted: submittedCount,
              required: requiredCount
            }
          });
        }
      }
    }

    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(
        CASE WHEN bi.unit_price IS NOT NULL AND ti.quantity IS NOT NULL
        THEN bi.unit_price * ti.quantity ELSE 0 END
      ), 0) as total
       FROM bid_items bi
       JOIN tender_items ti ON ti.id = bi.tender_item_id
       WHERE bi.bid_id = $1 AND bi.envelope_type = 'commercial'`,
      [bidId],
    );

    const totalAmount = parseFloat(totalResult.rows[0].total);

    const bidData = await pool.query(
      `SELECT bi.*, bfv.feature_id, bfv.option_id, bfv.text_value, bfv.numeric_value
       FROM bid_items bi
       LEFT JOIN bid_item_feature_values bfv ON bfv.bid_item_id = bi.id
       WHERE bi.bid_id = $1
       ORDER BY bi.tender_item_id`,
      [bidId],
    );

    const hashPayload = JSON.stringify({
      bidId,
      tenderId: bid.tender_id,
      vendorOrgId: bid.vendor_org_id,
      version: bid.version,
      totalAmount,
      items: bidData.rows,
    });
    const digitalHash = crypto
      .createHash("sha256")
      .update(hashPayload)
      .digest("hex");

    const { rows } = await pool.query<BidRow>(
      `UPDATE bids SET
        status = 'submitted',
        total_amount = $1,
        digital_hash = $2,
        submitted_at = NOW(),
        updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [totalAmount, digitalHash, bidId],
    );

    logger.info(
      `Bid submitted: ${bidId} with total ${totalAmount} (hash: ${digitalHash})`,
    );
    return rows[0];
  },

  async withdraw(bidId: string, vendorOrgId: string): Promise<BidRow> {
    const bid = await this.findById(bidId);

    if (!bid) {
      throw Object.assign(new Error("Bid not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    if (bid.vendor_org_id !== vendorOrgId) {
      throw Object.assign(new Error("Not authorized"), {
        statusCode: 403,
        code: "FORBIDDEN",
      });
    }

    if (bid.status !== "submitted") {
      throw Object.assign(new Error("Only submitted bids can be withdrawn"), {
        statusCode: 409,
        code: "CONFLICT",
      });
    }

    const tender = await pool.query(
      "SELECT submission_deadline FROM tenders WHERE id = $1",
      [bid.tender_id],
    );

    if (new Date() > new Date(tender.rows[0].submission_deadline)) {
      throw Object.assign(
        new Error("Cannot withdraw after submission deadline"),
        {
          statusCode: 403,
          code: "FORBIDDEN",
        },
      );
    }

    const { rows } = await pool.query<BidRow>(
      `UPDATE bids SET status = 'withdrawn', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [bidId],
    );

    logger.info(`Bid withdrawn: ${bidId}`);
    return rows[0];
  },

  async findBidItems(bidId: string): Promise<BidItemRow[]> {
    const { rows } = await pool.query<BidItemRow>(
      "SELECT * FROM bid_items WHERE bid_id = $1 ORDER BY tender_item_id",
      [bidId],
    );
    return rows;
  },

  async findBidEnvelopes(bidId: string): Promise<BidEnvelopeRow[]> {
    const { rows } = await pool.query<BidEnvelopeRow>(
      "SELECT * FROM bid_envelopes WHERE bid_id = $1",
      [bidId],
    );
    return rows;
  },
};
