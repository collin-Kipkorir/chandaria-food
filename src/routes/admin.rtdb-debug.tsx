import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminFirebaseNotice from "@/components/AdminFirebaseNotice";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { ref, set } from "firebase/database";

export const Route = createFileRoute("/admin/rtdb-debug")({
  component: RTDBDebug,
});

export default function RTDBDebug() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function doTestWrite() {
    setStatus(null);
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

  return (
    <div className="space-y-6">
      <AdminFirebaseNotice />
      <h1 className="text-2xl font-semibold">RTDB Debug</h1>
      <p className="text-sm text-muted-foreground">
        Use this page to do a one-off test write from the browser to your Firebase Realtime Database.
      </p>
      <div className="flex items-center gap-3">
        <button
          className="rounded bg-primary px-4 py-2 text-white"
          onClick={doTestWrite}
          disabled={busy}
        >
          {busy ? "Writing…" : "Test write to RTDB"}
        </button>
        <div className="text-sm">Status: {status ?? "idle"}</div>
      </div>
    </div>
  );
}
