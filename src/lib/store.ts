import { create } from "zustand";
import { persist } from "zustand/middleware";
import { get as dbGet, onValue, push, ref, remove, set as dbSet, update } from "firebase/database";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";
import type {
  ApplicationStatus,
  AuditLog,
  EmailCampaign,
  EmailLog,
  InterviewInvitation,
  Job,
  JobApplication,
  SystemSettings,
  User,
} from "./types";

const id = () => Math.random().toString(36).slice(2, 10);

const SEED_ADMIN: User = {
  id: "admin-seed",
  fullName: "System Administrator",
  email: "admin@gmail.com",
  phone: "",
  passwordHash: "admin",
  county: "",
  skills: [],
  education: "",
  experience: "",
  cvUrl: "",
  role: "admin",
  status: "active",
  createdAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: SystemSettings = {
  websiteMode: "online",
  maintenanceMessage: "We'll be back shortly.",
  updatedAt: new Date().toISOString(),
};

const SEED_JOBS: Job[] = [
  {
    id: "chandaria-prod-ops",
    companyName: "Chandaria Food Plus",
    companyLogoUrl: "",
    title: "Production Operations Supervisor",
    location: "Industrial Area, Nairobi",
    county: "Nairobi",
    jobType: "full-time",
    salaryRange: "KSh 60,000 – 90,000",
    skills: ["Production", "Quality Control", "Team Leadership", "FMCG"],
    description:
      "Oversee daily production line operations at our flagship food processing facility. Ensure output, quality, and safety targets are consistently met.",
    responsibilities:
      "Plan and supervise shift schedules; monitor line KPIs; enforce HACCP and food safety; coach line operators; coordinate with quality and maintenance teams.",
    requirements:
      "Diploma/Degree in Food Science, Industrial Engineering, or related. 3+ yrs FMCG production. Strong leadership and reporting skills.",
    applyDeadline: "",
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "chandaria-qa-officer",
    companyName: "Chandaria Food Plus",
    companyLogoUrl: "",
    title: "Quality Assurance Officer",
    location: "Industrial Area, Nairobi",
    county: "Nairobi",
    jobType: "full-time",
    salaryRange: "KSh 45,000 – 65,000",
    skills: ["HACCP", "ISO 22000", "Lab Testing", "Quality Control"],
    description:
      "Ensure every Chandaria Food Plus product meets internal and regulatory quality standards from raw material to finished good.",
    responsibilities:
      "Conduct in-process and finished product checks; maintain QA documentation; manage corrective actions; support audits.",
    requirements:
      "BSc in Food Science / Microbiology. HACCP certification. 2+ yrs in food manufacturing QA.",
    applyDeadline: "",
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "chandaria-sales-rep",
    companyName: "Chandaria Food Plus",
    companyLogoUrl: "",
    title: "Field Sales Representative",
    location: "Mombasa Region",
    county: "Mombasa",
    jobType: "full-time",
    salaryRange: "KSh 35,000 + commission",
    skills: ["Sales", "FMCG", "Customer Relations", "Route Planning"],
    description:
      "Grow Chandaria Food Plus distribution across the coastal region through direct retail engagement.",
    responsibilities:
      "Visit assigned outlets daily; secure orders; merchandise products; report market intelligence weekly.",
    requirements:
      "Diploma in Sales/Marketing. 1+ yr FMCG field sales. Valid driving licence preferred.",
    applyDeadline: "",
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "chandaria-warehouse-intern",
    companyName: "Chandaria Food Plus",
    companyLogoUrl: "",
    title: "Warehouse & Logistics Intern",
    location: "Industrial Area, Nairobi",
    county: "Nairobi",
    jobType: "internship",
    salaryRange: "KSh 20,000 stipend",
    skills: ["Inventory", "Logistics", "Excel"],
    description:
      "6-month internship supporting inbound/outbound logistics and stock control at the main DC.",
    responsibilities:
      "Stock counts; dispatch documentation; assist warehouse supervisor with daily reports.",
    requirements: "Recent graduate in Supply Chain / Logistics. Strong Excel. Eager to learn.",
    applyDeadline: "",
    status: "open",
    createdAt: new Date().toISOString(),
  },
];

// ---------- Firebase helpers ----------
const toArray = <T>(val: unknown): T[] => {
  if (!val || typeof val !== "object") return [];
  return Object.values(val as Record<string, T>);
};

function fbWrite(path: string, value: unknown) {
  const db = getFirebaseDb();
  if (!db) return;
  void dbSet(ref(db, path), value);
}
function fbUpdate(path: string, value: Record<string, unknown>) {
  const db = getFirebaseDb();
  if (!db) return;
  void update(ref(db, path), value);
}
function fbRemove(path: string) {
  const db = getFirebaseDb();
  if (!db) return;
  void remove(ref(db, path));
}
function fbPush(path: string, value: unknown) {
  const db = getFirebaseDb();
  if (!db) return null;
  const r = push(ref(db, path));
  void dbSet(r, value);
  return r.key;
}

interface AppState {
  users: User[];
  campaigns: EmailCampaign[];
  emailLogs: EmailLog[];
  interviews: InterviewInvitation[];
  audits: AuditLog[];
  settings: SystemSettings;
  jobs: Job[];
  applications: JobApplication[];
  currentUserId: string | null;
  firebaseReady: boolean;

  register: (
    data: Omit<User, "id" | "role" | "status" | "createdAt" | "passwordHash"> & {
      password: string;
    },
  ) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;

  updateProfile: (userId: string, patch: Partial<User>) => void;
  setUserStatus: (userId: string, status: User["status"]) => void;
  deleteUser: (userId: string) => void;
  approveBeta: (userId: string, approved: boolean) => void;

  setSettings: (patch: Partial<SystemSettings>) => void;

  createCampaign: (c: Omit<EmailCampaign, "id" | "createdAt" | "status">) => string;
  sendCampaign: (campaignId: string, userIds: string[]) => { sent: number; skipped: number };

  createInterview: (i: Omit<InterviewInvitation, "id" | "createdAt" | "status">) => string;

  createJob: (j: Omit<Job, "id" | "createdAt" | "status"> & { status?: Job["status"] }) => string;
  updateJob: (jobId: string, patch: Partial<Job>) => void;
  deleteJob: (jobId: string) => void;

  applyToJob: (
    jobId: string,
    data: {
      applicantName: string;
      applicantEmail: string;
      applicantPhone: string;
      county?: string;
      educationLevel?: string;
      expectedSalary?: string;
      cvUrl: string;
      cvFileName?: string;
      coverLetter?: string;
    },
  ) => { ok: boolean; error?: string; applicationId?: string };
  setApplicationStatus: (applicationId: string, status: ApplicationStatus) => void;

  audit: (action: string, target: string) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      users: [SEED_ADMIN],
      campaigns: [],
      emailLogs: [],
      interviews: [],
      audits: [],
      settings: DEFAULT_SETTINGS,
      jobs: SEED_JOBS,
      applications: [],
      currentUserId: null,
      firebaseReady: false,

      register: (data) => {
        const { users, settings } = get();
        if (settings.websiteMode === "readonly" || settings.websiteMode === "maintenance") {
          return { ok: false, error: "Registrations are currently disabled." };
        }
        if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
          return { ok: false, error: "Email already registered." };
        }
        const u: User = {
          id: id(),
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          passwordHash: data.password,
          county: data.county,
          skills: data.skills,
          education: data.education,
          experience: data.experience,
          cvUrl: data.cvUrl,
          role: "seeker",
          status: "active",
          createdAt: new Date().toISOString(),
        };
        if (isFirebaseConfigured) fbWrite(`users/${u.id}`, u);
        else set({ users: [...users, u] });
        set({ currentUserId: u.id });
        return { ok: true };
      },

      login: (email, password) => {
        const { users, settings } = get();
        const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
        if (!u || u.passwordHash !== password) return { ok: false, error: "Invalid credentials." };
        if (u.status === "suspended") return { ok: false, error: "Account suspended." };
        if (settings.websiteMode === "maintenance" && u.role !== "admin") {
          return { ok: false, error: "Site is under maintenance." };
        }
        if (settings.websiteMode === "beta" && u.role !== "admin" && !u.betaApproved) {
          return { ok: false, error: "Beta access required." };
        }
        set({ currentUserId: u.id });
        return { ok: true };
      },

      logout: () => set({ currentUserId: null }),

      updateProfile: (userId, patch) => {
        if (isFirebaseConfigured) fbUpdate(`users/${userId}`, patch as Record<string, unknown>);
        else set({ users: get().users.map((u) => (u.id === userId ? { ...u, ...patch } : u)) });
      },

      setUserStatus: (userId, status) => {
        get().audit("set_status:" + status, userId);
        get().updateProfile(userId, { status });
      },

      deleteUser: (userId) => {
        get().audit("delete_user", userId);
        if (isFirebaseConfigured) fbRemove(`users/${userId}`);
        else set({ users: get().users.filter((u) => u.id !== userId) });
      },

      approveBeta: (userId, approved) => {
        get().audit("beta_" + (approved ? "approve" : "revoke"), userId);
        get().updateProfile(userId, { betaApproved: approved });
      },

      setSettings: (patch) => {
        get().audit("update_settings", JSON.stringify(patch));
        const next = { ...get().settings, ...patch, updatedAt: new Date().toISOString() };
        if (isFirebaseConfigured) fbWrite("settings", next);
        else set({ settings: next });
      },

      createCampaign: (c) => {
        const cid = id();
        const campaign: EmailCampaign = {
          ...c,
          id: cid,
          status: "draft",
          createdAt: new Date().toISOString(),
        };
        if (isFirebaseConfigured) fbWrite(`campaigns/${cid}`, campaign);
        else set({ campaigns: [campaign, ...get().campaigns] });
        get().audit("create_campaign", cid);
        return cid;
      },

      sendCampaign: (campaignId, userIds) => {
        const { emailLogs } = get();
        let sent = 0,
          skipped = 0;
        const newLogs: EmailLog[] = [];
        for (const uid of userIds) {
          const already = emailLogs.some(
            (l) => l.campaignId === campaignId && l.userId === uid && l.status === "sent",
          );
          const log: EmailLog = {
            id: id(),
            campaignId,
            userId: uid,
            status: already ? "skipped" : "sent",
            sentAt: new Date().toISOString(),
          };
          if (already) skipped++;
          else sent++;
          newLogs.push(log);
        }
        if (isFirebaseConfigured) {
          for (const l of newLogs) fbWrite(`emailLogs/${l.id}`, l);
          fbUpdate(`campaigns/${campaignId}`, { status: "completed" });
        } else {
          set({
            emailLogs: [...emailLogs, ...newLogs],
            campaigns: get().campaigns.map((c) =>
              c.id === campaignId ? { ...c, status: "completed" } : c,
            ),
          });
        }
        get().audit("send_campaign", `${campaignId} sent=${sent} skipped=${skipped}`);
        return { sent, skipped };
      },

      createInterview: (i) => {
        const iid = id();
        const inv: InterviewInvitation = {
          ...i,
          id: iid,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        if (isFirebaseConfigured) fbWrite(`interviews/${iid}`, inv);
        else set({ interviews: [inv, ...get().interviews] });
        get().audit("create_interview", iid);
        return iid;
      },

      createJob: (j) => {
        const jid = id();
        const job: Job = {
          ...j,
          id: jid,
          status: j.status ?? "open",
          createdAt: new Date().toISOString(),
        };
        if (isFirebaseConfigured) fbWrite(`jobs/${jid}`, job);
        else set({ jobs: [job, ...get().jobs] });
        get().audit("create_job", jid);
        return jid;
      },

      updateJob: (jobId, patch) => {
        get().audit("update_job", jobId);
        if (isFirebaseConfigured) fbUpdate(`jobs/${jobId}`, patch as Record<string, unknown>);
        else set({ jobs: get().jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)) });
      },

      deleteJob: (jobId) => {
        get().audit("delete_job", jobId);
        if (isFirebaseConfigured) fbRemove(`jobs/${jobId}`);
        else set({ jobs: get().jobs.filter((j) => j.id !== jobId) });
      },

      applyToJob: (jobId, data) => {
        const { currentUserId, applications, jobs, settings } = get();
        if (settings.websiteMode === "readonly" || settings.websiteMode === "maintenance") {
          return { ok: false, error: "Applications are currently disabled." };
        }
        const job = jobs.find((j) => j.id === jobId);
        if (!job || job.status !== "open") return { ok: false, error: "This job is not open." };
        const email = data.applicantEmail.trim().toLowerCase();
        if (
          applications.some((a) => a.jobId === jobId && a.applicantEmail?.toLowerCase() === email)
        ) {
          return {
            ok: false,
            error: "An application with this email already exists for this job.",
          };
        }
        const app: JobApplication = {
          id: id(),
          jobId,
          userId: currentUserId ?? undefined,
          applicantName: data.applicantName.trim(),
          applicantEmail: email,
          applicantPhone: data.applicantPhone.trim(),
          county: data.county,
          educationLevel: data.educationLevel,
          expectedSalary: data.expectedSalary,
          coverLetter: data.coverLetter,
          cvUrl: data.cvUrl,
          cvFileName: data.cvFileName,
          status: "submitted",
          createdAt: new Date().toISOString(),
        };
        if (isFirebaseConfigured) fbWrite(`applications/${app.id}`, app);
        else set({ applications: [app, ...applications] });
        get().audit("apply_job", `${jobId} by ${email}`);
        return { ok: true, applicationId: app.id };
      },

      setApplicationStatus: (applicationId, status) => {
        get().audit("application_status:" + status, applicationId);
        if (isFirebaseConfigured) fbUpdate(`applications/${applicationId}`, { status });
        else
          set({
            applications: get().applications.map((a) =>
              a.id === applicationId ? { ...a, status } : a,
            ),
          });
      },

      audit: (action, target) => {
        const entry: AuditLog = {
          id: id(),
          adminAction: action,
          target,
          createdAt: new Date().toISOString(),
        };
        if (isFirebaseConfigured) {
          fbPush("audits", entry);
        } else {
          set({ audits: [entry, ...get().audits].slice(0, 500) });
        }
      },
    }),
    {
      name: "recruit-mvp-v1",
      partialize: (state) =>
        isFirebaseConfigured
          ? { currentUserId: state.currentUserId }
          : {
              users: state.users,
              campaigns: state.campaigns,
              emailLogs: state.emailLogs,
              interviews: state.interviews,
              audits: state.audits,
              settings: state.settings,
              jobs: state.jobs,
              applications: state.applications,
              currentUserId: state.currentUserId,
            },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!isFirebaseConfigured) {
          if (!state.users.some((u) => u.email === "admin@gmail.com")) {
            state.users = [SEED_ADMIN, ...state.users];
          }
          if (!state.jobs || state.jobs.length === 0) {
            state.jobs = SEED_JOBS;
          }
        }
      },
    },
  ),
);

// ---------- Firebase live sync ----------
let syncStarted = false;
export function startFirebaseSync() {
  if (syncStarted) return;
  if (!isFirebaseConfigured) return;
  const db = getFirebaseDb();
  if (!db) return;
  syncStarted = true;

  void (async () => {
    const usersSnap = await dbGet(ref(db, "users"));
    if (!usersSnap.exists()) await dbSet(ref(db, `users/${SEED_ADMIN.id}`), SEED_ADMIN);
    else {
      const all = usersSnap.val() as Record<string, User>;
      const hasAdmin = Object.values(all).some((u) => u.email === "admin@gmail.com");
      if (!hasAdmin) await dbSet(ref(db, `users/${SEED_ADMIN.id}`), SEED_ADMIN);
    }
    const settingsSnap = await dbGet(ref(db, "settings"));
    if (!settingsSnap.exists()) await dbSet(ref(db, "settings"), DEFAULT_SETTINGS);
    const jobsSnap = await dbGet(ref(db, "jobs"));
    if (!jobsSnap.exists()) {
      for (const j of SEED_JOBS) await dbSet(ref(db, `jobs/${j.id}`), j);
    }
  })();

  onValue(ref(db, "users"), (snap) => {
    useApp.setState({ users: toArray<User>(snap.val()) });
  });
  onValue(ref(db, "campaigns"), (snap) => {
    const list = toArray<EmailCampaign>(snap.val()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    useApp.setState({ campaigns: list });
  });
  onValue(ref(db, "emailLogs"), (snap) => {
    useApp.setState({ emailLogs: toArray<EmailLog>(snap.val()) });
  });
  onValue(ref(db, "interviews"), (snap) => {
    const list = toArray<InterviewInvitation>(snap.val()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    useApp.setState({ interviews: list });
  });
  onValue(ref(db, "audits"), (snap) => {
    const list = toArray<AuditLog>(snap.val())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 500);
    useApp.setState({ audits: list });
  });
  onValue(ref(db, "settings"), (snap) => {
    const s = snap.val() as SystemSettings | null;
    if (s) useApp.setState({ settings: s, firebaseReady: true });
    else useApp.setState({ firebaseReady: true });
  });
  onValue(ref(db, "jobs"), (snap) => {
    const list = toArray<Job>(snap.val()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    useApp.setState({ jobs: list });
  });
  onValue(ref(db, "applications"), (snap) => {
    const list = toArray<JobApplication>(snap.val()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    useApp.setState({ applications: list });
  });
}

export const useCurrentUser = () => {
  const { users, currentUserId } = useApp();
  return users.find((u) => u.id === currentUserId) ?? null;
};

export const COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Kericho",
  "Eldoret",
  "Nyeri",
  "Machakos",
  "Kakamega",
  "Meru",
];
