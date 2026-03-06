import { Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { StorageService } from '../services/storage.service';
import { OrganizationType } from '../types/organization.types';
import logger from '../config/logger';

/**
 * Validates organizationId format
 * Ensures organizationId is a valid positive integer string
 * @param organizationId - The organization ID to validate
 * @returns true if valid, false otherwise
 */
function isValidOrganizationId(organizationId: string | undefined): organizationId is string {
  if (!organizationId || typeof organizationId !== 'string') {
    return false;
  }
  // Validate that organizationId is a positive integer within PostgreSQL bigint range (max 19 digits)
  const integerRegex = /^[1-9]\d*$/;
  return integerRegex.test(organizationId) && organizationId.length <= 19;
}

interface AuthenticatedRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    roles: string[];
    organizationId?: string;
    organizationType?: OrganizationType;
    companyId?: string;
  };
  // Additional properties for middleware use
  body?: any;
  headers?: any;
  fileInfo?: any;
  subscription?: any;
}

/**
 * Middleware to check tender creation quota
 */
export const checkTenderQuota = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user;
    
    if (!user || !user.organizationId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
    }

    // Validate organizationId format before using in database queries
    if (!isValidOrganizationId(user.organizationId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
    }

    // Validate request body exists
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST_BODY',
          message: 'Request body is required',
        },
      });
    }

    // Validate is_simple_rfq field exists
    if (req.body.is_simple_rfq === undefined || req.body.is_simple_rfq === null) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TENDER_TYPE',
          message: 'Tender type field (is_simple_rfq) is required',
        },
      });
    }

    // Determine tender type from request body (now validated)
    const tenderType = req.body.is_simple_rfq ? 'simple_rfq' : 'detailed_tender';
    
    // Check and increment quota in a single atomic operation
    // This prevents race conditions by using row locking within a transaction
    const result = await SubscriptionService.checkAndIncrementQuota(user.organizationId, tenderType);
    
    if (!result.allowed) {
      return res.status(429).json({
        error: {
          code: 'QUOTA_EXCEEDED',
          message: 'Tender creation quota exceeded for this week',
        },
      });
    }
    
    next();
  } catch (error) {
    logger.error('Quota check failed', { error, userId: req.user?.id });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check quota',
      },
    });
  }
};

/**
 * Middleware to check storage quota for file uploads
 */
export const checkStorageQuota = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user;
    
    if (!user || !user.organizationId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
    }

    // Validate organizationId format before using in database queries
    if (!isValidOrganizationId(user.organizationId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
    }

    // Get file size from request headers or body
    const fileSize = req.headers['content-length'] ? 
      parseInt(req.headers['content-length']) : 
      req.body.file_size;

    if (!fileSize || fileSize <= 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE_SIZE',
          message: 'File size is required and must be greater than 0',
        },
      });
    }

    // Check storage quota
    const canUpload = await StorageService.canUploadFile(user.organizationId, fileSize);
    
    if (!canUpload) {
      return res.status(429).json({
        error: {
          code: 'STORAGE_QUOTA_EXCEEDED',
          message: 'Storage quota exceeded',
        },
      });
    }

    // Add file info to request for later use
    req.fileInfo = {
      organizationId: user.organizationId,
      uploadedBy: user.id,
      fileSize: fileSize
    };

    next();
  } catch (error) {
    logger.error('Storage quota check failed', { error, userId: req.user?.id });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check storage quota',
      },
    });
  }
};

/**
 * Middleware to check if organization has active subscription
 */
export const checkActiveSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user;
    
    if (!user || !user.organizationId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
    }

    // Validate organizationId format before using in database queries
    if (!isValidOrganizationId(user.organizationId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
    }

    const subscription = await SubscriptionService.getOrganizationSubscription(user.organizationId);
    
    if (!subscription) {
      return res.status(403).json({
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'Organization does not have an active subscription',
        },
      });
    }

    // Add subscription info to request
    req.subscription = subscription;

    next();
  } catch (error) {
    logger.error('Subscription check failed', { error, userId: req.user?.id });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check subscription',
      },
    });
  }
};

/**
 * Middleware to check if live tendering is enabled for organization
 */
export const checkLiveTenderingEnabled = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user;
    
    if (!user || !user.organizationId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
    }

    // Validate organizationId format before using in database queries
    if (!isValidOrganizationId(user.organizationId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
    }

    const subscription = await SubscriptionService.getOrganizationSubscription(user.organizationId);
    
    if (!subscription || !subscription.live_tendering_enabled) {
      return res.status(403).json({
        error: {
          code: 'LIVE_TENDERING_DISABLED',
          message: 'Live tendering is not enabled for this subscription',
        },
      });
    }

    next();
  } catch (error) {
    logger.error('Live tendering check failed', { error, userId: req.user?.id });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check live tendering availability',
      },
    });
  }
};

/**
 * Middleware to check if user has required role for workflow operations
 */
export const checkWorkflowRole = (requiredRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
      }

      const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Required roles: ${requiredRoles.join(', ')}`,
          },
        });
      }

      next();
    } catch (error) {
      logger.error('Workflow role check failed', { error, userId: req.user?.id });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check user permissions',
        },
      });
    }
  };
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      fileInfo?: {
        organizationId: string;
        uploadedBy: string;
        fileSize: number;
      };
      subscription?: any;
    }
  }
}
