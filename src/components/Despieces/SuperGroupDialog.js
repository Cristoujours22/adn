import React, { useEffect, useRef } from 'react';
import estilos from '../../App.module.css';

const getPieceLabel = (count) => `${count} ${count === 1 ? 'pieza' : 'piezas'}`;

const SuperGroupDialog = ({
  isOpen,
  preview,
  darkMode = false,
  errorMessage = '',
  onConfirm,
  onCancel
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    dialogRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !preview) return null;

  const validationErrors = Array.isArray(preview.validationErrors)
    ? preview.validationErrors
    : [];
  const canConfirm = Boolean(preview.canApply) && validationErrors.length === 0;

  return (
    <div className={estilos.modalOverlay}>
      <div
        ref={dialogRef}
        className={`${estilos.modalContent} ${estilos.superGroupDialog} ${darkMode ? estilos.superGroupDialogDark : ''}`}
        id="super-group-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="super-group-dialog-title"
        tabIndex="-1"
      >
        <h3 id="super-group-dialog-title">Agrupar módulos</h3>
        <p>
          Se moverán los módulos completos seleccionados. Revisa la vista previa antes de confirmar.
        </p>

        <ul className={estilos.superGroupPreviewList} aria-label="Módulos seleccionados">
          {preview.modules.map((module) => (
            <li key={module.moduleKey}>
              <strong>{module.label}</strong>
              <span>{getPieceLabel(module.pieceCount)}</span>
            </li>
          ))}
        </ul>

        {validationErrors.length > 0 && (
          <div className={estilos.superGroupError} role="alert">
            {validationErrors.map((error) => <p key={error}>{error}</p>)}
          </div>
        )}
        {errorMessage && <p className={estilos.superGroupError} role="alert">{errorMessage}</p>}

        <div className={estilos.superGroupActions}>
          <button
            type="button"
            className={estilos.botonSubmit}
            onClick={() => onConfirm(preview)}
            disabled={!canConfirm}
          >
            Confirmar agrupación
          </button>
          <button type="button" className={estilos.botonEliminar} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperGroupDialog;
