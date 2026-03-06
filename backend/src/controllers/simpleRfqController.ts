import { Request, Response } from 'express';
import { simpleRfqDataSchema } from '../schemas/tenderMode.schema';
import { simpleRfqDb } from '../services/simpleRfq.service';
import { OrganizationType } from '../types/organization.types';
import { AuthenticationError, AuthorizationError } from '../middleware/error.middleware';

// POST /tenders/simple-rfq
export async function createSimpleRfq(req: Request, res: Response) {
  try {
    // Ensure user is authenticated (middleware should have set req.user)
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const rfqData = simpleRfqDataSchema.parse(req.body);
    const userOrgType = req.user.organizationType as OrganizationType;
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.orgId;

    // Validate organization type is set
    if (!userOrgType) {
      res.status(400).json({ 
        error: { 
          code: 'ORG_TYPE_REQUIRED',
          message: 'User organization type is required' 
        }
      });
      return;
    }

    const tender = await simpleRfqDb.createSimpleRfq(
      rfqData, 
      userOrgType, 
      userId, 
      organizationId
    );
    res.status(201).json({ tender });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      res.status(error.statusCode || 401).json({ 
        error: { 
          code: error.code || 'AUTH_ERROR',
          message: error.message 
        }
      });
      return;
    }
    res.status(400).json({ 
      error: { 
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Invalid RFQ data' 
      }
    });
  }
}

// GET /tenders/simple-rfq/:id/response-form
export async function getSimpleRfqResponseForm(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.orgId;
    const userRoles = req.user.roles || [req.user.role];

    const items = await simpleRfqDb.getSimpleRfqItems(id, userId, organizationId, userRoles);
    if (!items) {
      res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND',
          message: 'Simple RFQ not found' 
        }
      });
      return;
    }
    res.json({ items });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      res.status(error.statusCode || 401).json({ 
        error: { 
          code: error.code || 'AUTH_ERROR',
          message: error.message 
        }
      });
      return;
    }
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch response form' 
      }
    });
  }
}

// GET /tenders/simple-rfq/:id/tender-type
export async function getSimpleRfqTenderType(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.orgId;
    const userRoles = req.user.roles || [req.user.role];

    const tenderTypeData = await simpleRfqDb.getSimpleRfqTenderType(id, userId, organizationId, userRoles);
    if (!tenderTypeData) {
      res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND',
          message: 'Simple RFQ not found' 
        }
      });
      return;
    }
    res.json(tenderTypeData);
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      res.status(error.statusCode || 401).json({ 
        error: { 
          code: error.code || 'AUTH_ERROR',
          message: error.message 
        }
      });
      return;
    }
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch tender type information' 
      }
    });
  }
}
