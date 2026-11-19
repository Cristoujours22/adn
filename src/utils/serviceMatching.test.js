import {
  findServiceMatches,
  getServiceMatchCount,
  normalizeServiceText,
  validateServiceAliasCollisions
} from './serviceMatching';

const services = [
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
  },
  {
    nomenclatura: 'SRNAR000',
    nombreOriginal: 'NARIZ',
    aliases: ['nariz', 'nar'],
    tipoCobro: 'ml_largo_ancho'
  },
  {
    nomenclatura: 'ENGNA',
    nombreOriginal: 'Engorde Nariz',
    aliases: ['engna', 'engorde', 'engordenariz'],
    tipoCobro: 'ml_largo_ancho'
  }
];

const countFor = (detail, service) => getServiceMatchCount(findServiceMatches(detail, services), service.nomenclatura);

describe('service matching', () => {
  test('assigns the specific Sencha Curva span instead of its contained Curva alias', () => {
    expect(countFor('sencha curva', services[0])).toBe(1);
    expect(countFor('sencha curva', services[1])).toBe(0);
    expect(findServiceMatches('sencha curva', services).matches).toHaveLength(1);
  });

  test('allows separate non-overlapping mentions after specific ownership', () => {
    expect(countFor('sencha curva + curva', services[0])).toBe(1);
    expect(countFor('sencha curva + curva', services[1])).toBe(1);
  });

  test.each(['2 curva', 'curva 2', 'curva x2', '2curva', 'curva2'])('parses adjacent quantity in %s', (detail) => {
    const result = findServiceMatches(detail, services);
    expect(getServiceMatchCount(result, 'CSCURVA1')).toBe(2);
    expect(result.matches[0].quantity).toBe(2);
  });

  test('preserves L quantity markers for compact legacy forms', () => {
    expect(countFor('2Lcurva', services[1])).toBe(2);
    expect(countFor('2Lnariz', services[2])).toBe(2);
    expect(countFor('2Lengna', services[3])).toBe(2);
    expect(countFor('2 lcurva', services[1])).toBe(0);
  });

  test('enforces token boundaries for short aliases', () => {
    expect(countFor('curvado', services[1])).toBe(0);
    expect(countFor('naranja', services[2])).toBe(0);
  });

  test('does not reuse a numeric token across adjacent mentions', () => {
    const result = findServiceMatches('curva 2 curva', services);
    const curvaMatches = result.matches.filter((match) => match.serviceId === 'CSCURVA1');

    expect(curvaMatches).toHaveLength(2);
    expect(curvaMatches.map((match) => match.quantity)).toEqual([2, 1]);
  });

  test('gives Engorde Nariz one owned span rather than overlapping Nariz', () => {
    const result = findServiceMatches('engorde nariz', services);
    expect(getServiceMatchCount(result, 'ENGNA')).toBe(1);
    expect(getServiceMatchCount(result, 'SRNAR000')).toBe(0);
    expect(result.matches[0].serviceId).toBe('ENGNA');
  });

  test('normalizes accents, punctuation, spacing, and case without changing display text', () => {
    expect(normalizeServiceText('  Náriz---Especial ')).toBe('nariz especial');
    const result = findServiceMatches('  SENCHA--CURVA  ', services);
    expect(result.matches[0].rawText).toBe('SENCHA--CURVA');
    expect(result.matches[0].serviceId).toBe('SENCHACURVA');
  });

  test('reports aliases that collide with another service canonical term', () => {
    const collisions = validateServiceAliasCollisions([
      { nomenclatura: 'MANIGAVETA', nombreOriginal: 'MANIGAVETA' },
      { nomenclatura: 'SENCHAMANUAL', nombreOriginal: 'ENCHAPE MANUAL', aliases: ['manigaveta'] }
    ]);

    expect(collisions).toHaveLength(1);
    expect(collisions[0].normalizedAlias).toBe('manigaveta');
    expect(collisions[0].services.map((service) => service.serviceId)).toEqual([
      'MANIGAVETA',
      'SENCHAMANUAL'
    ]);
  });

  test('reports only exact normalized alias collisions across canonical services', () => {
    const collisions = validateServiceAliasCollisions([
      { nomenclatura: 'A', nombreOriginal: 'Servicio A', aliases: ['Café'] },
      { nomenclatura: 'B', nombreOriginal: 'Servicio B', aliases: [' cafe '] },
      { nomenclatura: 'C', nombreOriginal: 'Servicio C', aliases: ['cafetería'] },
      { nomenclatura: 'D', nombreOriginal: 'Servicio D', aliases: ['cafe grande'] }
    ]);

    expect(collisions).toHaveLength(1);
    expect(collisions[0].normalizedAlias).toBe('cafe');
    expect(collisions[0].services.map(service => service.serviceId)).toEqual(['A', 'B']);
    expect(collisions[0].message).toMatch(/alias|servicio/i);

    expect(validateServiceAliasCollisions([
      { nomenclatura: 'S', nombreOriginal: 'S', aliases: ['sencha curva'] },
      { nomenclatura: 'C', nombreOriginal: 'C', aliases: ['curva'] }
    ])).toEqual([]);
  });

  test('keeps canonical Manigaveta and Manichaflán spans as sole owners', () => {
    const servicesWithLegacyTerms = [
      { nomenclatura: 'SENCHAMANUAL', nombreOriginal: 'ENCHAPE MANUAL', aliases: ['manigaveta', 'manichaflan'] },
      { nomenclatura: 'MANIGAVETA', nombreOriginal: 'MANIGAVETA' },
      { nomenclatura: 'MANICHAFLAN', nombreOriginal: 'MANICHAFLAN' }
    ];

    expect(findServiceMatches('manigaveta manichaflan', servicesWithLegacyTerms).matches.map((match) => match.serviceId))
      .toEqual(['MANIGAVETA', 'MANICHAFLAN']);
  });
});
