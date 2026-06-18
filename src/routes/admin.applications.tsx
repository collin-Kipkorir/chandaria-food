import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { getFirebaseDb, isFirebaseConfigured, databaseURL } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/types";
import AdminFirebaseNotice from "@/components/AdminFirebaseNotice";

const STATUSES: ApplicationStatus[] = ["submitted", "reviewed", "shortlisted", "rejected", "hired"];

export default function AdminApplications() {
  const apps = useApp((s) => s.applications);
  const jobs = useApp((s) => s.jobs);
  const setStatus = useApp((s) => s.setApplicationStatus);
  const isFB = useApp((s) => s.firebaseReady);
  const [filter, setFilter] = useState<string>("");
  const [showJson, setShowJson] = useState(false);
  const [rawFetch, setRawFetch] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const rows = useMemo(() => {
    return apps
      .filter((a) => !filter || a.status === filter)
      .map((a) => ({ a, job: jobs.find((j) => j.id === a.jobId) }));
  }, [apps, jobs, filter]);

  return (
    <div>
      <AdminFirebaseNotice />
      {/* Debug panel removed for production admin UI */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-sm text-muted-foreground">
            Review and progress candidate applications.
          </p>
        </div>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3">
        {rows.map(({ a, job }) => (
          <div key={a.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">{job?.title ?? "(deleted job)"}</h3>
                <p className="text-xs text-muted-foreground">
                  {job?.companyName} · {new Date(a.createdAt).toLocaleString()}
                </p>
                <div className="mt-2 text-sm">
                  <div>
                    <strong>{a.applicantName}</strong>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.applicantEmail} · {a.applicantPhone}
                  </div>
                </div>
                {a.cvUrl && (
                  <a
                    href={a.cvUrl}
                    download={a.cvFileName || "cv"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-primary underline"
                  >
                    Download CV {a.cvFileName ? `(${a.cvFileName})` : ""}
                  </a>
                )}
                {a.coverLetter && (
                  <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">
                    {a.coverLetter}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{a.status}</Badge>
                <select
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                  value={a.status}
                  onChange={(e) => setStatus(a.id, e.target.value as ApplicationStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
            No applications yet.
          </div>
        )}
      </div>
    </div>
  );
}
