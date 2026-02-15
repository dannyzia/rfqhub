import { v4 as uuidv4 } from "uuid";
import { pool, logger } from "../config";
import type {
  CreateTenderInput,
  UpdateTenderInput,
} from "../schemas/tender.schema";

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
  draft: ["published", "cancelled"],
  published: ["clarification", "closed", "cancelled"],
  clarification: ["published", "closed", "cancelled"],
  closed: ["tech_eval", "cancelled"],
  tech_eval: ["comm_eval", "cancelled"],
  comm_eval: ["awarded", "cancelled"],
  awarded: [],
  cancelled: [],
};

const generateTenderNumber = async (buyerOrgId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM tenders WHERE buyer_org_id = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
    [buyerOrgId, year],
  );
  const count = parseInt(rows[0].count, 10) + 1;
  return `RFQ-${year}-${String(count).padStart(5, "0")}`;
};

export const tenderService = {
  async create(
    input: CreateTenderInput,
    userId: string,
    orgId: string,
  ): Promise<TenderRow> {
    const id = uuidv4();
    const tenderNumber = await generateTenderNumber(orgId);
    
    // Step 1: Fetch tender type defaults
    const typeResult = await pool.query(
      `SELECT 
        code,
        requires_tender_security,
        tender_security_percent,
        min_submission_days,
        default_validity_days,
        requires_two_envelope
      FROM tender_type_definitions
      WHERE code = $1 AND is_active = TRUE`,
      [input.tenderType]
    );
    
    if (typeResult.rows.length === 0) {
      throw Object.assign(new Error(`Invalid tender type: ${input.tenderType}`), {
        statusCode: 400,
        code: 'INVALID_TENDER_TYPE'
      });
    }
    
    const tenderTypeDef = typeResult.rows[0];
    
    // Step 2: Calculate/validate bid security
    let bidSecurityAmount = input.bidSecurityAmount;
    
    if (!bidSecurityAmount && tenderTypeDef.requires_tender_security && input.estimatedCost) {
      // Auto-calculate if not provided
      const calculatedAmount = Math.round((input.estimatedCost * tenderTypeDef.tender_security_percent) / 100);
      bidSecurityAmount = calculatedAmount;
      
      logger.info(`Auto-calculated bid security for tender ${id}: ${calculatedAmount}`);
    }
    
    // Step 3: Set validity days (use type default if not provided)
    const validityDays = input.validityDays || tenderTypeDef.default_validity_days;
    
    // Step 4: Validate submission deadline
    const submissionDeadline = new Date(input.submissionDeadline);
    const minDaysFromNow = new Date();
    minDaysFromNow.setDate(minDaysFromNow.getDate() + tenderTypeDef.min_submission_days);
    
    if (submissionDeadline < minDaysFromNow) {
      throw Object.assign(new Error(
        `Submission deadline must be at least ${tenderTypeDef.min_submission_days} days from now for ${input.tenderType}`
      ), {
        statusCode: 400,
        code: 'INVALID_SUBMISSION_DEADLINE'
      });
    }
    
    // Step 5: Validate two-envelope requirement
    const twoEnvelopeSystem = input.twoEnvelopeSystem ?? false;
    
    if (tenderTypeDef.requires_two_envelope && !twoEnvelopeSystem) {
      throw Object.assign(new Error(
        `${input.tenderType} requires two-envelope system (technical + commercial separation)`
      ), {
        statusCode: 400,
        code: 'TWO_ENVELOPE_REQUIRED'
      });
    }
    
    // Step 6: Insert tender with enhanced data
    const { rows } = await pool.query<TenderRow>(
      `INSERT INTO tenders (
        id, tender_number, buyer_org_id, title, tender_type, visibility,
        procurement_type, currency, price_basis, fund_allocation,
        bid_security_amount, pre_bid_meeting_date, pre_bid_meeting_link,
        submission_deadline, bid_opening_time, validity_days, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft', $17)
      RETURNING *`,
      [
        id,
        tenderNumber,
        orgId,
        input.title,
        input.tenderType,
        input.visibility,
        input.procurementType,
        input.currency,
        input.priceBasis,
        input.fundAllocation || null,
        bidSecurityAmount || null,
        input.preBidMeetingDate || null,
        input.preBidMeetingLink || null,
        input.submissionDeadline,
        input.bidOpeningTime || null,
        validityDays,
        userId,
      ],
    );
    
    // Step 7: Audit log
    logger.info({
      tenderType: input.tenderType,
      estimatedCost: input.estimatedCost,
      calculatedSecurity: bidSecurityAmount,
      autoCalculated: !input.bidSecurityAmount,
      message: `Tender created with type-based validation`
    });

    logger.info(`Tender created: ${id} (${tenderNumber})`);
    return rows[0];
  },

  async findById(id: string): Promise<TenderRow | null> {
    const { rows } = await pool.query<TenderRow>(
      "SELECT * FROM tenders WHERE id = $1",
      [id],
    );
    return rows[0] || null;
  },

  async findAll(orgId: string, role: string): Promise<TenderRow[]> {
    let query: string;
    let params: string[];

    if (role === "buyer" || role === "admin") {
      query =
        "SELECT * FROM tenders WHERE buyer_org_id = $1 ORDER BY created_at DESC";
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

  async update(
    id: string,
    input: UpdateTenderInput,
    orgId: string,
  ): Promise<TenderRow> {
    const tender = await this.findById(id);

    if (!tender) {
      throw Object.assign(new Error("Tender not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    if (tender.buyer_org_id !== orgId) {
      throw Object.assign(new Error("Not authorized"), {
        statusCode: 403,
        code: "FORBIDDEN",
      });
    }

    if (tender.status !== "draft") {
      throw Object.assign(new Error("Can only edit draft tenders"), {
        statusCode: 409,
        code: "CONFLICT",
      });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      title: "title",
      tenderType: "tender_type",
      visibility: "visibility",
      procurementType: "procurement_type",
      currency: "currency",
      priceBasis: "price_basis",
      fundAllocation: "fund_allocation",
      bidSecurityAmount: "bid_security_amount",
      preBidMeetingDate: "pre_bid_meeting_date",
      preBidMeetingLink: "pre_bid_meeting_link",
      submissionDeadline: "submission_deadline",
      bidOpeningTime: "bid_opening_time",
      validityDays: "validity_days",
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
      `UPDATE tenders SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    logger.info(`Tender updated: ${id}`);
    return rows[0];
  },

  async transitionStatus(
    id: string,
    newStatus: string,
    orgId: string,
  ): Promise<TenderRow> {
    const tender = await this.findById(id);

    if (!tender) {
      throw Object.assign(new Error("Tender not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    if (tender.buyer_org_id !== orgId) {
      throw Object.assign(new Error("Not authorized"), {
        statusCode: 403,
        code: "FORBIDDEN",
      });
    }

    const allowed = VALID_TRANSITIONS[tender.status] || [];
    if (!allowed.includes(newStatus)) {
      throw Object.assign(
        new Error(`Cannot transition from ${tender.status} to ${newStatus}`),
        { statusCode: 409, code: "CONFLICT" },
      );
    }

    const { rows } = await pool.query<TenderRow>(
      `UPDATE tenders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newStatus, id],
    );

    logger.info(
      `Tender status changed: ${id} ${tender.status} -> ${newStatus}`,
    );
    return rows[0];
  },

  async publish(
    id: string,
    orgId: string,
    invitedVendorIds?: string[],
  ): Promise<TenderRow> {
    const tender = await this.transitionStatus(id, "published", orgId);

    if (
      tender.visibility === "limited" &&
      invitedVendorIds &&
      invitedVendorIds.length > 0
    ) {
      const crypto = await import("crypto");

      for (const vendorOrgId of invitedVendorIds) {
        const token = crypto.randomBytes(32).toString("hex");
        await pool.query(
          `INSERT INTO tender_vendor_invitations (tender_id, vendor_org_id, invitation_token, status)
           VALUES ($1, $2, $3, 'sent')
           ON CONFLICT (tender_id, vendor_org_id) DO NOTHING`,
          [id, vendorOrgId, token],
        );
      }

      logger.info(
        `Vendor invitations created: ${id} (${invitedVendorIds.length})`,
      );
    }

    return tender;
  },

  async cancel(id: string, orgId: string): Promise<TenderRow> {
    return this.transitionStatus(id, "cancelled", orgId);
  },
};
