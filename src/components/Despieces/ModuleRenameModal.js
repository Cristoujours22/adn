import React, { useEffect, useRef, useState } from 'react';
import { renameModuleInDespiece } from '../../utils/despieceTransformations';

const ModuleRenameModal = ({ despiece, module, isOpen, onClose, onApply, openerRef }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => { if (isOpen) { setName(module?.displayName || ''); setError(''); inputRef.current?.focus(); } }, [isOpen, module]);
  if (!isOpen) return null;
  const close = () => { setError(''); onClose?.(); openerRef?.current?.focus(); };
  const submit = async () => { try { const result = renameModuleInDespiece(despiece, module.moduleId, name); await onApply?.(result); close(); } catch (cause) { setError(cause.message); inputRef.current?.focus(); } };
  const trap = (event) => { if (event.key !== 'Tab') return; const controls = [...dialogRef.current.querySelectorAll('input, select, button')].filter((element) => !element.disabled); const index = controls.indexOf(document.activeElement); const next = event.shiftKey ? (index <= 0 ? controls[controls.length - 1] : controls[index - 1]) : (index === controls.length - 1 ? controls[0] : controls[index + 1]); event.preventDefault(); next?.focus(); };
  return <div ref={dialogRef} className="despiece-dialog" role="dialog" aria-modal="true" aria-labelledby="rename-module-title" onKeyDown={(event) => { if (event.key === 'Escape') close(); trap(event); }}>
    <h2 id="rename-module-title">Renombrar módulo</h2>
    <label>Nombre<input ref={inputRef} value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(); }} /></label>
    {error && <p role="alert" aria-live="assertive">{error}</p>}
    <button type="submit" onClick={submit}>Guardar</button><button type="button" aria-label="Cancelar" onClick={close}>Cancelar</button>
  </div>;
};

export default ModuleRenameModal;
