import { Response, NextFunction } from 'express';
import {
  checkTenderQuota,
  checkStorageQuota,
  checkActiveSubscription,
  checkLiveTenderingEnabled,
  checkWorkflowRole,
} from '../quota.middleware';
import { SubscriptionService } from '../../services/subscription.service';
import { StorageService } from '../../services/storage.service';

jest.mock('../../services/subscription.service');
jest.mock('../../services/storage.service');
jest.mock('../../config/logger');

describe('Quota Middleware', () => {
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      user: {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
        organizationType: 'government',
      },
      // is_simple_rfq is required by checkTenderQuota; default to false (detailed_tender)
      body: { is_simple_rfq: false },
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('checkTenderQuota', () => {
    it('should allow request when quota is available', async () => {
      (SubscriptionService.checkAndIncrementQuota as jest.Mock).mockResolvedValue({
        allowed: true,
        remainingQuota: 5,
      });

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject request when quota is exceeded', async () => {
      (SubscriptionService.checkAndIncrementQuota as jest.Mock).mockResolvedValue({
        allowed: false,
        remainingQuota: 0,
      });

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'QUOTA_EXCEEDED',
          message: 'Tender creation quota exceeded for this week',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when user is not authenticated', async () => {
      mockReq.user = undefined;

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when organizationId is missing', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
      };

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when organizationId is invalid format', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '0', // Invalid - must be positive integer
      };

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when organizationId is negative', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '-123', // Invalid - negative
      };

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when organizationId is not a string', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: 123, // Invalid - number instead of string
      };

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should determine tender type from request body', async () => {
      (SubscriptionService.checkAndIncrementQuota as jest.Mock).mockResolvedValue({
        allowed: true,
        remainingQuota: 5,
      });

      mockReq.body = { is_simple_rfq: true };

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(SubscriptionService.checkAndIncrementQuota).toHaveBeenCalledWith('123', 'simple_rfq');
    });

    it('should determine detailed_tender type when is_simple_rfq is false', async () => {
      (SubscriptionService.checkAndIncrementQuota as jest.Mock).mockResolvedValue({
        allowed: true,
        remainingQuota: 5,
      });

      mockReq.body = { is_simple_rfq: false };

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(SubscriptionService.checkAndIncrementQuota).toHaveBeenCalledWith('123', 'detailed_tender');
    });

    it('should handle service errors gracefully', async () => {
      (SubscriptionService.checkAndIncrementQuota as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check quota',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('checkStorageQuota', () => {
    it('should allow request when storage quota is available', async () => {
      (StorageService.canUploadFile as jest.Mock).mockResolvedValue(true);

      mockReq.headers = { 'content-length': '1048576' }; // 1MB
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkStorageQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.fileInfo).toEqual({
        organizationId: '123',
        uploadedBy: 'user-001',
        fileSize: 1048576,
      });
    });

    it('should allow request using file_size from body', async () => {
      (StorageService.canUploadFile as jest.Mock).mockResolvedValue(true);

      mockReq.body = { file_size: 1048576 };
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkStorageQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request when storage quota is exceeded', async () => {
      (StorageService.canUploadFile as jest.Mock).mockResolvedValue(false);

      mockReq.headers = { 'content-length': '1048576' };
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkStorageQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'STORAGE_QUOTA_EXCEEDED',
          message: 'Storage quota exceeded',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when user is not authenticated', async () => {
      mockReq.user = undefined;

      await checkStorageQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when organizationId is missing', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
      };

      await checkStorageQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when organizationId is invalid format', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '0', // Invalid
      };

      mockReq.headers = { 'content-length': '1048576' };

      await checkStorageQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when file size is missing', async () => {
      mockReq.headers = {};
      mockReq.body = {};
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkStorageQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_FILE_SIZE',
          message: 'File size is required and must be greater than 0',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when file size is zero', async () => {
      mockReq.headers = { 'content-length': '0' };
      mockReq.body = {};
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkStorageQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_FILE_SIZE',
          message: 'File size is required and must be greater than 0',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when file size is negative', async () => {
      mockReq.body = { file_size: -100 };
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkStorageQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_FILE_SIZE',
          message: 'File size is required and must be greater than 0',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      (StorageService.canUploadFile as jest.Mock).mockRejectedValue(new Error('Storage service unavailable'));

      mockReq.headers = { 'content-length': '1048576' };
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkStorageQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check storage quota',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('checkActiveSubscription', () => {
    it('should allow request when subscription is active', async () => {
      const mockSubscription = {
        id: 'sub-001',
        tier: 'platinum',
        isActive: true,
        liveTenderingEnabled: true,
      };

      (SubscriptionService.getOrganizationSubscription as jest.Mock).mockResolvedValue(mockSubscription);

      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkActiveSubscription(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.subscription).toEqual(mockSubscription);
    });

    it('should reject request when subscription is not found', async () => {
      (SubscriptionService.getOrganizationSubscription as jest.Mock).mockResolvedValue(null);

      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkActiveSubscription(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'Organization does not have an active subscription',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when user is not authenticated', async () => {
      mockReq.user = undefined;

      await checkActiveSubscription(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when organizationId is missing', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
      };

      await checkActiveSubscription(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when organizationId is invalid format', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '0', // Invalid
      };

      await checkActiveSubscription(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      (SubscriptionService.getOrganizationSubscription as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkActiveSubscription(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check subscription',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('checkLiveTenderingEnabled', () => {
    it('should allow request when live tendering is enabled', async () => {
      const mockSubscription = {
        id: 'sub-001',
        tier: 'platinum',
        // Middleware checks snake_case field from DB
        live_tendering_enabled: true,
      };

      (SubscriptionService.getOrganizationSubscription as jest.Mock).mockResolvedValue(mockSubscription);

      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkLiveTenderingEnabled(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request when live tendering is not enabled', async () => {
      const mockSubscription = {
        id: 'sub-001',
        tier: 'platinum',
        liveTenderingEnabled: false,
      };

      (SubscriptionService.getOrganizationSubscription as jest.Mock).mockResolvedValue(mockSubscription);

      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkLiveTenderingEnabled(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'LIVE_TENDERING_DISABLED',
          message: 'Live tendering is not enabled for this subscription',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when subscription does not have live tendering field', async () => {
      const mockSubscription = {
        id: 'sub-001',
        tier: 'platinum',
        // Missing live_tendering_enabled field
      };

      (SubscriptionService.getOrganizationSubscription as jest.Mock).mockResolvedValue(mockSubscription);

      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkLiveTenderingEnabled(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'LIVE_TENDERING_DISABLED',
          message: 'Live tendering is not enabled for this subscription',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when subscription is not found', async () => {
      (SubscriptionService.getOrganizationSubscription as jest.Mock).mockResolvedValue(null);

      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkLiveTenderingEnabled(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'LIVE_TENDERING_DISABLED',
          message: 'Live tendering is not enabled for this subscription',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when user is not authenticated', async () => {
      mockReq.user = undefined;

      await checkLiveTenderingEnabled(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when organizationId is missing', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: ' buyer',
        roles: ['buyer'],
      };

      await checkLiveTenderingEnabled(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated or missing organization',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when organizationId is invalid format', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '0', // Invalid
      };

      await checkLiveTenderingEnabled(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      (SubscriptionService.getOrganizationSubscription as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      await checkLiveTenderingEnabled(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check live tendering availability',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('checkWorkflowRole', () => {
    it('should allow request when user has required role', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer', 'admin'],
        organizationId: '123',
      };

      const middleware = checkWorkflowRole(['buyer', 'admin']);
      await middleware(mockReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow request when user has one of required roles', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '123',
      };

      const middleware = checkWorkflowRole(['buyer', 'admin', 'evaluator']);
      await middleware(mockReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject request when user does not have required role', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'vendor',
        roles: ['vendor'],
        organizationId: '123',
      };

      const middleware = checkWorkflowRole(['buyer', 'admin']);
      await middleware(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Required roles: buyer, admin',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when user has no roles', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'vendor',
        roles: [],
        organizationId: '123',
      };

      const middleware = checkWorkflowRole(['buyer', 'admin']);
      await middleware(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Required roles: buyer, admin',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when user is not authenticated', async () => {
      mockReq.user = undefined;

      const middleware = checkWorkflowRole(['buyer', 'admin']);
      await middleware(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      // Set roles to undefined to force a TypeError inside the middleware try block,
      // which triggers the catch handler returning 500.
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: undefined as any, // undefined.includes() will throw
        organizationId: '123',
      };

      const middleware = checkWorkflowRole(['buyer', 'admin']);
      await middleware(mockReq, mockRes as Response, mockNext);

      // The middleware should handle errors by returning 500
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check user permissions',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Security: Input Validation', () => {
    it('should prevent SQL injection through organizationId', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: "1' OR '1'='1", // SQL injection attempt
      };

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
      expect(SubscriptionService.checkAndIncrementQuota).not.toHaveBeenCalled();
    });

    it('should prevent NoSQL injection through organizationId', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: "1' UNION SELECT * FROM users--", // NoSQL injection attempt
      };

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
      expect(SubscriptionService.checkAndIncrementQuota).not.toHaveBeenCalled();
    });

    it('should prevent XSS through organizationId', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: "<script>alert('xss')</script>", // XSS attempt
      };

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
      expect(SubscriptionService.checkAndIncrementQuota).not.toHaveBeenCalled();
    });

    it('should validate organizationId before database queries', async () => {
      mockReq.user = {
        id: 'user-001',
        email: 'user@example.com',
        role: 'buyer',
        roles: ['buyer'],
        organizationId: '99999999999999999999999999999999', // Extremely large number
      };

      await checkTenderQuota(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization ID format. Organization ID must be a positive integer.',
        },
      });
      expect(SubscriptionService.checkAndIncrementQuota).not.toHaveBeenCalled();
    });
  });
});
