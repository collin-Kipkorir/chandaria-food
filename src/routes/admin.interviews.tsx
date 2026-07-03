import React, { useMemo, useState } from "react";
import { COUNTIES, useApp } from "@/lib/store";
import { countBulkInvitePreview } from "@/lib/bulk-invitations";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AdminHeader from "@/components/AdminHeader";

export default function InterviewsPage() {
  const jobs = useApp((s) => s.jobs);
  const applications = useApp((s) => s.applications);
  const users = useApp((s) => s.users);
  const emailLogs = useApp((s) => s.emailLogs);
  const interviews = useApp((s) => s.interviews);
  const sendBulkInvitations = useApp((s) => s.sendBulkInvitations);

  const NONE_SELECT_VALUE = "__none__";
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState<string>(NONE_SELECT_VALUE);
  const [county, setCounty] = useState<string>(NONE_SELECT_VALUE);
  const [onlyNew, setOnlyNew] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const preview = useMemo(
    () =>
      countBulkInvitePreview(applications, users, emailLogs, interviews, {
        jobIds: jobId !== NONE_SELECT_VALUE ? [jobId] : undefined,
        counties: county !== NONE_SELECT_VALUE ? [county] : undefined,
        notYetSent: onlyNew,
      }),
    [applications, users, emailLogs, interviews, jobId, county, onlyNew],
  );

  const selectedJob = useMemo(
    () => (jobId !== NONE_SELECT_VALUE ? jobs.find((job) => job.id === jobId) : undefined),
    [jobs, jobId],
  );

  const send = async () => {
    setSending(true);
    let scope: "all" | "job" | "county" = "all";
    if (jobId && county) scope = "county";
    else if (jobId) scope = "job";
    else if (county) scope = "county";

    try {
      await sendBulkInvitations(
        {
          jobId: jobId !== NONE_SELECT_VALUE ? jobId : undefined,
          scope,
          county: county !== NONE_SELECT_VALUE ? county : undefined,
          notYetSent: onlyNew,
        },
        { message },
      );
      toast.success("Invitations queued");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send invitations");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4">
      <AdminHeader
        title="Interviews"
        subtitle="Manage interview invitations, bulk sends, and targeted applicant outreach."
      >
        <Button onClick={() => setOpen(true)}>Bulk invite</Button>
      </AdminHeader>

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Total applications</p>
              <p className="mt-2 text-2xl font-semibold">{applications.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Jobs with applicants</p>
              <p className="mt-2 text-2xl font-semibold">
                {new Set(applications.map((a) => a.jobId)).size}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Counties represented</p>
              <p className="mt-2 text-2xl font-semibold">
                {new Set(applications.map((a) => a.county || "")).size}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.95fr]">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Bulk invite applicants</h3>
                <p className="text-sm text-muted-foreground">
                  Select the target job, county, or only applicants who have not yet received an
                  invite.
                </p>
              </div>
              {open ? (
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              ) : (
                <Button onClick={() => setOpen(true)}>Bulk invite</Button>
              )}
            </div>

            {open && (
              <div className="mt-5 grid gap-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Job (optional)</Label>
                    <Select value={jobId} onValueChange={setJobId}>
                      <SelectTrigger>
                        <SelectValue placeholder="All jobs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_SELECT_VALUE}>All jobs</SelectItem>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>County (optional)</Label>
                    <Select value={county} onValueChange={setCounty}>
                      <SelectTrigger>
                        <SelectValue placeholder="All counties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_SELECT_VALUE}>All counties</SelectItem>
                        {COUNTIES.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-3">
                  <Checkbox
                    id="only-new"
                    checked={onlyNew}
                    onCheckedChange={(value) => setOnlyNew(Boolean(value))}
                  />
                  <Label htmlFor="only-new" className="cursor-pointer">
                    Only applicants with no prior interview invitation
                  </Label>
                </div>

                <div className="grid gap-2">
                  <Label>Message</Label>
                  <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write a personalized invite message..."
                  />
                </div>

                <div className="rounded-xl bg-secondary/10 p-4 text-sm text-muted-foreground">
                  <p>
                    {preview.total === 0
                      ? "Preview will show how many applicants match your selected filters."
                      : `Matched ${preview.total} applicants, ${preview.alreadyInvited} already invited, ${preview.toSend} will be sent.`}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={send} disabled={sending || preview.toSend === 0}>
                    {sending
                      ? "Sending…"
                      : preview.toSend === 0
                        ? "Send invites"
                        : `Send ${preview.toSend} invite${preview.toSend === 1 ? "" : "s"}`}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h4 className="text-lg font-semibold">Recent applications</h4>
              <p className="text-sm text-muted-foreground">
                See the freshest applicants and where they applied.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {applications.slice(0, 8).map((application) => {
                const job = jobs.find((job) => job.id === application.jobId);
                return (
                  <div
                    key={application.id}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-semibold">{application.applicantName}</div>
                      <div className="text-sm text-muted-foreground">
                        {application.applicantEmail} · {application.county || "—"}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{job?.title ?? application.jobId}</Badge>
                      <Badge variant="secondary">{application.county || "No county"}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Current invite preview</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your current filter selection in the dialog determines this summary.
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Matched applicants</span>
                  <span className="font-medium">{preview.total}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Already invited</span>
                    <span>{preview.alreadyInvited}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Will receive invitation</span>
                    <span className="font-semibold">{preview.toSend}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="text-sm text-muted-foreground">Active selection</div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span>Job</span>
                    <span className="font-medium">{selectedJob?.title ?? "All jobs"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span>County</span>
                    <span className="font-medium">{county || "All counties"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span>Only new applicants</span>
                    <span className="font-medium">{onlyNew ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                {preview.total === 0 ? (
                  <p>No applicants match the selected filters yet.</p>
                ) : (
                  <p>
                    {preview.toSend} applicant{preview.toSend === 1 ? "" : "s"} will receive an
                    invite if you send now.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
