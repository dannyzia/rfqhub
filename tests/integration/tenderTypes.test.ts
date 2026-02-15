import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { pool } from '../../backend/src/config/database';
import { tenderTypeService } from '../../backend/src/services/tenderTypeSelector.service';
import { OrganizationType } from '../../backend/src/types/organization.types';

describe('Tender Type System Integration Tests', () => {
  beforeAll(async () => {
    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
  });

  describe('Organization Type Filtering', () => {
    it('should return only government tender types for government organizations', async () => {
      const types = await tenderTypeService.listTenderTypes('goods', OrganizationType.Government);
      
      expect(types).toBeDefined();
      expect(types.length).toBeGreaterThan(0);
      
      // All returned types should be government types
      types.forEach(type => {
        expect(type.is_govt_type).toBe(true);
      });
    });

    it('should return only non-government tender types for non-government organizations', async () => {
      const types = await tenderTypeService.listTenderTypes('goods', OrganizationType.NonGovernment);
      
      expect(types).toBeDefined();
      expect(types.length).toBeGreaterThan(0);
      
      // All returned types should be non-government types
      types.forEach(type => {
        expect(type.is_govt_type).toBe(false);
      });
    });

    it('should return all types when organization type is not specified', async () => {
      const types = await tenderTypeService.listTenderTypes('goods');
      
      expect(types).toBeDefined();
      expect(types.length).toBeGreaterThan(0);
      
      // Should contain both government and non-government types
      const hasGovtTypes = types.some(type => type.is_govt_type === true);
      const hasNonGovtTypes = types.some(type => type.is_govt_type === false);
      
      expect(hasGovtTypes).toBe(true);
      expect(hasNonGovtTypes).toBe(true);
    });
  });

  describe('Tender Type Suggestions', () => {
    it('should suggest appropriate NRQ1 type for low-value goods', async () => {
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'goods',
        estimatedValue: 500000, // ~$5k USD
        currency: 'BDT',
        organizationType: OrganizationType.NonGovernment
      });

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      const nrq1Suggestion = suggestions.find(s => s.code === 'NRQ1');
      expect(nrq1Suggestion).toBeDefined();
      expect(nrq1Suggestion?.confidence).toBeGreaterThan(80);
    });

    it('should suggest appropriate NRQ2 type for medium-value goods', async () => {
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'goods',
        estimatedValue: 25000000, // ~$25k USD
        currency: 'BDT',
        organizationType: OrganizationType.NonGovernment
      });

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      const nrq2Suggestion = suggestions.find(s => s.code === 'NRQ2');
      expect(nrq2Suggestion).toBeDefined();
      expect(nrq2Suggestion?.confidence).toBeGreaterThan(80);
    });

    it('should suggest appropriate NRQ3 type for high-value goods', async () => {
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'goods',
        estimatedValue: 100000000, // ~$100k USD
        currency: 'BDT',
        organizationType: OrganizationType.NonGovernment
      });

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      const nrq3Suggestion = suggestions.find(s => s.code === 'NRQ3');
      expect(nrq3Suggestion).toBeDefined();
      expect(nrq3Suggestion?.confidence).toBeGreaterThan(80);
    });

    it('should suggest government types for government organizations', async () => {
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'goods',
        estimatedValue: 50000000, // ~$50k USD
        currency: 'BDT',
        organizationType: OrganizationType.Government
      });

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should suggest government types like PG1, PG2, etc.
      const hasGovtSuggestion = suggestions.some(s => s.code.startsWith('PG'));
      expect(hasGovtSuggestion).toBe(true);
    });
  });

  describe('Value Range Validation', () => {
    it('should return value ranges for procurement types', async () => {
      const result = await tenderTypeService.getValueRangesForProcurementType(
        'goods',
        OrganizationType.NonGovernment
      );

      expect(result).toBeDefined();
      expect(result.procurementType).toBe('goods');
      expect(result.ranges).toBeDefined();
      expect(result.ranges.length).toBeGreaterThan(0);
      
      // Check that ranges are properly ordered
      for (let i = 1; i < result.ranges.length; i++) {
        expect(result.ranges[i].minValue).toBeGreaterThanOrEqual(
          result.ranges[i - 1].maxValue || 0
        );
      }
    });

    it('should include special cases for government procurement', async () => {
      const result = await tenderTypeService.getValueRangesForProcurementType(
        'goods',
        OrganizationType.Government
      );

      expect(result).toBeDefined();
      expect(result.specialCases).toBeDefined();
      expect(result.specialCases.international).toBeDefined();
      expect(result.specialCases.international.available).toBe(true);
    });
  });

  describe('Tender Type Validation', () => {
    it('should validate tender type definitions', async () => {
      const types = await tenderTypeService.listTenderTypes('goods', OrganizationType.NonGovernment);
      
      types.forEach(type => {
        expect(type.code).toBeDefined();
        expect(type.name).toBeDefined();
        expect(type.description).toBeDefined();
        expect(type.procurement_type).toBe('goods');
        expect(type.min_value_bdt).toBeDefined();
        expect(type.is_govt_type).toBe(false);
      });
    });

    it('should handle currency conversion for value validation', async () => {
      // Test with USD currency (assuming 100 BDT = 1 USD)
      const suggestions = await tenderTypeService.suggestTenderType({
        procurementType: 'goods',
        estimatedValue: 5000, // $5k USD = 500k BDT
        currency: 'USD',
        organizationType: OrganizationType.NonGovernment
      });

      expect(suggestions).toBeDefined();
      const nrq1Suggestion = suggestions.find(s => s.code === 'NRQ1');
      expect(nrq1Suggestion).toBeDefined();
    });
  });

  async function setupTestData() {
    // Ensure test data exists
    const testTypes = [
      { code: 'NRQ1', name: 'Test NRQ1', isGovt: false },
      { code: 'NRQ2', name: 'Test NRQ2', isGovt: false },
      { code: 'NRQ3', name: 'Test NRQ3', isGovt: false }
    ];

    for (const type of testTypes) {
      await pool.query(`
        INSERT INTO tender_type_definitions (
          code, name, description, procurement_type, min_value_bdt, max_value_bdt,
          requires_tender_security, tender_security_percent, requires_performance_security,
          performance_security_percent, requires_two_envelope, requires_newspaper_ad,
          requires_prequalification, min_submission_days, max_submission_days,
          default_validity_days, section_count, is_international, is_direct_procurement,
          is_govt_type, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (code) DO NOTHING
      `, [
        type.code, type.name, 'Test description', 'goods', 0, 1000000,
        false, null, false, null, false, false, false, 2, 7, 30, 3,
        false, false, type.isGovt, true
      ]);
    }
  }

  async function cleanupTestData() {
    // Clean up test data
    await pool.query(`
      DELETE FROM tender_type_definitions 
      WHERE code IN ('NRQ1', 'NRQ2', 'NRQ3') AND name LIKE 'Test %'
    `);
  }
});