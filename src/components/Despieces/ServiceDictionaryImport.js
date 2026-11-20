import React, { useEffect, useMemo, useState } from 'react';
import { parseServiceDictionary } from '../../utils/serviceDictionary';
import estilos from '../../App.module.css';

const readFileText = (file) => {
  if (typeof file.text === 'function') return file.text();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
};

const formatIssue = (issue) => (
  issue.path ? `${issue.path}: ${issue.message}` : issue.message
);

const ServiceList = ({ services, emptyMessage }) => (
  services.length > 0 ? (
    <ul>
      {services.map((service) => (
        <li key={`${service.nomenclatura}-${service.nombreOriginal}`}>
          <strong>{service.nomenclatura}</strong> — {service.nombreOriginal}
        </li>
      ))}
    </ul>
  ) : (
    <p>{emptyMessage}</p>
  )
);

const ServiceDictionaryImport = ({
  isOpen,
  currentServices = [],
  onCancel,
  onConfirm
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [readError, setReadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedFile(null);
    setParseResult(null);
    setReadError('');
    setSaveError('');
    setIsReading(false);
    setIsSaving(false);
  }, [isOpen]);

  const importedServices = parseResult?.normalizedServices || [];
  const activeServices = useMemo(
    () => importedServices.filter((service) => service.activo !== false),
    [importedServices]
  );
  const reviewServices = useMemo(
    () => importedServices.filter((service) => service.requiresReview === true),
    [importedServices]
  );
  const errors = parseResult?.errors || [];
  const collisions = parseResult?.collisions || [];
  const canConfirm = Boolean(parseResult?.valid && !isReading && !isSaving && !readError);

  if (!isOpen) return null;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setParseResult(null);
    setReadError('');
    setSaveError('');

    if (!file) return;

    setIsReading(true);
    try {
      const source = await readFileText(file);
      setParseResult(parseServiceDictionary(source));
    } catch (error) {
      setReadError(error?.message || 'No se pudo leer el archivo JSON.');
    } finally {
      setIsReading(false);
    }
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;

    setIsSaving(true);
    setSaveError('');
    try {
      await onConfirm(importedServices);
    } catch (error) {
      const fallback = 'No se pudo guardar el catálogo global. Verificá tu conexión y reintentá.';
      const message = error?.message || '';
      setSaveError(
        message.startsWith('No se pudo guardar el catálogo global')
          ? message
          : `${fallback}${message ? ` (${message})` : ''}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={estilos.modalOverlay}>
      <div
        className={estilos.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-dictionary-import-title"
        style={{ maxWidth: '720px' }}
      >
        <h2 id="service-dictionary-import-title">Importar diccionario de servicios</h2>
        <p>
          Seleccioná un archivo JSON para revisar sus servicios. El catálogo actual no cambia hasta confirmar.
        </p>
        {currentServices.length === 0 ? (
          <p role="status">El catálogo actual está vacío.</p>
        ) : (
          <p role="status">El catálogo actual contiene {currentServices.length} servicios.</p>
        )}

        <label htmlFor="service-dictionary-file">Archivo JSON del diccionario</label>
        <input
          id="service-dictionary-file"
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          disabled={isReading || isSaving}
        />
        {selectedFile && <p>Archivo seleccionado: {selectedFile.name}</p>}
        {isReading && <p role="status" aria-live="polite">Leyendo archivo…</p>}
        {isSaving && <p role="status" aria-live="polite">Guardando catálogo global…</p>}
        {readError && <p role="alert">{readError}</p>}
        {saveError && <p role="alert">{saveError}</p>}

        {parseResult && (
          <section aria-labelledby="service-dictionary-preview-title">
            <h3 id="service-dictionary-preview-title">Vista previa del diccionario</h3>
            <p>
              Diccionario: <strong>{parseResult.dictionary?.dictionary?.name || 'Sin nombre'}</strong>
            </p>
            <p>{importedServices.length} servicios en el diccionario.</p>

            {parseResult.valid ? (
              <>
                <h4>Servicios activos ({activeServices.length})</h4>
                <ServiceList services={activeServices} emptyMessage="No hay servicios activos." />
                <h4>Requieren revisión ({reviewServices.length})</h4>
                <ServiceList services={reviewServices} emptyMessage="No hay elementos que requieran revisión." />
              </>
            ) : (
              <div role="alert">
                <strong>Corregí estos problemas antes de confirmar:</strong>
                {errors.length > 0 && (
                  <>
                    <h4>Errores de validación</h4>
                    <ul>
                      {errors.map((issue, index) => <li key={`error-${index}`}>{formatIssue(issue)}</li>)}
                    </ul>
                  </>
                )}
                {collisions.length > 0 && (
                  <>
                    <h4>Colisiones detectadas</h4>
                    <ul>
                      {collisions.map((issue, index) => <li key={`collision-${index}`}>{formatIssue(issue)}</li>)}
                    </ul>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" onClick={handleConfirm} disabled={!canConfirm}>
            Confirmar y reemplazar catálogo
          </button>
          <button type="button" onClick={onCancel} disabled={isSaving}>
            Cancelar importación
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDictionaryImport;
