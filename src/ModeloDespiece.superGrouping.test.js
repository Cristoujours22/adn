import {
  canCreateSuperGroup,
  getSelectedRowIdsForSuperGrouping
} from './ModeloDespiece';

const configuration = { designPrefixes: ['D'], groupIdPosition: 'afterDesign' };
const rows = [
  { id: 'r1', detalle: 'pieza D1-005' },
  { id: 'r2', detalle: 'pieza D2-010' },
  { id: 'r3', detalle: 'pieza D1-005' }
];

describe('super-group UI coordinator helpers', () => {
  test('converts index selection to stable row IDs in source order', () => {
    expect(getSelectedRowIdsForSuperGrouping(rows, new Set([2, 0]))).toEqual(['r1', 'r3']);
  });

  test('enables the action only when selection resolves to two modules', () => {
    expect(canCreateSuperGroup(rows, new Set([0, 1]), configuration)).toBe(true);
    expect(canCreateSuperGroup(rows, new Set([0, 2]), configuration)).toBe(false);
  });
});
