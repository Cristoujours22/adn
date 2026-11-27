import React, { useEffect, useMemo, useState } from 'react';
import estilos from '../../App.module.css';
import {
  findModuleDetectionConflicts,
  getModuleDetectionPreview,
  normalizeModuleDetectionConfig
} from '../../utils/moduleDetection';

const DEFAULT_EXAMPLE_DETAIL = '1020-entrepaño-D1-005';

const ModuleDetectionSettingsModal = ({
  isOpen,
  initialConfig,
  details = [],
  superGroups = [],
  darkMode = false,
  onClose,
  onSave
}) => {
  const [prefixesInput, setPrefixesInput] = useState('D');
  const [groupIdPosition, setGroupIdPosition] = useState('afterDesign');
  const [exampleDetail, setExampleDetail] = useState(DEFAULT_EXAMPLE_DETAIL);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const config = normalizeModuleDetectionConfig(initialConfig);
    setPrefixesInput(config.designPrefixes.join(', '));
    setGroupIdPosition(config.groupIdPosition);
    setSaveAsDefault(false);
    setNeedsConfirmation(false);
    setErrorMessage('');
  }, [isOpen, initialConfig]);

  const draftConfig = useMemo(() => normalizeModuleDetectionConfig({
    designPrefixes: prefixesInput,
    groupIdPosition
  }), [prefixesInput, groupIdPosition]);

  const examplePreview = useMemo(
    () => getModuleDetectionPreview([exampleDetail], draftConfig),
    [exampleDetail, draftConfig]
  );

  const conflicts = useMemo(() => findModuleDetectionConflicts({
    details,
    currentConfig: initialConfig,
    nextConfig: draftConfig,
    superGroups
  }), [details, initialConfig, draftConfig, superGroups]);

  if (!isOpen) return null;

  const handleSubmit = async (forceSave = false) => {
    setErrorMessage('');
    if (conflicts.hasConflicts && !forceSave) {
      setNeedsConfirmation(true);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(draftConfig, { saveAsDefault });
      onClose();
    } catch (error) {
      setErrorMessage(error?.message || 'No se pudo guardar la configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={estilos.modalOverlay}>
      <div
        className={`${estilos.modalContent} ${estilos.moduleDetectionModal}`}
        id="module-detection-settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="module-detection-settings-title"
      >
        <button
          type="button"
          className={estilos.closeButton}
          aria-label="Cerrar configuración de detección de módulos"
          onClick={onClose}
        >
          ×
        </button>

        <h3 id="module-detection-settings-title" className={estilos.moduleDetectionTitle}>
          Configuración de detección de módulos
        </h3>
        <p className={estilos.moduleDetectionHelp}>
          Esta configuración se guarda en el proyecto actual. Los proyectos nuevos usarán el valor predeterminado vigente al crearse.
        </p>

        <label htmlFor="module-detection-prefixes" className={estilos.moduleDetectionLabel}>
          Prefijos de diseño
        </label>
        <input
          id="module-detection-prefixes"
          type="text"
          value={prefixesInput}
          onChange={(event) => {
            setPrefixesInput(event.target.value);
            setNeedsConfirmation(false);
          }}
          placeholder="D, T, A"
          className={estilos.controls}
          disabled={isSaving}
        />
        <p className={estilos.moduleDetectionHint}>Sepáralos con comas o espacios. Se guardan en mayúsculas.</p>

        <label htmlFor="module-detection-position" className={estilos.moduleDetectionLabel}>
          Posición del identificador de grupo
        </label>
        <select
          id="module-detection-position"
          value={groupIdPosition}
          onChange={(event) => {
            setGroupIdPosition(event.target.value);
            setNeedsConfirmation(false);
          }}
          className={estilos.controls}
          disabled={isSaving}
        >
          <option value="afterDesign">Después del diseño (D1-005)</option>
          <option value="beforeDesign">Antes del diseño (005-D1)</option>
          <option value="either">Cualquiera de las dos formas</option>
        </select>

        <div className={estilos.moduleDetectionPreview}>
          <label htmlFor="module-detection-example" className={estilos.moduleDetectionLabel}>
            Detalle de ejemplo
          </label>
          <input
            id="module-detection-example"
            type="text"
            value={exampleDetail}
            onChange={(event) => setExampleDetail(event.target.value)}
            className={estilos.controls}
            disabled={isSaving}
          />
          <p className={estilos.moduleDetectionPreviewResult} aria-live="polite">
            Módulo reconocido:{' '}
            <strong>{examplePreview.recognizedModuleKeys[0] || 'ninguno'}</strong>
          </p>
        </div>

        {conflicts.hasConflicts && (
          <div className={estilos.moduleDetectionConflict} role="alert">
            <strong>Esta configuración dejará de reconocer módulos existentes:</strong>
            <ul>
              {conflicts.lostModuleKeys.map((moduleKey) => <li key={moduleKey}>{moduleKey}</li>)}
            </ul>
            <p>Confirma explícitamente para guardar y revisa esos detalles después.</p>
            {conflicts.affectedSuperGroups.length > 0 && (
              <p>También hay agrupaciones guardadas afectadas por este cambio.</p>
            )}
          </div>
        )}

        <label className={estilos.moduleDetectionDefaultOption}>
          <input
            type="checkbox"
            checked={saveAsDefault}
            onChange={(event) => setSaveAsDefault(event.target.checked)}
            disabled={isSaving}
          />
          Usar también para futuros proyectos
        </label>

        {errorMessage && <p className={estilos.moduleDetectionError} role="alert">{errorMessage}</p>}

        <div className={estilos.moduleDetectionActions}>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSaving}
            className={estilos.botonSubmit}
          >
            {isSaving ? 'Guardando…' : 'Guardar configuración'}
          </button>
          {needsConfirmation && (
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSaving}
              className={estilos.moduleDetectionConfirm}
            >
              Confirmar y guardar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={estilos.botonEliminar}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetectionSettingsModal;
