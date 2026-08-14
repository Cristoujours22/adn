import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getDocs } from 'firebase/firestore';
import ModeloDespiece, { coordinateSnapshotPersistence, resolveDuplicateDocumentId, updateServiceDefinition } from './ModeloDespiece';

const mockPersistDespieceSnapshot = jest.fn();
jest.mock('react-router-dom', () => ({ useParams: () => ({ id: undefined }) }));
jest.mock('./credenciales', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({ collection: jest.fn(() => ({})), addDoc: jest.fn(), doc: jest.fn(() => ({})), getDoc: jest.fn(async () => ({ exists: () => false })), query: jest.fn(() => ({})), where: jest.fn(() => ({})), getDocs: jest.fn(), setDoc: jest.fn(), deleteDoc: jest.fn(), writeBatch: jest.fn() }));
jest.mock('./authContext', () => ({ useAuth: () => ({ currentUser: null }) }));
jest.mock('./ThemeContext', () => ({ useTheme: () => ({ darkMode: false }) }));
jest.mock('./menu', () => () => <div />);
jest.mock('./components/Despieces/TabsDespiece', () => () => <div />);
jest.mock('./components/Despieces/PanelResumen', () => () => <div />);
jest.mock('./components/Despieces/TablaPiezas', () => () => <div />);
jest.mock('./components/Despieces/ServicesCarousel', () => () => <div />);
jest.mock('./services/despiecePersistence', () => ({ persistDespieceSnapshot: (...args) => mockPersistDespieceSnapshot(...args) }));

test('service edits preserve canonical identity and metadata', () => {
  const original = { serviceId: 'svc-fixed', nomenclatura: 'OLD', nombreOriginal: 'Old', aliases: ['legacy'], activo: false, metadata: { source: 'user' } };
  expect(updateServiceDefinition(original, { nomenclatura: 'NEW', nombreOriginal: 'New', tipoCobro: 'ml' })).toEqual({ ...original, nomenclatura: 'NEW', nombreOriginal: 'New', tipoCobro: 'ml' });
  expect(updateServiceDefinition(null, { nomenclatura: 'NEW', nombreOriginal: 'New', tipoCobro: 'unidad' }).serviceId).toBe('svc_new');
});

test('snapshot coordinator commits locally only after complete primary persistence', async () => {
  const order = []; const snapshot = { proyecto: 'P', despieces: [{ id: 'tab' }], serviciosGuardados: [{ serviceId: 'svc' }] };
  const persist = jest.fn(async (value, options) => { expect(value).toBe(snapshot); order.push('primary'); options.onPrimaryCommit({ documentId: 'generated' }); return { documentId: 'generated', secondary: { history: 'ok', defaults: 'ok' }, retry: null }; });
  const result = await coordinateSnapshotPersistence(snapshot, persist, { onCommit: () => order.push('local') });
  expect(order).toEqual(['primary', 'local']); expect(result.warning).toBe('');
});

test('snapshot coordinator keeps local state on primary failure and retains secondary retry', async () => {
  const onCommit = jest.fn();
  await expect(coordinateSnapshotPersistence({}, jest.fn().mockRejectedValue(new Error('primary failed')), { onCommit })).rejects.toThrow('primary failed');
  expect(onCommit).not.toHaveBeenCalled();
  const retry = { snapshot: {}, failed: ['history'] };
  const result = await coordinateSnapshotPersistence({}, jest.fn(async (_snapshot, options) => { options.onPrimaryCommit({ documentId: 'd1' }); return { secondary: { history: 'failed', defaults: 'ok' }, retry }; }), { onCommit });
  expect(result).toMatchObject({ retry, warning: expect.stringMatching(/saved.*retry/i) });
  expect(onCommit).toHaveBeenCalledTimes(1);
});

test('autosave creates safely while manual save keeps explicit overwrite confirmation', () => {
  const duplicate = { empty: false, docs: [{ id: 'existing' }] };
  const confirmOverwrite = jest.fn(() => true);
  expect(resolveDuplicateDocumentId(duplicate, true, confirmOverwrite)).toBeUndefined();
  expect(confirmOverwrite).not.toHaveBeenCalled();
  expect(resolveDuplicateDocumentId(duplicate, false, confirmOverwrite)).toBe('existing');
  expect(confirmOverwrite).toHaveBeenCalledTimes(1);
  expect(resolveDuplicateDocumentId(duplicate, false, () => false)).toBeNull();
});

test('manual save after only service definitions change persists current services', async () => {
  getDocs.mockResolvedValue({ empty: true, docs: [], size: 0 });
  mockPersistDespieceSnapshot.mockImplementation(async (snapshot, _firestore, options) => {
    options.onPrimaryCommit({ documentId: 'generated' });
    return { documentId: 'generated', secondary: { history: 'skipped', defaults: 'skipped' }, retry: null };
  });
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  render(<ModeloDespiece />);
  fireEvent.change(screen.getByLabelText(/nombre del cliente/i), { target: { value: 'Client' } });
  fireEvent.change(screen.getByLabelText(/nombre del proyecto/i), { target: { value: 'Project' } });
  act(() => window.dispatchEvent(new Event('openNomenclaturesModal')));
  fireEvent.change(screen.getByPlaceholderText('Nombre Original (ej: Calado)'), { target: { value: 'Custom Service' } });
  fireEvent.change(screen.getByPlaceholderText('Nomenclatura (ej: CAL)'), { target: { value: 'CUSTOM' } });
  fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
  fireEvent.click(screen.getByRole('button', { name: /mas opciones/i }));
  fireEvent.click(screen.getByRole('button', { name: /guardar despiece/i }));
  await waitFor(() => expect(mockPersistDespieceSnapshot).toHaveBeenCalled());
  expect(mockPersistDespieceSnapshot.mock.calls[0][0].serviciosGuardados).toEqual(expect.arrayContaining([expect.objectContaining({ serviceId: 'svc_custom', nomenclatura: 'CUSTOM' })]));
});
