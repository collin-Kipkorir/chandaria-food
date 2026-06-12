import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useApp } from "@/lib/store";
import type { ApplicationStatus } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const Route = createFileRoute("/applications")({
  component: TrackApplications,
});

const statusStyle: Record<ApplicationStatus, string> = {
  submitted: "bg-blue-100 text-blue-800",
  reviewed: "bg-violet-100 text-violet-800",
  shortlisted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  hired: "bg-amber-100 text-amber-900",
};

function TrackApplications() {
  const apps = useApp((s) => s.applications);
  const jobs = useApp((s) => s.jobs);
  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState("");

  const mine = useMemo(() => {
    if (!searched) return [];
    return apps.filter((a) => a.applicantEmail?.toLowerCase() === searched.toLowerCase());
  }, [apps, searched]);

  return (
    <div className="min-h-screen bg-brand-cream font-body text-brand-green-deep">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-brand-gold-dark">
          Track your application
        </div>
        <h1 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl">
          CHECK <span className="italic text-brand-gold-dark">status</span>
        </h1>
        <p className="mt-3 text-sm text-brand-green-deep/70">
          Enter the email you used to apply and we'll show every application linked to it.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearched(email.trim());
          }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 flex-1 rounded-full border-brand-green/20 bg-white px-5"
          />
          <Button
            type="submit"
            className="h-12 rounded-full bg-brand-green px-6 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-brand-green-dark"
          >
            <Search className="h-4 w-4" /> Search
          </Button>
        </form>

        <div className="mt-8 grid gap-3 animate-in fade-in duration-500">
          {searched &&
            mine.map((a) => {
              const job = jobs.find((j) => j.id === a.jobId);
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-brand-green/10 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      {job ? (
                        <Link
                          to="/jobs/$jobId"
                          params={{ jobId: job.id }}
                          className="font-display text-xl tracking-wide text-brand-green-deep hover:text-brand-gold-dark"
                        >
                          {job.title}
                        </Link>
                      ) : (
                        <span className="font-semibold text-brand-green-deep/50">Job removed</span>
                      )}
                      <div className="mt-1 text-xs text-brand-green-deep/60">
                        {job?.companyName ?? "—"} · Applied{" "}
                        {new Date(a.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${statusStyle[a.status]}`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              );
            })}
          {searched && mine.length === 0 && (
            <div className="rounded-2xl border border-dashed border-brand-green/20 py-16 text-center text-sm text-brand-green-deep/60">
              No applications found for <strong>{searched}</strong>.{" "}
              <Link to="/jobs" className="text-brand-gold-dark underline">
                Browse jobs
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
