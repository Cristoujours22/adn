jest.mock('firebase/auth', () => ({
  connectAuthEmulator: jest.fn()
}));
jest.mock('firebase/firestore', () => ({
  connectFirestoreEmulator: jest.fn()
}));
jest.mock('firebase/storage', () => ({
  connectStorageEmulator: jest.fn()
}));

import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import {
  connectFirebaseEmulators,
  isFirebaseEmulatorsEnabled
} from './firebaseEmulators';

const originalFlag = process.env.REACT_APP_USE_FIREBASE_EMULATORS;
const fakeServices = {
  auth: { name: 'auth' },
  db: { name: 'db' },
  storage: { name: 'storage' }
};

afterEach(() => {
  if (originalFlag === undefined) {
    delete process.env.REACT_APP_USE_FIREBASE_EMULATORS;
  } else {
    process.env.REACT_APP_USE_FIREBASE_EMULATORS = originalFlag;
  }
  jest.clearAllMocks();
});

test('connectors stay disconnected unless the flag is exactly true', () => {
  for (const flag of [undefined, 'false', 'TRUE', '1', ' true']) {
    if (flag === undefined) {
      delete process.env.REACT_APP_USE_FIREBASE_EMULATORS;
    } else {
      process.env.REACT_APP_USE_FIREBASE_EMULATORS = flag;
    }

    expect(isFirebaseEmulatorsEnabled()).toBe(false);
    expect(connectFirebaseEmulators(fakeServices)).toBe(false);
  }

  expect(connectAuthEmulator).not.toHaveBeenCalled();
  expect(connectFirestoreEmulator).not.toHaveBeenCalled();
  expect(connectStorageEmulator).not.toHaveBeenCalled();
});

test('all emulator connectors run when the flag is exactly true', () => {
  process.env.REACT_APP_USE_FIREBASE_EMULATORS = 'true';

  expect(isFirebaseEmulatorsEnabled()).toBe(true);
  expect(connectFirebaseEmulators(fakeServices)).toBe(true);

  expect(connectAuthEmulator).toHaveBeenCalledWith(
    fakeServices.auth,
    'http://127.0.0.1:9099',
    { disableWarnings: true }
  );
  expect(connectFirestoreEmulator).toHaveBeenCalledWith(
    fakeServices.db,
    '127.0.0.1',
    8080
  );
  expect(connectStorageEmulator).toHaveBeenCalledWith(
    fakeServices.storage,
    '127.0.0.1',
    9199
  );
});
