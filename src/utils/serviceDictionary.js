import { normalizeServiceText } from './serviceMatching';

export const SERVICE_DICTIONARY_SCHEMA_VERSION = '1.0';

const DICTIONARY_REQUIRED_FIELDS = [
  'id',
  'name',
  'kind',
  'language',
  'visibility',
  'description'
];

const SERVICE_REQUIRED_FIELDS = [
  'code',
  'name',
  'description',
  'aliases',
  'chargeType',
  'measurementBasis',
  'active',
  'requiresReview'
];

const SUPPORTED_CHARGE_TYPES = [
  'unidad',
  'ml_largo',
  'ml_ancho',
  'ml_largo_ancho',
  'ml_perimetro',
  'm2',
  'escala_60'
];

const SUPPORTED_MEASUREMENT_BASES = [
  'unit',
  'selected-dimension',
  'selected-sides',
  'perimeter',
  'max-dimension-600'
];

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const addError = (errors, code, path, message, extra = {}) => {
  errors.push({ code, type: code, path, message, ...extra });
};

const validateStringField = (value, field, path, errors) => {
  if (!hasOwn(value, field)) {
    addError(errors, 'missing-field', path, `Falta el campo requerido "${path}".`);
    return;
  }

  if (typeof value[field] !== 'string') {
    addError(errors, 'invalid-type', path, `El campo "${path}" debe ser texto.`);
    return;
  }

  if (!value[field].trim()) {
    addError(errors, 'missing-field', path, `El campo requerido "${path}" no puede estar vacío.`);
  }
};

const validateBooleanField = (value, field, path, errors) => {
  if (!hasOwn(value, field)) {
    addError(errors, 'missing-field', path, `Falta el campo requerido "${path}".`);
    return;
  }

  if (typeof value[field] !== 'boolean') {
    addError(errors, 'invalid-type', path, `El campo "${path}" debe ser booleano.`);
  }
};

const validateAliases = (service, path, errors) => {
  if (!hasOwn(service, 'aliases')) {
    addError(errors, 'missing-field', path, `Falta el campo requerido "${path}".`);
    return;
  }

  if (!Array.isArray(service.aliases)) {
    addError(errors, 'invalid-type', path, `El campo "${path}" debe ser un arreglo.`);
    return;
  }

  service.aliases.forEach((alias, aliasIndex) => {
    const aliasPath = `${path}[${aliasIndex}]`;
    if (typeof alias !== 'string') {
      addError(errors, 'invalid-type', aliasPath, `El alias "${aliasPath}" debe ser texto.`);
    } else if (!alias.trim()) {
      addError(errors, 'missing-field', aliasPath, `El alias "${aliasPath}" no puede estar vacío.`);
    }
  });
};

const validateService = (service, serviceIndex, errors) => {
  const path = `services[${serviceIndex}]`;
  if (!isRecord(service)) {
    addError(errors, 'invalid-schema', path, `El elemento "${path}" debe ser un objeto.`);
    return;
  }

  SERVICE_REQUIRED_FIELDS.forEach((field) => {
    if (field === 'aliases') {
      validateAliases(service, `${path}.aliases`, errors);
    } else if (field === 'active' || field === 'requiresReview') {
      validateBooleanField(service, field, `${path}.${field}`, errors);
    } else {
      validateStringField(service, field, `${path}.${field}`, errors);
    }
  });

  if (typeof service.chargeType === 'string' && !SUPPORTED_CHARGE_TYPES.includes(service.chargeType)) {
    addError(
      errors,
      'invalid-value',
      `${path}.chargeType`,
      `El tipo de cobro "${service.chargeType}" no está soportado.`,
      { allowedValues: SUPPORTED_CHARGE_TYPES }
    );
  }

  if (
    typeof service.measurementBasis === 'string'
    && !SUPPORTED_MEASUREMENT_BASES.includes(service.measurementBasis)
  ) {
    addError(
      errors,
      'invalid-value',
      `${path}.measurementBasis`,
      `La base de medición "${service.measurementBasis}" no está soportada.`,
      { allowedValues: SUPPORTED_MEASUREMENT_BASES }
    );
  }
};

const addDuplicateErrors = (services, field, code, label, errors) => {
  const values = new Map();

  services.forEach((service, serviceIndex) => {
    const normalizedValue = normalizeServiceText(service?.[field]);
    if (!normalizedValue) return;
    const entries = values.get(normalizedValue) || [];
    entries.push({ serviceIndex, value: service[field] });
    values.set(normalizedValue, entries);
  });

  values.forEach((entries, normalizedValue) => {
    if (entries.length < 2) return;
    const displayValues = entries.map((entry) => String(entry.value).trim()).join('", "');
    addError(
      errors,
      code,
      `services.${field}`,
      `El ${label} "${displayValues}" está duplicado.`,
      { normalizedValue, serviceIndexes: entries.map((entry) => entry.serviceIndex), values: entries.map((entry) => entry.value) }
    );
  });
};

const addTerm = (termsByNormalizedValue, value, entry) => {
  const normalizedValue = normalizeServiceText(value);
  if (!normalizedValue) return;
  const terms = termsByNormalizedValue.get(normalizedValue) || [];
  terms.push({ ...entry, value: String(value).trim(), normalizedValue });
  termsByNormalizedValue.set(normalizedValue, terms);
};

const findTermCollisions = (services) => {
  const termsByNormalizedValue = new Map();

  services.forEach((service, serviceIndex) => {
    addTerm(termsByNormalizedValue, service?.code, {
      serviceIndex,
      source: 'canonical',
      field: 'code'
    });
    addTerm(termsByNormalizedValue, service?.name, {
      serviceIndex,
      source: 'canonical',
      field: 'name'
    });
    (Array.isArray(service?.aliases) ? service.aliases : []).forEach((alias) => {
      addTerm(termsByNormalizedValue, alias, {
        serviceIndex,
        source: 'alias',
        field: 'aliases'
      });
    });
  });

  return Array.from(termsByNormalizedValue.entries())
    .map(([normalizedValue, terms]) => {
      const serviceIndexes = Array.from(new Set(terms.map((term) => term.serviceIndex)));
      if (serviceIndexes.length < 2) return null;

      const hasAlias = terms.some((term) => term.source === 'alias');
      if (!hasAlias && terms.every((term) => term.source === 'canonical')) {
        return {
          code: 'canonical-collision',
          type: 'canonical-collision',
          normalizedValue,
          serviceIndexes,
          terms,
          message: `El término canónico "${terms[0].value}" coincide entre varios servicios.`
        };
      }

      return {
        code: 'term-collision',
        type: 'alias-canonical-collision',
        normalizedValue,
        serviceIndexes,
        terms,
        message: `El alias o término canónico "${terms[0].value}" coincide entre varios servicios.`
      };
    })
    .filter(Boolean);
};

export const normalizeDictionaryService = (service) => {
  if (!isRecord(service)) return service;

  return {
    nomenclatura: service.code,
    nombreOriginal: service.name,
    aliases: Array.isArray(service.aliases)
      ? service.aliases
        .map((alias) => (typeof alias === 'string' ? alias.trim() : ''))
        .filter(Boolean)
      : [],
    tipoCobro: service.chargeType,
    activo: service.active,
    description: service.description,
    measurementBasis: service.measurementBasis,
    requiresReview: service.requiresReview
  };
};

export const normalizeDictionaryServices = (services = []) => (
  Array.isArray(services) ? services.map(normalizeDictionaryService) : []
);

export const normalizeImportedService = normalizeDictionaryService;
export const normalizeImportedServices = normalizeDictionaryServices;

export const validateServiceDictionary = (value) => {
  const errors = [];
  const services = isRecord(value) && Array.isArray(value.services) ? value.services : [];

  if (!isRecord(value)) {
    addError(errors, 'invalid-schema', '', 'El diccionario debe ser un objeto JSON.');
  } else {
    if (!hasOwn(value, 'schemaVersion')) {
      addError(errors, 'missing-field', 'schemaVersion', 'Falta el campo requerido "schemaVersion".');
    } else if (value.schemaVersion !== SERVICE_DICTIONARY_SCHEMA_VERSION) {
      addError(
        errors,
        'invalid-version',
        'schemaVersion',
        `La versión "${value.schemaVersion}" no es compatible. Se esperaba "${SERVICE_DICTIONARY_SCHEMA_VERSION}".`
      );
    }

    if (!hasOwn(value, 'dictionary')) {
      addError(errors, 'missing-field', 'dictionary', 'Falta el campo requerido "dictionary".');
    } else if (!isRecord(value.dictionary)) {
      addError(errors, 'invalid-schema', 'dictionary', 'El campo "dictionary" debe ser un objeto.');
    } else {
      DICTIONARY_REQUIRED_FIELDS.forEach((field) => {
        validateStringField(value.dictionary, field, `dictionary.${field}`, errors);
      });
      validateBooleanField(value.dictionary, 'autoload', 'dictionary.autoload', errors);

      if (hasOwn(value.dictionary, 'autoload') && value.dictionary.autoload !== false) {
        addError(
          errors,
          'autoload-required',
          'dictionary.autoload',
          'El diccionario debe declarar "autoload: false".'
        );
      }
    }

    if (!hasOwn(value, 'services')) {
      addError(errors, 'missing-field', 'services', 'Falta el campo requerido "services".');
    } else if (!Array.isArray(value.services)) {
      addError(errors, 'invalid-type', 'services', 'El campo "services" debe ser un arreglo.');
    } else {
      value.services.forEach((service, serviceIndex) => validateService(service, serviceIndex, errors));
    }
  }

  addDuplicateErrors(services, 'name', 'duplicate-name', 'nombre', errors);
  addDuplicateErrors(services, 'code', 'duplicate-code', 'código', errors);
  const collisions = findTermCollisions(services);
  const issues = [...errors, ...collisions];

  return {
    valid: issues.length === 0,
    ok: issues.length === 0,
    errors,
    collisions,
    issues
  };
};

export const parseServiceDictionary = (source) => {
  let value = source;

  if (typeof source === 'string') {
    try {
      value = JSON.parse(source);
    } catch {
      const invalidJson = {
        code: 'invalid-json',
        type: 'invalid-json',
        path: '',
        message: 'El contenido no es un JSON válido.'
      };
      return {
        valid: false,
        ok: false,
        errors: [invalidJson],
        collisions: [],
        issues: [invalidJson],
        dictionary: null,
        services: [],
        normalizedServices: []
      };
    }
  }

  const validation = validateServiceDictionary(value);
  const normalizedServices = normalizeDictionaryServices(value?.services);

  return {
    ...validation,
    dictionary: value,
    services: normalizedServices,
    normalizedServices
  };
};
