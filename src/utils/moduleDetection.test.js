import {
  DEFAULT_MODULE_DETECTION_CONFIG,
  normalizeModuleDetectionConfig,
  parseModule
} from './moduleDetection';

describe('parseModule', () => {
  test('parses the legacy design-before-group format and returns a canonical key', () => {
    const detail = '1020-entrepaño-D1-005';

    expect(parseModule(detail)).toEqual({
      moduleKey: 'D1-005',
      designPrefix: 'D',
      designNumber: '1',
      groupId: '005',
      groupIdPosition: 'afterDesign'
    });
    expect(detail).toBe('1020-entrepaño-D1-005');
  });

  test('supports configured prefixes without changing the default configuration', () => {
    expect(parseModule('1020-entrepaño-T1-005', {
      designPrefixes: ['D', 'T', 'A']
    }).moduleKey).toBe('T1-005');
    expect(parseModule('1020-entrepaño-A1-005', {
      designPrefixes: ['D', 'T', 'A']
    }).moduleKey).toBe('A1-005');
    expect(parseModule('1020-entrepaño-T1-005')).toBeNull();
    expect(DEFAULT_MODULE_DETECTION_CONFIG.designPrefixes).toEqual(['D']);
  });

  test('supports group IDs before design tokens when configured', () => {
    const config = normalizeModuleDetectionConfig({
      designPrefixes: ['D', 'T', 'A'],
      groupIdPosition: 'beforeDesign'
    });

    expect(parseModule('1020-entrepaño-005-D1', config)).toEqual({
      moduleKey: 'D1-005',
      designPrefix: 'D',
      designNumber: '1',
      groupId: '005',
      groupIdPosition: 'beforeDesign'
    });
    expect(parseModule('1020-entrepaño-005-A1', config).moduleKey).toBe('A1-005');
    expect(parseModule('1020-entrepaño-D1-005', config)).toBeNull();
  });

  test('matches case-insensitively and tolerates punctuation or spacing around the separator', () => {
    expect(parseModule('Ref: d2 - 07.').moduleKey).toBe('D2-07');
    expect(parseModule('(07-T3);', {
      designPrefixes: ['T'],
      groupIdPosition: 'before'
    }).moduleKey).toBe('T3-07');
  });

  test('does not classify embedded identifiers or malformed separators', () => {
    const invalidDetails = [
      'AD1-005B',
      'D1-005_extra',
      'D1--005',
      'D1-0050piece',
      'module D1'
    ];

    invalidDetails.forEach((detail) => {
      expect(parseModule(detail)).toBeNull();
    });
  });
});
