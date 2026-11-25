import {
  applyServicePlanToDespieces,
  canOpenServicePlan,
  cloneServicePlan,
  createServicePlanSeed,
  mergeIdenticalPlanGroups,
  splitPlanUnits,
  synchronizeServicePlanWithRow
} from './servicePlans';

const services = [
  {
    nomenclatura: 'CURVE',
    nombreOriginal: 'Curva',
    aliases: ['curvado'],
    planProfile: {
      scope: 'outer-contour',
      mode: 'selectable',
      geometries: [
        {
          id: 'rounded-corners',
          label: 'Esquinas redondeadas',
          primitive: 'rounded-corners',
          parameters: []
        }
      ]
    }
  },
  {
    nomenclatura: 'HOLE',
    nombreOriginal: 'Perforación',
    aliases: ['perforacion', 'perforaciones']
  }
];

const row = (overrides = {}) => ({
  id: 'row_7',
  cant: '4',
  largo: '600',
  ancho: '600',
  detalle: 'Divisor curva y perforaciones x2',
  l1: '1',
  l2: '1',
  a1: '1',
  a2: '1',
  ...overrides
});

describe('service plan instances', () => {
  test('enables the detail menu for detected services or multiple physical pieces', () => {
    expect(canOpenServicePlan(row({ cant: 1, detalle: 'Divisor curva' }), services)).toBe(true);
    expect(canOpenServicePlan(row({ cant: 3, detalle: 'Divisor' }), services)).toBe(true);
    expect(canOpenServicePlan(row({ cant: 1, detalle: 'Divisor' }), services)).toBe(false);
  });

  test('assigns explicitly quantified services to the matching physical units', () => {
    const plan = createServicePlanSeed(row(), services);

    expect(plan).toMatchObject({
      version: 1,
      rowId: 'row_7',
      piece: {
        quantity: 4,
        lengthMm: 600,
        widthMm: 600,
        edges: { l1: '1', l2: '1', a1: '1', a2: '1' }
      }
    });
    expect(plan.groups.map((group) => group.unitIndexes)).toEqual([[1, 2], [3, 4]]);
    expect(plan.groups[0].operations).toEqual([
      expect.objectContaining({ serviceId: 'CURVE', detectedQuantity: 1, geometryId: null }),
      expect.objectContaining({ serviceId: 'HOLE', detectedQuantity: 2, geometryId: null })
    ]);
    expect(plan.groups[1].operations).toEqual([
      expect.objectContaining({ serviceId: 'CURVE', detectedQuantity: 1, geometryId: null })
    ]);
    expect(plan.groups[0].operations[0].planProfile).toEqual(services[0].planProfile);
    expect(plan.groups[0].operations[1].planProfile).toBeNull();
  });

  test('splits selected physical units with independent operation state', () => {
    const original = createServicePlanSeed(row(), services);
    const split = splitPlanUnits(original, [4]);

    expect(split.groups.map((group) => group.unitIndexes)).toEqual([[1, 2], [3], [4]]);
    split.groups[2].operations[0].parameters.radius = 80;
    expect(split.groups[1].operations[0].parameters).toEqual({});
  });

  test('synchronizes piece dimensions and quantity while preserving configured geometry', () => {
    const existing = createServicePlanSeed(row({ cant: '2', detalle: 'Divisor curva' }), services);
    existing.groups[0].operations[0].geometryId = 'rounded-corners';
    existing.groups[0].operations[0].parameters.radius = 80;

    const synchronized = synchronizeServicePlanWithRow(
      existing,
      row({ cant: '4', largo: '800', ancho: '500', detalle: 'Divisor curva' }),
      services
    );

    expect(synchronized.piece).toMatchObject({ quantity: 4, lengthMm: 800, widthMm: 500 });
    expect(synchronized.groups[0].unitIndexes).toEqual([1, 2, 3, 4]);
    expect(synchronized.groups[0].operations[0]).toMatchObject({
      serviceId: 'CURVE',
      geometryId: 'rounded-corners',
      parameters: { radius: 80 }
    });
  });

  test('keeps explicit service ownership when synchronizing a saved plan', () => {
    const synchronized = synchronizeServicePlanWithRow(
      createServicePlanSeed(row(), services),
      row(),
      services
    );

    expect(synchronized.groups.map((group) => ({
      units: group.unitIndexes,
      services: group.operations.map((operation) => operation.serviceId)
    }))).toEqual([
      { units: [1, 2], services: ['CURVE', 'HOLE'] },
      { units: [3, 4], services: ['CURVE'] }
    ]);
  });

  test('removes stale units and service operations when the source row changes', () => {
    const existing = splitPlanUnits(createServicePlanSeed(row(), services), [4]);
    existing.groups[1].operations[0].geometryId = 'rounded-corners';

    const synchronized = synchronizeServicePlanWithRow(
      existing,
      row({ cant: '2', detalle: 'Divisor perforaciones x2' }),
      services
    );

    expect(synchronized.groups.map((group) => group.unitIndexes)).toEqual([[1, 2]]);
    expect(synchronized.groups[0].operations).toEqual([
      expect.objectContaining({ serviceId: 'HOLE', detectedQuantity: 2 })
    ]);
  });

  test('clones copied plans so later edits cannot mutate the source row', () => {
    const source = createServicePlanSeed(row(), services);
    const copy = cloneServicePlan(source);

    copy.groups[0].operations[0].parameters.radius = 90;
    expect(source.groups[0].operations[0].parameters).toEqual({});
  });

  test('persists by stable row id when row positions change while the editor is open', () => {
    const targetRow = row();
    const original = [
      { id: 'tab-1', filas: [row({ id: 'row_8', detalle: 'Fila insertada' }), targetRow] },
      { id: 'tab-2', filas: [row({ id: 'row_9' })] }
    ];
    const plan = createServicePlanSeed(targetRow, services);
    const result = applyServicePlanToDespieces(original, 'tab-1', 0, plan);

    expect(result[0].filas[0]).toBe(original[0].filas[0]);
    expect(result[0].filas[1].servicePlan).toEqual(plan);
    expect(result[1]).toBe(original[1]);
    expect(targetRow.servicePlan).toBeUndefined();
  });

  test('merges groups again only when their geometry state is identical', () => {
    const split = splitPlanUnits(createServicePlanSeed(row({ detalle: 'Divisor curva' }), services), [4]);
    expect(mergeIdenticalPlanGroups(split).groups.map((group) => group.unitIndexes)).toEqual([
      [1, 2, 3, 4]
    ]);

    const changed = splitPlanUnits(createServicePlanSeed(row({ detalle: 'Divisor curva' }), services), [4]);
    changed.groups[1].operations[0].geometryId = 'rounded-corners';
    changed.groups[1].operations[0].parameters.radius = 80;

    expect(mergeIdenticalPlanGroups(changed).groups.map((group) => group.unitIndexes)).toEqual([
      [1, 2, 3],
      [4]
    ]);
  });
});
