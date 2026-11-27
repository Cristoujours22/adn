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

export const SUPPORTED_PLAN_SCOPES = [
  'outer-contour',
  'internal-contour',
  'surface',
  'edge',
  'internal-edge'
];

export const SUPPORTED_PLAN_MODES = ['fixed', 'selectable', 'custom'];

export const SUPPORTED_GEOMETRY_PRIMITIVES = [
  'point',
  'line',
  'circle',
  'arc',
  'rounded-corners',
  'chamfer',
  'slot',
  'pocket',
  'path',
  'edge-treatment'
];

export const SUPPORTED_GEOMETRY_PARAMETER_KINDS = [
  'length',
  'width',
  'depth',
  'radius',
  'diameter',
  'angle',
  'count',
  'spacing',
  'position-x',
  'position-y',
  'edge',
  'face',
  'direction',
  'path'
];

export const SUPPORTED_GEOMETRY_UNITS = ['mm', 'degrees', 'count', 'none'];

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

const validateAllowedValue = (value, path, allowedValues, errors) => {
  if (typeof value !== 'string' || !allowedValues.includes(value)) {
    addError(
      errors,
      'invalid-value',
      path,
      `El valor de "${path}" no está soportado.`,
      { allowedValues }
    );
  }
};

const addDuplicateNestedIdErrors = (items, path, code, errors) => {
  const ids = new Map();
  items.forEach((item, index) => {
    const normalizedId = normalizeServiceText(item?.id);
    if (!normalizedId) return;
    const indexes = ids.get(normalizedId) || [];
    indexes.push(index);
    ids.set(normalizedId, indexes);
  });

  ids.forEach((indexes, normalizedId) => {
    if (indexes.length < 2) return;
    addError(
      errors,
      code,
      path,
      `El identificador "${normalizedId}" está duplicado en "${path}".`,
      { normalizedValue: normalizedId, indexes }
    );
  });
};

const validateGeometryParameter = (parameter, parameterIndex, geometryPath, errors) => {
  const path = `${geometryPath}.parameters[${parameterIndex}]`;
  if (!isRecord(parameter)) {
    addError(errors, 'invalid-schema', path, `El elemento "${path}" debe ser un objeto.`);
    return;
  }

  ['id', 'label', 'kind', 'unit'].forEach((field) => {
    validateStringField(parameter, field, `${path}.${field}`, errors);
  });
  validateBooleanField(parameter, 'required', `${path}.required`, errors);

  if (typeof parameter.kind === 'string') {
    validateAllowedValue(
      parameter.kind,
      `${path}.kind`,
      SUPPORTED_GEOMETRY_PARAMETER_KINDS,
      errors
    );
  }
  if (typeof parameter.unit === 'string') {
    validateAllowedValue(parameter.unit, `${path}.unit`, SUPPORTED_GEOMETRY_UNITS, errors);
  }
};

const validateGeometry = (geometry, geometryIndex, profilePath, errors) => {
  const path = `${profilePath}.geometries[${geometryIndex}]`;
  if (!isRecord(geometry)) {
    addError(errors, 'invalid-schema', path, `El elemento "${path}" debe ser un objeto.`);
    return;
  }

  ['id', 'label', 'primitive'].forEach((field) => {
    validateStringField(geometry, field, `${path}.${field}`, errors);
  });

  if (typeof geometry.primitive === 'string') {
    validateAllowedValue(
      geometry.primitive,
      `${path}.primitive`,
      SUPPORTED_GEOMETRY_PRIMITIVES,
      errors
    );
  }

  if (!hasOwn(geometry, 'parameters')) {
    addError(errors, 'missing-field', `${path}.parameters`, `Falta el campo requerido "${path}.parameters".`);
  } else if (!Array.isArray(geometry.parameters)) {
    addError(errors, 'invalid-type', `${path}.parameters`, `El campo "${path}.parameters" debe ser un arreglo.`);
  } else {
    geometry.parameters.forEach((parameter, parameterIndex) => {
      validateGeometryParameter(parameter, parameterIndex, path, errors);
    });
    addDuplicateNestedIdErrors(
      geometry.parameters,
      `${path}.parameters`,
      'duplicate-parameter-id',
      errors
    );
  }
};

const validatePlanProfile = (profile, servicePath, errors) => {
  const path = `${servicePath}.planProfile`;
  if (!isRecord(profile)) {
    addError(errors, 'invalid-schema', path, `El campo "${path}" debe ser un objeto.`);
    return;
  }

  validateStringField(profile, 'scope', `${path}.scope`, errors);
  validateStringField(profile, 'mode', `${path}.mode`, errors);

  if (typeof profile.scope === 'string') {
    validateAllowedValue(profile.scope, `${path}.scope`, SUPPORTED_PLAN_SCOPES, errors);
  }
  if (typeof profile.mode === 'string') {
    validateAllowedValue(profile.mode, `${path}.mode`, SUPPORTED_PLAN_MODES, errors);
  }

  if (!hasOwn(profile, 'geometries')) {
    addError(errors, 'missing-field', `${path}.geometries`, `Falta el campo requerido "${path}.geometries".`);
    return;
  }
  if (!Array.isArray(profile.geometries)) {
    addError(errors, 'invalid-type', `${path}.geometries`, `El campo "${path}.geometries" debe ser un arreglo.`);
    return;
  }

  if (profile.geometries.length === 0) {
    addError(
      errors,
      'invalid-geometry-count',
      `${path}.geometries`,
      'El perfil de plano debe declarar al menos una geometría.'
    );
  }
  if (profile.mode === 'fixed' && profile.geometries.length !== 1) {
    addError(
      errors,
      'invalid-geometry-count',
      `${path}.geometries`,
      'Un perfil fijo debe declarar exactamente una geometría.'
    );
  }

  profile.geometries.forEach((geometry, geometryIndex) => {
    validateGeometry(geometry, geometryIndex, path, errors);
  });
  addDuplicateNestedIdErrors(
    profile.geometries,
    `${path}.geometries`,
    'duplicate-geometry-id',
    errors
  );
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

  if (hasOwn(service, 'planProfile')) {
    validatePlanProfile(service.planProfile, path, errors);
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

const normalizePlanProfile = (profile) => ({
  scope: profile.scope,
  mode: profile.mode,
  geometries: Array.isArray(profile.geometries)
    ? profile.geometries.map((geometry) => ({
      id: geometry.id,
      label: geometry.label,
      primitive: geometry.primitive,
      parameters: Array.isArray(geometry.parameters)
        ? geometry.parameters.map((parameter) => ({
          id: parameter.id,
          label: parameter.label,
          kind: parameter.kind,
          unit: parameter.unit,
          required: parameter.required
        }))
        : []
    }))
    : []
});

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
    requiresReview: service.requiresReview,
    ...(isRecord(service.planProfile) ? { planProfile: normalizePlanProfile(service.planProfile) } : {})
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
