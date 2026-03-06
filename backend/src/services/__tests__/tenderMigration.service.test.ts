import { tenderMigrationService } from '../tenderMigration.service';
import { TenderMode } from '../../types/tender.types';

jest.mock('../../config/database');
jest.mock('../../config/redis');

describe('TenderMigrationService', () => {
  let mockPool: any;
  let mockRedis: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // tenderMigration uses named import: import { pool } from '../config/database'
    const dbModule = require('../../config/database');
    mockPool = dbModule.pool;
    mockPool.query = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });

    // tenderMigration uses named import: import { redisClient } from '../config/redis'
    const redisModule = require('../../config/redis');
    mockRedis = redisModule.redisClient;
    mockRedis.get = jest.fn().mockResolvedValue(null);
    mockRedis.setex = jest.fn().mockResolvedValue('OK');
    mockRedis.del = jest.fn().mockResolvedValue(1);
  });

  // ─────────────────────────────────────────────────────────
  // migrateTenderMode
  // ─────────────────────────────────────────────────────────
  describe('migrateTenderMode', () => {
    it('should return true on successful migration', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ migrate_tender_mode: true }],
        rowCount: 1,
      });

      const result = await tenderMigrationService.migrateTenderMode(
        'tender-001',
        TenderMode.LiveAuction,
        'user-001',
      );

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should return false when migration stored procedure returns false', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ migrate_tender_mode: false }],
        rowCount: 1,
      });

      const result = await tenderMigrationService.migrateTenderMode(
        'tender-002',
        TenderMode.DetailedRFT,
        'user-001',
      );

      expect(result).toBe(false);
    });

    it('should throw on database error', async () => {
      mockPool.query.mockRejectedValue(new Error('Migration failed'));

      await expect(
        tenderMigrationService.migrateTenderMode('tender-003', TenderMode.LiveAuction, 'user-001'),
      ).rejects.toThrow('Migration failed');
    });
  });

  // ─────────────────────────────────────────────────────────
  // getMigrationHistory
  // ─────────────────────────────────────────────────────────
  describe('getMigrationHistory', () => {
    it('should return mapped migration history for a tender', async () => {
      const dbRows = [
        {
          id: 'mig-001',
          from_mode: 'detailed_rft',
          to_mode: 'live_auction',
          migration_type: 'manual_switch',
          migrated_at: new Date('2024-01-15'),
          migrated_by: 'user-001',
          metadata: { reason: 'test' },
        },
      ];
      mockPool.query.mockResolvedValue({ rows: dbRows, rowCount: 1 });

      const result = await tenderMigrationService.getMigrationHistory('tender-001');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'mig-001',
          tenderId: 'tender-001',
          fromMode: 'detailed_rft',
          toMode: 'live_auction',
          migrationType: 'manual_switch',
        }),
      );
    });

    it('should return empty array when no history found', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await tenderMigrationService.getMigrationHistory('tender-999');

      expect(result).toEqual([]);
    });

    it('should throw on database error', async () => {
      mockPool.query.mockRejectedValue(new Error('DB error'));

      await expect(
        tenderMigrationService.getMigrationHistory('tender-001'),
      ).rejects.toThrow('DB error');
    });
  });

  // ─────────────────────────────────────────────────────────
  // getTenderModeStats
  // ─────────────────────────────────────────────────────────
  describe('getTenderModeStats', () => {
    it('should return stats from database when cache is empty', async () => {
      const mockStats = [
        {
          tenderMode: 'simple_rfq',
          apiVersion: 'v1',
          isGovtTender: false,
          totalCount: 10,
          publishedCount: 8,
          awardedCount: 5,
          liveTenderingCount: 0,
          avgDaysToAward: 14,
        },
      ];
      mockRedis.get.mockResolvedValue(null); // cache miss
      mockPool.query.mockResolvedValue({ rows: mockStats, rowCount: 1 });

      const result = await tenderMigrationService.getTenderModeStats();

      expect(result).toEqual(mockStats);
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should return cached stats when cache is warm', async () => {
      const cachedStats = [{ tenderMode: 'simple_rfq', totalCount: 10 }];
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedStats));

      const result = await tenderMigrationService.getTenderModeStats();

      expect(result).toEqual(cachedStats);
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────
  // backfillTenderModes
  // ─────────────────────────────────────────────────────────
  describe('backfillTenderModes', () => {
    it('should return count of updated tenders', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 't1' }, { id: 't2' }], rowCount: 2 });

      const result = await tenderMigrationService.backfillTenderModes();

      expect(result).toBe(2);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should return 0 when no tenders need backfill', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await tenderMigrationService.backfillTenderModes();

      expect(result).toBe(0);
    });

    it('should throw on database error', async () => {
      mockPool.query.mockRejectedValue(new Error('Backfill failed'));

      await expect(tenderMigrationService.backfillTenderModes()).rejects.toThrow('Backfill failed');
    });
  });

  // ─────────────────────────────────────────────────────────
  // validateModeTransition (synchronous)
  // ─────────────────────────────────────────────────────────
  describe('validateModeTransition', () => {
    it('should return true for same mode', () => {
      expect(tenderMigrationService.validateModeTransition('simple_rfq', 'simple_rfq')).toBe(true);
      expect(tenderMigrationService.validateModeTransition('detailed_rft', 'detailed_rft')).toBe(true);
    });

    it('should return true for valid transitions', () => {
      expect(tenderMigrationService.validateModeTransition('detailed_rft', 'live_auction')).toBe(true);
      expect(tenderMigrationService.validateModeTransition('simple_rfq', 'live_auction')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(tenderMigrationService.validateModeTransition('simple_rfq', 'detailed_rft')).toBe(false);
      expect(tenderMigrationService.validateModeTransition('detailed_rft', 'simple_rfq')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────
  // getCompatibleModes (synchronous)
  // ─────────────────────────────────────────────────────────
  describe('getCompatibleModes', () => {
    it('should return government-compatible modes', () => {
      const modes = tenderMigrationService.getCompatibleModes('government');
      expect(modes).toContain(TenderMode.DetailedRFT);
      expect(modes).toContain(TenderMode.LiveAuction);
    });

    it('should return non-government-compatible modes', () => {
      const modes = tenderMigrationService.getCompatibleModes('non-government');
      expect(modes).toContain(TenderMode.SimpleRFQ);
      expect(modes).toContain(TenderMode.LiveAuction);
    });
  });

  // ─────────────────────────────────────────────────────────
  // clearTenderCache
  // ─────────────────────────────────────────────────────────
  describe('clearTenderCache', () => {
    it('should delete all cache keys for a tender', async () => {
      await tenderMigrationService.clearTenderCache('tender-001');

      expect(mockRedis.del).toHaveBeenCalledTimes(3);
      expect(mockRedis.del).toHaveBeenCalledWith('tender:tender-001');
      expect(mockRedis.del).toHaveBeenCalledWith('tender_stats:tender-001');
      expect(mockRedis.del).toHaveBeenCalledWith('tender_mode_stats');
    });
  });

  // ─────────────────────────────────────────────────────────
  // clearStatsCache
  // ─────────────────────────────────────────────────────────
  describe('clearStatsCache', () => {
    it('should delete the stats cache key', async () => {
      await tenderMigrationService.clearStatsCache();

      expect(mockRedis.del).toHaveBeenCalledWith('tender_mode_stats');
    });
  });

  // ─────────────────────────────────────────────────────────
  // getTenderForV1API
  // ─────────────────────────────────────────────────────────
  describe('getTenderForV1API', () => {
    it('should return null for non-existent tender', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await tenderMigrationService.getTenderForV1API('tender-999');

      expect(result).toBeNull();
    });

    it('should return rfqDetails for simple RFQ tender', async () => {
      const tenderRow = {
        id: 'tender-001',
        title: 'Simple RFQ Tender',
        status: 'published',
        extended_data: { rfqDetails: { items: [] }, buyerInfo: { name: 'BGCB' } },
      };
      mockPool.query.mockResolvedValue({ rows: [tenderRow], rowCount: 1 });

      const result = await tenderMigrationService.getTenderForV1API('tender-001');

      expect(result).toBeDefined();
      expect(result.rfqDetails).toEqual({ items: [] });
      expect(result.buyerInfo).toEqual({ name: 'BGCB' });
    });

    it('should return detailed format for RFT tender', async () => {
      const tenderRow = {
        id: 'tender-002',
        title: 'Detailed RFT Tender',
        status: 'published',
        extended_data: {
          procuringEntity: { name: 'BGCB' },
          timeline: { phases: [] },
          lots: [],
        },
      };
      mockPool.query.mockResolvedValue({ rows: [tenderRow], rowCount: 1 });

      const result = await tenderMigrationService.getTenderForV1API('tender-002');

      expect(result).toBeDefined();
      expect(result.procuringEntity).toEqual({ name: 'BGCB' });
      expect(result.lots).toEqual([]);
    });

    it('should throw on database error', async () => {
      mockPool.query.mockRejectedValue(new Error('DB error'));

      await expect(
        tenderMigrationService.getTenderForV1API('tender-001'),
      ).rejects.toThrow('DB error');
    });
  });
});
