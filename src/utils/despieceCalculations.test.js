import { calcularTotalesDespiece, detectServiceOccurrences, calculateCanonicalServiceTotals, applyValidatedService, getServiceSelectionAlert } from './despieceCalculations';
const services = [{ serviceId: 'svc_perbis', nomenclatura: 'SERPERBIS', nombreOriginal: 'PERBIS', tipoCobro: 'unidad' }, { serviceId: 'svc_canto', nomenclatura: 'CANTO', nombreOriginal: 'CANTO ALUMINIO', tipoCobro: 'unidad' }];
test('detects variants and rejects substring false positives', () => { expect(detectServiceOccurrences([{ id: 'r1', detalle: '2L PERBIS' }], services)).toEqual({ status: 'valid', serviceId: 'svc_perbis', rowIds: ['r1'], count: 2 }); expect(detectServiceOccurrences([{ id: 'r2', detalle: 'SUPERBISCUIT' }], services).status).toBe('empty'); });
test('distinguishes empty and unresolved results', () => { expect(detectServiceOccurrences([], services).status).toBe('empty'); expect(detectServiceOccurrences([{ id: 'r1', detalle: 'special finishing' }], services).status).toBe('unresolved'); expect(detectServiceOccurrences([{ id: 'r1', detalle: 'PERBIS' }], []).status).toBe('empty'); });
test('calculates canonical totals and accepts only valid candidates', () => { const rows = [{ id: 'r1', cant: 2, detalle: 'PERBIS', serviceId: 'svc_perbis' }]; expect(calculateCanonicalServiceTotals([{ filas: rows }], services)).toEqual({ totalPieces: 2, serviceCounts: { svc_perbis: 2, svc_canto: 0 } }); expect(applyValidatedService([{ id: 'r1', detalle: 'PERBIS' }], { status: 'unresolved', serviceId: 'svc_perbis' })).toEqual([{ id: 'r1', detalle: 'PERBIS' }]); expect(applyValidatedService([{ id: 'r1', detalle: 'PERBIS' }], { status: 'valid', serviceId: 'svc_perbis', rowIds: ['r1'] })[0].serviceId).toBe('svc_perbis'); });
test('retains legacy PERBIS quantity semantics', () => { expect(calculateCanonicalServiceTotals([{ filas: [{ cant: 2, detalle: '3L PERBIS', serviceId: 'svc_perbis' }] }], services).serviceCounts.svc_perbis).toBe(2); });
test.each([0, -1, '', 'invalid'])('ignores services for nonpositive or invalid cant %p', (cant) => { expect(calculateCanonicalServiceTotals([{ filas: [{ cant, detalle: '2L PERBIS', serviceId: 'svc_perbis' }] }], services)).toEqual({ totalPieces: 0, serviceCounts: { svc_perbis: 0, svc_canto: 0 } }); });
test('retains distinct legacy service matches', () => {
  const rows = [{ cant: 2, detalle: '3L PERBIS' }, { cant: 4, detalle: 'SUPERBISCUIT' }, { cant: 1, detalle: 'PERBIS CANTO' }];
  expect(calculateCanonicalServiceTotals([{ filas: rows }], services)).toEqual({ totalPieces: 7, serviceCounts: { svc_perbis: 3, svc_canto: 1 } });
});
test('returns the exact actionable rejection alert', () => { expect(getServiceSelectionAlert({ status: 'unresolved', label: 'PERBIS' })).toBe('Service "PERBIS" could not be resolved. Review the wording or select a canonical service before accepting.'); });

test('selected service detection ignores a different valid service on another row', () => {
  expect(detectServiceOccurrences([{ id: 'r1', detalle: 'PERBIS' }, { id: 'r2', detalle: 'CANTO ALUMINIO' }], services, 'svc_perbis')).toEqual({ status: 'valid', serviceId: 'svc_perbis', rowIds: ['r1'], count: 1 });
});

test('selected service detection keeps same-row ambiguity unresolved', () => {
  expect(detectServiceOccurrences([{ id: 'r1', detalle: 'PERBIS CANTO ALUMINIO' }], services, 'svc_perbis').status).toBe('unresolved');
});

test.each([
  ['ml_largo', { largo: 1200, ancho: 500 }, 1.2],
  ['ml_perimetro', { largo: 1200, ancho: 500 }, 3.4],
  ['m2', { largo: 1200, ancho: 500 }, 0.6],
  ['escala_60', { largo: 1200, ancho: 500 }, 2]
])('retains legacy %s billing in canonical totals', (tipoCobro, dimensions, expected) => {
  const service = { serviceId: 'svc_work', nomenclatura: 'WORK', nombreOriginal: 'WORK', tipoCobro };
  const totals = calculateCanonicalServiceTotals([{ filas: [{ cant: 1, detalle: 'WORK', ...dimensions }] }], [service]);
  expect(totals.serviceCounts.svc_work).toBeCloseTo(expected);
});

test('legacy services without ids remain distinct', () => {
  const legacy = [{ nomenclatura: 'ONE', nombreOriginal: 'ONE', tipoCobro: 'unidad' }, { nomenclatura: 'TWO', nombreOriginal: 'TWO', tipoCobro: 'unidad' }];
  expect(calculateCanonicalServiceTotals([{ filas: [{ cant: 1, detalle: 'ONE' }] }], legacy).serviceCounts).toEqual({ ONE: 1, TWO: 0 });
  expect(detectServiceOccurrences([{ id: 'r1', detalle: 'ONE' }, { id: 'r2', detalle: 'TWO' }], legacy, 'ONE')).toEqual({ status: 'valid', serviceId: 'ONE', rowIds: ['r1'], count: 1 });
});

test('retains specialized edge-based billing', () => {
  const sanduche = { serviceId: 'svc_sanduche', nomenclatura: 'SRREPEGA', nombreOriginal: 'SANDUCHE CLAVILLO', tipoCobro: 'ml_largo_ancho' };
  const totals = calculateCanonicalServiceTotals([{ filas: [{ cant: 1, detalle: 'SRREPEGA', largo: 1200, ancho: 500, l1: '3' }] }], [sanduche]);
  expect(totals.serviceCounts.svc_sanduche).toBeCloseTo(1.2);
});

const row = (detalle, overrides = {}) => ({
  cant: '1',
  largo: '600',
  ancho: '400',
  detalle,
  l1: '',
  l2: '',
  a1: '',
  a2: '',
  ...overrides
});

const curvaServices = [
  {
    nomenclatura: 'SENCHACURVA',
    nombreOriginal: 'ENCHAPE CURVO',
    aliases: ['sencha curva', 'senchacurva', 'senchcurv'],
    tipoCobro: 'unidad'
  },
  {
    nomenclatura: 'CSCURVA1',
    nombreOriginal: 'CURVA',
    aliases: ['curva', 'curv'],
    tipoCobro: 'unidad'
  }
];

describe('calcularTotalesDespiece service ownership', () => {
  test('counts Sencha Curva without counting its contained Curva alias', () => {
    const result = calcularTotalesDespiece([{ filas: [row('sencha curva')] }], curvaServices);

    expect(result.serviceCounts).toEqual({ SENCHACURVA: 1, CSCURVA1: 0 });
  });

  test('counts a separate Curva mention after Sencha Curva', () => {
    const result = calcularTotalesDespiece([{ filas: [row('sencha curva + curva')] }], curvaServices);

    expect(result.serviceCounts).toEqual({ SENCHACURVA: 1, CSCURVA1: 1 });
  });

  test.each(['2 curva', 'curva 2', 'curva x2', '2Lcurva'])('uses deterministic unit quantity for %s', (detail) => {
    const result = calcularTotalesDespiece([{ filas: [row(detail)] }], curvaServices);

    expect(result.serviceCounts.CSCURVA1).toBe(2);
  });

  test('does not reuse one quantity token across two Curva spans', () => {
    const result = calcularTotalesDespiece([{ filas: [row('curva 2 curva')] }], curvaServices);

    expect(result.serviceCounts.CSCURVA1).toBe(3);
  });

  test('preserves compact L quantities for Nariz and ENGNA', () => {
    const services = [
      { nomenclatura: 'SRNAR000', nombreOriginal: 'NARIZ', aliases: ['nariz', 'nar'], tipoCobro: 'ml_largo_ancho' },
      { nomenclatura: 'ENGNA', nombreOriginal: 'Engorde Nariz', aliases: ['engna', 'engorde'], tipoCobro: 'ml_largo_ancho' }
    ];
    const result = calcularTotalesDespiece([{ filas: [
      row('2Lnariz'),
      row('2Lengna')
    ] }], services);

    expect(result.serviceCounts.SRNAR000).toBe(2);
    expect(result.serviceCounts.ENGNA).toBe(2);
  });

  test('does not count shorter aliases inside unrelated words', () => {
    const services = [
      { nomenclatura: 'CSCURVA1', nombreOriginal: 'CURVA', aliases: ['curv'], tipoCobro: 'unidad' },
      { nomenclatura: 'SRNAR000', nombreOriginal: 'NARIZ', aliases: ['nar'], tipoCobro: 'unidad' }
    ];
    const result = calcularTotalesDespiece([{ filas: [row('curvado naranja')] }], services);

    expect(result.serviceCounts).toEqual({ CSCURVA1: 0, SRNAR000: 0 });
  });

  test('keeps ENGNA ownership separate from Nariz in totals', () => {
    const services = [
      { nomenclatura: 'SRNAR000', nombreOriginal: 'NARIZ', aliases: ['nariz', 'nar'], tipoCobro: 'ml_largo_ancho' },
      { nomenclatura: 'ENGNA', nombreOriginal: 'Engorde Nariz', aliases: ['engna', 'engorde', 'engordenariz'], tipoCobro: 'ml_largo_ancho' }
    ];
    const result = calcularTotalesDespiece([{ filas: [row('engorde nariz', { engnaCobro: '2' })] }], services);

    expect(result.serviceCounts.ENGNA).toBe(2);
    expect(result.serviceCounts.SRNAR000).toBe(0);
  });

  test('preserves legacy Ranura aliases and singular Circulo perimeter behavior', () => {
    const services = [
      { nomenclatura: 'CSRANUFO', nombreOriginal: 'RANURAFO', aliases: ['ranurafos', 'ranufo', 'ranufos'], tipoCobro: 'unidad' },
      { nomenclatura: 'SENCHAMANUAL', nombreOriginal: 'ENCHAPE MANUAL', aliases: ['enchape manual'], tipoCobro: 'ml_largo_ancho' },
      { nomenclatura: 'CSCIRCULO', nombreOriginal: 'CIRCULOS', aliases: ['circulo'], tipoCobro: 'ml_largo_ancho' }
    ];
    const result = calcularTotalesDespiece([{ filas: [
      row('ranurafos ranufo ranufos'),
      row('enchape manual circulo')
    ] }], services);

    expect(result.serviceCounts.CSRANUFO).toBe(3);
    expect(result.serviceCounts.CSCIRCULO).toBe(1);
    expect(result.serviceCounts.SENCHAMANUAL).toBe(2);
  });

  test('keeps canonical Manigaveta as the sole owner of its legacy term', () => {
    const services = [
      { nomenclatura: 'SENCHAMANUAL', nombreOriginal: 'ENCHAPE MANUAL', aliases: ['manigaveta'], tipoCobro: 'ml_largo_ancho' },
      { nomenclatura: 'MANIGAVETA', nombreOriginal: 'MANIGAVETA', tipoCobro: 'unidad' }
    ];
    const result = calcularTotalesDespiece([{ filas: [row('manigaveta')] }], services);

    expect(result.serviceCounts.SENCHAMANUAL).toBe(0);
    expect(result.serviceCounts.MANIGAVETA).toBe(1);
  });

  test('keeps legacy services without aliases matchable by name and nomenclature', () => {
    const services = [{ nomenclatura: 'LEGACY', nombreOriginal: 'Calado', tipoCobro: 'unidad' }];
    const result = calcularTotalesDespiece([{ filas: [row('CALADO')] }], services);

    expect(result.serviceCounts.LEGACY).toBe(1);
  });
});
