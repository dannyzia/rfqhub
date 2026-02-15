// backend/src/middleware/organizationType.middleware.ts
// Description: Validates that the tender type matches the organization type
// Phase 2, Task 8

import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { OrganizationType } from '../types/organization.types';

/**
 * Validates that the tender type matches the organization type
 * Prevents govt orgs from creating non-govt tenders and vice versa
 */
export async function validateTenderTypeMatchesOrgType(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { tenderType } = req.body;
    const userOrgType = req.user!.organizationType;
    
    if (!tenderType) {
      return res.status(400).json({
        error: {
          code: 'TENDER_TYPE_REQUIRED',
          message: 'Tender type is required'
        }
      });
    }
    
    // Look up tender type definition
    const { rows } = await pool.query(
      'SELECT is_govt_type FROM tender_type_definitions WHERE code = $1 AND is_active = TRUE',
      [tenderType]
    );
    
    if (rows.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TENDER_TYPE',
          message: `Tender type '${tenderType}' not found or inactive`
        }
      });
    }
    
    const isGovtType = rows[0].is_govt_type;
    const isGovtOrg = userOrgType === OrganizationType.Government;
    
    // Validate match
    if (isGovtType && !isGovtOrg) {
      return res.status(403).json({
        error: {
          code: 'ORG_TYPE_MISMATCH',
          message: `Tender type '${tenderType}' is only available to government organizations. Non-government organizations should use NRQ types.`
        }
      });
    }
    
    if (!isGovtType && isGovtOrg) {
      return res.status(403).json({
        error: {
          code: 'ORG_TYPE_MISMATCH',
          message: `Tender type '${tenderType}' is only available to non-government organizations. Government organizations should use PG/PW/PPS types.`
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Organization type validation error:', error);
    res.status(500).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Failed to validate organization type'
      }
    });
  }
}
