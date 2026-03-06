import { evaluationService } from '../evaluation.service';
import type { CreateEvaluationInput } from '../../schemas/evaluation.schema';

jest.mock('../../config/database');
jest.mock('../../config/logger');
jest.mock('uuid');
jest.mock('crypto');

import { v4 as uuidv4 } from 'uuid';

describe('EvaluationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('eval-uuid-1234');
  });

  describe('openTechnicalEnvelopes', () => {
    it('should open technical envelopes for tender', async () => {
      const mockDatabase = require('../../config/database');

      const tender = {
        id: 'tender-001',
        status: 'closed',
        buyer_org_id: 'org-001',
      };

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [tender] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await evaluationService.openTechnicalEnvelopes('tender-001', 'org-001', 'user-001');

      expect(mockDatabase.pool.query).toHaveBeenCalled();
    });

    it('should throw error if tender not found', async () => {
      const mockDatabase = require('../../config/database');
      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        evaluationService.openTechnicalEnvelopes('nonexistent', 'org-001', 'user-001')
      ).rejects.toThrow('Tender not found');
    });

    it('should throw error if not authorized (wrong buyer org)', async () => {
      const mockDatabase = require('../../config/database');

      const tender = {
        id: 'tender-001',
        status: 'closed',
        buyer_org_id: 'other-org',
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [tender] });

      await expect(
        evaluationService.openTechnicalEnvelopes('tender-001', 'org-001', 'user-001')
      ).rejects.toThrow('Not authorized');
    });

    it('should throw error if tender not in closed status', async () => {
      const mockDatabase = require('../../config/database');

      const tender = {
        id: 'tender-001',
        status: 'published',
        buyer_org_id: 'org-001',
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [tender] });

      await expect(
        evaluationService.openTechnicalEnvelopes('tender-001', 'org-001', 'user-001')
      ).rejects.toThrow('Tender must be closed to open bids');
    });

    it('should open specific bid envelopes when bidIds provided', async () => {
      const mockDatabase = require('../../config/database');

      const tender = {
        id: 'tender-001',
        status: 'closed',
        buyer_org_id: 'org-001',
      };

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [tender] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await evaluationService.openTechnicalEnvelopes('tender-001', 'org-001', 'user-001', ['bid-001', 'bid-002']);

      expect(mockDatabase.pool.query).toHaveBeenCalled();
    });
  });

  describe('unlockCommercialEnvelopes', () => {
    it('should unlock commercial envelopes for qualified bids', async () => {
      const mockDatabase = require('../../config/database');
      const crypto = require('crypto');

      const tender = {
        id: 'tender-001',
        status: 'tech_eval',
        buyer_org_id: 'org-001',
      };

      const evaluation = { is_technically_qualified: true };
      const bid = { digital_hash: 'abc123' };

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [tender] })
        .mockResolvedValueOnce({ rows: [evaluation] })
        .mockResolvedValueOnce({ rows: [bid] })
        .mockResolvedValueOnce({ rows: [] }) // bid details
        .mockResolvedValueOnce({ rows: [{ tender_id: 'tender-001', vendor_org_id: 'org-v', version: 1, total_amount: '1000' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      crypto.createHash = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('abc123'),
      });

      await evaluationService.unlockCommercialEnvelopes('tender-001', 'org-001', 'user-001', ['bid-001']);

      expect(mockDatabase.pool.query).toHaveBeenCalled();
    });

    it('should throw error if tender not found', async () => {
      const mockDatabase = require('../../config/database');
      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        evaluationService.unlockCommercialEnvelopes('nonexistent', 'org-001', 'user-001', ['bid-001'])
      ).rejects.toThrow('Tender not found');
    });

    it('should throw error if not authorized', async () => {
      const mockDatabase = require('../../config/database');

      const tender = {
        id: 'tender-001',
        status: 'tech_eval',
        buyer_org_id: 'other-org',
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [tender] });

      await expect(
        evaluationService.unlockCommercialEnvelopes('tender-001', 'org-001', 'user-001', ['bid-001'])
      ).rejects.toThrow('Not authorized');
    });

    it('should throw error if tender not in tech_eval status', async () => {
      const mockDatabase = require('../../config/database');

      const tender = {
        id: 'tender-001',
        status: 'published',
        buyer_org_id: 'org-001',
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [tender] });

      await expect(
        evaluationService.unlockCommercialEnvelopes('tender-001', 'org-001', 'user-001', ['bid-001'])
      ).rejects.toThrow('Tender must be in tech_eval to unlock commercial');
    });

    it('should throw error if bid not technically qualified', async () => {
      const mockDatabase = require('../../config/database');

      const tender = {
        id: 'tender-001',
        status: 'tech_eval',
        buyer_org_id: 'org-001',
      };

      const evaluation = { is_technically_qualified: false };

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [tender] })
        .mockResolvedValueOnce({ rows: [evaluation] });

      await expect(
        evaluationService.unlockCommercialEnvelopes('tender-001', 'org-001', 'user-001', ['bid-001'])
      ).rejects.toThrow('not technically qualified');
    });

    it('should detect bid tampering with integrity check failure', async () => {
      const mockDatabase = require('../../config/database');
      const crypto = require('crypto');

      const tender = {
        id: 'tender-001',
        status: 'tech_eval',
        buyer_org_id: 'org-001',
      };

      const evaluation = { is_technically_qualified: true };
      const bid = { digital_hash: 'stored-hash' };

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [tender] })
        .mockResolvedValueOnce({ rows: [evaluation] })
        .mockResolvedValueOnce({ rows: [bid] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ tender_id: 'tender-001', vendor_org_id: 'org-v', version: 1, total_amount: '1000' }] });

      crypto.createHash = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('different-hash'),
      });

      await expect(
        evaluationService.unlockCommercialEnvelopes('tender-001', 'org-001', 'user-001', ['bid-001'])
      ).rejects.toThrow('integrity check');
    });
  });

  describe('create', () => {
    it('should create evaluation for bid with technical score', async () => {
      const mockDatabase = require('../../config/database');

      const bid = {
        id: 'bid-001',
        tender_id: 'tender-001',
        status: 'submitted',
        buyer_org_id: 'org-001',
        tender_status: 'tech_eval',
      };

      const envelope = { is_open: true };
      const createdEval = {
        id: 'eval-uuid-1234',
        bid_id: 'bid-001',
        evaluator_id: 'user-001',
        technical_score: 85,
        is_technically_qualified: true,
      };

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [bid] })
        .mockResolvedValueOnce({ rows: [envelope] })
        .mockResolvedValueOnce({ rows: [createdEval] });

      const input: CreateEvaluationInput = {
        bidId: 'bid-001',
        technicalScore: 85,
        lineScores: [],
      };

      const result = await evaluationService.create(input, 'user-001', 'org-001');

      expect(result.bid_id).toBe('bid-001');
      expect(result.is_technically_qualified).toBe(true);
    });

    it('should mark bid as not qualified if score below threshold (70)', async () => {
      const mockDatabase = require('../../config/database');

      const bid = {
        id: 'bid-001',
        tender_id: 'tender-001',
        status: 'submitted',
        buyer_org_id: 'org-001',
        tender_status: 'tech_eval',
      };

      const envelope = { is_open: true };
      const createdEval = {
        id: 'eval-uuid-1234',
        bid_id: 'bid-001',
        evaluator_id: 'user-001',
        technical_score: 60,
        is_technically_qualified: false,
      };

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [bid] })
        .mockResolvedValueOnce({ rows: [envelope] })
        .mockResolvedValueOnce({ rows: [createdEval] });

      const input: CreateEvaluationInput = {
        bidId: 'bid-001',
        technicalScore: 60,
        lineScores: [],
      };

      const result = await evaluationService.create(input, 'user-001', 'org-001');

      expect(result.is_technically_qualified).toBe(false);
    });

    it('should throw error if bid not found', async () => {
      const mockDatabase = require('../../config/database');
      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [] });

      const input: CreateEvaluationInput = {
        bidId: 'nonexistent',
        technicalScore: 85,
        lineScores: [],
      };

      await expect(
        evaluationService.create(input, 'user-001', 'org-001')
      ).rejects.toThrow('Bid not found');
    });

    it('should throw error if not authorized', async () => {
      const mockDatabase = require('../../config/database');

      const bid = {
        id: 'bid-001',
        buyer_org_id: 'other-org',
        tender_status: 'tech_eval',
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [bid] });

      const input: CreateEvaluationInput = {
        bidId: 'bid-001',
        technicalScore: 85,
        lineScores: [],
      };

      await expect(
        evaluationService.create(input, 'user-001', 'org-001')
      ).rejects.toThrow('Not authorized');
    });

    it('should throw error if tender not in evaluation phase', async () => {
      const mockDatabase = require('../../config/database');

      const bid = {
        id: 'bid-001',
        buyer_org_id: 'org-001',
        tender_status: 'published',
      };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [bid] });

      const input: CreateEvaluationInput = {
        bidId: 'bid-001',
        technicalScore: 85,
        lineScores: [],
      };

      await expect(
        evaluationService.create(input, 'user-001', 'org-001')
      ).rejects.toThrow('not in evaluation phase');
    });

    it('should throw error if technical envelope not open', async () => {
      const mockDatabase = require('../../config/database');

      const bid = {
        id: 'bid-001',
        buyer_org_id: 'org-001',
        tender_status: 'tech_eval',
      };

      const envelope = { is_open: false };

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [bid] })
        .mockResolvedValueOnce({ rows: [envelope] });

      const input: CreateEvaluationInput = {
        bidId: 'bid-001',
        technicalScore: 85,
        lineScores: [],
      };

      await expect(
        evaluationService.create(input, 'user-001', 'org-001')
      ).rejects.toThrow('not open');
    });
  });

  describe('calculateCommercialScores', () => {
    it('should calculate commercial scores for qualified bids', async () => {
      const mockDatabase = require('../../config/database');

      const evaluations = [
        { bid_id: 'bid-001', technical_score: 85, is_technically_qualified: true },
        { bid_id: 'bid-002', technical_score: 75, is_technically_qualified: true },
      ];

      const bidItems = [
        { bid_id: 'bid-001', item_total_price: '10000' },
        { bid_id: 'bid-002', item_total_price: '12000' },
      ];

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: evaluations })
        .mockResolvedValueOnce({ rows: bidItems })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await evaluationService.calculateCommercialScores('tender-001');

      expect(mockDatabase.pool.query).toHaveBeenCalled();
    });

    it('should calculate overall scores using weights', async () => {
      const mockDatabase = require('../../config/database');

      const evaluations = [
        {
          id: 'eval-001',
          bid_id: 'bid-001',
          technical_score: 80,
          commercial_score: 75,
          is_technically_qualified: true,
        },
      ];

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: evaluations })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await evaluationService.calculateCommercialScores('tender-001');

      expect(mockDatabase.pool.query).toHaveBeenCalled();
    });
  });

  describe('getComparisonMatrix', () => {
    it('should return bid comparison matrix', async () => {
      const mockDatabase = require('../../config/database');

      const tender = { id: 'tender-001', buyer_org_id: 'org-001' };
      const matrix = {
        tenderItems: [{ id: 'item-001', specification: 'Feature 1' }],
        bids: [
          { bid_id: 'bid-001', vendor_name: 'Vendor A', scores: [] },
        ],
      };

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [tender] })
        .mockResolvedValueOnce({ rows: matrix.tenderItems })
        .mockResolvedValueOnce({ rows: matrix.bids })
        // one bid_items query per item×bid combination (1 item × 1 bid = 1 extra call)
        .mockResolvedValueOnce({ rows: [] });

      const result = await evaluationService.getComparisonMatrix('tender-001', 'org-001');

      expect(result).toEqual(expect.any(Object));
    });

    it('should throw error if not authorized', async () => {
      const mockDatabase = require('../../config/database');

      const tender = { id: 'tender-001', buyer_org_id: 'other-org' };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [tender] });

      await expect(
        evaluationService.getComparisonMatrix('tender-001', 'org-001')
      ).rejects.toThrow('Not authorized');
    });
  });

  describe('getRanking', () => {
    it('should return ranking of bids by overall score', async () => {
      const mockDatabase = require('../../config/database');

      const tender = { id: 'tender-001', buyer_org_id: 'org-001' };
      const ranking = [
        { rank: 1, bid_id: 'bid-001', vendor_name: 'Vendor A', overall_score: 85 },
        { rank: 2, bid_id: 'bid-002', vendor_name: 'Vendor B', overall_score: 78 },
      ];

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [tender] })
        .mockResolvedValueOnce({ rows: ranking });

      const result = await evaluationService.getRanking('tender-001', 'org-001');

      expect(result).toHaveLength(2);
      expect((result[0] as any).rank).toBe(1);
    });

    it('should throw error if not authorized', async () => {
      const mockDatabase = require('../../config/database');

      const tender = { id: 'tender-001', buyer_org_id: 'other-org' };

      mockDatabase.pool.query.mockResolvedValueOnce({ rows: [tender] });

      await expect(
        evaluationService.getRanking('tender-001', 'org-001')
      ).rejects.toThrow('Not authorized');
    });

    it('should return empty array if no qualified bids', async () => {
      const mockDatabase = require('../../config/database');

      const tender = { id: 'tender-001', buyer_org_id: 'org-001' };

      mockDatabase.pool.query
        .mockResolvedValueOnce({ rows: [tender] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await evaluationService.getRanking('tender-001', 'org-001');

      expect(result).toHaveLength(0);
    });
  });
});
