import {
  applySuperGroupPreview,
  createSuperGroupPreview,
  getRowsForSuperGroup,
  reconcileSuperGroups,
  resolveSelectedModules,
  ungroupSuperGroup,
  validateSuperGroups
} from './superGrouping';

const configuration = { designPrefixes: ['D'], groupIdPosition: 'afterDesign' };

const makeRows = () => [
  { id: 'r1', detalle: 'pieza D1-005', cant: '1' },
  { id: 'r2', detalle: 'sin módulo', cant: '2' },
  { id: 'r3', detalle: 'pieza D2-010', cant: '3' },
  { id: 'r4', detalle: 'otra fila', cant: '4' },
  { id: 'r5', detalle: 'pieza D1-005', cant: '5' },
  { id: 'r6', detalle: 'pieza D3-020', cant: '6' },
  { id: 'r7', detalle: 'última fila', cant: '7' }
];

describe('super-group module resolution and previews', () => {
  test('expands one selected row to its complete distinct module', () => {
    const modules = resolveSelectedModules(makeRows(), ['r5'], configuration);

    expect(modules).toHaveLength(1);
    expect(modules[0]).toMatchObject({
      moduleKey: 'D1-005',
      label: 'D1-005',
      pieceCount: 2,
      rowIds: ['r1', 'r5'],
      sourcePositions: [0, 4]
    });
    expect(modules[0].rows.map((row) => row.id)).toEqual(['r1', 'r5']);
  });

  test('builds a deterministic preview with identity and source metadata', () => {
    const preview = createSuperGroupPreview(
      makeRows(),
      ['r6', 'r3', 'r1'],
      configuration,
      { groupId: 'sg-1', label: 'Cocina' }
    );

    expect(preview).toMatchObject({
      groupId: 'sg-1',
      label: 'Cocina',
      selectedModuleKeys: ['D1-005', 'D2-010', 'D3-020'],
      firstSelectedPosition: 0,
      canApply: true
    });
    expect(preview.modules).toEqual([
      expect.objectContaining({
        moduleKey: 'D1-005', label: 'D1-005', pieceCount: 2, sourcePositions: [0, 4]
      }),
      expect.objectContaining({
        moduleKey: 'D2-010', label: 'D2-010', pieceCount: 1, sourcePositions: [2]
      }),
      expect.objectContaining({
        moduleKey: 'D3-020', label: 'D3-020', pieceCount: 1, sourcePositions: [5]
      })
    ]);
    expect(preview.sourceFingerprint).toEqual(expect.any(String));
    expect(preview.configuration).toEqual(configuration);
  });

  test('reports a one-module preview but cannot apply it as a group', () => {
    const preview = createSuperGroupPreview(makeRows(), ['r1'], configuration, { groupId: 'sg-1' });

    expect(preview.selectedModuleKeys).toEqual(['D1-005']);
    expect(preview.canApply).toBe(false);
    expect(preview.validationErrors).toContain('A super-group requires at least two modules.');
    expect(() => applySuperGroupPreview(makeRows(), preview, { configuration })).toThrow(/at least two modules/i);
  });
});

describe('super-group application', () => {
  test('moves complete selected modules contiguously without changing row objects or details', () => {
    const rows = makeRows();
    const detailsBefore = rows.map((row) => row.detalle);
    const preview = createSuperGroupPreview(rows, ['r3', 'r1'], configuration, { groupId: 'sg-1' });

    const result = applySuperGroupPreview(rows, preview, { configuration });

    expect(result.rows.map((row) => row.id)).toEqual(['r1', 'r5', 'r3', 'r2', 'r4', 'r6', 'r7']);
    expect(result.rows[0]).toBe(rows[0]);
    expect(result.rows[1]).toBe(rows[4]);
    expect(result.rows.map((row) => row.detalle)).toEqual([
      'pieza D1-005', 'pieza D1-005', 'pieza D2-010', 'sin módulo', 'otra fila', 'pieza D3-020', 'última fila'
    ]);
    expect(rows.map((row) => row.detalle)).toEqual(detailsBefore);
    expect(result.superGroups).toEqual([{ id: 'sg-1', label: 'D1-005 + D2-010', moduleKeys: ['D1-005', 'D2-010'] }]);
  });

  test('rejects a stale preview before producing any result', () => {
    const rows = makeRows();
    const preview = createSuperGroupPreview(rows, ['r1', 'r3'], configuration, { groupId: 'sg-1' });
    const changedRows = rows.map((row) => row.id === 'r3' ? { ...row, detalle: 'pieza D9-099' } : row);

    expect(() => applySuperGroupPreview(changedRows, preview, { configuration })).toThrow(/stale/i);
    expect(changedRows.map((row) => row.id)).toEqual(rows.map((row) => row.id));
  });

  test('rejects duplicate membership and nested group input', () => {
    const rows = makeRows();
    const existingGroups = [{ id: 'sg-1', moduleKeys: ['D1-005', 'D3-020'] }];
    const preview = createSuperGroupPreview(rows, ['r1', 'r3'], configuration, {
      groupId: 'sg-2',
      existingSuperGroups: existingGroups
    });

    expect(() => applySuperGroupPreview(rows, preview, {
      configuration,
      existingSuperGroups: existingGroups
    })).toThrow(/already belongs/i);
    expect(validateSuperGroups([{ id: 'sg-1', moduleKeys: ['D1-005', 'D2-010'], groups: [] }]).valid).toBe(false);
  });
});

describe('super-group reconciliation', () => {
  test('prunes missing keys, resolves duplicate ownership, and dissolves undersized groups', () => {
    const rows = makeRows().filter((row) => row.id !== 'r5' && row.id !== 'r6');
    const groups = [
      { id: 'sg-1', moduleKeys: ['D1-005', 'D9-999'] },
      { id: 'sg-2', moduleKeys: ['D1-005', 'D2-010'] }
    ];

    expect(reconcileSuperGroups(rows, groups, configuration)).toEqual([
      { id: 'sg-2', moduleKeys: ['D1-005', 'D2-010'] }
    ]);
  });

  test('includes pasted rows in the existing module on the next reconciliation', () => {
    const rows = makeRows();
    const pastedRow = { id: 'r8', detalle: 'copia D1-005', cant: '8' };
    const groups = [{ id: 'sg-1', moduleKeys: ['D1-005', 'D2-010'] }];
    const reconciled = reconcileSuperGroups([...rows, pastedRow], groups, configuration);

    expect(reconciled).toEqual(groups);
    expect(getRowsForSuperGroup([...rows, pastedRow], reconciled[0], configuration).map((row) => row.id))
      .toEqual(['r1', 'r3', 'r5', 'r8']);
    expect(rows).toHaveLength(7);
  });

  test('changed details cannot retain stale membership or create duplicate ownership', () => {
    const rows = makeRows().map((row) => row.id === 'r1'
      ? { ...row, detalle: 'changed D2-010' }
      : row);
    const groups = [
      { id: 'sg-1', moduleKeys: ['D1-005', 'D2-010'] },
      { id: 'sg-2', moduleKeys: ['D2-010', 'D3-020'] }
    ];

    expect(reconcileSuperGroups(rows, groups, configuration)).toEqual([
      { id: 'sg-1', moduleKeys: ['D1-005', 'D2-010'] }
    ]);
  });

  test('ungrouping is pure and removes only the requested group', () => {
    const groups = [
      { id: 'sg-1', moduleKeys: ['D1-005', 'D2-010'] },
      { id: 'sg-2', moduleKeys: ['D3-020', 'D4-030'] }
    ];

    expect(ungroupSuperGroup(groups, 'sg-1')).toEqual([groups[1]]);
    expect(groups).toEqual([
      { id: 'sg-1', moduleKeys: ['D1-005', 'D2-010'] },
      { id: 'sg-2', moduleKeys: ['D3-020', 'D4-030'] }
    ]);
  });
});
