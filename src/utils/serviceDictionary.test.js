import generalDictionary from '../../config/service-dictionaries/codigos-generales.json';
import {
  parseServiceDictionary,
  validateServiceDictionary
} from './serviceDictionary';

const geometry = (overrides = {}) => ({
  id: 'rounded-corners',
  label: 'Esquinas redondeadas',
  primitive: 'rounded-corners',
  parameters: [
    {
      id: 'radius',
      label: 'Radio',
      kind: 'radius',
      unit: 'mm',
      required: true
    }
  ],
  ...overrides
});

const planProfile = (overrides = {}) => ({
  scope: 'outer-contour',
  mode: 'selectable',
  geometries: [geometry()],
  ...overrides
});

const service = (overrides = {}) => ({
  code: 'GEN_CORTE',
  name: 'Corte curvo',
  description: 'Corte de contorno curvo.',
  aliases: ['curvado'],
  chargeType: 'unidad',
  measurementBasis: 'unit',
  active: true,
  requiresReview: false,
  ...overrides
});

const dictionary = (overrides = {}) => ({
  schemaVersion: '1.0',
  dictionary: {
    id: 'codigos-generales',
    name: 'Códigos generales',
    kind: 'optional-general-template',
    language: 'es',
    autoload: false,
    visibility: 'product',
    description: 'Plantilla opcional.',
    ...overrides.dictionary
  },
  services: [service()],
  ...overrides
});

describe('service dictionary parser and validator', () => {
  test('parses JSON v1 and normalizes services to ADN fields', () => {
    const result = parseServiceDictionary(JSON.stringify(dictionary({
      services: [service({ active: false, requiresReview: true })]
    })));

    expect(result.valid).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.services[0]).toMatchObject({
      nomenclatura: 'GEN_CORTE',
      nombreOriginal: 'Corte curvo',
      aliases: ['curvado'],
      tipoCobro: 'unidad',
      activo: false,
      requiresReview: true,
      measurementBasis: 'unit'
    });
  });

  test('reports malformed JSON, missing fields, invalid version and autoload', () => {
    expect(parseServiceDictionary('{')).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'invalid-json' })
      ])
    });

    const invalid = dictionary({
      schemaVersion: '2.0',
      dictionary: {
        id: '',
        autoload: true
      },
      services: [{ ...service(), name: undefined }]
    });
    const result = validateServiceDictionary(invalid);
    const codes = result.errors.map((error) => error.code);

    expect(codes).toEqual(expect.arrayContaining([
      'invalid-version',
      'missing-field',
      'autoload-required'
    ]));
    expect(result.valid).toBe(false);
  });

  test('accepts and normalizes a declarative geometry profile without service-name rules', () => {
    const profile = planProfile({
      geometries: [
        geometry(),
        geometry({
          id: 'full-circle',
          label: 'Círculo completo',
          primitive: 'circle',
          parameters: [
            { id: 'diameter', label: 'Diámetro', kind: 'diameter', unit: 'mm', required: true }
          ]
        })
      ]
    });

    const result = parseServiceDictionary(dictionary({
      services: [service({ planProfile: profile })]
    }));

    expect(result.valid).toBe(true);
    expect(result.services[0].planProfile).toEqual(profile);
  });

  test('rejects unsupported geometry vocabulary and duplicate geometry identifiers', () => {
    const result = validateServiceDictionary(dictionary({
      services: [service({
        planProfile: planProfile({
          scope: 'company-operation',
          mode: 'automatic-by-name',
          geometries: [
            geometry({ primitive: 'proprietary-curve' }),
            geometry()
          ]
        })
      })]
    }));

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'invalid-value', path: 'services[0].planProfile.scope' }),
      expect.objectContaining({ code: 'invalid-value', path: 'services[0].planProfile.mode' }),
      expect.objectContaining({ code: 'invalid-value', path: 'services[0].planProfile.geometries[0].primitive' }),
      expect.objectContaining({ code: 'duplicate-geometry-id', path: 'services[0].planProfile.geometries' })
    ]));
  });

  test('requires one geometry for fixed profiles and validates neutral parameter metadata', () => {
    const result = validateServiceDictionary(dictionary({
      services: [service({
        planProfile: planProfile({
          mode: 'fixed',
          geometries: [
            geometry(),
            geometry({
              id: 'angle-cut',
              primitive: 'chamfer',
              parameters: [
                { id: 'angle', label: '', kind: 'company-angle', unit: 'company-unit', required: 'yes' }
              ]
            })
          ]
        })
      })]
    }));

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'invalid-geometry-count', path: 'services[0].planProfile.geometries' }),
      expect.objectContaining({ code: 'missing-field', path: 'services[0].planProfile.geometries[1].parameters[0].label' }),
      expect.objectContaining({ code: 'invalid-value', path: 'services[0].planProfile.geometries[1].parameters[0].kind' }),
      expect.objectContaining({ code: 'invalid-value', path: 'services[0].planProfile.geometries[1].parameters[0].unit' }),
      expect.objectContaining({ code: 'invalid-type', path: 'services[0].planProfile.geometries[1].parameters[0].required' })
    ]));
  });

  test('accepts the defined general dictionary without enabling autoload', () => {
    const result = parseServiceDictionary(generalDictionary);

    expect(result.valid).toBe(true);
    expect(result.dictionary.dictionary.autoload).toBe(false);
    expect(result.services).toHaveLength(generalDictionary.services.length);
  });

  test('reports duplicate names and codes plus alias/canonical collisions', () => {
    const result = validateServiceDictionary(dictionary({
      services: [
        service({ code: 'DUP', name: 'Ranura', aliases: ['corte'] }),
        service({ code: 'DUP', name: 'ranura', aliases: ['Corte'] }),
        service({ code: 'OTRO', name: 'Otro servicio', aliases: ['ranura'] })
      ]
    }));

    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      'duplicate-code',
      'duplicate-name'
    ]));
    expect(result.collisions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'term-collision',
        normalizedValue: 'corte'
      }),
      expect.objectContaining({
        code: 'term-collision',
        normalizedValue: 'ranura'
      })
    ]));
    expect(result.valid).toBe(false);
  });
});
