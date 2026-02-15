import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

/**
 * Middleware to check if vendor has access to limited tender
 * Checks if the tender has limited vendor access and if the current user's organization is invited
 */
export async function checkLimitedTenderAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { tenderId } = req.params;
    const userOrgId = req.user?.orgId;
    
    if (!userOrgId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }
    
    // Check if tender has limited access
    const { rows } = await pool.query(
      `SELECT t.is_live_tendering, ltv.vendor_org_id
       FROM tenders t
       LEFT JOIN limited_tender_vendors ltv ON t.id = ltv.tender_id AND ltv.vendor_org_id = $1
       WHERE t.id = $2`,
      [userOrgId, tenderId]
    );
    
    if (rows.length === 0) {
      res.status(404).json({
        error: {
          code: 'TENDER_NOT_FOUND',
          message: 'Tender not found'
        }
      });
      return;
    }
    
    const tender = rows[0];
    
    // If tender has limited vendors and user's org is not in the list
    if (tender.vendor_org_id === null) {
      // Check if there are any limited vendors for this tender
      const { rows: limitedVendors } = await pool.query(
        'SELECT 1 FROM limited_tender_vendors WHERE tender_id = $1 LIMIT 1',
        [tenderId]
      );
      
      if (limitedVendors.length > 0) {
        // Log unauthorized access attempt
        await logAccessAttempt(tenderId, userOrgId, 'UNAUTHORIZED_ACCESS');
        
        res.status(403).json({
          error: {
            code: 'NOT_INVITED',
            message: 'You are not invited to participate in this limited tender'
          }
        });
        return;
      }
    }
    
    // User has access, log successful access
    await logAccessAttempt(tenderId, userOrgId, 'AUTHORIZED_ACCESS');
    
    next();
  } catch (error) {
    console.error('Limited tender access check error:', error);
    res.status(500).json({
      error: {
        code: 'ACCESS_CHECK_ERROR',
        message: 'Failed to check tender access'
      }
    });
  }
}

/**
 * Middleware to check if user can manage limited tender invitations
 * Only buyers/organizations that created the tender can manage invitations
 */
export async function checkInvitationManagementAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { tenderId } = req.params;
    const userOrgId = req.user?.orgId;
    
    if (!userOrgId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }
    
    // Check if user's organization is the buyer for this tender
    const { rows } = await pool.query(
      'SELECT organization_id FROM tenders WHERE id = $1',
      [tenderId]
    );
    
    if (rows.length === 0) {
      res.status(404).json({
        error: {
          code: 'TENDER_NOT_FOUND',
          message: 'Tender not found'
        }
      });
      return;
    }
    
    const tender = rows[0];
    
    if (tender.organization_id !== userOrgId) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PRIVILEGES',
          message: 'Only the tender creator can manage invitations'
        }
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Invitation management access check error:', error);
    res.status(500).json({
      error: {
        code: 'ACCESS_CHECK_ERROR',
        message: 'Failed to check invitation management access'
      }
    });
  }
}

/**
 * Log access attempts for audit purposes
 */
async function logAccessAttempt(tenderId: string, vendorOrgId: string, action: string): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs (
         id, user_id, action, entity_type, entity_id, metadata, created_at
       ) VALUES ($1, $2, $3, 'tender', $4, $5, NOW())`,
      [
        generateAuditId(),
        vendorOrgId,
        action,
        tenderId,
        JSON.stringify({
          vendor_org_id: vendorOrgId,
          action: action,
          timestamp: new Date().toISOString()
        })
      ]
    );
  } catch (error) {
    console.error('Failed to log access attempt:', error);
  }
}

/**
 * Generate unique audit log ID
 */
function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Utility function to check if tender has limited access
 */
export async function isLimitedTender(tenderId: string): Promise<boolean> {
  try {
    const { rows } = await pool.query(
      'SELECT 1 FROM limited_tender_vendors WHERE tender_id = $1 LIMIT 1',
      [tenderId]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Failed to check if tender is limited:', error);
    return false;
  }
}

/**
 * Get list of invited vendors for a tender
 */
export async function getInvitedVendors(tenderId: string): Promise<string[]> {
  try {
    const { rows } = await pool.query(
      'SELECT vendor_org_id FROM limited_tender_vendors WHERE tender_id = $1',
      [tenderId]
    );
    return rows.map(row => row.vendor_org_id);
  } catch (error) {
    console.error('Failed to get invited vendors:', error);
    return [];
  }
}

/**
 * Add vendor to limited tender invitation list
 */
export async function inviteVendorToTender(tenderId: string, vendorOrgId: string): Promise<boolean> {
  try {
    const { rows } = await pool.query(
      `INSERT INTO limited_tender_vendors (tender_id, vendor_org_id, invitation_status)
       VALUES ($1, $2, 'sent')
       ON CONFLICT (tender_id, vendor_org_id) DO UPDATE SET invitation_status = 'sent'
       RETURNING vendor_org_id`,
      [tenderId, vendorOrgId]
    );
    
    return rows.length > 0;
  } catch (error) {
    console.error('Failed to invite vendor to tender:', error);
    return false;
  }
}

/**
 * Remove vendor from limited tender invitation list
 */
export async function removeVendorFromTender(tenderId: string, vendorOrgId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'DELETE FROM limited_tender_vendors WHERE tender_id = $1 AND vendor_org_id = $2',
      [tenderId, vendorOrgId]
    );
    
    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('Failed to remove vendor from tender:', error);
    return false;
  }
}