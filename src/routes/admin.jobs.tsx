import { useState } from "react";
import { useApp } from "@/lib/store";
import { COUNTIES } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Job, JobType } from "@/lib/types";
import { toast } from "sonner";
import { Trash2, Pencil, Plus } from "lucide-react";
import AdminFirebaseNotice from "@/components/AdminFirebaseNotice";

type Draft = Omit<Job, "id" | "createdAt">;

const empty: Draft = {
  companyName: "",
  companyLogoUrl: "",
  title: "",
  location: "",
  county: "Nairobi",
  jobType: "full-time",
  salaryRange: "",
  requirements: "",
  applyDeadline: "",
  status: "open",
  skills: [],
  description: "",
  responsibilities: "",
};

export default function AdminJobs() {
  const jobs = useApp((s) => s.jobs);
  const apps = useApp((s) => s.applications);
  const createJob = useApp((s) => s.createJob);
  const updateJob = useApp((s) => s.updateJob);
  const deleteJob = useApp((s) => s.deleteJob);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [skillsText, setSkillsText] = useState("");
  // bulk invite moved to Interviews page
  type InviteOptions = {
    interviewDate?: string;
    interviewTime?: string;
    venue?: string;
    message?: string;
    bannerImageUrl?: string;
  };
  const sendInvitations = useApp((s) => s.sendInterviewInvitations);
  const sendBulkInvitations = useApp((s) => s.sendBulkInvitations);

  const openNew = () => {
    setEditId(null);
    setDraft(empty);
    setSkillsText("");
    setOpen(true);
  };
  const openEdit = (j: Job) => {
    setEditId(j.id);
    const { id: _i, createdAt: _c, ...rest } = j;
    setDraft(rest);
    setSkillsText(j.skills.join(", "));
    setOpen(true);
  };

  const save = () => {
    if (!draft.title || !draft.companyName) {
      toast.error("Title and company are required.");
      return;
    }
    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    (async () => {
      try {
        if (editId) {
          await updateJob(editId, { ...draft, skills });
          toast.success("Job updated");
        } else {
          await createJob({ ...draft, skills });
          toast.success("Job created");
        }
      } catch (err) {
        console.error("save job error", err);
        toast.error("Could not save job. Try again.");
      }
    })();
    setOpen(false);
  };

  return (
    <div>
      <AdminFirebaseNotice />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground">Create and manage job listings.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> New job
        </Button>
      </div>

      <div className="grid gap-3">
        {jobs.map((j) => {
          const count = apps.filter((a) => a.jobId === j.id).length;
          return (
            <div key={j.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{j.title}</h3>
                    <Badge variant={j.status === "open" ? "default" : "secondary"}>
                      {j.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {j.companyName} · {j.location} · {j.jobType} · {count} application
                    {count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(j)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => (window.location.href = "/admin/interviews")}
                  >
                    Manage invites
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateJob(j.id, { status: j.status === "open" ? "closed" : "open" })
                    }
                  >
                    {j.status === "open" ? "Close" : "Reopen"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      if (!confirm("Delete this job?")) return;
                      try {
                        await deleteJob(j.id);
                        toast.success("Job deleted");
                      } catch (err) {
                        console.error("delete job error", err);
                        toast.error("Could not delete job.");
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit job" : "New job"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </Field>
            <Field label="Company">
              <Input
                value={draft.companyName}
                onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
              />
            </Field>
            <Field label="Location">
              <Input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
            </Field>
            <Field label="County">
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.county}
                onChange={(e) => setDraft({ ...draft, county: e.target.value })}
              >
                {COUNTIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Job type">
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.jobType}
                onChange={(e) => setDraft({ ...draft, jobType: e.target.value as JobType })}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </Field>
            <Field label="Salary range">
              <Input
                value={draft.salaryRange ?? ""}
                onChange={(e) => setDraft({ ...draft, salaryRange: e.target.value })}
              />
            </Field>
            <Field label="Apply deadline" className="sm:col-span-2">
              <Input
                type="date"
                value={draft.applyDeadline ?? ""}
                onChange={(e) => setDraft({ ...draft, applyDeadline: e.target.value })}
              />
            </Field>
            <Field label="Skills (comma-separated)" className="sm:col-span-2">
              <Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <Field label="Responsibilities" className="sm:col-span-2">
              <Textarea
                rows={3}
                value={draft.responsibilities}
                onChange={(e) => setDraft({ ...draft, responsibilities: e.target.value })}
              />
            </Field>
            <Field label="Requirements" className="sm:col-span-2">
              <Textarea
                rows={3}
                value={draft.requirements}
                onChange={(e) => setDraft({ ...draft, requirements: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{editId ? "Save changes" : "Create job"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk invite UI moved to Admin Interviews page. */}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
