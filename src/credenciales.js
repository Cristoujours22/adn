// credenciales.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Importar getAuth

const firebaseConfig = {
  // ... tu configuración ...
  apiKey: "AIzaSyAkXEH7wxo5AgSoKBnotEWlugqfYikUr7U", // Considera variables de entorno
  authDomain: "adnf-568f2.firebaseapp.com",
  projectId: "adnf-568f2",
  storageBucket: "adnf-568f2.firebasestorage.app",
  messagingSenderId: "709853721386",
  appId: "1:709853721386:web:14d3152ef52dfdb23d2453"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Inicializar Firebase Auth

export { db, auth }; // Exportar db y auth