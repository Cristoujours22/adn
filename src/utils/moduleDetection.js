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

const getDetailValue = (item) => (
  item && typeof item === 'object' ? item.detalle : item
);

const uniqueKeys = (keys) => [...new Set(keys.filter(Boolean))];

export const getModuleDetectionPreview = (details = [], configuration) => {
  const values = Array.isArray(details) ? details : [details];
  const entries = values.map((item) => {
    const detail = getDetailValue(item);
    return {
      detail,
      moduleKey: getModuleKey(detail, configuration)
    };
  });

  return {
    entries,
    recognizedModuleKeys: uniqueKeys(entries.map((entry) => entry.moduleKey))
  };
};

export const findModuleDetectionConflicts = ({
  details = [],
  currentConfig,
  nextConfig,
  superGroups = []
} = {}) => {
  const previousPreview = getModuleDetectionPreview(details, currentConfig);
  const nextPreview = getModuleDetectionPreview(details, nextConfig);
  const nextKeys = new Set(nextPreview.recognizedModuleKeys);
  const lostModuleKeys = previousPreview.recognizedModuleKeys.filter((key) => !nextKeys.has(key));
  const lostKeySet = new Set(lostModuleKeys);

  return {
    previouslyRecognizedModuleKeys: previousPreview.recognizedModuleKeys,
    nextRecognizedModuleKeys: nextPreview.recognizedModuleKeys,
    lostModuleKeys,
    affectedSuperGroups: (Array.isArray(superGroups) ? superGroups : []).filter((group) => (
      Array.isArray(group?.moduleKeys) && group.moduleKeys.some((key) => lostKeySet.has(key))
    )),
    hasConflicts: lostModuleKeys.length > 0
  };
};

export const getProjectModuleDetectionConfig = (projectData = {}) => {
  const storedConfig = projectData && typeof projectData === 'object'
    ? projectData.moduleDetectionConfig
    : null;

  return normalizeModuleDetectionConfig(storedConfig || DEFAULT_MODULE_DETECTION_CONFIG);
};

export const getUserModuleDetectionConfig = (userSettings = {}) => {
  const storedConfig = userSettings && typeof userSettings === 'object'
    ? userSettings.moduleDetectionDefault || userSettings.moduleDetectionConfig
    : null;

  return normalizeModuleDetectionConfig(storedConfig || DEFAULT_MODULE_DETECTION_CONFIG);
};

export const buildModuleDetectionMetadata = (configuration) => ({
  moduleDetectionConfig: normalizeModuleDetectionConfig(configuration)
});
