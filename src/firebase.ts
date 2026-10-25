import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const env = (import.meta as any).env ?? {};

export const FIRESTORE_DATABASE_ID =
  env.VITE_FIREBASE_DATABASE_ID ||
  firebaseConfig.firestoreDatabaseId ||
  'ai-studio-feastledger-f422337c-8205-4459-87b5-cc2d92a932cb';

export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || 'AIzaSyDfpB2EJE-BmqFMbq8N7_bdffUrSBlyyFk',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || 'bold-vortex-478822-e7.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'bold-vortex-478822-e7',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || 'bold-vortex-478822-e7.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || '310383778092',
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfig.appId || '1:310383778092:web:dfca45cb622fbccfdf3489',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId || '',
};

let app: any = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

const hasFirebaseConfig =
  !!FIREBASE_CONFIG.apiKey &&
  !!FIREBASE_CONFIG.authDomain &&
  !!FIREBASE_CONFIG.projectId &&
  !!FIREBASE_CONFIG.appId;

if (hasFirebaseConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
    // Connect directly to the user's specific Firestore database ID
    db = getFirestore(app, FIRESTORE_DATABASE_ID);
    auth = getAuth(app);
  } catch (e) {
    console.warn('Firebase initialization notice:', e);
    db = null;
    auth = null;
  }
} else {
  console.warn('Firebase config is missing. The app will run in offline mode.');
}

export { app, db, auth };
