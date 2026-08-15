const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const fingerprint = (despiece) => JSON.stringify({
  id: despiece?.id,
  filas: (despiece?.filas || []).map(({ id, detalle }) => ({ id, detalle }))
});

const rowBelongsToModule = (row, module) => row?.moduleId === module.moduleId || new RegExp(`(?:^|[^A-Z0-9])${String(module.legacyToken || '').replace('-', '\\-')}(?=$|[^A-Z0-9])`, 'i').test(row?.detalle || '');

const compilePattern = ({ search, mode }) => {
  if (!String(search || '').trim()) return { error: 'Search cannot be blank.' };
  try {
    return new RegExp(mode === 'regex' ? search : escapeRegExp(search), 'gi');
  } catch (error) {
    return { error: `Invalid regular expression: ${error.message}` };
  }
};

export const buildFindReplacePreview = (despiece, input = {}) => {
  const pattern = compilePattern(input);
  if (pattern.error) return { error: pattern.error, activeDespieceId: despiece?.id, rows: [], changedRows: [], matchCount: 0 };
  const rows = (despiece?.filas || []).map((row) => {
    const value = String(row?.detalle || '');
    const next = value.replace(pattern, () => input.replacement || '');
    return next === value ? null : { id: row.id, before: row, next: { ...row, detalle: next } };
  }).filter(Boolean);
  return {
    mode: input.mode || 'literal', pattern: input.search || '', replacement: input.replacement || '',
    activeDespieceId: despiece?.id, fingerprint: fingerprint(despiece),
    rows, changedRows: rows.map((row) => row.id), matchCount: rows.reduce((total, row) => total + ((String(row.before.detalle).match(pattern) || []).length), 0)
  };
};

export const applyFindReplace = (despiece, preview) => {
  if (!preview || preview.activeDespieceId !== despiece?.id || preview.fingerprint !== fingerprint(despiece)) throw new Error('Find/replace preview is stale. Generate a new preview.');
  const replacements = new Map(preview.rows.map((row) => [row.id, row.next.detalle]));
  return { despiece: { ...despiece, filas: (despiece.filas || []).map((row) => replacements.has(row.id) ? { ...row, detalle: replacements.get(row.id) } : row) }, changedRows: preview.changedRows };
};

export const renameModuleInDespiece = (despiece, moduleId, displayName) => {
  const name = String(displayName || '').trim();
  if (!name) throw new Error('Module name cannot be blank.');
  const duplicate = (despiece.modules || []).some((module) => module.moduleId !== moduleId && String(module.displayName || '').trim().toLowerCase() === name.toLowerCase());
  if (duplicate) throw new Error('Module name already exists.');
  const selected = (despiece.modules || []).find((module) => module.moduleId === moduleId);
  const rows = selected ? (despiece.filas || []).filter((row) => rowBelongsToModule(row, selected)).map((row) => row.id) : [];
  return { despiece: { ...despiece, modules: (despiece.modules || []).map((module) => module.moduleId === moduleId ? { ...module, displayName: name } : module) }, changedRows: rows };
};
