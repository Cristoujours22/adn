jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getFirestore: jest.fn(() => ({ name: 'mock-db' }))
}));

import { doc, setDoc } from 'firebase/firestore';
import { persistUserServiceCatalog, shouldApplyHydratedServiceCatalog } from './ModeloDespiece';

const services = [{
  nomenclatura: 'COR',
  nombreOriginal: 'Corte',
  tipoCobro: 'unidad'
}];

describe('service catalog persistence ordering', () => {
  test('rejects a stale hydration result after a newer confirmed import', () => {
    expect(shouldApplyHydratedServiceCatalog(0, 1)).toBe(false);
    expect(shouldApplyHydratedServiceCatalog(1, 1)).toBe(true);
  });
});

describe('persistUserServiceCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    doc.mockReturnValue({ path: 'userServices/uid-1' });
    setDoc.mockResolvedValue(undefined);
  });

  test('writes the confirmed catalog to the user global document', async () => {
    await persistUserServiceCatalog('uid-1', services);

    expect(doc).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'mock-db' }),
      'userServices',
      'uid-1'
    );
    expect(setDoc).toHaveBeenCalledWith(
      { path: 'userServices/uid-1' },
      expect.objectContaining({
        userId: 'uid-1',
        servicios: services
      })
    );
  });

  test('does not hide Firestore write failures', async () => {
    const error = new Error('permission-denied');
    setDoc.mockRejectedValueOnce(error);

    await expect(persistUserServiceCatalog('uid-1', services)).rejects.toBe(error);
  });
});
