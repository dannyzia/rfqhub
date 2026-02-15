import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { tenderTypeService } from './tenderTypeSelector.service';
import { OrganizationType } from '../types/organization.types';

export const simpleRfqDb = {
  async createSimpleRfq(rfqData: any, userOrgType: OrganizationType) {
    // NEW: Validate tender type against organization type
    const { rfqDetails } = rfqData;
    const { tenderType, estimatedValue, currency, rfqType } = rfqDetails;
    
    if (!tenderType) {
      throw Object.assign(new Error('Tender type is required for Simple RFQ'), {
        statusCode: 400,
        code: 'TENDER_TYPE_REQUIRED'
      });
    }
    
    // Validate that the tender type matches the organization type
    const isGovt = userOrgType === OrganizationType.Government;
    const { rows } = await pool.query(
      'SELECT is_govt_type FROM tender_type_definitions WHERE code = $1 AND is_active = TRUE',
      [tenderType]
    );
    
    if (rows.length === 0) {
      throw Object.assign(new Error(`Tender type '${tenderType}' not found or inactive`), {
        statusCode: 400,
        code: 'INVALID_TENDER_TYPE'
      });
    }
    
    const isGovtType = rows[0].is_govt_type;
    
    if (isGovtType && !isGovt) {
      throw Object.assign(new Error(`Tender type '${tenderType}' is only available to government organizations. Non-government organizations should use NRQ types.`), {
        statusCode: 403,
        code: 'ORG_TYPE_MISMATCH'
      });
    }
    
    if (!isGovtType && isGovt) {
      throw Object.assign(new Error(`Tender type '${tenderType}' is only available to non-government organizations. Government organizations should use PG/PW/PPS types.`), {
        statusCode: 403,
        code: 'ORG_TYPE_MISMATCH'
      });
    }
    
    // NEW: Validate value against tender type ranges
    if (estimatedValue !== undefined && estimatedValue > 0) {
      const tenderTypeDef = await tenderTypeService.getTenderTypeByCode(tenderType);
      
      // Convert estimated value to BDT for comparison (assuming 100 BDT = $1)
      const valueInBDT = currency === 'USD' ? estimatedValue * 100 : estimatedValue;
      
      const minVal = tenderTypeDef.min_value_bdt || 0;
      const maxVal = tenderTypeDef.max_value_bdt;
      
      if (valueInBDT < minVal) {
        throw Object.assign(new Error(`Estimated value ${valueInBDT} BDT is below minimum ${minVal} BDT for ${tenderType}`), {
          statusCode: 400,
          code: 'VALUE_BELOW_MINIMUM'
        });
      }
      
      if (maxVal !== null && valueInBDT > maxVal) {
        throw Object.assign(new Error(`Estimated value ${valueInBDT} BDT exceeds maximum ${maxVal} BDT for ${tenderType}`), {
          statusCode: 400,
          code: 'VALUE_EXCEEDS_MAXIMUM'
        });
      }
    }
    
    const id = uuidv4();
    const tenderNumber = `RFQ-${new Date().getFullYear()}-${Math.floor(Math.random()*100000).toString().padStart(5,'0')}`;
    
    // NEW: Enhanced extended_data with tender type information
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
          currency: currency || 'BDT'
        }
      }
    };
    
    const result = await pool.query(
      `INSERT INTO tenders (id, tender_number, tender_mode, is_govt_tender, extended_data, status, created_at, updated_at)
       VALUES ($1, $2, 'simple_rfq', $3, $4, 'published', NOW(), NOW()) RETURNING *`,
      [id, tenderNumber, !isGovt, enhancedData]
    );
    return result.rows[0];
  },

  async getSimpleRfqItems(id: string) {
    const result = await pool.query(
      `SELECT extended_data FROM tenders WHERE id = $1 AND tender_mode = 'simple_rfq'`,
      [id]
    );
    if (!result.rows[0]) return null;
    return result.rows[0].extended_data?.rfqDetails?.items || [];
  },
  
  // NEW: Get tender type information for a Simple RFQ
  async getSimpleRfqTenderType(id: string) {
    const result = await pool.query(
      `SELECT extended_data->'rfqDetails'->>'tenderType' as tender_type,
              extended_data->'rfqDetails'->>'estimatedValue' as estimated_value,
              extended_data->'rfqDetails'->>'currency' as currency,
              extended_data->'rfqDetails'->>'organizationType' as organization_type
       FROM tenders WHERE id = $1 AND tender_mode = 'simple_rfq'`,
      [id]
    );
    if (!result.rows[0]) return null;
    return {
      tenderType: result.rows[0].tender_type,
      estimatedValue: parseFloat(result.rows[0].estimated_value) || 0,
      currency: result.rows[0].currency || 'BDT',
      organizationType: result.rows[0].organization_type
    };
  }
};
