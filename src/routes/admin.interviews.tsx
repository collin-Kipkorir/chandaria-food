import React, { useEffect, useMemo, useRef, useState } from "react";
import { COUNTIES, useApp } from "@/lib/store";
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
  const NONE_SELECT_VALUE = "__none__";
  const jobs = useApp((s) => s.jobs);
  const applications = useApp((s) => s.applications);
  const interviews = useApp((s) => s.interviews);
  const [recentSends, setRecentSends] = useState<
    Array<{
      applicantName: string;
      applicantEmail: string;
      subject: string;
      message: string;
      sentAt: string;
    }>
  >([]);
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState<string>(NONE_SELECT_VALUE);
  const [county, setCounty] = useState<string>(NONE_SELECT_VALUE);
  const [onlyNew, setOnlyNew] = useState(false);
  const [subject, setSubject] = useState("Interview invitation details");
  const [message, setMessage] = useState(
    "Hello {{name}},\n\nWe would like to invite you to interview for the {{job}} position in {{county}}. Interview date and venue will be communicated shortly. Please review the details and confirm your availability.\n\nPlease ensure you bring the following documents to the interview:\n1. Food Handling certificate - https://example.com/food-handling-certificate\n2. Original Academic Certificates\n3. Any other relevant certificates\n\nThank you.",
  );
  const [linkLabel, setLinkLabel] = useState("View interview details");
  const [linkUrl, setLinkUrl] = useState("https://kemri.ecitizen.go.ke/");
  const [interviewDate, setInterviewDate] = useState("");
  const [location, setLocation] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");
  const [invitationText, setInvitationText] = useState("View interview details");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState({ total: 0, alreadyInvited: 0, toSend: 0 });
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const placeholderText = "{{name}}, {{job}}, {{county}}, {{interview_date}}, {{location}}";

  const selectedJob = useMemo(
    () => (jobId !== "__none__" ? jobs.find((job) => job.id === jobId) : undefined),
    [jobs, jobId],
  );

  const selectedCountyLabel = county !== NONE_SELECT_VALUE ? county : "All counties";

  useEffect(() => {
    if (recentSends.length === 0 && interviews.length > 0) {
      const seeded = interviews
        .filter((invitation) => invitation.subject || invitation.message)
        .slice(0, 6)
        .map((invitation) => {
          const application = applications.find((app) => app.id === invitation.applicationId);
          return {
            applicantName: application?.applicantName ?? "Applicant",
            applicantEmail: application?.applicantEmail ?? "No email",
            subject: invitation.subject ?? "Interview invitation",
            message: invitation.message ?? "",
            sentAt: invitation.createdAt ?? new Date().toISOString(),
          };
        });
      if (seeded.length > 0) {
        setRecentSends(seeded);
      }
    }
  }, [applications, interviews, recentSends.length]);

  useEffect(() => {
    if (!open) return;

    const loadPreview = async () => {
      try {
        const response = await fetch("/api/interviews/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jobId: jobId !== "__none__" ? jobId : undefined,
            county: county !== "__none__" ? county : undefined,
            notYetSent: onlyNew,
          }),
        });
        if (!response.ok) throw new Error("Preview request failed");
        const data = await response.json();
        setPreview({
          total: data.matched ?? 0,
          alreadyInvited: data.alreadyInvited ?? 0,
          toSend: data.toSend ?? 0,
        });
      } catch (error) {
        console.error(error);
        toast.error("Unable to load preview");
      }
    };

    loadPreview();
  }, [open, jobId, county, onlyNew]);

  const insertLinkPlaceholder = () => {
    const label = linkLabel.trim();
    const url = linkUrl.trim();

    if (!label || !url) {
      toast.error("Please enter both link text and URL.");
      return;
    }

    const placeholder = `{{link:${label}:${url}}}`;
    const textarea = messageRef.current;
    const start = textarea?.selectionStart ?? message.length;
    const end = textarea?.selectionEnd ?? message.length;
    const nextMessage = `${message.slice(0, start)}${placeholder}${message.slice(end)}`;

    setMessage(nextMessage);
    setLinkLabel("");
    setLinkUrl("");

    requestAnimationFrame(() => {
      textarea?.focus();
      const cursorPosition = start + placeholder.length;
      textarea?.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const send = async () => {
    setSending(true);

    try {
      const response = await fetch("/api/interviews/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jobId: jobId !== "__none__" ? jobId : undefined,
          county: county !== "__none__" ? county : undefined,
          notYetSent: onlyNew,
          subject: subject || "Interview invitation details",
          message:
            message ||
            "Hello {{name}},\n\nWe would like to invite you to interview for the {{job}} position in {{county}}.",
          invitationUrl: invitationUrl || undefined,
          invitationText: invitationText || undefined,
          interviewDate: interviewDate || undefined,
          location:
            location ||
            (county !== NONE_SELECT_VALUE ? county : selectedJob?.location || undefined),
        }),
      });
      if (!response.ok) throw new Error("Send request failed");
      const result = await response.json();
      setRecentSends((prev) => [...(result.sentItems ?? []), ...prev].slice(0, 6));
      toast.success(`Sent ${result.sent} invitations, skipped ${result.skipped}`);
      setOpen(false);
      setPreview({ total: 0, alreadyInvited: 0, toSend: 0 });
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
                  <Label>Subject</Label>
                  <Input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Interview invitation details"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Message</Label>
                  <Textarea
                    ref={messageRef}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write a personalized invite message..."
                    rows={6}
                  />
                  <div className="rounded-lg border border-border bg-background/70 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="grid flex-1 gap-2">
                        <Label>Link text</Label>
                        <Input
                          value={linkLabel}
                          onChange={(event) => setLinkLabel(event.target.value)}
                          placeholder="View interview details"
                        />
                      </div>
                      <div className="grid flex-1 gap-2">
                        <Label>Link URL</Label>
                        <Input
                          value={linkUrl}
                          onChange={(event) => setLinkUrl(event.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                      <Button type="button" onClick={insertLinkPlaceholder} className="self-end">
                        Add link
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      This inserts a clickable link placeholder at the cursor position in the
                      message.
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use placeholders: <code>{placeholderText}</code>. You can also insert clickable
                    links with the controls above.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Interview date</Label>
                    <Input
                      type="date"
                      value={interviewDate}
                      onChange={(event) => setInterviewDate(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder={selectedJob?.location ?? "Nairobi"}
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Invitation link</Label>
                    <Input
                      value={invitationUrl}
                      onChange={(event) => setInvitationUrl(event.target.value)}
                      placeholder="https://example.com/interview-details"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Link button/text</Label>
                    <Input
                      value={invitationText}
                      onChange={(event) => setInvitationText(event.target.value)}
                      placeholder="View interview details"
                    />
                  </div>
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

            <div className="mt-6 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold">Recent invite log</h4>
                  <p className="text-sm text-muted-foreground">
                    Review the exact subject and message body sent to each applicant.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {recentSends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invitation sends logged yet.</p>
                ) : (
                  recentSends.map((entry, index) => (
                    <div
                      key={`${entry.applicantEmail}-${entry.sentAt}-${index}`}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{entry.applicantName}</p>
                          <p className="text-sm text-muted-foreground">{entry.applicantEmail}</p>
                        </div>
                        <Badge variant="outline">Sent</Badge>
                      </div>
                      <div className="mt-2 space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Subject:</span>{" "}
                          {entry.subject || "Interview invitation"}
                        </div>
                        <div>
                          <span className="font-medium">Message:</span>
                          <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-xs">
                            {entry.message || "No message recorded"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
                    <span className="font-medium">{selectedCountyLabel}</span>
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
