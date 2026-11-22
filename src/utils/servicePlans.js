import { findServiceMatches } from './serviceMatching';

export const SERVICE_PLAN_VERSION = 1;

const asPositiveInteger = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const asMillimetres = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const cloneValue = (value) => {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
};

const createUnitIndexes = (quantity) => Array.from({ length: quantity }, (_, index) => index + 1);

const createDetectedOperations = (detail, services) => {
  const matches = findServiceMatches(detail, services).matches || [];
  const detectedByService = new Map();

  matches.forEach((match) => {
    const current = detectedByService.get(match.serviceId);
    if (current) {
      current.detectedQuantity += match.quantity || 1;
      return;
    }

    detectedByService.set(match.serviceId, {
      id: `operation-${detectedByService.size + 1}`,
      serviceId: match.serviceId,
      detectedQuantity: match.quantity || 1,
      geometryId: null,
      parameters: {},
      planProfile: cloneValue(match.service?.planProfile) || null
    });
  });

  return Array.from(detectedByService.values());
};

export const canOpenServicePlan = (row, services = []) => {
  const quantity = asPositiveInteger(row?.cant, 1);
  if (quantity > 1) return true;
  return findServiceMatches(row?.detalle, services).matches.length > 0;
};

export const createServicePlanSeed = (row, services = []) => {
  const quantity = asPositiveInteger(row?.cant, 1);

  return {
    version: SERVICE_PLAN_VERSION,
    rowId: row?.id || null,
    piece: {
      quantity,
      lengthMm: asMillimetres(row?.largo),
      widthMm: asMillimetres(row?.ancho),
      edges: {
        l1: row?.l1 == null ? '' : String(row.l1),
        l2: row?.l2 == null ? '' : String(row.l2),
        a1: row?.a1 == null ? '' : String(row.a1),
        a2: row?.a2 == null ? '' : String(row.a2)
      }
    },
    groups: [
      {
        id: 'group-1',
        unitIndexes: createUnitIndexes(quantity),
        operations: createDetectedOperations(row?.detalle, services)
      }
    ]
  };
};

const getNextGroupNumber = (groups) => groups.reduce((highest, group) => {
  const match = String(group?.id || '').match(/^group-(\d+)$/);
  return match ? Math.max(highest, Number.parseInt(match[1], 10)) : highest;
}, 0) + 1;

export const splitPlanUnits = (plan, selectedUnitIndexes = []) => {
  const selectedUnits = new Set(
    selectedUnitIndexes
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value) && value > 0)
  );
  if (selectedUnits.size === 0) return cloneValue(plan);

  const nextPlan = cloneValue(plan);
  let nextGroupNumber = getNextGroupNumber(nextPlan.groups || []);
  const nextGroups = [];

  (nextPlan.groups || []).forEach((group) => {
    const selected = group.unitIndexes.filter((unitIndex) => selectedUnits.has(unitIndex));
    const remaining = group.unitIndexes.filter((unitIndex) => !selectedUnits.has(unitIndex));

    if (selected.length === 0 || remaining.length === 0) {
      nextGroups.push(group);
      return;
    }

    nextGroups.push({ ...group, unitIndexes: remaining });
    nextGroups.push({
      ...cloneValue(group),
      id: `group-${nextGroupNumber++}`,
      unitIndexes: selected
    });
  });

  return { ...nextPlan, groups: nextGroups };
};

export const applyServicePlanToDespieces = (
  despieces = [],
  activeDespieceId,
  rowIndex,
  plan
) => despieces.map((despiece) => {
  if (despiece?.id !== activeDespieceId) return despiece;
  return {
    ...despiece,
    filas: (despiece.filas || []).map((row, currentRowIndex) => (
      currentRowIndex === rowIndex ? { ...row, servicePlan: cloneValue(plan) } : row
    ))
  };
});

const getOperationsSignature = (group) => JSON.stringify(group?.operations || []);

export const mergeIdenticalPlanGroups = (plan) => {
  const nextPlan = cloneValue(plan);
  const groupsBySignature = new Map();

  (nextPlan.groups || []).forEach((group) => {
    const signature = getOperationsSignature(group);
    const existing = groupsBySignature.get(signature);
    if (existing) {
      existing.unitIndexes = Array.from(new Set([
        ...existing.unitIndexes,
        ...group.unitIndexes
      ])).sort((first, second) => first - second);
      return;
    }
    groupsBySignature.set(signature, group);
  });

  return {
    ...nextPlan,
    groups: Array.from(groupsBySignature.values())
      .sort((first, second) => (first.unitIndexes[0] || 0) - (second.unitIndexes[0] || 0))
  };
};
