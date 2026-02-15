import * as tenderTypeService from '../tenderTypeSelector.service';

describe('getValueRangesForProcurementType', () => {
  // Basic functionality
  test('should return value ranges for goods procurement', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    expect(result.procurementType).toBe('goods');
    expect(result.ranges.length).toBeGreaterThan(0);
    expect(result.ranges[0]).toHaveProperty('label');
    expect(result.ranges[0]).toHaveProperty('minValue');
    expect(result.ranges[0]).toHaveProperty('maxValue');
    expect(result.ranges[0]).toHaveProperty('suggestedTypes');
  });

  test('should return correct special cases for goods', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    expect(result.specialCases).toHaveProperty('international');
    expect(result.specialCases.international.available).toBe(true);
    expect(result.specialCases.international.type).toBe('PG4');
    expect(result.specialCases).toHaveProperty('turnkey');
    expect(result.specialCases.turnkey.type).toBe('PG5A');
    expect(result.specialCases).toHaveProperty('emergency');
    expect(result.specialCases.emergency.type).toBe('PG9A');
  });

  test('should return value ranges for works procurement', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('works');
    
    expect(result.procurementType).toBe('works');
    expect(result.ranges).toContainEqual(
      expect.objectContaining({ suggestedTypes: ['PW1'] })
    );
    expect(result.ranges).toContainEqual(
      expect.objectContaining({ suggestedTypes: ['PW3'] })
    );
  });

  test('should return correct special cases for services', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('services');
    
    expect(result.specialCases).toHaveProperty('outsourcingPersonnel');
    expect(result.specialCases.outsourcingPersonnel.type).toBe('PPS2');
    expect(result.specialCases).not.toHaveProperty('international');
    expect(result.specialCases).not.toHaveProperty('turnkey');
  });

  test('should not include special types in normal ranges', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    const allSuggestedTypes = result.ranges.flatMap(r => r.suggestedTypes);
    expect(allSuggestedTypes).not.toContain('PG4');
    expect(allSuggestedTypes).not.toContain('PG5A');
    expect(allSuggestedTypes).not.toContain('PG9A');
  });

  test('should return ranges sorted by minValue', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    for (let i = 1; i < result.ranges.length; i++) {
      expect(result.ranges[i].minValue).toBeGreaterThan(
        result.ranges[i - 1].minValue
      );
    }
  });

  test('should format human-readable labels', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    // Should contain Lac/Crore formatting
    expect(result.ranges.some(r => r.label.includes('Lac') || r.label.includes('Crore'))).toBe(true);
  });

  test('should include tender type code in label', async () => {
    const result = await tenderTypeService.getValueRangesForProcurementType('goods');
    
    result.ranges.forEach(range => {
      range.suggestedTypes.forEach(type => {
        expect(range.label).toContain(type);
      });
    });
  });
});

describe('suggestTenderType', () => {
  test('should suggest PG1 for goods under 8 Lac', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 500000,
      isInternational: false
    });

    expect(suggestions).toBeDefined();
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].code).toBe('PG1');
    expect(suggestions[0].confidence).toBe(100);
  });

  test('should suggest PG2 for goods between 8-50 Lac', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 3000000, // 30 Lac
      isInternational: false
    });

    expect(suggestions[0].code).toBe('PG2');
    expect(suggestions[0].confidence).toBe(100);
  });

  test('should suggest PG4 for international goods', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 3000000,
      isInternational: true
    });

    expect(suggestions).toBeDefined();
    expect(suggestions[0].code).toBe('PG4');
    expect(suggestions[0].confidence).toBe(100);
  });

  test('should suggest PG5A for turnkey contracts', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 3000000,
      isTurnkey: true
    });

    expect(suggestions[0].code).toBe('PG5A');
    expect(suggestions[0].confidence).toBe(100);
  });

  test('should suggest PG9A for emergency procurement', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 2000000,
      isInternational: false,
      isEmergency: true
    });

    const pg9a = suggestions.find(s => s.code === 'PG9A');
    expect(pg9a).toBeDefined();
  });

  test('should suggest PW1 for works under 15 Lac', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'works',
      estimatedValue: 1000000, // 10 Lac
      isInternational: false
    });

    expect(suggestions[0].code).toBe('PW1');
  });

  test('should suggest PPS2 for outsourcing personnel', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'services',
      estimatedValue: 1000000,
      isOutsourcingPersonnel: true
    });

    const pps2 = suggestions.find(s => s.code === 'PPS2');
    expect(pps2).toBeDefined();
  });

  test('should suggest PPS6 for emergency services', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'services',
      estimatedValue: 1000000,
      isEmergency: true
    });

    const pps6 = suggestions.find(s => s.code === 'PPS6');
    expect(pps6).toBeDefined();
  });

  test('should handle emergency priority over other flags', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 2000000,
      isInternational: true,
      isEmergency: true
    });

    expect(suggestions[0].code).toBe('PG9A'); // Emergency should override
  });

  test('should handle turnkey priority over value-based selection', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 3000000,
      isTurnkey: true
    });

    expect(suggestions[0].code).toBe('PG5A');
  });

  test('should return suggestions sorted by confidence', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 3000000
    });

    for (let i = 0; i < suggestions.length - 1; i++) {
      expect(suggestions[i].confidence).toBeGreaterThanOrEqual(suggestions[i + 1].confidence);
    }
  });
});

describe('listTenderTypes', () => {
  test('should return all tender types', async () => {
    const types = await tenderTypeService.listTenderTypes();
    expect(types.length).toBeGreaterThan(10); // Should have multiple types
  });

  test('should filter by procurement type - goods', async () => {
    const types = await tenderTypeService.listTenderTypes('goods');
    expect(types.every(t => t.procurement_type === 'goods')).toBe(true);
  });

  test('should filter by procurement type - works', async () => {
    const types = await tenderTypeService.listTenderTypes('works');
    expect(types.every(t => t.procurement_type === 'works')).toBe(true);
  });

  test('should filter by procurement type - services', async () => {
    const types = await tenderTypeService.listTenderTypes('services');
    expect(types.every(t => t.procurement_type === 'services')).toBe(true);
  });

  test('should return only active tender types', async () => {
    const types = await tenderTypeService.listTenderTypes();
    expect(types.every(t => t.is_active === true)).toBe(true);
  });
});

describe('getTenderTypeByCode', () => {
  test('should return PG1 details', async () => {
    const type = await tenderTypeService.getTenderTypeByCode('PG1');

    expect(type).toBeDefined();
    expect(type.code).toBe('PG1');
    expect(type.procurement_type).toBe('goods');
    expect(Number(type.max_value_bdt)).toBe(800000);
    expect(type.requires_tender_security).toBe(false);
  });

  test('should return PG2 details', async () => {
    const type = await tenderTypeService.getTenderTypeByCode('PG2');

    expect(Number(type.min_value_bdt)).toBe(800000);
    expect(Number(type.max_value_bdt)).toBe(5000000);
    expect(type.requires_tender_security).toBe(true);
    expect(parseFloat(String(type.tender_security_percent))).toBeCloseTo(2, 1);
  });

  test('should return PW1 details', async () => {
    const type = await tenderTypeService.getTenderTypeByCode('PW1');

    expect(type.code).toBe('PW1');
    expect(type.procurement_type).toBe('works');
    expect(Number(type.max_value_bdt)).toBe(1500000);
  });

  test('should return PPS2 details', async () => {
    const type = await tenderTypeService.getTenderTypeByCode('PPS2');

    expect(type.code).toBe('PPS2');
    expect(type.procurement_type).toBe('services');
  });

  test('should throw error for invalid code', async () => {
    await expect(
      tenderTypeService.getTenderTypeByCode('INVALID')
    ).rejects.toThrow('Tender type not found');
  });

  test('should throw error with proper status code', async () => {
    try {
      await tenderTypeService.getTenderTypeByCode('INVALID');
    } catch (error: any) {
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('TENDER_TYPE_NOT_FOUND');
    }
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle works with emergency flag', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'works',
      estimatedValue: 1000000,
      isEmergency: true
    });

    // Works doesn't have specific emergency type, should fall back to normal logic
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('should handle single source procurement', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 2000000,
      isSingleSource: true
    });

    const pg9a = suggestions.find(s => s.code === 'PG9A');
    expect(pg9a).toBeDefined();
  });

  test('should handle multiple special flags with correct priority', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 2000000,
      isInternational: true,
      isTurnkey: true,
      isEmergency: false
    });

    // Turnkey should take priority over international in this implementation
    expect(suggestions[0].code).toBe('PG5A');
  });

  test('should handle boundary values correctly', async () => {
    // Test exactly 8 Lac (boundary between PG1 and PG2)
    const suggestions1 = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 800000
    });
    expect(suggestions1[0].code).toBe('PG1');

    // Test just above 8 Lac
    const suggestions2 = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 800001
    });
    expect(suggestions2[0].code).toBe('PG2');
  });

  test('should handle very high values', async () => {
    const suggestions = await tenderTypeService.suggestTenderType({
      procurementType: 'goods',
      estimatedValue: 100000000 // 10 Crore
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].code).toMatch(/^PG[0-9A]+$/);
  });
});
