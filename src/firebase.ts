import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

export const FIREBASE_CONFIG = {
  projectId: 'bold-vortex-478822-e7',
  appId: '1:310383778092:web:dfca45cb622fbccfdf3489',
  apiKey: 'AIzaSyDfpB2EJE-BmqFMbq8N7_bdffUrSBlyyFk',
  authDomain: 'bold-vortex-478822-e7.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-feastledger-f422337c-8205-4459-87b5-cc2d92a932cb',
  storageBucket: 'bold-vortex-478822-e7.firebasestorage.app',
  messagingSenderId: '310383778092',
  measurementId: '',
  oAuthClientId: '310383778092-d5hf9uk1ocb59bvmu0em0m96pcsmjo93.apps.googleusercontent.com',
  recaptchaSiteKey: '',
};

let app: any = null;
let db: Firestore | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId);
} catch (e) {
  console.warn('Firebase initialization notice:', e);
}

export { app, db };
