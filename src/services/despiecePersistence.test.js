import { persistDespieceSnapshot } from './despiecePersistence';

const makeFirestore = ({ commit = jest.fn().mockResolvedValue(), history, defaults } = {}) => {
  const batch = { set: jest.fn(), commit };
  const api = {
    db: {},
    collection: jest.fn((db, name) => ({ db, name })),
    doc: jest.fn((...args) => ({ path: args.slice(1).join('/') || 'generated', id: 'generated-1' })),
    writeBatch: jest.fn(() => batch),
    addDoc: jest.fn(),
    history: history || jest.fn().mockResolvedValue(),
    defaults: defaults || jest.fn().mockResolvedValue()
  };
  return { api, batch };
};

const snapshot = { documentId: 'd-1', proyecto: 'P', cliente: 'C', despieces: [{ id: 'tab-1', filas: [] }], serviciosGuardados: [] };

test('commits the project envelope through the authoritative primary batch', async () => {
  const { api, batch } = makeFirestore();
  const result = await persistDespieceSnapshot(snapshot, api, { history: api.history, defaults: api.defaults });

  expect(api.writeBatch).toHaveBeenCalledWith(api.db);
  expect(batch.set).toHaveBeenCalledWith(expect.objectContaining({ path: 'despieces/d-1' }), expect.objectContaining({ proyecto: 'P', cliente: 'C' }));
  expect(result).toEqual({ documentId: 'd-1', primary: 'committed', secondary: { history: 'ok', defaults: 'ok' }, retry: null });
});

test('generates the project document id when creating without documentId', async () => {
  const { api, batch } = makeFirestore();
  const createSnapshot = { proyecto: 'P', cliente: 'C', despieces: [], serviciosGuardados: [] };

  const result = await persistDespieceSnapshot(createSnapshot, api);

  expect(api.doc).toHaveBeenCalledWith(expect.objectContaining({ name: 'despieces' }));
  expect(batch.set).toHaveBeenCalledWith(expect.objectContaining({ id: 'generated-1' }), createSnapshot);
  expect(result.documentId).toBe('generated-1');
});

test('propagates primary failure and does not attempt secondary writes', async () => {
  const commit = jest.fn().mockRejectedValue(new Error('primary failed'));
  const { api } = makeFirestore({ commit });
  const localCommit = jest.fn();

  await expect(persistDespieceSnapshot(snapshot, api, { onPrimaryCommit: localCommit })).rejects.toThrow('primary failed');
  expect(localCommit).not.toHaveBeenCalled();
  expect(api.history).not.toHaveBeenCalled();
  expect(api.defaults).not.toHaveBeenCalled();
});

test('reports best-effort secondary failures with retry payload after primary commit', async () => {
  const history = jest.fn().mockRejectedValue(new Error('history failed'));
  const defaults = jest.fn().mockResolvedValue();
  const { api } = makeFirestore({ history, defaults });

  const result = await persistDespieceSnapshot(snapshot, api, { history, defaults });

  expect(result.secondary).toEqual({ history: 'failed', defaults: 'ok' });
  expect(result.retry).toEqual({ snapshot, failed: ['history'] });
});

test('reports default backup failure in the retry payload', async () => {
  const defaults = jest.fn().mockRejectedValue(new Error('defaults failed'));
  const { api } = makeFirestore({ defaults });

  const result = await persistDespieceSnapshot(snapshot, api, { defaults });

  expect(result.secondary).toEqual({ history: 'skipped', defaults: 'failed' });
  expect(result.retry).toEqual({ snapshot, failed: ['defaults'] });
});

test('reports skipped secondary writes without a retry payload', async () => {
  const { api } = makeFirestore();

  const result = await persistDespieceSnapshot(snapshot, api);

  expect(result.secondary).toEqual({ history: 'skipped', defaults: 'skipped' });
  expect(result.retry).toBeNull();
});

test('exposes local commit only after the primary batch resolves', async () => {
  const order = [];
  const commit = jest.fn(async () => order.push('primary'));
  const { api } = makeFirestore({ commit });
  await persistDespieceSnapshot(snapshot, api, { onPrimaryCommit: () => order.push('local') });
  expect(order).toEqual(['primary', 'local']);
});
