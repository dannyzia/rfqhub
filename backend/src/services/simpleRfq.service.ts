import { pool } from "../config/database";
import { v4 as uuidv4 } from "uuid";
import { getTenderTypeByCode } from "./tenderTypeSelector.service";
import { OrganizationType } from "../types/organization.types";

export const simpleRfqDb = {
  async createSimpleRfq(
    rfqData: any,
    userOrgType: OrganizationType,
    userId: string,
    organizationId: string
  ) {
    // Validate tender type against organization type
    const { rfqDetails } = rfqData;
    const { tenderType, estimatedValue, currency = 'BDT' } = rfqDetails;

    if (!tenderType) {
      throw Object.assign(new Error("Tender type is required for Simple RFQ"), {
        statusCode: 400,
        code: "TENDER_TYPE_REQUIRED",
      });
    }

    // Validate that the tender type matches the organization type
    const isGovt = userOrgType === OrganizationType.Government;

    const { rows } = await pool.query(
      "SELECT is_govt_type FROM tender_type_definitions WHERE code = $1 AND is_active = TRUE",
      [tenderType],
    );

    // Check if row exists and is active
    if (rows.length === 0) {
      throw Object.assign(
        new Error(`Tender type '${tenderType}' not found or inactive`),
        {
          statusCode: 400,
          code: "INVALID_TENDER_TYPE",
        },
      );
    }

    // Validate value against tender type ranges
    if (estimatedValue !== undefined && estimatedValue > 0) {
      const tenderTypeDef = await getTenderTypeByCode(tenderType);

      // Convert estimated value to BDT for comparison (assuming 100 BDT = $1)
      const valueInBDT =
        currency === "USD" ? estimatedValue * 100 : estimatedValue;

      const minVal = tenderTypeDef.min_value_bdt || 0;
      const maxVal = tenderTypeDef.max_value_bdt;

      if (valueInBDT < minVal) {
        throw Object.assign(
          new Error(
            `Estimated value ${valueInBDT} BDT is below minimum ${minVal} BDT for ${tenderType}`,
          ),
          {
            statusCode: 400,
            code: "VALUE_BELOW_MINIMUM",
          },
        );
      }

      if (maxVal != null && valueInBDT > maxVal) {
        throw Object.assign(
          new Error(
            `Estimated value ${valueInBDT} BDT exceeds maximum ${maxVal} BDT for ${tenderType}`,
          ),
          {
            statusCode: 400,
            code: "VALUE_EXCEEDS_MAXIMUM",
          },
        );
      }
    }

    const id = uuidv4();
    const tenderNumber = `RFQ-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 100000,
    )
      .toString()
      .padStart(5, "0")}`;

    // Enhanced extended_data with tender type information
    const enhancedData = {
      ...rfqData,
      rfqDetails: {
        ...rfqData.rfqDetails,
        tenderType,
        estimatedValue,
        currency,
        organizationType: userOrgType,
        validation: {
          tenderTypeValid: true,
          valueInRange: estimatedValue ? true : undefined,
          currency: currency || "BDT",
        },
      },
    };

    // Map rfqType to procurement_type (they have the same enum values)
    const procurementType = rfqDetails.rfqType; // 'goods', 'services', 'works'
    const visibility = 'open';

    const priceBasis = 'unit_rate';
    // Default submission deadline: 30 days from now
    const submissionDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const validityDays = 90;
    const status = 'draft'; // matches schema default

    // Use the authenticated user's organization and user ID
    const buyerOrgId = organizationId;
    const createdByUserId = userId;

    const result = await pool.query(
      `INSERT INTO tenders (
        id, tender_number, buyer_org_id, title, tender_type, visibility,
        procurement_type, currency, price_basis, fund_allocation,
        bid_security_amount, pre_bid_meeting_date, pre_bid_meeting_link,
        submission_deadline, bid_opening_time, validity_days, status, created_by,
        created_at, updated_at, tender_mode, is_govt_tender, extended_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        NOW(), NOW(), 'simple_rfq', $19, $20
      ) RETURNING *`,
      [
        id,
        tenderNumber,
        buyerOrgId,
        rfqDetails.title,
        tenderType,
        visibility,
        procurementType,
        currency,
        priceBasis,
        null, // fund_allocation
        null, // bid_security_amount
        null, // pre_bid_meeting_date
        null, // pre_bid_meeting_link
        submissionDeadline,
        null, // bid_opening_time
        validityDays,
        status,
        createdByUserId,
        !isGovt, // is_govt_tender
        enhancedData
      ]
    );
    return result.rows[0];
  },

  async getSimpleRfqItems(
    id: string,
    userId: string,
    organizationId: string,
    userRoles: string[]
  ) {
    // First, check if the tender exists and get its organization
    const tenderResult = await pool.query(
      `SELECT buyer_org_id, created_by FROM tenders WHERE id = $1 AND tender_mode = 'simple_rfq'`,
      [id],
    );

    if (!tenderResult.rows[0]) {
      return null;
    }

    const tender = tenderResult.rows[0];

    // Check authorization: user must be the creator, belong to the same organization,
    // or have admin role
    const isCreator = tender.created_by === userId;
    const isSameOrg = tender.buyer_org_id === organizationId;
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');

    if (!isCreator && !isSameOrg && !isAdmin) {
      throw Object.assign(
        new Error("You do not have permission to access this Simple RFQ"),
        {
          statusCode: 403,
          code: "FORBIDDEN",
        }
      );
    }

    const result = await pool.query(
      `SELECT extended_data FROM tenders WHERE id = $1 AND tender_mode = 'simple_rfq'`,
      [id],
    );
    if (!result.rows[0]) return null;
    return result.rows[0].extended_data?.rfqDetails?.items || [];
  },

  // Get tender type information for a Simple RFQ
  async getSimpleRfqTenderType(
    id: string,
    userId: string,
    organizationId: string,
    userRoles: string[]
  ) {
    // First, check if the tender exists and get its organization
    const tenderResult = await pool.query(
      `SELECT buyer_org_id, created_by FROM tenders WHERE id = $1 AND tender_mode = 'simple_rfq'`,
      [id],
    );

    if (!tenderResult.rows[0]) {
      return null;
    }

    const tender = tenderResult.rows[0];

    // Check authorization: user must be the creator, belong to the same organization,
    // or have admin role
    const isCreator = tender.created_by === userId;
    const isSameOrg = tender.buyer_org_id === organizationId;
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');

    if (!isCreator && !isSameOrg && !isAdmin) {
      throw Object.assign(
        new Error("You do not have permission to access this Simple RFQ"),
        {
          statusCode: 403,
          code: "FORBIDDEN",
        }
      );
    }

    const result = await pool.query(
      `SELECT extended_data->'rfqDetails'->>'tenderType' as tender_type,
              extended_data->'rfqDetails'->>'estimatedValue' as estimated_value,
              extended_data->'rfqDetails'->>'currency' as currency,
              extended_data->'rfqDetails'->>'organizationType' as organization_type
       FROM tenders WHERE id = $1 AND tender_mode = 'simple_rfq'`,
      [id],
    );
    if (!result.rows[0]) return null;
    return {
      tenderType: result.rows[0].tender_type,
      estimatedValue: parseFloat(result.rows[0].estimated_value) || 0,
      currency: result.rows[0].currency || "BDT",
      organizationType: result.rows[0].organization_type,
    };
  },
} as const;

// Compatibility export alias
export const simpleRfqService = simpleRfqDb;