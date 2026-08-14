import {
  deterministicServiceId,
  parseLegacyModuleToken,
  hydrateDespieceSchema,
  resolveModuleReference
} from './moduleIdentity';

test('derives stable service ids without depending on object identity', () => {
  expect(deterministicServiceId('  Canto  Aluminio ')).toBe('svc_canto-aluminio');
  expect(deterministicServiceId('Canto Aluminio')).toBe(deterministicServiceId('canto aluminio'));
});

test('parses only complete legacy module tokens', () => {
  expect(parseLegacyModuleToken('pieza D12-03 lateral')).toEqual({
    legacyToken: 'D12-03',
    moduleId: 'module_D12-03'
  });
  expect(parseLegacyModuleToken('D12-03A')).toBeNull();
  expect(parseLegacyModuleToken('XD12-03Y')).toBeNull();
});

test('hydrates modules, rows, and legacy services while preserving detalle tokens', () => {
  const result = hydrateDespieceSchema({
    id: 'tab-1',
    filas: [
      { id: 'row-1', detalle: 'D2-01 / canto', nomenclatura: 'old' },
      { id: 'row-2', detalle: 'sin modulo', nomenclatura: 'old' }
    ]
  }, [{ nomenclatura: 'Canto Aluminio' }]);

  expect(result.despiece.modules).toEqual([{ moduleId: 'module_D2-01', legacyToken: 'D2-01', displayName: 'D2-01' }]);
  expect(result.despiece.filas.map((row) => row.moduleId)).toEqual(['module_D2-01', undefined]);
  expect(result.despiece.filas[0].detalle).toBe('D2-01 / canto');
  expect(result.services[0].serviceId).toBe('svc_canto-aluminio');
  expect(resolveModuleReference(result.despiece, result.despiece.filas[0])).toBe('module_D2-01');
});

test('falls back from a stale row moduleId to token metadata before creating a module', () => {
  const result = hydrateDespieceSchema({
    filas: [{ id: 'row-1', moduleId: 'module_missing', detalle: 'D2-01 / canto' }],
    modules: [{ moduleId: 'module_D2-01', legacyToken: 'D2-01', displayName: 'Kitchen Left' }]
  });

  expect(result.despiece.modules).toEqual([
    { moduleId: 'module_D2-01', legacyToken: 'D2-01', displayName: 'Kitchen Left' }
  ]);
  expect(result.despiece.filas[0].moduleId).toBe('module_D2-01');
});
