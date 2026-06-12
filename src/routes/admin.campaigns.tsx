import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/store";

export default function CampaignsPage() {
  const { campaigns, users, emailLogs, createCampaign, sendCampaign } = useApp();
  const [form, setForm] = useState({ title: "", subject: "", message: "", bannerImageUrl: "" });
  const seekers = users.filter((u) => u.role === "seeker" && u.status === "active");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Email campaigns</h1>

      <form
        className="grid gap-3 rounded-xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title) return;
          createCampaign(form);
          setForm({ title: "", subject: "", message: "", bannerImageUrl: "" });
        }}
      >
        <h2 className="font-semibold">New campaign</h2>
        <Input
          placeholder="Title (internal)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Input
          placeholder="Email subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <textarea
          className="min-h-[100px] rounded-md border border-input bg-transparent p-2 text-sm"
          placeholder="Message body"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        <Input
          placeholder="Banner image URL (Cloudinary)"
          value={form.bannerImageUrl}
          onChange={(e) => setForm({ ...form, bannerImageUrl: e.target.value })}
        />
        <Button type="submit" className="w-fit">
          Save draft
        </Button>
      </form>

      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Status</th>
              <th className="p-3">Sent</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const sent = emailLogs.filter(
                (l) => l.campaignId === c.id && l.status === "sent",
              ).length;
              return (
                <tr key={c.id} className="border-t">
                  <td className="p-3">{c.title}</td>
                  <td className="p-3">{c.subject}</td>
                  <td className="p-3">{c.status}</td>
                  <td className="p-3">{sent}</td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      onClick={() => {
                        const r = sendCampaign(
                          c.id,
                          seekers.map((u) => u.id),
                        );
                        alert(`Queued ${r.sent} (skipped ${r.skipped} already-sent)`);
                      }}
                    >
                      Send to active seekers
                    </Button>
                  </td>
                </tr>
              );
            })}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No campaigns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Sending is queued in-app and de-duped per user/campaign. Wire Resend in{" "}
        <code>src/lib/store.ts</code> (sendCampaign) when ready.
      </p>
    </div>
  );
}
