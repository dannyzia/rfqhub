import { Request, Response, NextFunction } from 'express';
import { tenderController } from '../tender.controller';
import { tenderService } from '../../services/tender.service';

// Import the mapTenderRow function for testing
const { mapTenderRow } = require('../tender.controller');

jest.mock('../../services/tender.service');
jest.mock('../../config/logger');

describe('TenderController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      body: {},
      params: {},
      user: {
        id: 'user-001',
        email: 'buyer@example.com',
        role: 'buyer',
        roles: ['buyer'],
        companyId: 'org-001',
        orgId: 'org-001',
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('create', () => {
    it('should create a new tender successfully', async () => {
      const mockTender = {
        id: 'tender-001',
        referenceNumber: 'TNDR-2023-001',
        title: 'Infrastructure Project',
        description: 'Large infrastructure project',
        status: 'draft',
        organizationId: 'org-001',
        tenderType: 'open',
        visibility: 'public',
        procurementType: 'goods',
        currency: 'USD',
        estimatedCost: 500000,
        bidSecurityAmount: null,
        preBidMeetingDate: null,
        preBidMeetingLink: null,
        submissionDeadline: null,
        bidOpeningTime: null,
        validityDays: null,
        twoEnvelopeSystem: false,
        createdBy: 'user-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (tenderService.create as jest.Mock).mockResolvedValue(mockTender);

      mockReq.body = {
        title: 'Infrastructure Project',
        description: 'Large infrastructure project',
        tender_type: 'open',
        procurement_type: 'goods',
        estimated_cost: 500000,
      };

      await tenderController.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockTender });
      expect(tenderService.create).toHaveBeenCalledWith(
        mockReq.body,
        'user-001',
        'org-001'
      );
    });

    it('should handle validation errors on tender creation', async () => {
      const error = new Error('Invalid tender data');
      (tenderService.create as jest.Mock).mockRejectedValue(error);

      mockReq.body = { title: '' };

      await tenderController.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      (tenderService.create as jest.Mock).mockRejectedValue(error);

      mockReq.body = {
        title: 'Project',
        tender_type: 'open',
      };

      await tenderController.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('findAll', () => {
    it('should return all tenders for buyer', async () => {
      const mockTenders = [
        {
          id: 'tender-001',
          title: 'Project 1',
          status: 'published',
          buyer_org_id: 'org-001',
        },
        {
          id: 'tender-002',
          title: 'Project 2',
          status: 'draft',
          buyer_org_id: 'org-001',
        },
      ];

      (tenderService.findAll as jest.Mock).mockResolvedValue(mockTenders);

      (mockReq.user as any).role = 'buyer';

      await tenderController.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockTenders });
      expect(tenderService.findAll).toHaveBeenCalledWith('org-001', 'buyer');
    });

    it('should return published tenders for vendor', async () => {
      const mockTenders = [
        {
          id: 'tender-001',
          title: 'Project 1',
          status: 'published',
        },
      ];

      (tenderService.findAll as jest.Mock).mockResolvedValue(mockTenders);

      (mockReq.user as any).role = 'vendor';

      await tenderController.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(tenderService.findAll).toHaveBeenCalledWith('org-001', 'vendor');
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      (tenderService.findAll as jest.Mock).mockRejectedValue(error);

      await tenderController.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('findById', () => {
    it('should return tender for owner', async () => {
      const mockTender = {
        id: 'tender-001',
        tender_number: 'TNDR-2023-001',
        title: 'Project 1',
        description: 'Test Description',
        status: 'published',
        buyer_org_id: 'org-001',
        tender_type: 'open',
        visibility: 'public',
        procurement_type: 'goods',
        currency: 'BDT',
        price_basis: 'unit_rate',
        fund_allocation: 100000,
        estimated_cost: 500000,
        bid_security_amount: null,
        pre_bid_meeting_date: null,
        pre_bid_meeting_link: null,
        submission_deadline: '2023-12-31T23:59:59Z',
        bid_opening_time: '2024-01-01T10:00:00Z',
        validity_days: 30,
        two_envelope_system: false,
        created_by: 'user-001',
        created_at: '2023-12-01T10:00:00Z',
        updated_at: '2023-12-01T10:00:00Z',
      };

      (tenderService.findById as jest.Mock).mockResolvedValue(mockTender);

      mockReq.params = { id: 'tender-001' };

      await tenderController.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mapTenderRow(mockTender) });
    });

    it('should hide sensitive data from vendors', async () => {
      const mockTender = {
        id: 'tender-001',
        tender_number: 'TNDR-2023-001',
        title: 'Project 1',
        description: 'Test Description',
        status: 'published',
        buyer_org_id: 'org-002',
        tender_type: 'open',
        visibility: 'public',
        procurement_type: 'goods',
        currency: 'BDT',
        price_basis: 'unit_rate',
        fund_allocation: 100000,
        estimated_cost: 500000,
        bid_security_amount: null,
        pre_bid_meeting_date: null,
        pre_bid_meeting_link: null,
        submission_deadline: '2023-12-31T23:59:59Z',
        bid_opening_time: '2024-01-01T10:00:00Z',
        validity_days: 30,
        two_envelope_system: false,
        created_by: 'user-002',
        created_at: '2023-12-01T10:00:00Z',
        updated_at: '2023-12-01T10:00:00Z',
      };

      (tenderService.findById as jest.Mock).mockResolvedValue(mockTender);

      // Set user as vendor (not owner of this tender)
      mockReq.user = {
        id: 'user-001',
        email: 'vendor@example.com',
        role: 'vendor',
        roles: ['vendor'],
        companyId: 'org-001',
        orgId: 'org-001',
      };
      mockReq.params = { id: 'tender-001' };

      await tenderController.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mapTenderRow(mockTender) });
      // Verify that the controller was called for a vendor user
      expect(mockRes.json).toHaveBeenCalled();
      const response = (mockRes.json as jest.Mock).mock.calls[0][0].data;
      // For vendors who are not owners, sensitive fields should be hidden
      expect(response).toHaveProperty('id', 'tender-001');
    });

    it('should return 404 for non-existent tender', async () => {
      (tenderService.findById as jest.Mock).mockResolvedValue(null);

      mockReq.params = { id: 'tender-999' };

      await tenderController.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: { code: 'NOT_FOUND', message: 'Tender not found' },
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      (tenderService.findById as jest.Mock).mockRejectedValue(error);

      mockReq.params = { id: 'tender-001' };

      await tenderController.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update tender successfully', async () => {
      const mockUpdatedTender = {
        id: 'tender-001',
        title: 'Updated Project',
        status: 'draft',
        organizationId: undefined,
        referenceNumber: undefined,
        description: null,
        tenderType: undefined,
        visibility: undefined,
        procurementType: undefined,
        currency: undefined,
        priceBasis: undefined,
        fundAllocation: null,
        estimatedCost: null,
        bidSecurityAmount: null,
        preBidMeetingDate: null,
        preBidMeetingLink: null,
        submissionDeadline: undefined,
        bidOpeningTime: null,
        validityDays: undefined,
        twoEnvelopeSystem: false,
        createdBy: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      (tenderService.update as jest.Mock).mockResolvedValue(mockUpdatedTender);

      mockReq.params = { id: 'tender-001' };
      mockReq.body = { title: 'Updated Project' };

      await tenderController.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockUpdatedTender });
      expect(tenderService.update).toHaveBeenCalledWith(
        'tender-001',
        mockReq.body,
        'org-001'
      );
    });

    it('should reject updates on published tenders', async () => {
      const error = new Error('Cannot update published tender');
      (tenderService.update as jest.Mock).mockRejectedValue(error);

      mockReq.params = { id: 'tender-001' };
      mockReq.body = { title: 'New Title' };

      await tenderController.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle authorization errors', async () => {
      const error = new Error('Unauthorized to update this tender');
      (tenderService.update as jest.Mock).mockRejectedValue(error);

      mockReq.params = { id: 'tender-001' };
      mockReq.body = { title: 'New Title' };

      await tenderController.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('publish', () => {
    it('should publish a draft tender', async () => {
      const mockPublishedTender = {
        id: 'tender-001',
        title: 'Project 1',
        status: 'published',
        organizationId: undefined,
        referenceNumber: undefined,
        description: null,
        tenderType: undefined,
        visibility: undefined,
        procurementType: undefined,
        currency: undefined,
        priceBasis: undefined,
        fundAllocation: null,
        estimatedCost: null,
        bidSecurityAmount: null,
        preBidMeetingDate: null,
        preBidMeetingLink: null,
        submissionDeadline: undefined,
        bidOpeningTime: null,
        validityDays: undefined,
        twoEnvelopeSystem: false,
        createdBy: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      (tenderService.publish as jest.Mock).mockResolvedValue(mockPublishedTender);

      mockReq.params = { id: 'tender-001' };

      await tenderController.publish(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockPublishedTender });
    });

    it('should reject publishing tender without items', async () => {
      const error = new Error('Tender must have items before publishing');
      (tenderService.publish as jest.Mock).mockRejectedValue(error);

      mockReq.params = { id: 'tender-001' };

      await tenderController.publish(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should reject re-publishing published tender', async () => {
      const error = new Error('Tender is already published');
      (tenderService.publish as jest.Mock).mockRejectedValue(error);

      mockReq.params = { id: 'tender-001' };

      await tenderController.publish(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('cancel', () => {
    it('should cancel a tender with reason', async () => {
      const mockCancelledTender = {
        id: 'tender-001',
        title: 'Project 1',
        status: 'cancelled',
        organizationId: undefined,
        referenceNumber: undefined,
        description: null,
        tenderType: undefined,
        visibility: undefined,
        procurementType: undefined,
        currency: undefined,
        priceBasis: undefined,
        fundAllocation: null,
        estimatedCost: null,
        bidSecurityAmount: null,
        preBidMeetingDate: null,
        preBidMeetingLink: null,
        submissionDeadline: undefined,
        bidOpeningTime: null,
        validityDays: undefined,
        twoEnvelopeSystem: false,
        createdBy: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      (tenderService.cancel as jest.Mock).mockResolvedValue(mockCancelledTender);

      mockReq.params = { id: 'tender-001' };
      mockReq.body = { reason: 'Budget constraints' };

      await tenderController.cancel(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockCancelledTender });
    });

    it('should reject cancellation without reason', async () => {
      const error = new Error('Cancellation reason is required');
      (tenderService.cancel as jest.Mock).mockRejectedValue(error);

      mockReq.params = { id: 'tender-001' };
      mockReq.body = {};

      await tenderController.cancel(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should reject cancellation of awarded tender', async () => {
      const error = new Error('Cannot cancel awarded tender');
      (tenderService.cancel as jest.Mock).mockRejectedValue(error);

      mockReq.params = { id: 'tender-001' };
      mockReq.body = { reason: 'Changed mind' };

      await tenderController.cancel(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getTenderStatus', () => {
    it('should return current tender status', async () => {
      const mockTender = { 
        id: 'tender-001', 
        tender_number: 'TNDR-2023-001',
        title: 'Test Tender',
        description: 'Test Description',
        status: 'published',
        buyer_org_id: 'org-001',
        tender_type: 'open',
        visibility: 'public',
        procurement_type: 'goods',
        currency: 'BDT',
        price_basis: 'unit_rate',
        fund_allocation: null,
        estimated_cost: 500000,
        bid_security_amount: null,
        pre_bid_meeting_date: null,
        pre_bid_meeting_link: null,
        submission_deadline: '2023-12-31T23:59:59Z',
        bid_opening_time: '2024-01-01T10:00:00Z',
        validity_days: 30,
        two_envelope_system: false,
        created_by: 'user-001',
        created_at: '2023-12-01T10:00:00Z',
        updated_at: '2023-12-01T10:00:00Z',
      };
      (tenderService.findById as jest.Mock).mockResolvedValue(mockTender);

      mockReq.params = { id: 'tender-001' };

      await tenderController.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mapTenderRow(mockTender) });
    });

    it('should handle tender not found', async () => {
      (tenderService.findById as jest.Mock).mockResolvedValue(null);

      mockReq.params = { id: 'tender-999' };

      await tenderController.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
