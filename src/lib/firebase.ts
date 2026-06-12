import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.databaseURL);

let _app: FirebaseApp | null = null;
let _db: Database | null = null;

export function getFirebaseDb(): Database | null {
  if (!isFirebaseConfigured) return null;
  if (typeof window === "undefined") return null;
  if (!_app) _app = initializeApp(config as Record<string, string>);
  if (!_db) _db = getDatabase(_app);
  return _db;
}
