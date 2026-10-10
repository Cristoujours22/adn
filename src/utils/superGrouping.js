import { normalizeModuleDetectionConfig, parseModule } from './moduleDetection';

export const MIN_SUPER_GROUP_MODULES = 2;
const NESTED_GROUP_FIELDS = ['groups', 'superGroups', 'children'];

const asArray = (value) => Array.isArray(value) ? value : [];
const getRowId = (row) => row && row.id;
const getGroupId = (group) => group && (group.id ?? group.groupId ?? group.key ?? group.label);
const getModuleConfiguration = (configuration) => normalizeModuleDetectionConfig(configuration);

const hasNestedGroups = (group) => NESTED_GROUP_FIELDS.some((field) => (
  group && Object.prototype.hasOwnProperty.call(group, field) && group[field] != null
));

const unique = (values) => [...new Set(values)];

const serialize = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

export const getRowsFingerprint = (rows = []) => serialize(asArray(rows).map((row) => [
  getRowId(row),
  row && row.detalle
]));

const getGroupsFingerprint = (groups = []) => serialize(asArray(groups).map((group) => ({
  id: getGroupId(group),
  moduleKeys: asArray(group && group.moduleKeys)
})));

const buildModuleIndex = (rows, configuration) => {
  const modules = [];
  const byKey = new Map();
  const normalizedConfiguration = getModuleConfiguration(configuration);

  asArray(rows).forEach((row, sourcePosition) => {
    const parsed = parseModule(row && row.detalle, normalizedConfiguration);
    if (!parsed) return;

    let module = byKey.get(parsed.moduleKey);
    if (!module) {
      module = {
        moduleKey: parsed.moduleKey,
        label: parsed.moduleKey,
        rows: [],
        rowIds: [],
        sourcePositions: []
      };
      byKey.set(parsed.moduleKey, module);
      modules.push(module);
    }

    module.rows.push(row);
    module.rowIds.push(getRowId(row));
    module.sourcePositions.push(sourcePosition);
  });

  return { modules, byKey, configuration: normalizedConfiguration };
};

const toPublicModule = (module) => ({
  moduleKey: module.moduleKey,
  label: module.label,
  pieceCount: module.rows.length,
  rowIds: [...module.rowIds],
  sourcePositions: [...module.sourcePositions],
  rows: [...module.rows]
});

const toPreviewModule = (module) => ({
  moduleKey: module.moduleKey,
  label: module.label,
  pieceCount: module.pieceCount,
  rowIds: [...module.rowIds],
  sourcePositions: [...module.sourcePositions]
});

const moduleSignatures = (modules) => serialize(asArray(modules).map((module) => ({
  moduleKey: module.moduleKey,
  rowIds: module.rowIds,
  sourcePositions: module.sourcePositions,
  pieceCount: module.pieceCount
})));

const readRowsAndSelection = (rowsOrInput, selectedRowIds, configuration) => {
  if (!Array.isArray(rowsOrInput) && rowsOrInput && typeof rowsOrInput === 'object') {
    return {
      rows: rowsOrInput.rows || rowsOrInput.filas || [],
      selectedRowIds: rowsOrInput.selectedRowIds || rowsOrInput.rowIds || [],
      configuration: rowsOrInput.configuration || rowsOrInput.moduleDetectionConfig
    };
  }

  return { rows: rowsOrInput, selectedRowIds, configuration };
};

export const resolveSelectedModules = (rowsOrInput = [], selectedRowIds, configuration) => {
  const input = readRowsAndSelection(rowsOrInput, selectedRowIds, configuration);
  const selectedIds = new Set(asArray(input.selectedRowIds));
  const index = buildModuleIndex(input.rows, input.configuration);

  return index.modules
    .filter((module) => module.rowIds.some((rowId) => selectedIds.has(rowId)))
    .map(toPublicModule);
};

const getValidationErrors = (selectedModules, rows, selectedRowIds, existingGroups, groupId) => {
  const errors = [];
  const selectedIds = asArray(selectedRowIds);
  const moduleKeys = new Set(selectedModules.map((module) => module.moduleKey));

  if (selectedModules.length < MIN_SUPER_GROUP_MODULES) {
    errors.push('A super-group requires at least two modules.');
  }
  if (selectedModules.length === 0 && selectedIds.length > 0) {
    errors.push('The selection contains no detected modules.');
  }

  const knownRowIds = new Set(asArray(rows).map(getRowId));
  const unresolvedRowIds = selectedIds.filter((rowId) => !knownRowIds.has(rowId));
  if (unresolvedRowIds.length) errors.push('The selection contains missing row IDs.');

  asArray(existingGroups).forEach((group) => {
    if (getGroupId(group) === groupId) return;
    asArray(group && group.moduleKeys).forEach((moduleKey) => {
      if (moduleKeys.has(moduleKey)) {
        errors.push(`Module ${moduleKey} already belongs to another super-group.`);
      }
    });
  });

  return errors;
};

const normalizePreviewOptions = (options = {}) => (
  options && typeof options === 'object' ? options : {}
);

export const createSuperGroupPreview = (
  rowsOrInput = [],
  selectedRowIds,
  configuration,
  options = {}
) => {
  let input;
  let previewOptions;
  if (!Array.isArray(rowsOrInput) && rowsOrInput && typeof rowsOrInput === 'object') {
    input = readRowsAndSelection(rowsOrInput);
    previewOptions = { ...rowsOrInput, ...normalizePreviewOptions(options) };
  } else {
    input = readRowsAndSelection(rowsOrInput, selectedRowIds, configuration);
    previewOptions = normalizePreviewOptions(options);
  }

  const rows = asArray(input.rows);
  const normalizedConfiguration = getModuleConfiguration(input.configuration);
  const selectedIds = asArray(input.selectedRowIds);
  const selectedModules = resolveSelectedModules(rows, selectedIds, normalizedConfiguration);
  const modules = selectedModules.map(toPreviewModule);
  const selectedModuleKeys = modules.map((module) => module.moduleKey);
  const existingSuperGroups = asArray(
    previewOptions.existingSuperGroups || previewOptions.superGroups
  );
  const groupId = previewOptions.groupId
    || previewOptions.superGroupId
    || `super-group:${selectedModuleKeys.join('|')}`;
  const label = previewOptions.label || selectedModuleKeys.join(' + ');
  const firstSelectedPosition = modules.length
    ? Math.min(...modules.flatMap((module) => module.sourcePositions))
    : null;
  const validationErrors = getValidationErrors(
    selectedModules,
    rows,
    selectedIds,
    existingSuperGroups,
    groupId
  );

  return {
    version: 1,
    kind: 'super-group-preview',
    groupId,
    label,
    selectedRowIds: [...selectedIds],
    selectedModuleKeys,
    modules,
    firstSelectedPosition,
    sourceRowIds: rows.map(getRowId),
    sourceFingerprint: getRowsFingerprint(rows),
    configuration: normalizedConfiguration,
    existingSuperGroups: existingSuperGroups.map((group) => ({ ...group, moduleKeys: [...asArray(group.moduleKeys)] })),
    existingGroupsFingerprint: getGroupsFingerprint(existingSuperGroups),
    validationErrors,
    canApply: validationErrors.length === 0 && selectedModules.length >= MIN_SUPER_GROUP_MODULES
  };
};

export const validateSuperGroups = (superGroups = []) => {
  const groups = asArray(superGroups);
  const errors = [];
  const seenModuleKeys = new Set();

  if (!Array.isArray(superGroups)) {
    errors.push('Super-groups must be an array.');
    return { valid: false, errors };
  }

  groups.forEach((group, groupIndex) => {
    if (!group || typeof group !== 'object') {
      errors.push(`Super-group ${groupIndex} is invalid.`);
      return;
    }
    if (hasNestedGroups(group)) {
      errors.push(`Super-group ${groupIndex} cannot contain nested groups.`);
    }

    const keys = asArray(group.moduleKeys);
    const uniqueKeys = unique(keys);
    if (keys.length < MIN_SUPER_GROUP_MODULES) {
      errors.push(`Super-group ${groupIndex} requires at least two modules.`);
    }
    if (uniqueKeys.length !== keys.length) {
      errors.push(`Super-group ${groupIndex} contains duplicate module membership.`);
    }
    if (keys.some((moduleKey) => typeof moduleKey !== 'string' || !moduleKey.trim())) {
      errors.push(`Super-group ${groupIndex} contains an invalid module key.`);
    }
    uniqueKeys.forEach((moduleKey) => {
      if (seenModuleKeys.has(moduleKey)) {
        errors.push(`Module ${moduleKey} belongs to more than one super-group.`);
      }
      seenModuleKeys.add(moduleKey);
    });
  });

  return { valid: errors.length === 0, errors };
};

const staleError = () => new Error('Cannot apply stale super-group preview.');

const assertFreshPreview = (rows, preview, configuration) => {
  if (!preview || preview.kind !== 'super-group-preview') throw staleError();
  if (getRowsFingerprint(rows) !== preview.sourceFingerprint) throw staleError();
  if (serialize(getModuleConfiguration(configuration)) !== serialize(preview.configuration)) throw staleError();

  const currentModules = resolveSelectedModules(rows, preview.selectedRowIds, configuration)
    .map(toPreviewModule);
  if (moduleSignatures(currentModules) !== moduleSignatures(preview.modules)) throw staleError();
};

const getExistingGroups = (options, preview) => {
  if (Object.prototype.hasOwnProperty.call(options, 'existingSuperGroups')) return asArray(options.existingSuperGroups);
  if (Object.prototype.hasOwnProperty.call(options, 'superGroups')) return asArray(options.superGroups);
  return asArray(preview.existingSuperGroups);
};

export const applySuperGroupPreview = (rowsOrInput, preview, options = {}) => {
  let rows = rowsOrInput;
  let nextPreview = preview;
  let applyOptions = normalizePreviewOptions(options);
  if (!Array.isArray(rowsOrInput) && rowsOrInput && typeof rowsOrInput === 'object') {
    rows = rowsOrInput.rows || rowsOrInput.filas || [];
    nextPreview = rowsOrInput.preview || preview;
    applyOptions = { ...rowsOrInput, ...applyOptions };
  }

  rows = asArray(rows);
  const configuration = applyOptions.configuration
    || applyOptions.moduleDetectionConfig
    || nextPreview?.configuration;
  assertFreshPreview(rows, nextPreview, configuration);
  if (!nextPreview.canApply) {
    throw new Error(nextPreview.validationErrors.join(' ') || 'Super-group preview cannot be applied.');
  }

  const existingGroups = getExistingGroups(applyOptions, nextPreview);
  const validation = validateSuperGroups(existingGroups);
  if (!validation.valid) throw new Error(validation.errors.join(' '));
  if (getGroupsFingerprint(existingGroups) !== nextPreview.existingGroupsFingerprint) throw staleError();

  const groupId = nextPreview.groupId;
  existingGroups.forEach((group) => {
    if (getGroupId(group) === groupId) return;
    asArray(group.moduleKeys).forEach((moduleKey) => {
      if (nextPreview.selectedModuleKeys.includes(moduleKey)) {
        throw new Error(`Module ${moduleKey} already belongs to another super-group.`);
      }
    });
  });

  const index = buildModuleIndex(rows, configuration);
  const selectedKeySet = new Set(nextPreview.selectedModuleKeys);
  const selectedRows = nextPreview.selectedModuleKeys.flatMap((moduleKey) => index.byKey.get(moduleKey).rows);
  const firstPosition = nextPreview.firstSelectedPosition;
  const unaffectedRows = rows.filter((row) => {
    const parsed = parseModule(row && row.detalle, configuration);
    return !parsed || !selectedKeySet.has(parsed.moduleKey);
  });
  const unaffectedBefore = rows.slice(0, firstPosition).filter((row) => {
    const parsed = parseModule(row && row.detalle, configuration);
    return !parsed || !selectedKeySet.has(parsed.moduleKey);
  }).length;
  const reorderedRows = [
    ...unaffectedRows.slice(0, unaffectedBefore),
    ...selectedRows,
    ...unaffectedRows.slice(unaffectedBefore)
  ];
  const existingGroup = existingGroups.find((group) => getGroupId(group) === groupId);
  const nextGroup = {
    ...(existingGroup || {}),
    id: groupId,
    label: nextPreview.label,
    moduleKeys: [...nextPreview.selectedModuleKeys]
  };
  const nextSuperGroups = [
    ...existingGroups.filter((group) => getGroupId(group) !== groupId),
    nextGroup
  ];

  return { rows: reorderedRows, superGroups: nextSuperGroups };
};

export const reconcileSuperGroups = (rows = [], superGroups = [], configuration) => {
  if (!Array.isArray(rows) && rows && typeof rows === 'object') {
    const input = rows;
    rows = input.rows || input.filas || [];
    superGroups = input.superGroups || input.groups || [];
    configuration = input.configuration || input.moduleDetectionConfig;
  }

  const availableModuleKeys = new Set(buildModuleIndex(rows, configuration).modules.map((module) => module.moduleKey));
  const claimedModuleKeys = new Set();
  const reconciled = [];

  asArray(superGroups).forEach((group) => {
    if (!group || typeof group !== 'object' || hasNestedGroups(group)) return;
    const moduleKeys = unique(asArray(group.moduleKeys)).filter((moduleKey) => (
      typeof moduleKey === 'string'
      && moduleKey.trim()
      && availableModuleKeys.has(moduleKey)
      && !claimedModuleKeys.has(moduleKey)
    ));
    if (moduleKeys.length < MIN_SUPER_GROUP_MODULES) return;

    moduleKeys.forEach((moduleKey) => claimedModuleKeys.add(moduleKey));
    reconciled.push({ ...group, moduleKeys });
  });

  return reconciled;
};

export const getRowsForSuperGroup = (rows = [], group, configuration) => {
  const moduleKeys = new Set(asArray(group && group.moduleKeys));
  return asArray(rows).filter((row) => {
    const parsed = parseModule(row && row.detalle, configuration);
    return parsed && moduleKeys.has(parsed.moduleKey);
  });
};

export const ungroupSuperGroup = (superGroups = [], groupId) => asArray(superGroups)
  .filter((group) => getGroupId(group) !== groupId);

export const removeSuperGroup = ungroupSuperGroup;
export const buildSuperGroupPreview = createSuperGroupPreview;
export const applySuperGroup = applySuperGroupPreview;
export const reconcileSuperGroupMembership = reconcileSuperGroups;
