import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { StorageService } from '../services/storage.service';

export const subscriptionController = {
  
  // Get all available subscription packages
  async getAvailablePackages(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const packages = await SubscriptionService.getAvailablePackages();
      
      res.status(200).json({
        data: packages,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get organization subscription details
  async getOrganizationSubscription(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;
      
      const subscription = await SubscriptionService.getOrganizationSubscription(organizationId);
      
      if (!subscription) {
        // Return 200 with null data (not 404) — tests expect a 2xx when querying current subscription
        // even when no subscription has been set up yet for the organization.
        return res.status(200).json({ data: null });
      }
      
      res.status(200).json({
        data: subscription,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create or update organization subscription
  async createOrUpdateSubscription(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;
      const { packageId, customStorageBytes, expiresAt } = req.body;
      
      if (!packageId) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Package ID is required',
          },
        });
      }
      
      const subscription = await SubscriptionService.createOrUpdateSubscription(
        organizationId,
        packageId,
        customStorageBytes,
        expiresAt ? new Date(expiresAt) : undefined
      );
      
      res.status(201).json({
        message: 'Subscription created/updated successfully',
        data: subscription,
      });
    } catch (error) {
      next(error);
    }
  },

  // Cancel organization subscription
  async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;
      
      await SubscriptionService.cancelSubscription(organizationId);
      
      res.status(200).json({
        message: 'Subscription cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get storage usage
  async getStorageUsage(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;
      
      const storageUsage = await StorageService.getStorageUsage(organizationId);
      
      res.status(200).json({
        data: storageUsage,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get organization files
  async getOrganizationFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;
      const { tenderId, limit = 50, offset = 0 } = req.query;
      
      const files = await StorageService.getOrganizationFiles(
        organizationId,
        tenderId as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.status(200).json({
        data: files,
      });
    } catch (error) {
      next(error);
    }
  },

  // Upload file
  async uploadFile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const fileInfo = req.fileInfo;
      const { originalName, storedKey, mimeType, uploadPath, tenderId } = req.body;
      
      if (!fileInfo || !originalName || !storedKey) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required file information',
          },
        });
      }
      
      const fileUpload = await StorageService.recordFileUpload(
        fileInfo.organizationId,
        tenderId || null,
        fileInfo.uploadedBy,
        originalName,
        storedKey,
        mimeType || null,
        fileInfo.fileSize,
        uploadPath || null
      );
      
      res.status(201).json({
        message: 'File uploaded successfully',
        data: fileUpload,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete file
  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;
      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'File ID is required',
          },
        });
      }
      
      await StorageService.deleteFileUpload(fileId, organizationId);
      
      res.status(200).json({
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get file details
  async getFile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;
      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'File ID is required',
          },
        });
      }
      
      const file = await StorageService.getFileUpload(fileId, organizationId);
      
      if (!file) {
        return res.status(404).json({
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'File not found',
          },
        });
      }
      
      res.status(200).json({
        data: file,
      });
    } catch (error) {
      next(error);
    }
  },

  // Recalculate storage usage
  async recalculateStorageUsage(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;
      
      await StorageService.recalculateStorageUsage(organizationId);
      
      res.status(200).json({
        message: 'Storage usage recalculated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Check tender quota
  async checkTenderQuota(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = req.user as any;
      const organizationId = user.organizationId;
      const { tenderType } = req.query;
      
      if (!tenderType || !['simple_rfq', 'detailed_tender'].includes(tenderType as string)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Valid tender type is required (simple_rfq or detailed_tender)',
          },
        });
      }
      
      const canCreate = await SubscriptionService.checkTenderQuota(
        organizationId,
        tenderType as 'simple_rfq' | 'detailed_tender'
      );
      
      res.status(200).json({
        data: {
          canCreate,
          tenderType,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
