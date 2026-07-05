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
  const credentialJson = process.env.FIREBASE_SERVICE_ACCOUNT ?? process.env.GOOGLE_SERVICE_ACCOUNT;

  // Prefer explicit service account JSON in env (`FIREBASE_SERVICE_ACCOUNT`) or a
  // file path via `GOOGLE_APPLICATION_CREDENTIALS`. Do NOT fall back to
  // Application Default Credentials (metadata server) in serverless environments.
  let credential: admin.credential.Credential | undefined;

  if (credentialPath) {
    if (!fs.existsSync(credentialPath)) {
      throw new Error(
        `GOOGLE_APPLICATION_CREDENTIALS is set to '${credentialPath}' but the file does not exist. Set a valid path or provide FIREBASE_SERVICE_ACCOUNT env JSON.`,
      );
    }
    credential = admin.credential.cert(credentialPath);
  } else if (credentialJson) {
    try {
      const parsed = typeof credentialJson === "string" ? JSON.parse(credentialJson) : credentialJson;
      credential = admin.credential.cert(parsed as admin.ServiceAccount);
    } catch (error) {
      throw new Error(
        "Failed to parse FIREBASE_SERVICE_ACCOUNT / GOOGLE_SERVICE_ACCOUNT JSON. Ensure the env contains valid service account JSON.",
      );
    }
  } else {
    throw new Error(
      "Missing Firebase service account credentials. Set FIREBASE_SERVICE_ACCOUNT (JSON) or GOOGLE_APPLICATION_CREDENTIALS (file path) in environment.",
    );
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
