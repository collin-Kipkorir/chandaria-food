import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTIES, useApp } from "@/lib/store";
export default function RegisterPage() {
  const register = useApp((s) => s.register);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    county: COUNTIES[0],
    skills: "",
    education: "",
    experience: "",
    cvUrl: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const res = register({
              ...form,
              skills: form.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            });
            if (!res.ok) return setErr(res.error || "Failed");
            navigate({ to: "/profile" });
          }}
        >
          <Field label="Full name">
            <Input
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
          </div>
          <Field label="Password">
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
            />
          </Field>
          <Field label="County">
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={form.county}
              onChange={(e) => set("county", e.target.value)}
            >
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Skills (comma separated)">
            <Input
              value={form.skills}
              onChange={(e) => set("skills", e.target.value)}
              placeholder="React, Node.js, SQL"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Education level">
              <Input value={form.education} onChange={(e) => set("education", e.target.value)} />
            </Field>
            <Field label="Experience">
              <Input value={form.experience} onChange={(e) => set("experience", e.target.value)} />
            </Field>
          </div>
          <Field label="CV URL (paste Cloudinary or any link)">
            <Input value={form.cvUrl} onChange={(e) => set("cvUrl", e.target.value)} />
          </Field>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit">Create account</Button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
