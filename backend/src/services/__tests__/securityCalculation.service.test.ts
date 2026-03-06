// backend/src/services/__tests__/securityCalculation.service.test.ts
//
// The service calls tenderTypeSelector.service.getTenderTypeByCode(), which
// queries the real DB.  We mock pool.query here to supply canonical test data
// from the shared fixture so no real database is needed.

import * as securityService from '../securityCalculation.service';
import { buildTenderTypeQueryMock } from './__fixtures__/tenderTypeMocks';

// ── Mock pool BEFORE importing the service ───────────────────────────────────
jest.mock('../../config/database');

// ── Set up pool.query mock before each test ──────────────────────────────────
beforeEach(() => {
  const pool = require('../../config/database').default;
  pool.query.mockImplementation(buildTenderTypeQueryMock());
});

describe('Security Calculation Service', () => {

  describe('calculateSecurities', () => {
    it('should return zero securities for PG1 (no security required)', async () => {
      const result = await securityService.calculateSecurities('PG1', 500000, 'BDT');

      expect(result).toBeDefined();
      expect(result.bidSecurity.applicable).toBe(false);
      expect(result.bidSecurity.amount).toBe(null);
      expect(result.performanceSecurity.applicable).toBe(false);
      expect(result.performanceSecurity.amount).toBe(null);
    });

    it('should calculate 2% bid security for PG2', async () => {
      const result = await securityService.calculateSecurities('PG2', 5000000, 'BDT');

      expect(result.bidSecurity.applicable).toBe(true);
      expect(parseFloat(String(result.bidSecurity.percentage))).toBeCloseTo(2, 1);
      expect(result.bidSecurity.amount).toBe(100000); // 2% of 50 Lac
    });

    it('should calculate 2% bid security for PG3', async () => {
      const result = await securityService.calculateSecurities('PG3', 10000000, 'BDT');

      expect(result.bidSecurity.applicable).toBe(true);
      expect(parseFloat(String(result.bidSecurity.percentage))).toBeCloseTo(2, 1);
      expect(result.bidSecurity.amount).toBe(200000); // 2% of 1 Crore
    });

    it('should calculate performance security for PG2', async () => {
      const result = await securityService.calculateSecurities('PG2', 5000000, 'BDT');

      expect(result.performanceSecurity.applicable).toBe(true);
      expect(parseFloat(String(result.performanceSecurity.percentage))).toBeCloseTo(5, 1);
      expect(result.performanceSecurity.amount).toBe(250000); // 5% of 50 Lac
    });

    it('should return result with valid tenderTypeCode and tenderValue', async () => {
      const result = await securityService.calculateSecurities('PG1', 500000, 'BDT');

      expect(result.tenderTypeCode).toBe('PG1');
      expect(result.tenderValue).toBe(500000);
    });

    it('should handle different tender types correctly', async () => {
      const pg1Result = await securityService.calculateSecurities('PG1', 500000, 'BDT');
      const pg2Result = await securityService.calculateSecurities('PG2', 5000000, 'BDT');

      // PG1 should have no securities
      expect(pg1Result.bidSecurity.applicable).toBe(false);

      // PG2 should have securities
      expect(pg2Result.bidSecurity.applicable).toBe(true);
      expect(pg2Result.performanceSecurity.applicable).toBe(true);
    });

    it('should throw error for invalid tender type code', async () => {
      await expect(
        securityService.calculateSecurities('INVALID', 500000, 'BDT')
      ).rejects.toThrow();
    });
  });
});
