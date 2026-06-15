import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Coins,
  FileUp,
  GraduationCap,
  Leaf,
  MapPin,
  Menu,
  Search,
  Send,
  ShoppingBasket,
  Sparkles,
  Truck,
  User2,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { useApp } from "@/lib/store";
import type { Job } from "@/lib/types";

// ---------------- constants ----------------
const MAX_CV_BYTES = 5 * 1024 * 1024;
const ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const KENYA_COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nak  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Uasin Gishu",
  "Kiambu",
  "Machakos",
  "Kajiado",
  "Kakamega",
  "Bungoma",
  "Meru",
  "Nyeri",
  "Murang'a",
  "Kirinyaga",
  "Embu",
  "Tharaka-Nithi",
  "Kitui",
  "Makueni",
  "Kilifi",
  "Kwale",
  "Taita-Taveta",
  "Lamu",
  "Tana River",
  "Garissa",
  "Wajir",
  "Mandera",
  "Marsabit",
  "Isiolo",
  "Samburu",
  "Turkana",
  "West Pokot",
  "Trans Nzoia",
  "Elgeyo-Marakwet",
  "Baringo",
  "Laikipia",
  "Narok",
  "Bomet",
  "Kericho",
  "Nandi",
  "Vihiga",
  "Busia",
  "Siaya",
  "Homa Bay",
  "Migori",
  "Nyamira",
  "Kisii",
  "Nyandarua",
];
const EDUCATION_LEVELS = [
  "Certificate",
  "Diploma",
  "Higher National Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Other",
];
const SALARY_RANGES = [
  "Below KSh 20,000",
  "KSh 20,000 – 35,000",
  "KSh 35,000 – 60,000",
  "KSh 60,000 – 90,000",
  "KSh 90,000 – 150,000",
  "Above KSh 150,000",
  "Negotiable",
];

const NAV = [
  { label: "Home", target: "home" },
  { label: "About", target: "about" },
  { label: "Our Stores", target: "stores" },
  { label: "Careers", target: "careers" },
];

const STORES = [
  {
    name: "Westgate",
    img: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&f  { name: "Westgate" },
  { name: "Lavington" },
  { name: "Sarit Centre" },
  { name: "Two Rivers" },
];

const SERVICES = [
  {
    icon: ShoppingBasket,
    title: "Fresh Groceries",
    text: "Daily-fresh produce, meats and household essentials sourced locally.",
  },
  {
    icon: Utensils,
    title: "Ready-To-Eat",
    text: "In-house bakery, deli and hot-foods counter for meals on the go.",
  },
  {
    icon: Truck,
    title: "Delivery & Pickup",
    text: "Same-day delivery across Nairobi and click-and-collect nationwide.",
  },
];

// ---------------- App ----------------
export default function App() {
  const allJobs = useApp((s) => s.jobs);
  const jobs = useMemo(() => allJobs.filter((j) => j.status === "open"), [allJobs]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  // Scroll to top whenever we toggle into / out of detail view
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeJob]);

  // Push a history state when opening a preview so mobile/browser back button
  // closes the preview instead of exiting the app.
  useEffect(() => {
    if (!activeJob) return;
    // push a dummy state
    try {
      window.history.pushState({ preview: true }, "");
    } catch (e) {
      // ignore
    }

    const onPop = (e: PopStateEvent) => {
      // if preview is open, close it instead of letting the browser navigate away
      if (activeJob) {
        setActiveJob(null);
        // replace state so further back goes back to real history
        try {
          window.history.replaceState({}, "");
        } catch (er) {}
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [activeJob]);

  return (
    <div className="min-h-screen bg-brand-cream font-body text-brand-green-deep">
      <Header onApplyClick={() => goTo("careers")} onNavigate={() => setActiveJob(null)} />
      {activeJob ? (
        <JobDetailView job={activeJob} onBack={() => setActiveJob(null)} />
      ) : (
        <Landing jobs={jobs} onOpenJob={setActiveJob} />
      )}
      <Footer />
    </div>
  );
}

function goTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------------- Header ----------------
function Header({ onApplyClick, onNavigate }: { onApplyClick: () => void; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-green-deep/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <button
          onClick={() => {
            close();
            goTo("home");
          }}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green-deep ring-2 ring-brand-gold/40 sm:h-11 sm:w-11">
            <Leaf className="h-5 w-5 text-brand-gold" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base tracking-wider text-white sm:text-xl">
              CHANDARANA <span className="text-brand-gold">FOODPLUS</span>
            </div>
            <div className="hidden text-[10px] uppercase tracking-[0.25em] text-white/60 sm:block">
              More than just food
            </div>
          </div>
        </button>

        <nav className="hidden items-center gap-7 text-xs font-semibold uppercase tracking-[0.18em] text-white/85 lg:flex xl:gap-9">
          {NAV.map((n) => (
            <button
              key={n.target}
              onClick={() => {
                close();
                onNavigate?.();
                goTo(n.target);
              }}
              className="transition hover:text-brand-gold"
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              close();
              onNavigate?.();
              onApplyClick();
            }}
            className="hidden items-center justify-center rounded-full bg-brand-gold px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-green-deep shadow-lg shadow-brand-gold/30 transition hover:scale-[1.03] hover:bg-brand-gold-dark sm:inline-flex"
          >
            Apply Now
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-brand-green-deep px-4 pb-5 pt-3 lg:hidden animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1 text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
            {NAV.map((n) => (
              <button
                key={n.target}
                onClick={() => {
                  close();
                  onNavigate?.();
                  goTo(n.target);
                }}
                className="rounded-lg px-3 py-3 text-left hover:bg-white/5 hover:text-brand-gold"
              >
                {n.label}
              </button>
            ))}
            <button
              onClick={() => {
                close();
                onNavigate?.();
                onApplyClick();
              }}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-brand-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-green-deep"
            >
              Apply Now
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

// ---------------- Landing ----------------
function Landing({ jobs, onOpenJob }: { jobs: Job[]; onOpenJob: (j: Job) => void }) {
  return (
    <main id="home">
      <Hero />
      <About />
      <Stores />
      <Careers jobs={jobs} onOpenJob={onOpenJob} />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-green-deep text-white">
      <img
        src="https://images.unsplash.com/photo-1514512364185-2a5f07e1b88d?auto=format&fit=crop&w=2000&q=90"
        alt="Vibrant assortment of fresh fruits and vegetables"
        className="absolute inset-0 h-full w-full object-cover opacity-24"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-green-deep via-brand-green-deep/90 to-brand-green-dark/80" />
      <div
        aria-hidden
        className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-gold/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-brand-gold/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:py-32">
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">
            <Sparkles className="h-3 w-3" /> We're hiring across Kenya
          </div>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-wide sm:text-6xl lg:text-7xl">
            GROW WITH <br />
            <span className="text-brand-gold">PURPOSE</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Join the family behind Kenya's most trusted neighbourhood supermarkets. Fresh
            opportunities. Real growth. Lasting impact.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => goTo("careers")}
              className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-green-deep shadow-xl shadow-brand-gold/30 transition hover:scale-[1.03] hover:bg-brand-gold-dark"
            >
              View open roles <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => goTo("about")}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
            >
              About us
            </button>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 sm:gap-8">
            {[
              { v: "50+", l: "Stores" },
              { v: "1.2k", l: "Team" },
              { v: "40+", l: "Years" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="font-display text-3xl text-brand-gold sm:text-4xl">{s.v}</dt>
                <dd className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                  {s.l}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hidden lg:block animate-in fade-in zoom-in-95 duration-1000">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 shadow-2xl group">
            <img
              src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=90"
              alt="Close-up of colorful produce display in a market"
              className="h-full w-full object-cover transition group-hover:scale-105 duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-green-deep/90 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8">
              <h3 className="font-display text-3xl leading-tight tracking-wide text-white">
                Chandaria <br />
                <span className="text-brand-gold">Food Plus</span>
              </h3>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
                More than just food
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => goTo("about")}
        aria-label="Scroll down"
        className="relative mx-auto mb-8 hidden h-10 w-10 animate-bounce items-center justify-center rounded-full border border-white/20 text-white/70 sm:flex"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="bg-brand-cream py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[5/4] overflow-hidden rounded-3xl shadow-xl group">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=90"
            alt="Baskets of fresh vegetables and herbs at a farmers market"
            className="h-full w-full object-cover transition group-hover:scale-105 duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-green-deep/90 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <h3 className="font-display text-3xl leading-tight tracking-wide text-white">
              Fresh local <br />
              <span className="text-brand-gold">produce</span>
            </h3>
            <p className="mt-2 text-sm text-white/90">
              Sourced daily from Kenyan farms, supporting local communities.
            </p>
          </div>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold-dark">
            About Chandarana Foodplus
          </span>
          <h2 className="mt-3 font-display text-3xl leading-tight tracking-wide text-brand-green-deep sm:text-5xl">
            A KENYAN STORY OF <span className="text-brand-gold-dark">FRESH</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-brand-green-deep/75">
            For more than four decades, Chandarana Foodplus has been the neighbourhood market
            families trust. We're proudly Kenyan, family run, and obsessed with sourcing the
            freshest local produce — from farm, to shelf, to your table.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-brand-green/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold-dark">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-base tracking-wide text-brand-green-deep">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-brand-green-deep/70">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stores() {
  return (
    <section id="stores" className="bg-brand-cream py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">
              Our Stores
            </span>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-wide sm:text-5xl">
              FIND US <span className="text-brand-gold">NEARBY</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              50+ locations across Nairobi and beyond — from buzzing malls to quiet neighbourhoods.
            </p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button
              aria-label="Previous stores"
              id="stores-prev"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-input bg-background text-muted-foreground shadow-sm hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next stores"
              id="stores-next"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-input bg-background text-muted-foreground shadow-sm hover:bg-muted"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            id="stores-scroller"
            tabIndex={0}
            className="no-scrollbar flex gap-6 overflow-x-auto pb-4 scroll-smooth touch-pan-x rounded-md"
            role="list"
            aria-label="Nearby stores"
          >
            {STORES.map((s, i) => (
              <article
                key={s.name}
                role="listitem"
                className="min-w-[18rem] flex-shrink-0 rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <h3 className="font-display text-xl tracking-wide text-brand-green-deep">
                  {s.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">Convenient locations across Nairobi.</p>
                <div className="mt-4 flex items-center gap-2">
                  <button className="rounded-full bg-brand-gold px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-brand-green-deep">
                    View
                  </button>
                  <button className="text-sm text-muted-foreground">Get directions</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{
        __html: `(() => {
          const scroller = document.getElementById('stores-scroller');
          const prev = document.getElementById('stores-prev');
          const next = document.getElementById('stores-next');
          if (!scroller) return;
          const step = Math.min(300, scroller.clientWidth * 0.6);
          prev?.addEventListener('click', () => scroller.scrollBy({ left: -step, behavior: 'smooth' }));
          next?.addEventListener('click', () => scroller.scrollBy({ left: step, behavior: 'smooth' }));
        })()`
      }} />
    </section>
  );
}

function Careers({ jobs, onOpenJob }: { jobs: Job[]; onOpenJob: (j: Job) => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(term) ||
        j.location.toLowerCase().includes(term) ||
        j.skills.some((s) => s.toLowerCase().includes(term)),
    );
  }, [jobs, q]);

  return (
    <section id="careers" className="bg-brand-cream py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold-dark">
              Careers
            </span>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-wide text-brand-green-deep sm:text-5xl">
              OPEN <span className="text-brand-gold-dark">ROLES</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm text-brand-green-deep/70">
              {filtered.length} {filtered.length === 1 ? "role" : "roles"} currently open — no
              account needed to apply.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-green-deep/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search role, skill, location…"
              className="h-11 w-full rounded-full border border-brand-green/15 bg-white pl-10 pr-4 text-sm shadow-sm transition focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-brand-green/20 bg-white p-12 text-center">
            <p className="text-sm text-brand-green-deep/60">
              No roles match your search. Try a different keyword.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((job, i) => (
              <button
                key={job.id}
                onClick={() => onOpenJob(job)}
                className="group flex h-full flex-col items-start rounded-3xl border border-brand-green/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-brand-gold/30 hover:shadow-xl animate-in fade-in slide-in-from-bottom-3"
                style={{ animationDelay: `${i * 60}ms`, animationDuration: "500ms" }}
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-green/5 text-brand-green-deep transition group-hover:bg-brand-gold/15 group-hover:text-brand-gold-dark">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    Open
                  </span>
                </div>
                <h3 className="mt-4 font-display text-xl leading-tight tracking-wide text-brand-green-deep">
                  {job.title}
                </h3>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-brand-green-deep/65">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {job.jobType.replace("-", " ")}
                  </span>
                  {job.salaryRange && (
                    <span className="inline-flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5" /> {job.salaryRange}
                    </span>
                  )}
                </div>
                {job.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-brand-green/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-green-deep/70"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold-dark">
                  View & apply{" "}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------- Job detail + apply form ----------------
const STEPS = [
  { id: 1, label: "Personal", icon: User2 },
  { id: 2, label: "Background", icon: GraduationCap },
  { id: 3, label: "Upload CV", icon: FileUp },
] as const;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function JobDetailView({ job, onBack }: { job: Job; onBack: () => void }) {
  const apply = useApp((s) => s.applyToJob);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [education, setEducation] = useState("");
  const [salary, setSalary] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_CV_BYTES) {
      toast.error("CV file must be 5MB or less.");
      return;
    }
    setCvFile(f);
  };

  const goNext = () => {
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !phone.trim()) {
        toast.error("Please fill in your name, email and phone.");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        toast.error("Please enter a valid email address.");
        return;
      }
    }
    if (step === 2 && (!county || !education || !salary)) {
      toast.error("Please complete your background details.");
      return;
    }
    setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3);
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) {
      toast.error("Please attach your CV (PDF or DOC).");
      return;
    }
    setSubmitting(true);
    try {
      const cvDataUrl = await fileToDataUrl(cvFile);
      const res = apply(job.id, {
        applicantName: fullName.trim(),
        applicantEmail: email.trim(),
        applicantPhone: phone.trim(),
        county,
        educationLevel: education,
        expectedSalary: salary,
        cvUrl: cvDataUrl,
        cvFileName: cvFile.name,
        coverLetter: coverLetter.trim() || undefined,
      });
      if (!res.ok || !res.applicationId) {
        toast.error(res.error ?? "Could not submit application.");
        return;
      }
      toast.success("Application submitted! We'll be in touch.");
      setSubmittedRef(res.applicationId);
    } catch {
      toast.error("Could not read your CV file.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedRef(null);
    setStep(1);
    setFullName("");
    setEmail("");
    setPhone("");
    setCounty("");
    setEducation("");
    setSalary("");
    setCvFile(null);
    setCoverLetter("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-green-deep/70 transition hover:text-brand-gold-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Back to careers
      </button>

      <header className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-green via-brand-green-dark to-brand-green-deep p-6 text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 sm:p-10">
        <img
          src="https://images.unsplash.com/photo-1543353071-087092ec393f?auto=format&fit=crop&w=1600&q=90"
          alt="Prepared fresh food and smiling staff in a store environment"
          className="absolute inset-0 h-full w-full object-cover opacity-22"
          loading="lazy"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-gold/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl"
        />
  <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">
              <Sparkles className="h-3 w-3" /> Now Hiring
            </div>
            <h1 className="mt-4 font-display text-3xl leading-tight tracking-wide sm:text-5xl">
              {job.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/85 sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-brand-gold" /> {job.companyName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-gold" /> {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-brand-gold" /> {job.jobType.replace("-", " ")}
              </span>
              {job.salaryRange && (
                <span className="inline-flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-brand-gold" /> {job.salaryRange}
                </span>
              )}
              {job.applyDeadline && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-brand-gold" /> Apply by {job.applyDeadline}
                </span>
              )}
            </div>
            {job.skills.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/90"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-6">
          <Block title="About the role" delay="delay-75">
            {job.description}
          </Block>
          <Block title="Responsibilities" delay="delay-150">
            {job.responsibilities}
          </Block>
          <Block title="Requirements" delay="delay-200">
            {job.requirements}
          </Block>
        </section>

        <aside className="lg:sticky lg:top-24 h-fit animate-in fade-in slide-in-from-bottom-6 duration-700">
          {submittedRef ? (
            <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white p-7 text-center shadow-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="mt-4 font-display text-2xl tracking-wide text-brand-green-deep">
                Application sent!
              </h2>
              <p className="mt-2 text-sm text-brand-green-deep/70">
                Thank you{fullName ? `, ${fullName.split(" ")[0]}` : ""}. Our team will review your
                application and contact you by email if shortlisted.
              </p>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green-deep/50">
                Reference: {submittedRef.slice(0, 8).toUpperCase()}
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={resetForm}
                  className="rounded-full border border-brand-green/20 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-green-deep transition hover:bg-brand-green/5"
                >
                  Apply for another role
                </button>
                <button
                  onClick={onBack}
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold-dark hover:underline"
                >
                  Back to all jobs
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-3xl border border-brand-green/10 bg-white shadow-xl"
            >
              <div className="bg-gradient-to-br from-brand-green-deep to-brand-green-dark px-6 py-5 text-white">
                <h2 className="font-display text-xl tracking-wide sm:text-2xl">
                  Apply for this role
                </h2>
                <p className="mt-1 text-xs text-white/70">
                  No account needed — just three quick steps.
                </p>

                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    {STEPS.map((s, i) => {
                      const active = step === s.id;
                      const done = step > s.id;
                      const Icon = s.icon;
                      return (
                        <div key={s.id} className="flex flex-1 items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={[
                                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                                done
                                  ? "bg-brand-gold text-brand-green-deep"
                                  : active
                                    ? "bg-white text-brand-green-deep ring-4 ring-brand-gold/40"
                                    : "bg-white/15 text-white/60",
                              ].join(" ")}
                            >
                              {done ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </div>
                            <span
                              className={[
                                "mt-1.5 text-[9px] font-bold uppercase tracking-[0.18em]",
                                active || done ? "text-white" : "text-white/50",
                              ].join(" ")}
                            >
                              {s.label}
                            </span>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-white/15">
                              <div
                                className={`h-full bg-brand-gold transition-all duration-500 ${step > s.id ? "w-full" : "w-0"}`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-7">
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <Field label="Full Name" required icon={<User2 className="h-3.5 w-3.5" />}>
                      <TextInput
                        value={fullName}
                        onChange={setFullName}
                        placeholder="e.g. Amina Odhiambo"
                        maxLength={100}
                      />
                    </Field>
                    <Field label="Email Address" required>
                      <TextInput
                        type="email"
                        value={email}
                        onChange={setEmail}
                        placeholder="you@example.com"
                        maxLength={255}
                      />
                    </Field>
                    <Field label="Phone Number" required>
                      <TextInput
                        value={phone}
                        onChange={setPhone}
                        placeholder="+254 7XX XXX XXX"
                        maxLength={30}
                      />
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <Field label="County" required icon={<MapPin className="h-3.5 w-3.5" />}>
                      <SelectInput
                        value={county}
                        onChange={setCounty}
                        placeholder="Select county…"
                        options={KENYA_COUNTIES}
                      />
                    </Field>
                    <Field
                      label="Education Level"
                      required
                      icon={<GraduationCap className="h-3.5 w-3.5" />}
                    >
                      <SelectInput
                        value={education}
                        onChange={setEducation}
                        placeholder="Select level…"
                        options={EDUCATION_LEVELS}
                      />
                    </Field>
                    <Field
                      label="Expected Salary Range"
                      required
                      icon={<Wallet className="h-3.5 w-3.5" />}
                    >
                      <SelectInput
                        value={salary}
                        onChange={setSalary}
                        placeholder="Select range…"
                        options={SALARY_RANGES}
                      />
                    </Field>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-[0.15em] text-brand-green-deep/70">
                        Upload CV (PDF or Word) <span className="text-rose-500">*</span>
                      </label>
                      <label
                        htmlFor="cv"
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          const f = e.dataTransfer.files?.[0];
                          if (f) pickFile(f);
                        }}
                        className={[
                          "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition",
                          dragOver
                            ? "border-brand-gold bg-brand-gold/10 scale-[1.01]"
                            : "border-brand-green/25 bg-brand-cream/40 hover:border-brand-gold hover:bg-brand-gold/5",
                        ].join(" ")}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/5 text-brand-green-deep transition group-hover:bg-brand-gold/15 group-hover:text-brand-gold-dark">
                          <FileUp className="h-5 w-5" />
                        </div>
                        <span className="mt-3 text-sm font-semibold text-brand-green-deep">
                          {cvFile ? cvFile.name : "Click to upload or drag & drop your CV"}
                        </span>
                        <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-brand-green-deep/50">
                          PDF, DOC or DOCX — max 5 MB
                        </span>
                        {cvFile && (
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> File ready
                          </span>
                        )}
                        <input
                          id="cv"
                          ref={fileInput}
                          type="file"
                          accept={ACCEPT}
                          className="sr-only"
                          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>

                    <Field label="Cover letter (optional)">
                      <textarea
                        rows={4}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Tell us why you'd be a great fit…"
                        maxLength={2000}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                      />
                    </Field>
                  </div>
                )}

                <div className="mt-7 flex items-center justify-between gap-3">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="inline-flex h-11 items-center gap-1.5 rounded-full border border-brand-green/20 px-5 text-xs font-bold uppercase tracking-[0.18em] text-brand-green-deep transition hover:bg-brand-green/5"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>
                  ) : (
                    <span />
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand-green px-6 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-brand-green/20 transition hover:scale-[1.02] hover:bg-brand-green-dark"
                    >
                      Continue <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark px-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-green-deep shadow-lg shadow-brand-gold/30 transition hover:scale-[1.02] disabled:opacity-60"
                    >
                      {submitting ? "Submitting…" : "Submit Application"}
                      {!submitting && <Send className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>

                <p className="mt-4 text-center text-[10px] uppercase tracking-[0.18em] text-brand-green-deep/40">
                  By submitting, you agree to be contacted about this role.
                </p>
              </div>
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}

// ---------------- Footer ----------------
function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-green-deep py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-brand-gold/40">
            <Leaf className="h-4 w-4 text-brand-gold" />
          </div>
          <div className="font-display text-base tracking-wider">
            CHANDARANA <span className="text-brand-gold">FOODPLUS</span>
          </div>
        </div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
t-bold uppercase tracking-[0.15em] text-brand-green-deep/70">
        {icon} {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type={type}
      placeholder={placeholder}
      maxLength={maxLength}
      required
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
