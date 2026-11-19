import {
  buildModuleDetectionMetadata,
  getProjectModuleDetectionConfig,
  getUserModuleDetectionConfig
} from './utils/moduleDetection';

describe('module detection persistence contract', () => {
  test('keeps legacy projects on the ADN-1 fallback when no snapshot exists', () => {
    expect(getProjectModuleDetectionConfig({ proyecto: 'legacy' })).toEqual({
      designPrefixes: ['D'],
      groupIdPosition: 'afterDesign'
    });
  });

  test('copies the current user default for a new project without sharing mutable state', () => {
    const userDefault = { designPrefixes: ['T', 'A'], groupIdPosition: 'beforeDesign' };
    const projectConfig = getUserModuleDetectionConfig({ moduleDetectionConfig: userDefault });

    expect(projectConfig).toEqual(userDefault);
    expect(projectConfig).not.toBe(userDefault);

    projectConfig.designPrefixes.push('D');
    expect(userDefault.designPrefixes).toEqual(['T', 'A']);
  });

  test('stores normalized configuration metadata without touching raw detail fields', () => {
    const metadata = buildModuleDetectionMetadata({
      designPrefixes: [' t ', 'T', 'a '],
      groupIdPosition: 'before'
    });

    expect(metadata).toEqual({
      moduleDetectionConfig: {
        designPrefixes: ['T', 'A'],
        groupIdPosition: 'beforeDesign'
      }
    });
    expect({ detalle: 'pieza T1-005' }).toEqual({ detalle: 'pieza T1-005' });
  });
});
