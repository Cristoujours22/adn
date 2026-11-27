import {
  buildModuleDetectionMetadata,
  getProjectModuleDetectionConfig,
  getUserModuleDetectionConfig
} from './utils/moduleDetection';
import {
  buildVersionSnapshot,
  restoreVersionSnapshot
} from './ModeloDespiece';

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

  test('binds version restore to its saved parser and supports legacy snapshots', () => {
    const savedConfiguration = { designPrefixes: ['D'], groupIdPosition: 'beforeDesign' };
    const currentConfiguration = { designPrefixes: ['D'], groupIdPosition: 'afterDesign' };
    const rows = [
      { id: 'suffix-013-a', detalle: '1041-Lat_der-013-D1' },
      { id: 'suffix-013-b', detalle: '1059-Lat_der-013-D1' },
      { id: 'suffix-003', detalle: '1055-Lat_der-003-D1' }
    ];
    const data = {
      despieces: [{
        id: 'tab-1',
        filas: rows,
        superGroups: [{ id: 'sg-1', moduleKeys: ['D1-013', 'D1-003'] }]
      }],
      servicios: []
    };

    const snapshot = buildVersionSnapshot(data, savedConfiguration);
    expect(snapshot.moduleDetectionConfig).toEqual(savedConfiguration);

    const restored = restoreVersionSnapshot(snapshot, currentConfiguration);
    expect(restored.moduleDetectionConfig).toEqual(savedConfiguration);
    expect(restored.despieces[0].superGroups).toEqual(data.despieces[0].superGroups);

    const legacyRows = [
      { id: 'legacy-a', detalle: 'pieza D1-005' },
      { id: 'legacy-b', detalle: 'pieza D2-010' }
    ];
    const legacy = restoreVersionSnapshot({
      datos: [{
        id: 'legacy-tab',
        filas: legacyRows,
        superGroups: [{ id: 'legacy-group', moduleKeys: ['D1-005', 'D2-010'] }]
      }]
    }, currentConfiguration);
    expect(legacy.moduleDetectionConfig).toEqual(currentConfiguration);
    expect(legacy.despieces[0].superGroups).toEqual([{
      id: 'legacy-group',
      moduleKeys: ['D1-005', 'D2-010']
    }]);
  });
});
