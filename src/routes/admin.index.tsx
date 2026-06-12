import { useApp } from "@/lib/store";

export default function Dashboard() {
  const { users, campaigns, interviews, emailLogs, audits } = useApp();
  const seekers = users.filter((u) => u.role === "seeker");
  const active = seekers.filter((u) => u.status === "active").length;
  const sent = emailLogs.filter((l) => l.status === "sent").length;

  const byCounty = group(seekers, (u) => u.county || "—");
  const bySkill = group(
    seekers.flatMap((u) => u.skills.map((s) => ({ skill: s }))),
    (x) => x.skill,
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total users" value={seekers.length} />
        <Stat label="Active" value={active} />
        <Stat label="Emails sent" value={sent} />
        <Stat label="Interviews" value={interviews.length} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Users by county">
          <Bars data={byCounty} />
        </Panel>
        <Panel title="Users by skill">
          <Bars data={bySkill} />
        </Panel>
      </div>

      <Panel title="Recent admin activity">
        <ul className="divide-y text-sm">
          {audits.slice(0, 10).map((a) => (
            <li key={a.id} className="flex justify-between py-2">
              <span>
                <span className="font-mono text-xs text-muted-foreground">{a.adminAction}</span>{" "}
                {a.target}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(a.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
          {audits.length === 0 && <li className="py-2 text-muted-foreground">No activity yet.</li>}
        </ul>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function group<T>(items: T[], key: (t: T) => string) {
  const m = new Map<string, number>();
  items.forEach((i) => {
    const k = key(i);
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
}

function Bars({ data }: { data: [string, number][] }) {
  const max = Math.max(1, ...data.map(([, v]) => v));
  if (!data.length) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map(([k, v]) => (
        <div key={k} className="flex items-center gap-3 text-sm">
          <div className="w-24 truncate">{k}</div>
          <div className="h-2 flex-1 rounded bg-secondary">
            <div className="h-2 rounded bg-primary" style={{ width: `${(v / max) * 100}%` }} />
          </div>
          <div className="w-8 text-right tabular-nums">{v}</div>
        </div>
      ))}
    </div>
  );
}
