import { isFirebaseConfigured } from "@/lib/firebase";

export default function AdminFirebaseNotice() {
  if (isFirebaseConfigured) return null;
  return (
    <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
      <strong>Firebase RTDB not configured</strong>
      <div className="text-sm">
        Your admin actions will only update local state. To persist changes to the
        cloud, set the <code>VITE_FIREBASE_DATABASE_URL</code> environment variable to your
        Realtime Database URL (for example: <em>https://&lt;project&gt;-default-rtdb.firebaseio.com</em> or
        <em>https://&lt;project&gt;.firebasedatabase.app</em>) and restart the dev server.
      </div>
    </div>
  );
}
