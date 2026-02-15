// backend/src/services/__tests__/valueValidation.service.test.ts

import * as valueValidationService from '../valueValidation.service';

describe('Value Validation Service', () => {

  describe('validateTenderValue', () => {
    it('should validate correct PG1 value (under 8 Lac)', async () => {
      const result = await valueValidationService.validateTenderValue(500000, 'PG1');

      expect(result.valid).toBe(true);
      expect(result.message).toContain('valid for PG1');
    });

    it('should invalidate PG1 value over 8 Lac', async () => {
      const result = await valueValidationService.validateTenderValue(1000000, 'PG1');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('exceeds maximum');
      // suggestedType may be null or contain a suggestion
    });

    it('should validate PG2 value (8-50 Lac)', async () => {
      const result = await valueValidationService.validateTenderValue(3000000, 'PG2');

      expect(result.valid).toBe(true);
    });

    it('should invalidate PG2 value under 8 Lac', async () => {
      const result = await valueValidationService.validateTenderValue(500000, 'PG2');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('below minimum');
      // suggestedType may be null or contain a suggestion
    });

    it('should validate PG3 value (over 50 Lac)', async () => {
      const result = await valueValidationService.validateTenderValue(10000000, 'PG3');

      expect(result.valid).toBe(true);
    });

    it('should validate PW1 value (under 15 Lac)', async () => {
      const result = await valueValidationService.validateTenderValue(1200000, 'PW1');

      expect(result.valid).toBe(true);
    });

    it('should handle edge case - exact minimum value', async () => {
      const result = await valueValidationService.validateTenderValue(800000, 'PG2');
      expect(result.valid).toBe(true); // 8 Lac is minimum for PG2
    });

    it('should handle edge case - exact maximum value', async () => {
      const result = await valueValidationService.validateTenderValue(800000, 'PG1');
      expect(result.valid).toBe(true); // 8 Lac is maximum for PG1
    });
  });
});
