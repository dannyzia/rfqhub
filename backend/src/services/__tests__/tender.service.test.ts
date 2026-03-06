import { tenderService } from '../tender.service';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../config/logger');

describe('TenderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTender', () => {
    it('should create a valid draft tender', async () => {
      const mockDatabase = require('../../config/database');
      
      // Mock pool.query to return appropriate values for each call
      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // generateTenderNumber
        .mockResolvedValueOnce({ rows: [{ code: 'PG1', requires_tender_security: false, tender_security_percent: 0, min_submission_days: 7, default_validity_days: 30, requires_two_envelope: false }] }) // tender type
        .mockResolvedValueOnce({ rows: [{ id: 'tender-001', title: 'Test Tender' }] }); // Created tender

      const tenderData = {
        title: 'Test Tender',
        description: 'Test Description',
        organizationId: 'org-001',
        tenderType: 'PG1',
        estimatedCost: 500000,
        visibility: 'open' as 'open' | 'limited',
        procurementType: 'goods' as 'goods' | 'works' | 'services',
        currency: 'BDT',
        priceBasis: 'unit_rate' as 'unit_rate' | 'lump_sum',
        submissionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'user-001',
      };

      const result = await tenderService.create(tenderData, 'user-001', 'org-001');

      expect(result).toHaveProperty('id');
      expect(result.title).toBe(tenderData.title);
    });

    it('should reject tender with invalid organization type', async () => {
      const mockDatabase = require('../../config/database');
      
      // Mock pool.query to return invalid tender type
      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // generateTenderNumber
        .mockResolvedValueOnce({ rows: [] }); // Invalid tender type

      const tenderData = {
        title: 'Test Tender',
        description: 'Test Description',
        organizationId: 'org-001',
        tenderType: 'INVALID_TYPE',
        estimatedCost: 500000,
        visibility: 'open' as 'open' | 'limited',
        procurementType: 'goods' as 'goods' | 'works' | 'services',
        currency: 'BDT',
        priceBasis: 'unit_rate' as 'unit_rate' | 'lump_sum',
        submissionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'user-001',
      };

      await expect(tenderService.create(tenderData, 'user-001', 'org-001')).rejects.toThrow();
    });
  });

  describe('findAllTenders', () => {
    it('should return tenders for buyer with their own tenders', async () => {
      const mockDatabase = require('../../config/database');
      
      // Mock the data query
      mockDatabase.pool.query.mockResolvedValueOnce({ 
        rows: [
          { id: 'tender-001', title: 'Tender 1', buyer_org_id: 'org-001' },
          { id: 'tender-002', title: 'Tender 2', buyer_org_id: 'org-001' }
        ]
      });
      
      // Mock the count query
      mockDatabase.pool.query.mockResolvedValueOnce({ 
        rows: [{ total: '2' }]
      });

      const result = await tenderService.findAll('org-001', 'buyer');

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].buyer_org_id).toBe('org-001');
      expect(result.total).toBe(2);
    });

    it('should return published tenders for vendor', async () => {
      const mockDatabase = require('../../config/database');
      
      // Mock the data query
      mockDatabase.pool.query.mockResolvedValueOnce({ 
        rows: [
          { id: 'tender-001', title: 'Published Tender 1', status: 'published' },
          { id: 'tender-002', title: 'Published Tender 2', status: 'published' }
        ]
      });
      
      // Mock the count query
      mockDatabase.pool.query.mockResolvedValueOnce({ 
        rows: [{ total: '2' }]
      });

      const result = await tenderService.findAll('org-002', 'vendor');

      expect(result.rows).toHaveLength(2);
      expect(result.rows.every((t: any) => t.status === 'published')).toBe(true);
      expect(result.total).toBe(2);
    });

    it('should return all tenders for admin', async () => {
      const mockDatabase = require('../../config/database');
      
      // Mock the data query
      mockDatabase.pool.query.mockResolvedValueOnce({ 
        rows: [
          { id: 'tender-001', title: 'Tender 1', status: 'draft' },
          { id: 'tender-002', title: 'Tender 2', status: 'published' },
          { id: 'tender-003', title: 'Tender 3', status: 'closed' }
        ]
      });
      
      // Mock the count query
      mockDatabase.pool.query.mockResolvedValueOnce({ 
        rows: [{ total: '3' }]
      });

      const result = await tenderService.findAll('user-001', 'admin');

      expect(result.rows).toHaveLength(3);
      expect(result.total).toBe(3);
    });
  });

  describe('findTenderById', () => {
    it('should return tender for valid ID', async () => {
      const mockDatabase = require('../../config/database');
      
      mockDatabase.pool.query.mockResolvedValueOnce({ 
        rows: [{
          id: 'tender-001',
          title: 'Test Tender',
          description: 'Test Description',
          status: 'published'
        }]
      });

      const result = await tenderService.findById('tender-001');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('tender-001');
      expect(result!.title).toBe('Test Tender');
    });

    it('should return null for non-existent tender', async () => {
      const mockDatabase = require('../../config/database');
      
      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await tenderService.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateTender', () => {
    it('should update draft tender', async () => {
      const mockDatabase = require('../../config/database');
      
      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'tender-001', status: 'draft', buyer_org_id: 'org-001' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'tender-001', title: 'Updated Tender' }] });

      const updateData = {
        title: 'Updated Tender',
        description: 'Updated Description',
      };

      const result = await tenderService.update('tender-001', updateData, 'org-001');

      expect(result.title).toBe('Updated Tender');
    });

    it('should reject update on published tender', async () => {
      const mockDatabase = require('../../config/database');
      
      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [{ id: 'tender-001', status: 'published', buyer_org_id: 'org-001' }] });

      const updateData = {
        title: 'Updated Tender',
      };

      await expect(tenderService.update('tender-001', updateData, 'org-001')).rejects.toThrow();
    });
  });

  describe('publishTender', () => {
    it('should publish draft tender', async () => {
      const mockDatabase = require('../../config/database');
      
      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'tender-001', status: 'draft', buyer_org_id: 'org-001' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'tender-001', status: 'published' }] });

      const result = await tenderService.publish('tender-001', 'org-001');

      expect(result.status).toBe('published');
    });
  });

  describe('cancelTender', () => {
    it('should cancel published tender', async () => {
      const mockDatabase = require('../../config/database');
      
      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'tender-001', status: 'published', buyer_org_id: 'org-001' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'tender-001', status: 'cancelled' }] });

      const result = await tenderService.cancel('tender-001', 'org-001');

      expect(result.status).toBe('cancelled');
    });

    it('should reject cancel awarded tender', async () => {
      const mockDatabase = require('../../config/database');
      
      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [{ id: 'tender-001', status: 'awarded', buyer_org_id: 'org-001' }] });

      await expect(tenderService.cancel('tender-001', 'org-001')).rejects.toThrow();
    });
  });
});
