/**
 * Firebase web config. Override via .env (VITE_FIREBASE_*) for production.
 * Shared Firebase project (Staystock) — SQM_* collections are namespaced.
 */
export const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ??
    'AIzaSyA_twCuBkGEWU-AKF6ex9LoPmhIaYMZFxs',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
    'staystock-f7c6a.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'staystock-f7c6a',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    'staystock-f7c6a.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '868111877115',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    '1:868111877115:web:4d8d5d15a29ba19f70815e',
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-X057NE73C1',
};
