import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

// Fallback config (useful for local testing). If you prefer to keep secrets out
// of source control, set the VITE_FIREBASE_* env vars and they will be used.
const FALLBACK = {
  apiKey: "AIzaSyCP9B03uei8_k8GOAv1Sz-VSXwcv3_T6JE",
  authDomain: "chandarana-foodplus-62c54.firebaseapp.com",
  databaseURL: "https://chandarana-foodplus-62c54-default-rtdb.firebaseio.com",
  projectId: "chandarana-foodplus-62c54",
  storageBucket: "chandarana-foodplus-62c54.firebasestorage.app",
  messagingSenderId: "4092435792",
  appId: "1:4092435792:web:1063aceb762bc45f922055",
  measurementId: "G-9FDDN4C7VY",
};

const configApiKey = import.meta.env.VITE_FIREBASE_API_KEY ?? FALLBACK.apiKey;
const configAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? FALLBACK.authDomain;
const explicitDatabaseUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL ?? "";
const forceFirebase = Boolean(Number(import.meta.env.VITE_FORCE_FIREBASE ?? "0"));
const rawDatabaseUrl =
  explicitDatabaseUrl ||
  FALLBACK.databaseURL ||
  // best-effort guess for Realtime DB URL if not provided explicitly
  `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID ?? FALLBACK.projectId}-default-rtdb.firebaseio.com`;
const databaseURL = String(rawDatabaseUrl).replace(/\/+$/, ""); // strip trailing slash
export { databaseURL };

const config = {
  apiKey: configApiKey,
  authDomain: configAuthDomain,
  databaseURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? FALLBACK.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? FALLBACK.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? FALLBACK.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? FALLBACK.appId,
};

// Only treat RTDB as configured when the environment explicitly sets VITE_FIREBASE_DATABASE_URL
// by default. During local development a developer may opt-in to use a best-effort
// guessed URL by setting VITE_FORCE_FIREBASE=1. This avoids surprising runtime
// errors while still printing a clear warning.
const _dbUrlLooksValid = Boolean(
  explicitDatabaseUrl &&
    (explicitDatabaseUrl.includes("firebaseio.com") ||
      explicitDatabaseUrl.includes("firebasedatabase.app")),
);

export const isFirebaseConfigured = Boolean(
  config.apiKey && (_dbUrlLooksValid || forceFirebase) && (explicitDatabaseUrl || forceFirebase),
);

let _app: FirebaseApp | null = null;
let _db: Database | null = null;

export function getFirebaseDb(): Database | null {
  // Diagnostic: surface why DB may be unavailable in the browser console
  console.debug(
    "[getFirebaseDb] isFirebaseConfigured=",
    isFirebaseConfigured,
    "databaseURL=",
    config.databaseURL,
    "window=",
    typeof window !== "undefined",
  );
  if (!isFirebaseConfigured) {
    // If the URL looks wrong, provide actionable guidance in the console
    if (forceFirebase) {
      console.warn(
        `[getFirebaseDb] VITE_FORCE_FIREBASE=1 is enabled. Attempting to initialize Firebase using guessed URL: ${databaseURL}. This is intended for local development only. For production, set VITE_FIREBASE_DATABASE_URL explicitly.`,
      );
    } else {
      console.warn(
        `[getFirebaseDb] Firebase not configured for RTDB. Set VITE_FIREBASE_DATABASE_URL to the correct Realtime Database URL (eg https://<project>-default-rtdb.firebaseio.com) in your .env or environment. Current computed URL: ${databaseURL}`,
      );
    }
    return null;
  }
  if (typeof window === "undefined") return null;
  if (!_app) _app = initializeApp(config as Record<string, string>);
  if (!_db) _db = getDatabase(_app);
  return _db;
}
