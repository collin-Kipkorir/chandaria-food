import {
  get as dbGet,
  push,
  ref,
  remove,
  set as dbSet,
  update,
  type Database,
} from "firebase/database";
import { getFirebaseDb } from "./firebase";

/**
 * Chandarana Foodplus — Realtime Database schema
 *
 * /users/{userId}           — registered seekers + admin accounts
 * /jobs/{jobId}             — open/closed job postings (public careers page)
 * /applications/{appId}     — job applications submitted from the careers form
 * /campaigns/{campaignId}   — email campaigns (admin)
 * /emailLogs/{logId}        — per-recipient send status for campaigns/interviews
 * /interviews/{inviteId}    — interview invitations (admin)
 * /audits/{pushId}          — append-only admin audit trail
 * /settings                 — singleton: websiteMode, maintenanceMessage
 * /emailQueue/{pushId}      — outbound email queue (processed by worker script)
 * /__debug/{timestamp}      — optional RTDB connectivity test writes
 */
export const RTDB_PATHS = {
  users: "users",
  jobs: "jobs",
  applications: "applications",
  campaigns: "campaigns",
  emailLogs: "emailLogs",
  interviews: "interviews",
  audits: "audits",
  settings: "settings",
  emailQueue: "emailQueue",
} as const;

export const toArray = <T extends { id?: string }>(val: unknown): T[] => {
  if (!val || typeof val !== "object") return [];
  const o = val as Record<string, unknown>;
  return Object.entries(o).map(([k, v]) => {
    if (v && typeof v === "object") {
      const obj = v as Record<string, unknown>;
      return { ...(obj as object), id: (obj.id as string) ?? k } as T;
    }
    return { id: k, value: v } as unknown as T;
  });
};

function cleanForFirebase(val: unknown): unknown {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map((v) => cleanForFirebase(v)).filter((v) => v !== undefined);
  }
  if (typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v === undefined) continue;
      const cv = cleanForFirebase(v);
      if (cv !== undefined) out[k] = cv;
    }
    return out;
  }
  return val;
}

function dbOrNull(): Database | null {
  return getFirebaseDb();
}

export async function fbWrite(path: string, value: unknown): Promise<void> {
  const db = dbOrNull();
  if (!db) {
    console.warn(`[fbWrite] no Firebase DB available, skipping write to ${path}`, value);
    return;
  }
  const cleaned = cleanForFirebase(value);
  if (cleaned === undefined) {
    console.warn(`[fbWrite] cleaned value is undefined, skipping write to ${path}`, value);
    return;
  }
  try {
    return await dbSet(ref(db, path), cleaned as Record<string, unknown>);
  } catch (err) {
    console.error(`[fbWrite] failed to write to ${path}`, err, value);
  }
}

export async function fbUpdate(path: string, value: Record<string, unknown>): Promise<void> {
  const db = dbOrNull();
  if (!db) {
    console.warn(`[fbUpdate] no Firebase DB available, skipping update to ${path}`, value);
    return;
  }
  const cleaned = cleanForFirebase(value);
  if (!cleaned || typeof cleaned !== "object" || Array.isArray(cleaned)) {
    console.warn(
      `[fbUpdate] cleaned value is not a plain object, skipping update to ${path}`,
      value,
    );
    return;
  }
  try {
    return await update(ref(db, path), cleaned as Record<string, unknown>);
  } catch (err) {
    console.error(`[fbUpdate] failed to update ${path}`, err, value);
  }
}

export async function fbRemove(path: string): Promise<void> {
  const db = dbOrNull();
  if (!db) {
    console.warn(`[fbRemove] no Firebase DB available, skipping remove ${path}`);
    return;
  }
  try {
    return await remove(ref(db, path));
  } catch (err) {
    console.error(`[fbRemove] failed to remove ${path}`, err);
  }
}

export async function fbPush(path: string, value: unknown): Promise<string | null> {
  const db = dbOrNull();
  if (!db) {
    console.warn(`[fbPush] no Firebase DB available, skipping push to ${path}`, value);
    return null;
  }
  const r = push(ref(db, path));
  const cleaned = cleanForFirebase(value);
  if (cleaned === undefined) {
    console.warn(`[fbPush] cleaned value is undefined, skipping push to ${path}`, value);
    return null;
  }
  try {
    await dbSet(r, cleaned as Record<string, unknown>);
    return r.key;
  } catch (err) {
    console.error(`[fbPush] failed to push to ${path}`, err, value);
    return null;
  }
}

export async function fbRead<T>(path: string): Promise<T | null> {
  const db = dbOrNull();
  if (!db) return null;
  const snap = await dbGet(ref(db, path));
  return snap.exists() ? (snap.val() as T) : null;
}
