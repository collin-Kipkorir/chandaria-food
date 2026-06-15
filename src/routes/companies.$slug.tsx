import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { ArrowRight, Building2, MapPin, Briefcase } from "lucide-react";
import { useMemo } from "react";

const COMPANY_BY_SLUG: Record<string, { name: string; tagline: string; about: string }> = {
  "chandaria-food-plus": {
    name: "Chandaria Food Plus",
    tagline: "Nourishing Kenya, one product at a time.",
    about:
      "Chandaria Food Plus is a leading Kenyan food manufacturer producing trusted everyday staples. We invest in our people through structured training, internal mobility, and a strong culture of safety and quality.",
  },
};

export const Route = createFileRoute("/companies/$slug")({
  component: CompanyPage,
});

function CompanyPage() {
  const { slug } = Route.useParams<{ slug: string }>();
  const meta = slug ? COMPANY_BY_SLUG[slug] : undefined;
  const allJobs = useApp((s) => s.jobs);
  const jobs = useMemo(
    () => allJobs.filter((j) => j.status === "open" && j.companyName === meta?.name),
    [allJobs, meta?.name],
  );

  if (!meta) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Company not found</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <section className="border-b bg-gradient-to-br from-orange-500 to-amber-500 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-orange-100">
            <Building2 className="h-4 w-4" /> Featured employer
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{meta.name}</h1>
          <p className="mt-2 max-w-2xl text-orange-50">{meta.tagline}</p>
          <p className="mt-6 max-w-3xl text-sm text-orange-50/90">{meta.about}</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-xl font-semibold">
          Open roles at {meta.name}{" "}
          <span className="text-sm font-normal text-muted-foreground">({jobs.length})</span>
        </h2>

        <div className="mt-4 grid gap-3">
          {jobs.map((j) => (
            <Link
              key={j.id}
              to="/jobs/$jobId"
              params={{ jobId: j.id }}
              className="group rounded-xl border bg-card p-5 transition hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold group-hover:text-primary">{j.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {j.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {j.jobType}
                    </span>
                    {j.salaryRange && <span>· {j.salaryRange}</span>}
                  </div>
                  {j.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {j.skills.slice(0, 5).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs font-normal">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" className="shrink-0">
                  View <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </Link>
          ))}
          {jobs.length === 0 && (
            <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
              No open roles right now. Check back soon.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
