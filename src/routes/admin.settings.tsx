import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import type { WebsiteMode } from "@/lib/types";

const MODES: { value: WebsiteMode; label: string; desc: string }[] = [
  { value: "online", label: "Online", desc: "Full system access." },
  {
    value: "maintenance",
    label: "Maintenance",
    desc: "Public users see a maintenance page; admins keep full access.",
  },
  {
    value: "readonly",
    label: "Read-only",
    desc: "Users can browse but can't register, log in, or edit.",
  },
  { value: "beta", label: "Private beta", desc: "Only admin-approved users can sign in." },
];

export default function SettingsPage() {
  const { settings, setSettings } = useApp();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Website mode</h2>
        <p className="text-sm text-muted-foreground">
          Switch the site without restarting anything.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setSettings({ websiteMode: m.value })}
              className={`rounded-lg border p-4 text-left transition ${
                settings.websiteMode === m.value
                  ? "border-primary ring-2 ring-primary"
                  : "hover:bg-accent"
              }`}
            >
              <div className="font-medium">{m.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{m.desc}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Maintenance message</h2>
        <textarea
          className="mt-3 min-h-[80px] w-full rounded-md border border-input bg-transparent p-2 text-sm"
          value={settings.maintenanceMessage}
          onChange={(e) => setSettings({ maintenanceMessage: e.target.value })}
        />
        <Button className="mt-3" onClick={() => alert("Saved")}>
          Save
        </Button>
      </section>

      <p className="text-xs text-muted-foreground">
        Current mode: <b>{settings.websiteMode}</b>
      </p>
    </div>
  );
}
