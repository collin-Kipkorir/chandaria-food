import React, { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import AdminHeader from "@/components/AdminHeader";

export default function InterviewsPage() {
  const jobs = useApp((s) => s.jobs);
  const applications = useApp((s) => s.applications);
  const sendBulkInvitations = useApp((s) => s.sendBulkInvitations);
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState<string | "">("");
  const [county, setCounty] = useState<string | "">("");
  const [message, setMessage] = useState("");

  const jobOptions = useMemo(() => jobs.map((j) => ({ id: j.id, title: j.title })), [jobs]);

  const send = async () => {
    try {
      await sendBulkInvitations(
        { jobId: jobId || undefined, scope: jobId ? "job" : "all", county: county || undefined },
        { message },
      );
      toast.success("Invitations queued");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send invitations");
    }
  };

  return (
    <div className="p-4">
      <AdminHeader title="Interviews" subtitle="Manage interview invitations and bulk sends.">
        <Button onClick={() => setOpen(true)}>Bulk invite</Button>
      </AdminHeader>

      <div className="space-y-3">
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          applications.slice(0, 50).map((a) => (
            <div key={a.id} className="rounded-md border p-3">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{a.applicantName}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.applicantEmail} • {a.county}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Job: {a.jobId}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk invite applicants</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Job (optional)</Label>
              <select
                className="w-full rounded border px-2 py-1"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
              >
                <option value="">All jobs</option>
                {jobOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>County (optional)</Label>
              <Input value={county} onChange={(e) => setCounty(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <Input value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={send}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
