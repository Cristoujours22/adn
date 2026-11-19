import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';

const FIREBASE_EMULATOR_HOST = '127.0.0.1';

export const FIREBASE_EMULATOR_CONFIG = Object.freeze({
  apiKey: 'demo-api-key',
  authDomain: 'demo-adn-e2e.firebaseapp.com',
  projectId: 'demo-adn-e2e',
  storageBucket: 'demo-adn-e2e.appspot.com',
  messagingSenderId: '000000000000',
  appId: 'demo-adn-e2e-app'
});

export const FIREBASE_EMULATOR_ENDPOINTS = Object.freeze({
  auth: `http://${FIREBASE_EMULATOR_HOST}:9099`,
  firestore: { host: FIREBASE_EMULATOR_HOST, port: 8080 },
  storage: { host: FIREBASE_EMULATOR_HOST, port: 9199 }
});

export function isFirebaseEmulatorsEnabled() {
  return process.env.REACT_APP_USE_FIREBASE_EMULATORS === 'true';
}

export function connectFirebaseEmulators({ auth, db, storage }) {
  if (!isFirebaseEmulatorsEnabled()) {
    return false;
  }

  connectAuthEmulator(auth, FIREBASE_EMULATOR_ENDPOINTS.auth, {
    disableWarnings: true
  });
  connectFirestoreEmulator(
    db,
    FIREBASE_EMULATOR_ENDPOINTS.firestore.host,
    FIREBASE_EMULATOR_ENDPOINTS.firestore.port
  );
  connectStorageEmulator(
    storage,
    FIREBASE_EMULATOR_ENDPOINTS.storage.host,
    FIREBASE_EMULATOR_ENDPOINTS.storage.port
  );

  return true;
}
