import fs from "node:fs";
import admin from "firebase-admin";
import { getDatabase, type Database } from "firebase-admin/database";

let db: Database | null = null;
const databaseURL = process.env.FIREBASE_DATABASE_URL ?? process.env.VITE_FIREBASE_DATABASE_URL;

function normalizeDatabaseUrl(url: string) {
  return url.replace(/\/+$|\?+.*$/, "");
}

function initializeAdmin() {
  if (db) return db;
  if (!databaseURL) {
    throw new Error(
      "FIREBASE_DATABASE_URL or VITE_FIREBASE_DATABASE_URL is required for Firebase Admin initialization",
    );
  }

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const credentialJson = process.env.GOOGLE_SERVICE_ACCOUNT ?? process.env.FIREBASE_SERVICE_ACCOUNT;
  let credential: admin.credential.Credential | undefined;

  if (credentialPath) {
    if (!fs.existsSync(credentialPath)) {
      console.warn(
        `GOOGLE_APPLICATION_CREDENTIALS is set to '${credentialPath}' but the file does not exist. Firebase Admin will not initialize. Remove or correct this env var to enable admin writes.`,
      );
      return null;
    }
    credential = admin.credential.cert(credentialPath);
  } else if (credentialJson) {
    try {
      credential = admin.credential.cert(JSON.parse(credentialJson));
    } catch (error) {
      console.warn(
        "Failed to parse GOOGLE_SERVICE_ACCOUNT / FIREBASE_SERVICE_ACCOUNT JSON:",
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  } else {
    try {
      credential = admin.credential.applicationDefault();
    } catch (error) {
      console.warn(
        "Firebase Admin applicationDefault credential resolution failed:",
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential,
      databaseURL,
    });
  }

  db = getDatabase();
  return db;
}

export function getFirebaseAdminDatabase(): Database | null {
  try {
    return initializeAdmin();
  } catch (error) {
    console.warn("Firebase Admin initialization failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

async function fetchDatabaseValue<T>(path: string): Promise<T | null> {
  if (!databaseURL) return null;
  const url = `${normalizeDatabaseUrl(databaseURL)}/${path}.json`;
  const authParam = process.env.FIREBASE_DATABASE_SECRET
    ? `?auth=${encodeURIComponent(process.env.FIREBASE_DATABASE_SECRET)}`
    : "";
  const response = await fetch(`${url}${authParam}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch RTDB path '${path}' with status ${response.status}`);
  }
  return (await response.json()) as T | null;
}

export async function getDatabaseValue<T>(path: string): Promise<T | null> {
  const adminDb = getFirebaseAdminDatabase();
  if (adminDb) {
    const snap = await adminDb.ref(path).get();
    return snap.val() as T | null;
  }
  return fetchDatabaseValue<T>(path);
}

export function objectToArray<T extends { id?: string }>(value: unknown): T[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).map(([key, item]) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return { ...(item as object), id: key } as T;
    }
    return { id: key, value: item } as unknown as T;
  });
}
