// C:\Users\intelligent\OneDrive\Metricas Intelligent Zone\src\services\firebaseClient.ts

// Importa las funciones necesarias desde los SDKs modulares de Firebase
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";

// Configuración de Firebase obtenida desde variables de entorno de Vite
// Nota: measurementId es opcional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined
};

// Aviso en consola si faltan variables (no rompe build pero ayuda a detectar)
if (import.meta.env.PROD) {
  const missing = Object.entries(firebaseConfig)
    .filter(([k, v]) => v === "" || v === undefined)
    .map(([k]) => k);
  if (missing.length) {
    console.warn("[Firebase] Variables de entorno faltantes en producción:", missing.join(", "));
  }
}

// Inicializa Firebase
// Exporta la instancia de la aplicación directamente para evitar inicializaciones duplicadas
export const app: FirebaseApp = initializeApp(firebaseConfig);

// Obtiene la instancia de Firestore y la exporta
// Es común llamarla 'db' o 'firestore'
export const db: Firestore = getFirestore(app);

// Obtiene la instancia de Analytics y la exporta, solo si estamos en un entorno de navegador
export const analytics: Analytics | null = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Auth del cliente (para login con Google/email)
export const auth: Auth = getAuth(app);
// Fuerza persistencia local para que la sesión sobreviva recargas/navegaciones
try {
  // No await aquí para no bloquear el render; Firebase aplica en segundo plano
  setPersistence(auth, browserLocalPersistence);
} catch {}

// Exports de compatibilidad con código existente
export function getDb(): Firestore { return db; }
export function getAuthClient(): Auth { return auth; }
export function getGoogleProvider(): GoogleAuthProvider { return new GoogleAuthProvider(); }

// Si tenías una función getDb(), ya no sería necesaria así,
// ahora los servicios se exportan directamente.
// Si tu código antiguo dependía de getDb(), deberías actualizarlo para usar 'db' directamente.
