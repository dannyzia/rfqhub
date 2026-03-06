import { simpleRfqService } from '../simpleRfq.service';
import { OrganizationType } from '../../types/organization.types';
import { getTenderTypeByCode } from '../tenderTypeSelector.service';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../config/logger');
jest.mock('../tenderTypeSelector.service');

describe('SimpleRfqService', () => {
  const { pool } = require('../../config/database');

  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockReset();
  });

  describe('createSimpleRfq', () => {
    it('should create simple RFQ with valid data', async () => {
      const rfqData = {
        rfqDetails: {
          tenderType: "PG1",
          estimatedValue: 500000,
          currency: "BDT",
          items: [],
        },
      };

      const mockTenderType = {
        code: "PG1",
        min_value_bdt: 0,
        max_value_bdt: 800000,
        procurement_type: "government",
      };

      (getTenderTypeByCode as jest.Mock).mockResolvedValue(mockTenderType);

      // Mock the sequence of queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ is_govt_type: true }] }) // tender type validation
        .mockResolvedValueOnce({ rows: [{ id: 'rfq-001', tender_number: 'RFQ-2023-001' }] }); // INSERT

      const result = await simpleRfqService.createSimpleRfq(
        rfqData,
        OrganizationType.Government,
        'user-001',
        'org-001',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('rfq-001');
      expect(getTenderTypeByCode).toHaveBeenCalledWith("PG1");
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should reject value below tender type minimum', async () => {
      const rfqData = {
        rfqDetails: {
          tenderType: "PG2",
          estimatedValue: 500000,
          currency: "BDT",
          items: [],
        },
      };

      const mockTenderType = {
        code: "PG2",
        min_value_bdt: 800000,
        max_value_bdt: 5000000,
        procurement_type: "government",
      };

      (getTenderTypeByCode as jest.Mock).mockResolvedValue(mockTenderType);

      pool.query.mockResolvedValue({ rows: [{ is_govt_type: true }] });

      await expect(
        simpleRfqService.createSimpleRfq(rfqData, OrganizationType.Government, 'user-001', 'org-001'),
      ).rejects.toThrow("below minimum");
    });

    it('should reject value exceeding tender type maximum', async () => {
      const rfqData = {
        rfqDetails: {
          tenderType: "PG1",
          estimatedValue: 1000000,
          currency: "BDT",
          items: [],
        },
      };

      const mockTenderType = {
        code: "PG1",
        min_value_bdt: 0,
        max_value_bdt: 800000,
        procurement_type: "government",
      };

      (getTenderTypeByCode as jest.Mock).mockResolvedValue(mockTenderType);

      pool.query.mockResolvedValue({ rows: [{ is_govt_type: true }] });

      await expect(
        simpleRfqService.createSimpleRfq(rfqData, OrganizationType.Government, 'user-001', 'org-001'),
      ).rejects.toThrow("exceeds maximum");
    });
  });

  describe('getSimpleRfqItems', () => {
    it('should return items for a simple RFQ', async () => {
      const mockItems = [
        { name: 'Item 1', quantity: 10, unitPrice: 1000 },
        { name: 'Item 2', quantity: 5, unitPrice: 500 },
      ];

      pool.query
        .mockResolvedValueOnce({
          rows: [{ buyer_org_id: 'org-001', created_by: 'user-001' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ extended_data: { rfqDetails: { items: mockItems } } }],
          rowCount: 1,
        });

      const result = await simpleRfqService.getSimpleRfqItems('rfq-001', 'user-001', 'org-001', ['buyer']);

      expect(result).toEqual(mockItems);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND tender_mode'),
        ['rfq-001'],
      );
    });

    it('should return null for non-existent RFQ', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await simpleRfqService.getSimpleRfqItems('rfq-999', 'user-001', 'org-001', ['buyer']);

      expect(result).toBeNull();
    });
  });

  describe('getSimpleRfqTenderType', () => {
    it('should return tender type info for simple RFQ', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ buyer_org_id: 'org-001', created_by: 'user-001' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              tender_type: 'PG2',
              estimated_value: '3000000',
              currency: 'BDT',
              organization_type: 'government',
            },
          ],
          rowCount: 1,
        });

      const result = await simpleRfqService.getSimpleRfqTenderType('rfq-001', 'user-001', 'org-001', ['buyer']);

      expect(result).toEqual({
        tenderType: 'PG2',
        estimatedValue: 3000000,
        currency: 'BDT',
        organizationType: 'government',
      });
    });

    it('should return null for non-existent RFQ', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await simpleRfqService.getSimpleRfqTenderType('rfq-999', 'user-001', 'org-001', ['buyer']);

      expect(result).toBeNull();
    });
  });
});
