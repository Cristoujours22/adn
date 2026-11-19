// credenciales.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  connectFirebaseEmulators,
  FIREBASE_EMULATOR_CONFIG,
  isFirebaseEmulatorsEnabled
} from './firebaseEmulators';

const productionFirebaseConfig = {
  apiKey: "AIzaSyAkXEH7wxo5AgSoKBnotEWlugqfYikUr7U",
  authDomain: "adnf-568f2.firebaseapp.com",
  projectId: "adnf-568f2",
  storageBucket: "adnf-568f2.appspot.com",
  messagingSenderId: "709853721386",
  appId: "1:709853721386:web:14d3152ef52dfdb23d2453"
};

const firebaseConfig = isFirebaseEmulatorsEnabled()
  ? FIREBASE_EMULATOR_CONFIG
  : productionFirebaseConfig;

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Firestore must be connected before any application reads or writes it.
connectFirebaseEmulators({ auth, db, storage });

export { auth, db, storage };
