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
import { countBulkInvitePreview } from "@/lib/bulk-invitations";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AdminHeader from "@/components/AdminHeader";

const TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <title>Shortlisting &amp; Document Verification</title>

    <style>
        /* simplified inline styles for template preview */
        body{margin:0;padding:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif}
        .container{max-width:680px;margin:0 auto;background:#fff;padding:24px;border-radius:8px}
        .header{background:#0b1220;color:#fff;padding:24px;border-radius:8px}
        .cta{display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none}
    </style>
</head>
<body>
<div style="background:#f3f6fa;padding:20px">
  <div class="container">
    <div class="header"><h1 style="margin:0">{{companyName}}</h1><div>HUMAN RESOURCES DEPARTMENT</div></div>
    <div style="padding:18px 0">
      <p>Good morning <strong>{{name}}</strong>,</p>
      <h2>Shortlisting &amp; Document Verification</h2>
      <p>Thank you for applying for the <strong>{{job}}</strong> position. You have been shortlisted pending document verification.</p>
      <p><a href="{{documentUploadUrl}}" class="cta">Upload PDF Documents →</a></p>
      <p>Deadline: 48 hours</p>
    </div>
    <div style="font-size:12px;color:#64748b">&copy; {{companyName}} · Human Resources</div>
  </div>
</div>
</body>
</html>`;

export default function InterviewsPage() {
  const NONE_SELECT_VALUE = "__none__";
  const jobs = useApp((s) => s.jobs);
  const applications = useApp((s) => s.applications);
  const interviews = useApp((s) => s.interviews);
  const users = useApp((s) => s.users);
  const emailLogs = useApp((s) => s.emailLogs);
  const bulkInviteStatus = useApp((s) => s.bulkInviteStatus);
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
  const [onlyNew, setOnlyNew] = useState(true);
  const [subject, setSubject] = useState("Interview Invitation");
  const [message, setMessage] = useState<string>(TEMPLATE_HTML);
  const [linkLabel, setLinkLabel] = useState("View interview details");
  const [linkUrl, setLinkUrl] = useState("https://kemri.ecitizen.go.ke/");
  const [interviewDate, setInterviewDate] = useState("");
  const [location, setLocation] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");
  const [invitationText, setInvitationText] = useState("View interview details");
  const [documentUploadUrl, setDocumentUploadUrl] = useState("");
  const [documentUploadFileName, setDocumentUploadFileName] = useState("");
  const [useTemplateDesign, setUseTemplateDesign] = useState(true);
  const [workEthicsUrl, setWorkEthicsUrl] = useState("");
  const [foodHandlerCertUrl, setFoodHandlerCertUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [autoCheckedOnce, setAutoCheckedOnce] = useState(false);
  const [preview, setPreview] = useState({ total: 0, alreadyInvited: 0, toSend: 0 });
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const placeholderText = "{{name}}, {{job}}, {{county}}, {{interview_date}}, {{location}}, {{companyName}}, {{sentDate}}, {{hrEmail}}, {{documentUploadUrl}}, {{workEthicsUrl}}, {{foodHandlerCertUrl}}";

  const selectedJob = useMemo(
    () => (jobId !== "__none__" ? jobs.find((job) => job.id === jobId) : undefined),
    [jobs, jobId],
  );

  useEffect(() => {
    if (jobId !== NONE_SELECT_VALUE && !onlyNew && !autoCheckedOnce) {
      setOnlyNew(true);
      setAutoCheckedOnce(true);
    }
  }, [jobId, onlyNew, autoCheckedOnce]);

  const selectedCountyLabel = county !== NONE_SELECT_VALUE ? county : "All counties";

  useEffect(() => {
    if (recentSends.length === 0 && interviews.length > 0) {
      const seeded = interviews
        .filter((invitation) => invitation.message)
        .slice(0, 6)
        .map((invitation) => {
          const application = applications.find((app) => app.id === invitation.applicationId);
          return {
            applicantName: application?.applicantName ?? "Applicant",
            applicantEmail: application?.applicantEmail ?? "No email",
            subject: "Interview invitation",
            message: invitation.message ?? "",
            sentAt: invitation.createdAt ?? new Date().toISOString(),
          };
        });
      if (seeded.length > 0) {
        setRecentSends(seeded);
      }
    }
  }, [applications, interviews, recentSends.length]);

  const refreshPreview = async (showError = false) => {
    try {
      const response = await fetch("/api/interviews/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jobId: jobId !== NONE_SELECT_VALUE ? jobId : undefined,
          county: county !== NONE_SELECT_VALUE ? county : undefined,
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
      try {
        const filters = {
          jobIds: jobId !== NONE_SELECT_VALUE ? [jobId] : undefined,
          counties: county !== NONE_SELECT_VALUE ? [county] : undefined,
          notYetSent: onlyNew,
        };
        const local = countBulkInvitePreview(
          applications,
          users,
          emailLogs,
          interviews,
          filters as any,
          bulkInviteStatus,
        );
        setPreview({ total: local.total, alreadyInvited: local.alreadyInvited, toSend: local.toSend });
      } catch (e) {
        console.error("Local preview fallback failed", e);
        if (showError) toast.error("Unable to load preview");
      }
    }
  };

  useEffect(() => {
    void refreshPreview(open);
  }, [open, jobId, county, onlyNew]);

  const insertLinkPlaceholder = (labelOverride?: string, urlOverride?: string) => {
    const label = (labelOverride ?? linkLabel).trim();
    const url = (urlOverride ?? linkUrl).trim();

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

    // If admin chooses to send to users who may already have invites, confirm first
    if (!onlyNew) {
      const ok = window.confirm(
        "You're about to send invitations to applicants who may already have received an invitation. This may use additional email tokens. Do you want to continue?",
      );
      if (!ok) {
        setSending(false);
        return;
      }
    }

    try {
      const resolvedSubject = (subject && subject.trim()) || `Interview Invitation for ${selectedJob?.title ?? "applicant applied role"}`;
      const response = await fetch("/api/interviews/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jobId: jobId !== "__none__" ? jobId : undefined,
          county: county !== "__none__" ? county : undefined,
          notYetSent: onlyNew,
          subject: resolvedSubject,
          message: message || "",
          html: useTemplateDesign ? message : undefined,
          invitationUrl: invitationUrl || undefined,
          invitationText: invitationText || undefined,
          interviewDate: interviewDate || undefined,
          location:
            location ||
            (county !== NONE_SELECT_VALUE ? county : selectedJob?.location || undefined),
          documentUploadUrl: documentUploadUrl || undefined,
          workEthicsUrl: workEthicsUrl || undefined,
          foodHandlerCertUrl: foodHandlerCertUrl || undefined,
        }),
      });
      if (!response.ok) throw new Error("Send request failed");
      const result = await response.json();
      setRecentSends((prev) => [...(result.sentItems ?? []), ...prev].slice(0, 6));
      setPreview((prev) => ({
        total: prev.total,
        alreadyInvited: prev.alreadyInvited + (result.sent ?? 0),
        toSend: Math.max(0, prev.toSend - (result.sent ?? 0)),
      }));
      toast.success(`Sent ${result.sent} invitations, skipped ${result.skipped}`);
      await refreshPreview(false);
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send invitations");
    } finally {
      setSending(false);
    }
  };

  const [previewOpenLocal, setPreviewOpenLocal] = useState(false);
  const [previewHtmlLocal, setPreviewHtmlLocal] = useState("");

  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");

  const resolveLinkPlaceholders = (msg: string) =>
    msg
      .replace(/{{\s*documentUploadUrl\s*}}/gi, documentUploadUrl)
      .replace(/{{\s*workEthicsUrl\s*}}/gi, workEthicsUrl)
      .replace(/{{\s*foodHandlerCertUrl\s*}}/gi, foodHandlerCertUrl);

  const renderMessageToHtmlClient = (msg: string, invUrl?: string, invText?: string) => {
    if (!msg) return "";
    const resolved = resolveLinkPlaceholders(msg);
    // Replace link placeholders {{link:Label:https://...}}
    let out = escapeHtml(resolved);
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, url) => {
      const l = escapeHtml(label.trim());
      const u = url.trim();
      if (!u) return l;
      return `<a href="${u}" target="_blank" rel="noopener noreferrer" style="color:#9fd0ff;text-decoration:underline;">${l}</a>`;
    });
    out = out.replace(/\{\{link:([^}:]+):([^}]+)\}\}/g, (_m, label, url) => {
      const l = escapeHtml(label.trim());
      const u = url.trim() || invUrl || "";
      if (!u) return l;
      return `<a href="${u}" target="_blank" rel="noopener noreferrer" style="color:#9fd0ff;text-decoration:underline;">${l}</a>`;
    });

    // Auto-link plain URLs only outside anchor tags
    const parts = out.split(/(<a[^>]*>.*?<\/a>)/gi);
    out = parts
      .map((part, index) => {
        if (index % 2 === 1) return part;
        return part.replace(/(https?:\/\/[^\s<]+)/g, (u) =>
          `<a href="${u}" target="_blank" rel="noopener noreferrer" style="color:#9fd0ff;text-decoration:underline;">${u}</a>`,
        );
      })
      .join("");

    const paragraphs = out.split(/\n\s*\n/).map((p) => p.replace(/\n/g, "<br/>"));
    return paragraphs.map((p) => `<p style="margin:0 0 10px 0;">${p}</p>`).join("");
  };

  const generatePreview = () => {
    const sample = {
      name: "Jane Doe",
      job: selectedJob?.title ?? "Position",
      county: selectedCountyLabel,
      interview_date: interviewDate || "TBD",
      location: location || selectedJob?.location || "TBD",
    };

    const dataMap: Record<string, string> = {
      name: sample.name,
      job: sample.job,
      county: sample.county,
      interview_date: sample.interview_date,
      location: sample.location,
      companyname: (selectedJob && selectedJob.companyName) || "Company Name",
      sentdate: new Date().toISOString().slice(0, 10),
      hremail: "",
      documentuploadurl: documentUploadUrl || "",
      workethicsurl: workEthicsUrl || "",
      foodhandlercerturl: foodHandlerCertUrl || "",
    };

    const replaceClientPlaceholders = (tpl: string) =>
      tpl.replace(/{{\s*([^}]+)\s*}}/g, (_m, key) => {
        const k = key.trim().toLowerCase();
        return dataMap[k] ?? `{{${key.trim()}}}`;
      });

    let filled: string;
    if (useTemplateDesign) {
      const candidate = message || TEMPLATE_HTML;
      filled = replaceClientPlaceholders(candidate);
    } else {
      filled = message.replace(/{{\s*name\s*}}/gi, sample.name)
      .replace(/{{\s*job\s*}}/gi, sample.job)
      .replace(/{{\s*county\s*}}/gi, sample.county)
      .replace(/{{\s*interview_date\s*}}/gi, sample.interview_date)
      .replace(/{{\s*location\s*}}/gi, sample.location)
      .replace(/{{\s*companyName\s*}}/gi, (selectedJob && selectedJob.companyName) || "Company Name")
      .replace(/{{\s*hrEmail\s*}}/gi, "")
      .replace(/{{\s*sentDate\s*}}/gi, new Date().toISOString().slice(0,10));

    const bodyHtml = renderMessageToHtmlClient(filled, invitationUrl || undefined, invitationText || undefined);
    const containerHtml = `
      <div style="background:#0f1720;color:#e6eef8;font-family:Arial, Helvetica, sans-serif;padding:20px;">
        <div style="max-width:680px;margin:0 auto;background:#0b1220;padding:24px;border-radius:8px;">
          <div style="text-align:center;margin-bottom:12px;"><h1 style="margin:0;color:#fff;">${escapeHtml((selectedJob && selectedJob.companyName) || "Company Name")}</h1><div style="color:#9aa6b8;font-size:13px;">Human Resources Department</div></div>
          <div style="color:#c9d6e6;margin:12px 0;">Date: ${escapeHtml(new Date().toISOString().slice(0,10))}</div>
          <div style="color:#e6eef8;margin-bottom:10px;">Good morning <strong>${escapeHtml(sample.name)}</strong>,</div>
          <div style="font-weight:600;color:#c9d6e6;margin-bottom:8px;">RE: Shortlisting & Document Verification</div>
          <div style="color:#c9d6e6;">${bodyHtml}</div>
        </div>
      </div>`;

    setPreviewHtmlLocal(containerHtml);
    setPreviewOpenLocal(true);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocumentUploadFileName(file.name);
    try {
      const url = URL.createObjectURL(file);
      setDocumentUploadUrl(url);
    } catch (err) {
      setDocumentUploadUrl(`https://example.com/uploads/${encodeURIComponent(file.name)}`);
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
                    Only applicants for the selected job who have not previously received an invitation
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
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <input
                        id="use-template"
                        type="checkbox"
                        checked={useTemplateDesign}
                        onChange={(e) => setUseTemplateDesign(Boolean(e.target.checked))}
                      />
                      <Label htmlFor="use-template" className="cursor-pointer">Use designed HTML template</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Upload PDF (simulate)</Label>
                      <input type="file" accept="application/pdf" onChange={onFileChange} />
                      {documentUploadFileName && <div className="text-sm text-muted-foreground">{documentUploadFileName}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button type="button" onClick={generatePreview}>Preview Mail</Button>
                    <Button type="button" variant="outline" onClick={() => { setPreviewOpenLocal(false); setPreviewHtmlLocal(""); }}>Close Preview</Button>
                  </div>
                  {previewOpenLocal && (
                    <div className="mt-3 rounded-lg border border-border bg-background p-3" style={{ overflow: "auto" }}>
                      <div dangerouslySetInnerHTML={{ __html: previewHtmlLocal }} />
                    </div>
                  )}
                  <div className="rounded-lg border border-border bg-background/70 p-3">
                    <p className="mb-2 text-sm font-medium">Add link</p>
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
                      <Button type="button" onClick={() => insertLinkPlaceholder()} className="self-end">
                        Add link
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertLinkPlaceholder("Submit documents", documentUploadUrl || "")}
                      >
                        Submit documents
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertLinkPlaceholder("Get Work Ethics / Labour Clearance", workEthicsUrl || "")}
                      >
                        Work Ethics / Labour Clearance
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertLinkPlaceholder("Food Handler Certificate", foodHandlerCertUrl || "")}
                      >
                        Food Handler Certificate
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


                <div className="rounded-xl border border-border bg-background/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Send preview</p>
                      <p className="text-xs text-muted-foreground">
                        {preview.total === 0
                          ? "Select filters to see who will be included."
                          : "Counts for the current selection before sending."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-border bg-card p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Matched</p>
                      <p className="mt-1 text-xl font-semibold">{preview.total}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Already invited</p>
                      <p className="mt-1 text-xl font-semibold">{preview.alreadyInvited}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Will be sent</p>
                      <p className="mt-1 text-xl font-semibold">{preview.toSend}</p>
                    </div>
                  </div>
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
