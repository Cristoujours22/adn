const DEFAULT_DESIGN_PREFIXES = Object.freeze(['D']);

export const DEFAULT_MODULE_DETECTION_CONFIG = Object.freeze({
  designPrefixes: DEFAULT_DESIGN_PREFIXES,
  groupIdPosition: 'afterDesign'
});

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizePrefixes = (value) => {
  let values = [];
  if (Array.isArray(value)) {
    values = value;
  } else if (typeof value === 'string') {
    values = value.split(/[\s,]+/);
  }

  const prefixes = values
    .map((prefix) => typeof prefix === 'string' ? prefix.trim().toUpperCase() : '')
    .filter((prefix) => /^[A-Z]+$/.test(prefix));

  return [...new Set(prefixes)];
};

const normalizePosition = (config = {}) => {
  if (config.groupBeforeDesign === true || config.groupIdBeforeDesign === true) {
    return 'beforeDesign';
  }

  const rawPosition = config.groupIdPosition ?? config.groupPosition ?? config.moduleOrder;
  if (typeof rawPosition === 'boolean') {
    return rawPosition ? 'beforeDesign' : 'afterDesign';
  }

  const position = String(rawPosition || 'afterDesign')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

  if (['before', 'beforedesign', 'groupbeforedesign', 'groupfirst'].includes(position)) {
    return 'beforeDesign';
  }

  if (['either', 'any', 'both'].includes(position)) {
    return 'either';
  }

  return 'afterDesign';
};

export const normalizeModuleDetectionConfig = (config = {}) => {
  const source = config && typeof config === 'object' ? config : {};
  const configuredPrefixes = normalizePrefixes(
    source.designPrefixes ?? source.prefixes ?? source.designPrefix
  );

  return {
    designPrefixes: configuredPrefixes.length ? configuredPrefixes : [...DEFAULT_DESIGN_PREFIXES],
    groupIdPosition: normalizePosition(source)
  };
};

const buildModulePattern = (designPrefixes, groupIdPosition) => {
  const prefixPattern = designPrefixes
    .slice()
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp)
    .join('|');
  const safeBoundaryCharacter = '\\p{L}\\p{N}_';
  const prefixAndDesign = `(${prefixPattern})(\\d+)`;
  const group = '(\\d+)';
  const separator = '\\s*-\\s*';
  const start = `(?:^|[^${safeBoundaryCharacter}])`;
  const end = `(?![${safeBoundaryCharacter}])`;

  const afterDesign = `${start}${prefixAndDesign}${separator}${group}${end}`;
  const beforeDesign = `${start}${group}${separator}${prefixAndDesign}${end}`;

  if (groupIdPosition === 'beforeDesign') {
    return { expression: beforeDesign, groupIdIndex: 1, prefixIndex: 2, designNumberIndex: 3, position: 'beforeDesign' };
  }

  return { expression: afterDesign, groupIdIndex: 3, prefixIndex: 1, designNumberIndex: 2, position: 'afterDesign' };
};

const parseWithPosition = (detail, config, position) => {
  const pattern = buildModulePattern(config.designPrefixes, position);
  const match = new RegExp(pattern.expression, 'iu').exec(detail);
  if (!match) return null;

  const designPrefix = match[pattern.prefixIndex].toUpperCase();
  const designNumber = match[pattern.designNumberIndex];
  const groupId = match[pattern.groupIdIndex];

  return {
    moduleKey: `${designPrefix}${designNumber}-${groupId}`,
    designPrefix,
    designNumber,
    groupId,
    groupIdPosition: pattern.position
  };
};

export const parseModule = (detalle, configuration) => {
  if (detalle == null) return null;

  const detail = String(detalle);
  const config = normalizeModuleDetectionConfig(configuration);
  const positions = config.groupIdPosition === 'either'
    ? ['afterDesign', 'beforeDesign']
    : [config.groupIdPosition];

  for (const position of positions) {
    const parsed = parseWithPosition(detail, config, position);
    if (parsed) return parsed;
  }

  return null;
};

export const getModuleKey = (detalle, configuration) => parseModule(detalle, configuration)?.moduleKey || null;
