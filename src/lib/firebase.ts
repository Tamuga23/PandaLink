import { initializeApp } from "@firebase/app";
import { getAuth, signInAnonymously } from "@firebase/auth";
import { initializeFirestore } from "@firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// App de Firebase. La config es la misma del POS (PandaStoreOS).
const app = initializeApp(firebaseConfig);

// IMPORTANTE: base de datos NOMBRADA (no la "default").
// El 3er argumento de initializeFirestore es el databaseId.
export const db = initializeFirestore(
  app,
  {
    // Auto-detecta si la red necesita long polling (force penalizaba siempre).
    // Si en la tienda aparecen problemas de conexión, volver a
    // experimentalForceLongPolling: true.
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId,
);

export const auth = getAuth(app);

// Igual que el POS: sesión anónima (la app es de solo lectura).
export const ensureAnonAuth = () => signInAnonymously(auth);
