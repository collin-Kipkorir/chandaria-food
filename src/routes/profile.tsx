import { Navigate } from "react-router-dom";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTIES, useApp, useCurrentUser } from "@/lib/store";
export default function ProfilePage() {
  const user = useCurrentUser();
  const updateProfile = useApp((s) => s.updateProfile);
  const interviews = useApp((s) => s.interviews);
  const [saved, setSaved] = useState(false);

  if (!user) return <Navigate to="/login" />;
  if (user.role === "admin") return <Navigate to="/admin" />;

  const myInterviews = interviews.filter((i) => i.userId === user.id);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">My profile</h1>

        <form
          className="mt-6 grid gap-4 rounded-xl border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <L label="Full name">
              <Input
                value={user.fullName}
                onChange={(e) => updateProfile(user.id, { fullName: e.target.value })}
              />
            </L>
            <L label="Phone">
              <Input
                value={user.phone}
                onChange={(e) => updateProfile(user.id, { phone: e.target.value })}
              />
            </L>
          </div>
          <L label="County">
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={user.county}
              onChange={(e) => updateProfile(user.id, { county: e.target.value })}
            >
              {COUNTIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </L>
          <L label="Skills (comma separated)">
            <Input
              value={user.skills.join(", ")}
              onChange={(e) =>
                updateProfile(user.id, {
                  skills: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </L>
          <div className="grid grid-cols-2 gap-4">
            <L label="Education">
              <Input
                value={user.education}
                onChange={(e) => updateProfile(user.id, { education: e.target.value })}
              />
            </L>
            <L label="Experience">
              <Input
                value={user.experience}
                onChange={(e) => updateProfile(user.id, { experience: e.target.value })}
              />
            </L>
          </div>
          <L label="CV URL">
            <Input
              value={user.cvUrl}
              onChange={(e) => updateProfile(user.id, { cvUrl: e.target.value })}
            />
          </L>
          <div className="flex items-center gap-3">
            <Button type="submit">Save</Button>
            {saved && <span className="text-sm text-green-600">Saved</span>}
          </div>
        </form>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">My interview invitations</h2>
          {myInterviews.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No invitations yet.</p>
          ) : (
            <ul className="mt-4 grid gap-4">
              {myInterviews.map((iv) => (
                <li key={iv.id} className="overflow-hidden rounded-xl border bg-card">
                  {iv.bannerImageUrl && (
                    <img src={iv.bannerImageUrl} alt="" className="h-40 w-full object-cover" />
                  )}
                  <div className="p-4">
                    <div className="text-sm text-muted-foreground">{iv.companyName}</div>
                    <div className="font-semibold">{iv.jobTitle}</div>
                    <div className="mt-1 text-sm">
                      {iv.interviewDate} at {iv.interviewTime} — {iv.venue}
                    </div>
                    {iv.message && <p className="mt-2 text-sm">{iv.message}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
