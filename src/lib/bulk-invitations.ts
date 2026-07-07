import type { EmailLog, InterviewInvitation, JobApplication, User } from "./types";

export type BulkInvitationFilters = {
  /** Empty or undefined = all job titles */
  jobIds?: string[];
  /** Empty or undefined = all counties */
  counties?: string[];
  /** When true, exclude applicants who already received an invitation */
  notYetSent?: boolean;
};

export function resolveUserForApplication(
  application: JobApplication,
  users: User[],
): User | undefined {
  if (application.userId) {
    const byId = users.find((u) => u.id === application.userId);
    if (byId) return byId;
  }
  return users.find(
    (u) => u.email.toLowerCase() === application.applicantEmail.toLowerCase(),
  );
}

export function hasReceivedInvitation(
  application: JobApplication,
  users: User[],
  emailLogs: EmailLog[],
  interviews: InterviewInvitation[],
  invitationStatuses: Array<{ status?: string; key?: string; recipientKey?: string; applicationId?: string; jobId?: string }> = [],
): boolean {
  const user = resolveUserForApplication(application, users);
  const userId = user?.id ?? application.userId ?? "";
  const applicantEmail = application.applicantEmail.trim().toLowerCase();
  const jobKey = application.jobId ?? "";

  if (
    invitationStatuses.some(
      (record) =>
        (record.status === "pending" || record.status === "sent") &&
        ((record.key && record.key === `${(application.userId?.trim() || application.applicantEmail.trim().toLowerCase() || application.id).toLowerCase()}::${(application.jobId ?? "all").toLowerCase()}`) ||
          (record.applicationId && record.applicationId === application.id) ||
          (record.recipientKey && record.recipientKey === (application.userId?.trim() || application.applicantEmail.trim().toLowerCase() || application.id))),
    )
  ) {
    return true;
  }

  if (interviews.some((i) => i.applicationId === application.id)) {
    return true;
  }

  return emailLogs.some((log) => {
    if (log.status !== "sent") return false;

    if (log.applicationId && log.applicationId === application.id) return true;

    if (userId && log.userId === userId) {
      return log.campaignId?.includes(`bulk-invite:${jobKey}:`) || log.campaignId === jobKey;
    }

    if (applicantEmail && log.campaignId?.includes(applicantEmail)) {
      return log.campaignId?.includes(`bulk-invite:${jobKey}:`);
    }

    return false;
  });
}

export function filterApplicationsForBulkInvite(
  applications: JobApplication[],
  users: User[],
  emailLogs: EmailLog[],
  interviews: InterviewInvitation[],
  filters: BulkInvitationFilters,
): JobApplication[] {
  let targets = applications.slice();

  const jobIds = filters.jobIds?.filter(Boolean) ?? [];
  if (jobIds.length > 0) {
    const allowed = new Set(jobIds);
    targets = targets.filter((a) => allowed.has(a.jobId));
  }

  const counties = filters.counties?.filter(Boolean) ?? [];
  if (counties.length > 0) {
    const allowed = new Set(counties.map((c) => c.toLowerCase()));
    targets = targets.filter((a) => a.county && allowed.has(a.county.toLowerCase()));
  }

  if (filters.notYetSent) {
    targets = targets.filter(
      (a) => !hasReceivedInvitation(a, users, emailLogs, interviews),
    );
  }

  return targets;
}

export function countBulkInvitePreview(
  applications: JobApplication[],
  users: User[],
  emailLogs: EmailLog[],
  interviews: InterviewInvitation[],
  filters: BulkInvitationFilters,
): { total: number; alreadyInvited: number; toSend: number; targets: JobApplication[] } {
  const matched = filterApplicationsForBulkInvite(
    applications,
    users,
    emailLogs,
    interviews,
    { ...filters, notYetSent: false },
  );
  const alreadyInvited = matched.filter((a) =>
    hasReceivedInvitation(a, users, emailLogs, interviews),
  ).length;
  const targets = filters.notYetSent
    ? matched.filter((a) => !hasReceivedInvitation(a, users, emailLogs, interviews))
    : matched;
  const toSend = filters.notYetSent ? targets.length : matched.length;

  return { total: matched.length, alreadyInvited, toSend, targets };
}
