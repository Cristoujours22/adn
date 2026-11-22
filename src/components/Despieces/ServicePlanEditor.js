import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  mergeIdenticalPlanGroups,
  splitPlanUnits
} from '../../utils/servicePlans';
import ServicePlanCanvas from './ServicePlanCanvas';
import styles from './ServicePlanEditor.module.css';

const clonePlan = (plan) => JSON.parse(JSON.stringify(plan));

const formatUnitIndexes = (unitIndexes = []) => {
  if (unitIndexes.length === 1) return `Pieza ${unitIndexes[0]}`;
  const sorted = [...unitIndexes].sort((first, second) => first - second);
  const consecutive = sorted.every((value, index) => index === 0 || value === sorted[index - 1] + 1);
  if (consecutive) return `Piezas ${sorted[0]}–${sorted[sorted.length - 1]}`;
  return `Piezas ${sorted.join(', ')}`;
};

const getSelectedGroup = (plan, groupId) => (
  plan?.groups?.find((group) => group.id === groupId) || plan?.groups?.[0] || null
);

const getSelectedOperation = (group, operationId) => (
  group?.operations?.find((operation) => operation.id === operationId)
  || group?.operations?.[0]
  || null
);

const updateOperation = (plan, groupId, operationId, updater) => ({
  ...plan,
  groups: plan.groups.map((group) => (
    group.id !== groupId
      ? group
      : {
        ...group,
        operations: group.operations.map((operation) => (
          operation.id === operationId ? updater(operation) : operation
        ))
      }
  ))
});

const ServicePlanEditor = ({
  isOpen,
  plan,
  row,
  onApply,
  onClose
}) => {
  const [draft, setDraft] = useState(() => (plan ? clonePlan(plan) : null));
  const [selectedGroupId, setSelectedGroupId] = useState(plan?.groups?.[0]?.id || null);
  const [selectedOperationId, setSelectedOperationId] = useState(
    plan?.groups?.[0]?.operations?.[0]?.id || null
  );
  const [selectedUnits, setSelectedUnits] = useState([]);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !plan) return;
    const nextDraft = clonePlan(plan);
    setDraft(nextDraft);
    setSelectedGroupId(nextDraft.groups?.[0]?.id || null);
    setSelectedOperationId(nextDraft.groups?.[0]?.operations?.[0]?.id || null);
    setSelectedUnits([]);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
  }, [isOpen, plan]);

  const selectedGroup = getSelectedGroup(draft, selectedGroupId);
  const selectedOperation = getSelectedOperation(selectedGroup, selectedOperationId);
  const geometries = selectedOperation?.planProfile?.geometries || [];
  const selectedGeometry = geometries.find(
    (geometry) => geometry.id === selectedOperation?.geometryId
  ) || null;
  const hasPendingProfile = Boolean(
    selectedGroup?.operations?.some((operation) => !operation.planProfile)
  );
  const hasUnconfiguredGeometry = Boolean(
    selectedGroup?.operations?.some((operation) => (
      operation.planProfile && !operation.geometryId
    ))
  );
  const applyDisabled = Boolean(
    selectedGroup?.operations?.length > 0 && (hasPendingProfile || hasUnconfiguredGeometry)
  );

  const title = useMemo(() => {
    const detail = String(row?.detalle || '').trim();
    return detail ? `Plano de servicios · ${detail}` : 'Plano de servicios';
  }, [row?.detalle]);

  if (!isOpen || !draft) return null;

  const chooseGroup = (group) => {
    setSelectedGroupId(group.id);
    setSelectedOperationId(group.operations?.[0]?.id || null);
    setSelectedUnits([]);
  };

  const chooseGeometry = (geometryId) => {
    if (!selectedGroup || !selectedOperation) return;
    setDraft((current) => updateOperation(
      current,
      selectedGroup.id,
      selectedOperation.id,
      (operation) => ({ ...operation, geometryId: geometryId || null, parameters: {} })
    ));
  };

  const changeParameter = (parameterId, value) => {
    if (!selectedGroup || !selectedOperation) return;
    const parsedValue = value === '' ? '' : Number(value);
    setDraft((current) => updateOperation(
      current,
      selectedGroup.id,
      selectedOperation.id,
      (operation) => ({
        ...operation,
        parameters: {
          ...operation.parameters,
          [parameterId]: Number.isFinite(parsedValue) ? parsedValue : value
        }
      })
    ));
  };

  const toggleUnit = (unitIndex) => {
    setSelectedUnits((current) => (
      current.includes(unitIndex)
        ? current.filter((value) => value !== unitIndex)
        : [...current, unitIndex]
    ));
  };

  const splitSelectedUnits = () => {
    if (!selectedGroup || selectedUnits.length === 0) return;
    const nextDraft = splitPlanUnits(draft, selectedUnits);
    setDraft(nextDraft);
    setSelectedUnits([]);
  };

  const mergeGroups = () => {
    const nextDraft = mergeIdenticalPlanGroups(draft);
    setDraft(nextDraft);
    const nextGroup = nextDraft.groups?.[0] || null;
    setSelectedGroupId(nextGroup?.id || null);
    setSelectedOperationId(nextGroup?.operations?.[0]?.id || null);
    setSelectedUnits([]);
  };

  return (
    <aside
      aria-label={title}
      aria-modal="false"
      className={styles.drawer}
      role="dialog"
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Plano de servicios</p>
          <h2>{row?.detalle || 'Pieza sin detalle'}</h2>
          <p className={styles.dimensions}>
            {draft.piece.lengthMm} × {draft.piece.widthMm} mm · {draft.piece.quantity} {draft.piece.quantity === 1 ? 'pieza' : 'piezas'}
          </p>
        </div>
        <button ref={closeButtonRef} type="button" className={styles.close} onClick={onClose}>
          Cerrar
        </button>
      </header>

      <div className={styles.body}>
        <ServicePlanCanvas piece={draft.piece} operation={selectedOperation} />

        <section className={styles.section} aria-labelledby="service-plan-groups">
          <div className={styles.sectionHeading}>
            <h3 id="service-plan-groups">Aplicación por piezas</h3>
            <button type="button" className={styles.secondary} onClick={mergeGroups}>
              Reunir planos idénticos
            </button>
          </div>
          <div className={styles.groupTabs}>
            {draft.groups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={group.id === selectedGroup?.id ? styles.activeGroup : styles.group}
                onClick={() => chooseGroup(group)}
              >
                {formatUnitIndexes(group.unitIndexes)}
              </button>
            ))}
          </div>
          {selectedGroup && selectedGroup.unitIndexes.length > 1 && (
            <>
              <fieldset className={styles.units}>
                <legend>Unidades que tendrán un plano diferente</legend>
                {selectedGroup.unitIndexes.map((unitIndex) => (
                  <label key={unitIndex}>
                    <input
                      type="checkbox"
                      checked={selectedUnits.includes(unitIndex)}
                      onChange={() => toggleUnit(unitIndex)}
                    />
                    Pieza {unitIndex}
                  </label>
                ))}
              </fieldset>
              <button
                type="button"
                className={styles.secondary}
                disabled={selectedUnits.length === 0 || selectedUnits.length === selectedGroup.unitIndexes.length}
                onClick={splitSelectedUnits}
              >
                Separar seleccionadas
              </button>
            </>
          )}
        </section>

        <section className={styles.section} aria-labelledby="service-plan-geometry">
          <h3 id="service-plan-geometry">Geometría</h3>
          {!selectedOperation && (
            <p className={styles.status} role="status">No se detectaron servicios; podés organizar las piezas y configurar servicios después.</p>
          )}
          {selectedOperation && !selectedOperation.planProfile && (
            <p className={styles.status} role="status">
              Este servicio no tiene geometrías declaradas. Configurá su perfil antes de aplicar el plano.
            </p>
          )}
          {selectedOperation?.planProfile && (
            <>
              {selectedGroup.operations.length > 1 && (
                <label className={styles.field}>
                  <span>Servicio</span>
                  <select
                    value={selectedOperation.id}
                    onChange={(event) => setSelectedOperationId(event.target.value)}
                  >
                    {selectedGroup.operations.map((operation) => (
                      <option key={operation.id} value={operation.id}>{operation.serviceId}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className={styles.field}>
                <span>Geometría</span>
                <select
                  aria-label="Geometría"
                  value={selectedOperation.geometryId || ''}
                  onChange={(event) => chooseGeometry(event.target.value)}
                >
                  <option value="">Seleccionar geometría…</option>
                  {geometries.map((geometry) => (
                    <option key={geometry.id} value={geometry.id}>{geometry.label}</option>
                  ))}
                </select>
              </label>
              {selectedGeometry?.parameters?.map((parameter) => (
                <label className={styles.field} key={parameter.id}>
                  <span>{parameter.label}{parameter.unit === 'mm' ? ' (mm)' : parameter.unit === 'degrees' ? ' (°)' : ''}</span>
                  <input
                    aria-label={`${parameter.label}${parameter.unit === 'mm' ? ' (mm)' : parameter.unit === 'degrees' ? ' (°)' : ''}`}
                    type="number"
                    min="0"
                    required={parameter.required}
                    value={selectedOperation.parameters?.[parameter.id] ?? ''}
                    onChange={(event) => changeParameter(parameter.id, event.target.value)}
                  />
                </label>
              ))}
            </>
          )}
        </section>
      </div>

      <footer className={styles.footer}>
        <button type="button" className={styles.secondary} onClick={onClose}>Cancelar</button>
        <button
          type="button"
          className={styles.primary}
          disabled={applyDisabled}
          onClick={() => onApply?.(draft)}
        >
          Aplicar plano
        </button>
      </footer>
    </aside>
  );
};

export default ServicePlanEditor;
