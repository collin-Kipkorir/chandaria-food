import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTIES, useApp } from "@/lib/store";
import type { User } from "@/lib/types";
import AdminFirebaseNotice from "@/components/AdminFirebaseNotice";
import AdminHeader from "@/components/AdminHeader";
export default function UsersPage() {
  const { users, setUserStatus, deleteUser, approveBeta, emailLogs } = useApp();
  const [q, setQ] = useState("");
  const [county, setCounty] = useState("");
  const [skill, setSkill] = useState("");
  const [status, setStatus] = useState<"" | User["status"]>("");
  const [emailFilter, setEmailFilter] = useState<"" | "sent" | "never">("");

  const seekers = useMemo(() => users.filter((u) => u.role === "seeker"), [users]);

  const filtered = useMemo(() => {
    return seekers.filter((u) => {
      if (q && !`${u.fullName} ${u.email}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (county && u.county !== county) return false;
      if (skill && !u.skills.some((s) => s.toLowerCase().includes(skill.toLowerCase())))
        return false;
      if (status && u.status !== status) return false;
      const hasSent = emailLogs.some((l) => l.userId === u.id && l.status === "sent");
      if (emailFilter === "sent" && !hasSent) return false;
      if (emailFilter === "never" && hasSent) return false;
      return true;
    });
  }, [seekers, q, county, skill, status, emailFilter, emailLogs]);

  const exportCsv = () => {
    const rows = [
      [
        "Name",
        "Email",
        "Phone",
        "County",
        "Skills",
        "Education",
        "Experience",
        "Status",
        "Created",
      ],
      ...filtered.map((u) => [
        u.fullName,
        u.email,
        u.phone,
        u.county,
        u.skills.join("|"),
        u.education,
        u.experience,
        u.status,
        u.createdAt,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "users.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <AdminFirebaseNotice />
      <AdminHeader title="Users" subtitle="Manage registered users and send emails">
        <Button variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
      </AdminHeader>

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5">
        <Input
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={county}
          onChange={(e) => setCounty(e.target.value)}
        >
          <option value="">All counties</option>
          {COUNTIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <Input
          placeholder="Skill contains…"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        />
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as User["status"] | "")}
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value as "" | "sent" | "never")}
        >
          <option value="">Any email status</option>
          <option value="sent">Emailed</option>
          <option value="never">Never emailed</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">County</th>
              <th className="p-3">Skills</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.fullName}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.county}</td>
                <td className="p-3 text-xs">{u.skills.join(", ")}</td>
                <td className="p-3">
                  <select
                    className="h-7 rounded border bg-transparent px-1 text-xs"
                    value={u.status}
                    onChange={(e) => setUserStatus(u.id, e.target.value as User["status"])}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="suspended">suspended</option>
                  </select>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => approveBeta(u.id, !u.betaApproved)}
                    className="mr-2 text-xs text-blue-600 hover:underline"
                  >
                    {u.betaApproved ? "Revoke beta" : "Approve beta"}
                  </button>
                  <button
                    onClick={() => confirm("Delete user?") && deleteUser(u.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No users match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        {filtered.length} of {seekers.length} users
      </p>
    </div>
  );
}
