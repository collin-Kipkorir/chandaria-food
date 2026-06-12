import { Link, useParams } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  FileUp,
  GraduationCap,
  MapPin,
  Send,
  Sparkles,
  User2,
  Wallet,
} from "lucide-react";
import { useNavigationLoader } from "@/components/NavigationLoader";

// Route handled by react-router-dom via AppRoutes

const MAX_CV_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const KENYA_COUNTIES = [
  "Nairobi",
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

const STEPS = [
  { id: 1, label: "Personal", icon: User2 },
  { id: 2, label: "Background", icon: GraduationCap },
  { id: 3, label: "Upload CV", icon: FileUp },
] as const;

function JobDetail() {
  const { jobId } = useParams() as { jobId?: string };
  const allJobs = useApp((s) => s.jobs);
  const job = useMemo(() => allJobs.find((j) => j.id === jobId), [allJobs, jobId]);
  const apply = useApp((s) => s.applyToJob);
  const nav = useNavigationLoader();

  const [step, setStep] = useState(1);
  // step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // step 2
  const [county, setCounty] = useState("");
  const [education, setEducation] = useState("");
  const [salary, setSalary] = useState("");
  // step 3
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!job) {
    return (
      <div className="min-h-screen bg-brand-cream">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-4xl text-brand-green-deep">Job not found</h1>
          <Link
            to="/jobs"
            className="mt-6 inline-block text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold-dark underline"
          >
            Back to careers
          </Link>
        </main>
      </div>
    );
  }

  const pickFile = async (f: File | null) => {
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
    if (step === 2) {
      if (!county || !education || !salary) {
        toast.error("Please complete your background details.");
        return;
      }
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
      toast.error("Could not read your CV file. Try a different one.");
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
    <div className="min-h-screen bg-brand-cream font-body text-brand-green-deep">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-green-deep/70 transition hover:text-brand-gold-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Back to careers
        </Link>

        {/* Hero */}
        <header className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-green via-brand-green-dark to-brand-green-deep p-6 text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-gold/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl"
          />
          <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
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
                    <Badge
                      key={s}
                      className="rounded-full border-0 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/90 hover:bg-white/15"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <a
              href="#apply"
              className="hidden shrink-0 items-center gap-2 rounded-full bg-brand-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-green-deep shadow-lg shadow-brand-gold/30 transition hover:scale-[1.03] hover:bg-brand-gold-dark sm:inline-flex"
            >
              Apply <Send className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Content */}
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

          {/* Application wizard */}
          <aside
            id="apply"
            className="lg:sticky lg:top-24 h-fit animate-in fade-in slide-in-from-bottom-6 duration-700"
          >
            {submittedRef ? (
              <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white p-7 text-center shadow-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 animate-in zoom-in-50 duration-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mt-4 font-display text-2xl tracking-wide text-brand-green-deep">
                  Application sent!
                </h2>
                <p className="mt-2 text-sm text-brand-green-deep/70">
                  Thank you, {fullName.split(" ")[0]}. Our team will review your application and
                  contact you by email if shortlisted.
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
                  <Link
                    to="/jobs"
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold-dark hover:underline"
                  >
                    Back to all jobs
                  </Link>
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

                  {/* Stepper */}
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
                                  className={`h-full bg-brand-gold transition-all duration-500 ${
                                    step > s.id ? "w-full" : "w-0"
                                  }`}
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
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Amina Odhiambo"
                          maxLength={100}
                          required
                        />
                      </Field>
                      <Field label="Email Address" required>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          maxLength={255}
                          required
                        />
                      </Field>
                      <Field label="Phone Number" required>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+254 7XX XXX XXX"
                          maxLength={30}
                          required
                        />
                      </Field>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                      <Field label="County" required icon={<MapPin className="h-3.5 w-3.5" />}>
                        <Select
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
                        <Select
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
                        <Select
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
                        <Label className="text-xs font-bold uppercase tracking-[0.15em] text-brand-green-deep/70">
                          Upload CV (PDF or Word) <span className="text-rose-500">*</span>
                        </Label>
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
                            if (f) void pickFile(f);
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
                        <Textarea
                          rows={4}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="Tell us why you'd be a great fit…"
                          maxLength={2000}
                        />
                      </Field>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-7 flex items-center justify-between gap-3">
                    {step > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="h-11 rounded-full border-brand-green/20 px-5 text-xs font-bold uppercase tracking-[0.18em] text-brand-green-deep hover:bg-brand-green/5"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                      </Button>
                    ) : (
                      <span />
                    )}

                    {step < 3 ? (
                      <Button
                        type="button"
                        onClick={goNext}
                        className="h-11 rounded-full bg-brand-green px-6 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-brand-green/20 transition hover:scale-[1.02] hover:bg-brand-green-dark"
                      >
                        Continue <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="h-11 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark px-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-green-deep shadow-lg shadow-brand-gold/30 transition hover:scale-[1.02]"
                      >
                        {submitting ? "Submitting…" : "Submit Application"}
                        {!submitting && <Send className="h-3.5 w-3.5" />}
                      </Button>
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
      {/* Sticky Apply button */}
      <button
        type="button"
        onClick={() => {
          try {
            nav.start();
            const el = document.getElementById("apply");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => nav.done(), 700);
          } catch (e) {
            const el = document.getElementById("apply");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }}
        aria-label="Apply for this role"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark px-5 py-3 text-base font-bold uppercase tracking-[0.14em] text-brand-green-deep shadow-2xl transition hover:scale-[1.03]"
      >
        Apply <Send className="ml-2 h-4 w-4" />
      </button>
    </div>
  );
}

export default JobDetail;

function Block({
  title,
  children,
  delay,
}: {
  title: string;
  children: React.ReactNode;
  delay?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-brand-green/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 ${delay ?? ""}`}
    >
      <h2 className="font-display text-xl tracking-wide text-brand-green-deep">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-green-deep/75">
        {children}
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-brand-green-deep/70">
        {icon}
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Select({
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
    </select>
  );
}
