// C:\Users\intelligent\OneDrive\Metricas Intelligent Zone\src\firebase.ts

// Importa las instancias inicializadas desde tu archivo de servicio
import { db as firestoreDb, app as firebaseAppInstance, analytics as firebaseAnalyticsInstance } from './services/firebaseClient';

// Reexporta la instancia de Firestore bajo el nombre 'db'
export const db = firestoreDb;

// Reexporta la instancia de la aplicación Firebase si la necesitas
export const app = firebaseAppInstance;

// Reexporta la instancia de Analytics si la necesitas
export const analytics = firebaseAnalyticsInstance;

// Puedes añadir aquí otras exportaciones si tu firebaseClient.ts inicializa más servicios (ej. auth, storage)
