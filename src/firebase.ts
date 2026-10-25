import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Embedded production Firebase configuration constant (no dynamic json or import.meta.env dependencies)
export const firebaseConfig = {
  projectId: "bold-vortex-478822-e7",
  appId: "1:310383778092:web:dfca45cb622fbccfdf3489",
  apiKey: "AIzaSyDfpB2EJE-BmqFMbq8N7_bdffUrSBlyyFk",
  authDomain: "bold-vortex-478822-e7.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-feastledger-f422337c-8205-4459-87b5-cc2d92a932cb",
  storageBucket: "bold-vortex-478822-e7.firebasestorage.app",
  messagingSenderId: "310383778092"
};

export const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;

let app: any = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(app);
} catch (error) {
  console.warn('Firestore initialization notice (falling back to offline mode):', error);
  db = null;
  auth = null;
}

export { app, db, auth };
