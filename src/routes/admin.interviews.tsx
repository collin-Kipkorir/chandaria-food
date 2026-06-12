import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/admin/interviews")({
  component: InterviewsPage,
});

function InterviewsPage() {
  const { users, interviews, createInterview } = useApp();
  const seekers = users.filter((u) => u.role === "seeker");
  const [form, setForm] = useState({
    userId: "",
    companyName: "",
    jobTitle: "",
    interviewDate: "",
    interviewTime: "",
    venue: "",
    message: "",
    bannerImageUrl: "",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Interview invitations</h1>

      <form
        className="grid gap-3 rounded-xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.userId || !form.companyName) return;
          createInterview(form);
          setForm({ ...form, companyName: "", jobTitle: "", venue: "", message: "" });
        }}
      >
        <h2 className="font-semibold">New invitation</h2>
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={form.userId}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
          required
        >
          <option value="">Select candidate…</option>
          {seekers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName} ({u.email})
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Company"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <Input
            placeholder="Job title"
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
          />
          <Input
            type="date"
            value={form.interviewDate}
            onChange={(e) => setForm({ ...form, interviewDate: e.target.value })}
          />
          <Input
            type="time"
            value={form.interviewTime}
            onChange={(e) => setForm({ ...form, interviewTime: e.target.value })}
          />
        </div>
        <Input
          placeholder="Venue / location"
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
        />
        <textarea
          className="min-h-[80px] rounded-md border border-input bg-transparent p-2 text-sm"
          placeholder="Custom message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        <Input
          placeholder="Banner image URL (Cloudinary)"
          value={form.bannerImageUrl}
          onChange={(e) => setForm({ ...form, bannerImageUrl: e.target.value })}
        />
        <Button type="submit" className="w-fit">
          Send invitation
        </Button>
      </form>

      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3">Candidate</th>
              <th className="p-3">Company</th>
              <th className="p-3">Role</th>
              <th className="p-3">When</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((iv) => {
              const u = users.find((x) => x.id === iv.userId);
              return (
                <tr key={iv.id} className="border-t">
                  <td className="p-3">{u?.fullName ?? "—"}</td>
                  <td className="p-3">{iv.companyName}</td>
                  <td className="p-3">{iv.jobTitle}</td>
                  <td className="p-3">
                    {iv.interviewDate} {iv.interviewTime}
                  </td>
                  <td className="p-3">{iv.status}</td>
                </tr>
              );
            })}
            {interviews.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No invitations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
