import React, { useEffect, useRef, useState } from 'react';
import { applyFindReplace, buildFindReplacePreview } from '../../utils/despieceTransformations';

const FindReplaceModal = ({ despiece, isOpen, onClose, onApply, openerRef }) => {
  const [input, setInput] = useState({ search: '', replacement: '', mode: 'literal' });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const searchRef = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => { if (isOpen) { searchRef.current?.focus(); setError(''); } }, [isOpen]);
  if (!isOpen) return null;
  const close = () => { setInput({ search: '', replacement: '', mode: 'literal' }); setPreview(null); setError(''); onClose?.(); openerRef?.current?.focus(); };
  const createPreview = () => { setError(''); setPreview(buildFindReplacePreview(despiece, input)); };
  const confirm = async () => { if (!preview || preview.error || !preview.matchCount) return; try { await onApply?.(applyFindReplace(despiece, preview)); close(); } catch (cause) { setError(cause.message); searchRef.current?.focus(); } };
  const trap = (event) => { if (event.key !== 'Tab') return; const controls = [...dialogRef.current.querySelectorAll('input, select, button')].filter((element) => !element.disabled); const index = controls.indexOf(document.activeElement); const next = event.shiftKey ? (index <= 0 ? controls[controls.length - 1] : controls[index - 1]) : (index === controls.length - 1 ? controls[0] : controls[index + 1]); event.preventDefault(); next?.focus(); };
  return <div ref={dialogRef} className="despiece-dialog" role="dialog" aria-modal="true" aria-labelledby="find-replace-title" onKeyDown={(event) => { if (event.key === 'Escape') close(); trap(event); }}>
    <h2 id="find-replace-title">Buscar y reemplazar</h2>
    <label>Buscar<input ref={searchRef} value={input.search} onChange={(event) => { setInput({ ...input, search: event.target.value }); setPreview(null); }} /></label>
    <label>Reemplazar<input value={input.replacement} onChange={(event) => { setInput({ ...input, replacement: event.target.value }); setPreview(null); }} /></label>
    <label>Modo<select value={input.mode} onChange={(event) => { setInput({ ...input, mode: event.target.value }); setPreview(null); }}><option value="literal">Literal</option><option value="regex">Regex</option></select></label>
    {(preview?.error || error) && <p role="alert" aria-live="assertive">{error || preview.error}</p>}
    {preview && !preview.error && <p role="status" aria-live="polite">{preview.matchCount ? `${preview.matchCount} coincidencias para revisar.` : 'No hay cambios para aplicar.'}</p>}
    <button type="button" onClick={createPreview}>Vista previa</button><button type="button" onClick={confirm} disabled={!preview?.matchCount}>Aplicar</button><button type="button" aria-label="Cancelar" onClick={close}>Cancelar</button>
  </div>;
};

export default FindReplaceModal;
