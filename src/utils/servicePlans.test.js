import {
  applyServicePlanToDespieces,
  canOpenServicePlan,
  createServicePlanSeed,
  mergeIdenticalPlanGroups,
  splitPlanUnits
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

  test('creates one shared hybrid plan group from row dimensions and detected services', () => {
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
    expect(plan.groups).toHaveLength(1);
    expect(plan.groups[0].unitIndexes).toEqual([1, 2, 3, 4]);
    expect(plan.groups[0].operations).toEqual([
      expect.objectContaining({ serviceId: 'CURVE', detectedQuantity: 1, geometryId: null }),
      expect.objectContaining({ serviceId: 'HOLE', detectedQuantity: 2, geometryId: null })
    ]);
    expect(plan.groups[0].operations[0].planProfile).toEqual(services[0].planProfile);
    expect(plan.groups[0].operations[1].planProfile).toBeNull();
  });

  test('splits selected physical units with independent operation state', () => {
    const original = createServicePlanSeed(row(), services);
    const split = splitPlanUnits(original, [4]);

    expect(split.groups.map((group) => group.unitIndexes)).toEqual([[1, 2, 3], [4]]);
    split.groups[1].operations[0].parameters.radius = 80;
    expect(split.groups[0].operations[0].parameters).toEqual({});
  });

  test('persists a plan only on the selected row without mutating other despieces', () => {
    const original = [
      { id: 'tab-1', filas: [row(), row({ id: 'row_8', detalle: 'Otra pieza' })] },
      { id: 'tab-2', filas: [row({ id: 'row_9' })] }
    ];
    const plan = createServicePlanSeed(original[0].filas[0], services);
    const result = applyServicePlanToDespieces(original, 'tab-1', 0, plan);

    expect(result[0].filas[0].servicePlan).toEqual(plan);
    expect(result[0].filas[1]).toBe(original[0].filas[1]);
    expect(result[1]).toBe(original[1]);
    expect(original[0].filas[0].servicePlan).toBeUndefined();
  });

  test('merges groups again only when their geometry state is identical', () => {
    const split = splitPlanUnits(createServicePlanSeed(row(), services), [4]);
    expect(mergeIdenticalPlanGroups(split).groups.map((group) => group.unitIndexes)).toEqual([
      [1, 2, 3, 4]
    ]);

    const changed = splitPlanUnits(createServicePlanSeed(row(), services), [4]);
    changed.groups[1].operations[0].geometryId = 'rounded-corners';
    changed.groups[1].operations[0].parameters.radius = 80;

    expect(mergeIdenticalPlanGroups(changed).groups.map((group) => group.unitIndexes)).toEqual([
      [1, 2, 3],
      [4]
    ]);
  });
});
