import { create } from "zustand";
import { persist } from "zustand/middleware";
import { get as dbGet, onValue, ref, set as dbSet } from "firebase/database";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";
import { fbPush, fbRemove, fbUpdate, fbWrite, toArray } from "./firebase-db";
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

  // Enqueue interview invitations for applicants of a job (writes to emailQueue in Firebase)
  sendInterviewInvitations: (
    jobId: string,
    opts: {
      interviewDate?: string;
      interviewTime?: string;
      venue?: string;
      message?: string;
      companyName?: string;
      jobTitle?: string;
      bannerImageUrl?: string;
    },
  ) => Promise<{ sent: number; skipped: number }>;

  // Send invitations in bulk with flexible targeting scopes
  sendBulkInvitations: (
    opts: {
      jobId?: string | null;
      scope: "all" | "job" | "county" | "role" | "selected";
      county?: string;
      role?: string;
      selectedApplicationIds?: string[];
      notYetSent?: boolean;
    },
    emailOpts: {
      interviewDate?: string;
      interviewTime?: string;
      venue?: string;
      message?: string;
      bannerImageUrl?: string;
      invitationUrl?: string; // optional override URL included in email body
    },
  ) => Promise<{ sent: number; skipped: number }>;

  createInterview: (i: Omit<InterviewInvitation, "id" | "createdAt" | "status">) => Promise<string>;

  createJob: (
    j: Omit<Job, "id" | "createdAt" | "status"> & { status?: Job["status"] },
  ) => Promise<string>;
  updateJob: (jobId: string, patch: Partial<Job>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;

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
  ) => Promise<{ ok: boolean; error?: string; applicationId?: string }>;
  setApplicationStatus: (applicationId: string, status: ApplicationStatus) => Promise<void>;

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
      jobs: [],
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

      sendInterviewInvitations: async (jobId, opts) => {
        const { applications, users } = get();
        const applicants = applications.filter((a) => a.jobId === jobId);
        let sent = 0;
        let skipped = 0;
        const logs: EmailLog[] = [];

        for (const a of applicants) {
          const u = users.find((x) => x.email.toLowerCase() === a.applicantEmail.toLowerCase());
          // consider an application already sent if there's a log for the same applicationId OR
          // a log for the same campaignId + userId. This protects against duplicates by application.
          const already = get().emailLogs.some(
            (l) =>
              (l.applicationId && l.applicationId === a.id && l.status === "sent") ||
              (l.campaignId === jobId &&
                l.userId === (u?.id ?? a.userId ?? "") &&
                l.status === "sent"),
          );
          const log: EmailLog = {
            id: id(),
            campaignId: jobId,
            userId: u?.id ?? a.userId ?? "",
            applicationId: a.id,
            status: already ? "skipped" : "sent",
            sentAt: new Date().toISOString(),
          };
          if (already) skipped++;
          else sent++;
          logs.push(log);

          // Push interview record too (so admin can see invitations)
          const iid = id();
          const inv: InterviewInvitation = {
            id: iid,
            userId: a.userId ?? u?.id ?? "",
            companyName: opts.companyName ?? "Chandarana Foodplus",
            jobTitle: opts.jobTitle ?? "",
            interviewDate: opts.interviewDate ?? "",
            interviewTime: opts.interviewTime ?? "",
            venue: opts.venue ?? "",
            message: opts.message ?? "",
            bannerImageUrl: opts.bannerImageUrl ?? "",
            status: "pending",
            createdAt: new Date().toISOString(),
          };

          if (isFirebaseConfigured) {
            try {
              await fbWrite(`interviews/${iid}`, inv);
              await fbPush("emailQueue", {
                id: id(),
                to: a.applicantEmail,
                subject: `Interview invitation — ${inv.jobTitle || inv.companyName}`,
                body: opts.message || `You're invited to an interview for ${inv.jobTitle}`,
                meta: { interviewId: iid, applicationId: a.id },
                createdAt: new Date().toISOString(),
              });
            } catch (err) {
              console.error("sendInterviewInvitations write error", err);
            }
          } else {
            set({ interviews: [inv, ...get().interviews] });
          }
        }

        if (isFirebaseConfigured) {
          for (const l of logs) {
            try {
              await fbWrite(`emailLogs/${l.id}`, l);
            } catch (err) {
              console.error("sendInterviewInvitations emailLogs write error", err, l);
            }
          }
        } else {
          set({ emailLogs: [...get().emailLogs, ...logs] });
        }

        get().audit("send_interview_invitations", `${jobId} sent=${sent} skipped=${skipped}`);
        return { sent, skipped };
      },

      sendBulkInvitations: async (filterOpts, emailOpts) => {
        const { users, applications, jobs } = get();
        // build candidate list based on scope
        let targets: typeof applications = [];
        const scope = filterOpts.scope;

        if (scope === "all") {
          targets = applications.slice();
        } else if (scope === "job") {
          const jid = filterOpts.jobId ?? null;
          if (!jid) return { sent: 0, skipped: 0 };
          targets = applications.filter((a) => a.jobId === jid);
        } else if (scope === "county") {
          const county = filterOpts.county ?? "";
          if (filterOpts.jobId)
            targets = applications.filter(
              (a) => a.jobId === filterOpts.jobId && a.county === county,
            );
          else targets = applications.filter((a) => a.county === county);
        } else if (scope === "role") {
          const role = filterOpts.role ?? "";
          // match users by role, then applications by userId or email
          const matchedUsers = users.filter((u) => u.role === role);
          const userIds = new Set(matchedUsers.map((u) => u.id));
          targets = applications.filter(
            (a) =>
              (a.userId && userIds.has(a.userId)) ||
              matchedUsers.some((u) => u.email.toLowerCase() === a.applicantEmail?.toLowerCase()),
          );
          if (filterOpts.jobId) targets = targets.filter((a) => a.jobId === filterOpts.jobId);
        } else if (scope === "selected") {
          const ids = new Set(filterOpts.selectedApplicationIds ?? []);
          targets = applications.filter((a) => ids.has(a.id));
        }

        // Optionally only include applications that have not yet been sent an email
        if (filterOpts.notYetSent) {
          targets = targets.filter((a) => {
            const u = users.find((x) => x.email.toLowerCase() === a.applicantEmail.toLowerCase());
            const already = get().emailLogs.some(
              (l) =>
                (l.applicationId && l.applicationId === a.id && l.status === "sent") ||
                (l.campaignId === (a.jobId ?? "") &&
                  l.userId === (u?.id ?? a.userId ?? "") &&
                  l.status === "sent"),
            );
            return !already;
          });
        }

        let sent = 0;
        let skipped = 0;

        const logs: EmailLog[] = [];

        for (const a of targets) {
          const u = users.find((x) => x.email.toLowerCase() === a.applicantEmail.toLowerCase());
          const already = get().emailLogs.some(
            (l) =>
              l.campaignId === (a.jobId ?? "") &&
              l.userId === (u?.id ?? a.userId ?? "") &&
              l.status === "sent",
          );
          const logId = id();
          const log: EmailLog = {
            id: logId,
            campaignId: a.jobId ?? "",
            userId: u?.id ?? a.userId ?? "",
            applicationId: a.id,
            status: already ? "skipped" : "sent",
            sentAt: new Date().toISOString(),
          };
          if (already) skipped++;
          else sent++;
          logs.push(log);

          const iid = id();
          const job = jobs.find((j) => j.id === a.jobId);
          const inv: InterviewInvitation = {
            id: iid,
            userId: a.userId ?? u?.id ?? "",
            companyName: job?.companyName ?? "",
            jobTitle: job?.title ?? "",
            applicationId: a.id,
            interviewDate: emailOpts.interviewDate ?? "",
            interviewTime: emailOpts.interviewTime ?? "",
            venue: emailOpts.venue ?? "",
            message: emailOpts.message ?? "",
            bannerImageUrl: emailOpts.bannerImageUrl ?? "",
            status: "pending",
            createdAt: new Date().toISOString(),
          };

          // email body includes message + invitation url template
          const invitationUrl =
            emailOpts.invitationUrl ?? `https://example.com/interview?app=${a.id}&inv=${iid}`;
          const body = `${emailOpts.message ?? "You are invited to interview."}\n\nView details: ${invitationUrl}`;

          if (isFirebaseConfigured) {
            try {
              await fbWrite(`interviews/${iid}`, inv);
              await fbPush("emailQueue", {
                id: id(),
                to: a.applicantEmail,
                subject: `Interview invitation — ${inv.jobTitle || inv.companyName}`,
                body,
                meta: { interviewId: iid, applicationId: a.id },
                createdAt: new Date().toISOString(),
              });
            } catch (err) {
              console.error("sendBulkInvitations write error", err);
            }
          } else {
            set({ interviews: [inv, ...get().interviews] });
          }
        }

        if (isFirebaseConfigured) {
          for (const l of logs) {
            try {
              await fbWrite(`emailLogs/${l.id}`, l);
            } catch (err) {
              console.error("sendBulkInvitations emailLogs write error", err, l);
            }
          }
        } else {
          set({ emailLogs: [...get().emailLogs, ...logs] });
        }

        get().audit(
          "send_bulk_invitations",
          `scope=${filterOpts.scope} sent=${sent} skipped=${skipped}`,
        );
        return { sent, skipped };
      },

      createInterview: async (i) => {
        const iid = id();
        const inv: InterviewInvitation = {
          ...i,
          id: iid,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        try {
          if (isFirebaseConfigured) await fbWrite(`interviews/${iid}`, inv);
          else set({ interviews: [inv, ...get().interviews] });
          get().audit("create_interview", iid);
          return iid;
        } catch (err) {
          console.error("createInterview error", err);
          // fallback to local state
          set({ interviews: [inv, ...get().interviews] });
          return iid;
        }
      },

      createJob: async (j) => {
        const jid = id();
        const job: Job = {
          ...j,
          id: jid,
          status: j.status ?? "open",
          createdAt: new Date().toISOString(),
        };
        try {
          if (isFirebaseConfigured) await fbWrite(`jobs/${jid}`, job);
          else set({ jobs: [job, ...get().jobs] });
          get().audit("create_job", jid);
          return jid;
        } catch (err) {
          console.error("createJob error", err);
          // fallback to local state
          set({ jobs: [job, ...get().jobs] });
          return jid;
        }
      },

      updateJob: async (jobId, patch) => {
        get().audit("update_job", jobId);
        try {
          if (isFirebaseConfigured) {
            await fbUpdate(`jobs/${jobId}`, patch as Record<string, unknown>);
          } else {
            set({ jobs: get().jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)) });
          }
        } catch (err) {
          console.error("updateJob error", err);
          set({ jobs: get().jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)) });
        }
      },

      deleteJob: async (jobId) => {
        get().audit("delete_job", jobId);
        try {
          if (isFirebaseConfigured) await fbRemove(`jobs/${jobId}`);
          else set({ jobs: get().jobs.filter((j) => j.id !== jobId) });
        } catch (err) {
          console.error("deleteJob error", err);
          set({ jobs: get().jobs.filter((j) => j.id !== jobId) });
        }
      },

      applyToJob: async (jobId, data) => {
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
        try {
          if (isFirebaseConfigured) await fbWrite(`applications/${app.id}`, app);
          else set({ applications: [app, ...applications] });
          get().audit("apply_job", `${jobId} by ${email}`);
          return { ok: true, applicationId: app.id };
        } catch (err) {
          console.error("applyToJob error", err);
          // fallback to local
          set({ applications: [app, ...applications] });
          get().audit("apply_job", `${jobId} by ${email}`);
          return { ok: true, applicationId: app.id };
        }
      },

      setApplicationStatus: async (applicationId, status) => {
        get().audit("application_status:" + status, applicationId);
        try {
          if (isFirebaseConfigured) {
            await fbUpdate(`applications/${applicationId}`, { status });
          } else {
            set({
              applications: get().applications.map((a) =>
                a.id === applicationId ? { ...a, status } : a,
              ),
            });
          }
        } catch (err) {
          console.error("setApplicationStatus error", err);
          set({
            applications: get().applications.map((a) =>
              a.id === applicationId ? { ...a, status } : a,
            ),
          });
        }
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
          // keep jobs empty locally until populated by admin or remote DB
          if (!state.jobs) state.jobs = [];
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
    // Do not auto-seed jobs; rely on admin creating jobs via the admin UI or manual seeding.
    // read initial snapshots for primary collections so the UI immediately reflects DB state
    try {
      const [jobsSnap, appsSnap, campaignsSnap, emailLogsSnap, interviewsSnap, auditsSnap] =
        await Promise.all([
          dbGet(ref(db, "jobs")),
          dbGet(ref(db, "applications")),
          dbGet(ref(db, "campaigns")),
          dbGet(ref(db, "emailLogs")),
          dbGet(ref(db, "interviews")),
          dbGet(ref(db, "audits")),
        ]);

      if (jobsSnap.exists()) {
        useApp.setState({
          jobs: toArray<Job>(jobsSnap.val()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        });
      }
      // populate users and settings from the initial snapshots we already fetched
      if (usersSnap.exists()) {
        useApp.setState({ users: toArray<User>(usersSnap.val()) });
      }
      if (settingsSnap.exists()) {
        useApp.setState({ settings: settingsSnap.val() as SystemSettings, firebaseReady: true });
      } else {
        // if settings were absent but we wrote defaults above, mark firebaseReady true
        useApp.setState({ firebaseReady: true });
      }
      if (appsSnap.exists()) {
        useApp.setState({
          applications: toArray<JobApplication>(appsSnap.val()).sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          ),
        });
      }
      if (campaignsSnap.exists()) {
        useApp.setState({
          campaigns: toArray<EmailCampaign>(campaignsSnap.val()).sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          ),
        });
      }
      if (emailLogsSnap.exists()) {
        useApp.setState({
          emailLogs: toArray<EmailLog>(emailLogsSnap.val()),
        });
      }
      if (interviewsSnap.exists()) {
        useApp.setState({
          interviews: toArray<InterviewInvitation>(interviewsSnap.val()).sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          ),
        });
      }
      if (auditsSnap.exists()) {
        useApp.setState({
          audits: toArray<AuditLog>(auditsSnap.val())
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 500),
        });
      }
    } catch (err) {
      console.warn("[startFirebaseSync] initial snapshots failed", err);
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
    console.debug("[startFirebaseSync] applications onValue ->", {
      count: list.length,
      sample: list.slice(0, 5),
    });
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
