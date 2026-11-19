import {
  DEFAULT_SERVICES,
  buildServiceCollection,
  getServiceCollisionMessage,
  normalizeServiceAliases,
  normalizeStoredService
} from './ModeloDespiece';
import { validateServiceAliasCollisions } from './utils/serviceMatching';

describe('service configuration persistence and validation', () => {
  test('seeds legacy terms on their canonical services without Sencha conflicts', () => {
    const senchaManual = DEFAULT_SERVICES.find((service) => service.nomenclatura === 'SENCHAMANUAL');
    const manigaveta = DEFAULT_SERVICES.find((service) => service.nomenclatura === 'MANIGAVETA');
    const manichaflan = DEFAULT_SERVICES.find((service) => service.nomenclatura === 'MANICHAFLAN');
    const ranuraFo = DEFAULT_SERVICES.find((service) => service.nomenclatura === 'CSRANUFO');
    const circulo = DEFAULT_SERVICES.find((service) => service.nomenclatura === 'CSCIRCULO');

    expect(senchaManual.aliases).not.toEqual(expect.arrayContaining(['manigaveta', 'manichaflan']));
    expect(manigaveta.aliases || []).not.toContain('manigaveta');
    expect(manichaflan.aliases || []).not.toContain('manichaflan');
    expect(ranuraFo.aliases).toEqual(expect.arrayContaining(['ranurafos', 'ranufo', 'ranufos']));
    expect(circulo.aliases).toContain('circulo');
  });
  test('round-trips explicit aliases and keeps legacy string services compatible', () => {
    const service = {
      nomenclatura: 'CSCURVA1',
      nombreOriginal: 'CURVA',
      aliases: ['curva', 'curv'],
      tipoCobro: 'unidad',
      activo: false
    };

    expect(normalizeStoredService(service)).toEqual(service);
    expect(normalizeStoredService('LEGACY')).toEqual({
      nombreOriginal: 'LEGACY',
      nomenclatura: 'LEGACY',
      tipoCobro: 'unidad'
    });
    expect(normalizeServiceAliases(' curva, curv ,')).toEqual(['curva', 'curv']);
  });

  test('keeps inactive state when editing aliases and creates aliases for new services', () => {
    const existing = [{
      nomenclatura: 'CURVA',
      nombreOriginal: 'CURVA',
      aliases: ['curva'],
      tipoCobro: 'unidad',
      activo: false
    }];
    const edited = buildServiceCollection(existing, {
      nomenclatura: 'CURVA',
      nombreOriginal: 'CURVA ESPECIAL',
      aliases: ['curv-especial'],
      tipoCobro: 'unidad'
    }, 'CURVA');
    const added = buildServiceCollection(edited, {
      nomenclatura: 'NAR',
      nombreOriginal: 'Nariz',
      aliases: ['nariz'],
      tipoCobro: 'ml_largo_ancho'
    });

    expect(edited[0]).toEqual({
      nomenclatura: 'CURVA',
      nombreOriginal: 'CURVA ESPECIAL',
      aliases: ['curv-especial'],
      tipoCobro: 'unidad',
      activo: false
    });
    expect(added[1].aliases).toEqual(['nariz']);
  });

  test('returns actionable Spanish feedback for exact normalized collisions only', () => {
    const collisions = validateServiceAliasCollisions([
      { nomenclatura: 'A', nombreOriginal: 'A', aliases: ['Sencha-Curva'] },
      { nomenclatura: 'B', nombreOriginal: 'B', aliases: ['sencha curva'] }
    ]);

    expect(collisions).toHaveLength(1);
    expect(getServiceCollisionMessage(collisions)).toMatch(/alias|servicios|distinto/i);
    expect(getServiceCollisionMessage(collisions)).toMatch(/Sencha-Curva/i);
  });
});
