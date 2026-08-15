import {
  buildFindReplacePreview,
  applyFindReplace,
  renameModuleInDespiece
} from './despieceTransformations';

const despiece = {
  id: 'active',
  filas: [
    { id: 'r1', detalle: 'D1-01 PERBIS' },
    { id: 'r2', detalle: 'CANTO' }
  ],
  modules: [{ moduleId: 'module_D1-01', legacyToken: 'D1-01', displayName: 'Base' }]
};

test('escapes literal input and limits preview to the active despiece', () => {
  const preview = buildFindReplacePreview(despiece, { search: 'D1-01', replacement: 'D1+02', mode: 'literal' });
  expect(preview).toMatchObject({ activeDespieceId: 'active', changedRows: ['r1'], matchCount: 1 });
  expect(preview.rows[0].next.detalle).toBe('D1+02 PERBIS');
});

test('replaces regex metacharacters and replacement tokens literally', () => {
  const source = { id: 'active', filas: [{ id: 'r1', detalle: 'Cut a+b? [x] exactly' }] };
  const preview = buildFindReplacePreview(source, { search: 'a+b? [x]', replacement: '$& done', mode: 'literal' });
  expect(preview.rows[0].next.detalle).toBe('Cut $& done exactly');
});

test('accepts valid regex, rejects invalid regex, and reports no matches', () => {
  expect(buildFindReplacePreview(despiece, { search: 'PERBIS|CANTO', replacement: 'SERVICE', mode: 'regex' }).matchCount).toBe(2);
  expect(buildFindReplacePreview(despiece, { search: '[', replacement: 'x', mode: 'regex' }).error).toMatch(/regular expression/i);
  expect(buildFindReplacePreview(despiece, { search: 'missing', replacement: 'x', mode: 'literal' })).toMatchObject({ matchCount: 0, changedRows: [] });
});

test.each(['literal', 'regex'])('rejects blank %s searches without changes', (mode) => {
  expect(buildFindReplacePreview(despiece, { search: '  ', replacement: 'x', mode })).toEqual({
    error: 'Search cannot be blank.', activeDespieceId: 'active', rows: [], changedRows: [], matchCount: 0
  });
});

test('rejects stale previews and applies only the reviewed preview', () => {
  const preview = buildFindReplacePreview(despiece, { search: 'CANTO', replacement: 'BORDE', mode: 'literal' });
  expect(() => applyFindReplace({ ...despiece, filas: [{ ...despiece.filas[0], detalle: 'changed' }, despiece.filas[1]] }, preview)).toThrow(/stale/i);
  const current = { ...despiece, filas: [despiece.filas[0], { ...despiece.filas[1], cant: 2, largo: 40, serviceId: 'svc_canto' }] };
  expect(applyFindReplace(current, preview).despiece.filas[1]).toEqual({ id: 'r2', detalle: 'BORDE', cant: 2, largo: 40, serviceId: 'svc_canto' });
});

test('renames a module without rewriting legacy tokens or unrelated rows', () => {
  const result = renameModuleInDespiece(despiece, 'module_D1-01', 'Kitchen');
  expect(result.despiece.modules[0].displayName).toBe('Kitchen');
  expect(result.despiece.filas[0].detalle).toBe('D1-01 PERBIS');
  expect(result.changedRows).toEqual(['r1']);
});
