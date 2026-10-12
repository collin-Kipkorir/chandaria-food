import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminFirebaseNotice from "@/components/AdminFirebaseNotice";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { ref, set, get as dbGet } from "firebase/database";

export const Route = createFileRoute("/admin/rtdb-debug")({
  component: RTDBDebug,
});

export default function RTDBDebug() {
  const [status, setStatus] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function doTestWrite() {
    setStatus(null);
    setDebugData(null);
    setBusy(true);
    try {
      if (!isFirebaseConfigured) {
        setStatus("RTDB not configured. Set VITE_FIREBASE_DATABASE_URL and restart dev server.");
        return;
      }
      const db = getFirebaseDb();
      if (!db) {
        setStatus("Could not get Firebase DB instance (server-side or not initialized).");
        return;
      }
      const key = `__debug/${Date.now()}`;
      await set(ref(db, key), {
        ts: new Date().toISOString(),
        ua: typeof navigator !== "undefined" ? navigator.userAgent : "server",
      });
      setStatus(`Write succeeded at path: ${key}`);
    } catch (err: any) {
      console.error("RTDB debug write failed", err);
      setStatus(`Write failed: ${err?.message ?? String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function doFetchApplications() {
    setStatus(null);
    setDebugData(null);
    setBusy(true);
    try {
      if (!isFirebaseConfigured) {
        setStatus("RTDB not configured. Set VITE_FIREBASE_DATABASE_URL and restart dev server.");
        return;
      }
      const db = getFirebaseDb();
      if (!db) {
        setStatus("Could not get Firebase DB instance (server-side or not initialized).");
        return;
      }
      const snap = await dbGet(ref(db, "applications"));
      if (snap.exists()) {
        const data = snap.val();
        const count = Object.keys(data).length;
        setStatus(`Found ${count} applications in database`);
        setDebugData(data);
      } else {
        setStatus("No applications found in database");
        setDebugData(null);
      }
    } catch (err: any) {
      console.error("RTDB fetch failed", err);
      setStatus(`Fetch failed: ${err?.message ?? String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminFirebaseNotice />
      <h1 className="text-2xl font-semibold">RTDB Debug</h1>
      <p className="text-sm text-muted-foreground">
        Use this page to test Firebase Realtime Database connectivity and inspect data.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
          onClick={doTestWrite}
          disabled={busy}
        >
          {busy ? "Writing…" : "Test write to RTDB"}
        </button>
        <button
          className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
          onClick={doFetchApplications}
          disabled={busy}
        >
          {busy ? "Fetching…" : "Fetch Applications"}
        </button>
        <div className="text-sm">Status: {status ?? "idle"}</div>
      </div>
      {debugData && (
        <div className="rounded bg-gray-100 p-4">
          <h3 className="font-semibold mb-2">Applications Data:</h3>
          <pre className="text-xs overflow-auto max-h-96 bg-white p-2 rounded border">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
