import type { EmailLog, InterviewInvitation, JobApplication } from "./types";

export interface InvitationStatusRecord {
  id?: string;
  key?: string;
  recipientKey?: string;
  applicationId?: string;
  jobId?: string;
  status?: "pending" | "sent" | "failed";
  sentAt?: string;
}

function normalizeValue(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

export function buildInvitationCampaignId(application: JobApplication): string {
  const recipientKey =
    application.userId?.trim() || application.applicantEmail.trim().toLowerCase() || application.id;
  return `bulk-invite:${application.jobId ?? "all"}:${recipientKey}`;
}

export function buildLegacyInvitationCampaignId(application: JobApplication): string {
  return `bulk-invite:${application.jobId ?? "all"}:${application.id}`;
}

export function buildInvitationStatusKey(application: JobApplication): string {
  const recipientKey =
    application.userId?.trim() || application.applicantEmail.trim().toLowerCase() || application.id;
  return `${recipientKey}::${application.jobId ?? "all"}`;
}

export function buildInvitationStatusRecord(
  application: JobApplication,
  status: "pending" | "sent" | "failed" = "sent",
  sentAt?: string,
): InvitationStatusRecord {
  return {
    key: buildInvitationStatusKey(application),
    recipientKey:
      application.userId?.trim() || application.applicantEmail.trim().toLowerCase() || application.id,
    applicationId: application.id,
    jobId: application.jobId ?? "all",
    status,
    sentAt,
  };
}

function matchesInvitationStatusRecord(
  application: JobApplication,
  record: InvitationStatusRecord,
): boolean {
  const applicationId = normalizeValue(application.id);
  const recipientKey = normalizeValue(
    application.userId?.trim() || application.applicantEmail.trim().toLowerCase() || application.id,
  );
  const jobKey = normalizeValue(application.jobId ?? "all");
  const recordKey = normalizeValue(record.key);
  const recordRecipientKey = normalizeValue(record.recipientKey);
  const recordApplicationId = normalizeValue(record.applicationId);
  const recordJobKey = normalizeValue(record.jobId);

  if (recordKey && recordKey === `${recipientKey}::${jobKey}`) return true;
  if (recordApplicationId && applicationId && recordApplicationId === applicationId) return true;
  if (recordRecipientKey && recipientKey && recordRecipientKey === recipientKey) {
    return !recordJobKey || recordJobKey === jobKey || recordJobKey === "all";
  }
  return false;
}

export function hasReceivedInvitation(
  application: JobApplication,
  emailLogs: EmailLog[],
  interviews: InterviewInvitation[],
  invitationStatuses: InvitationStatusRecord[] = [],
): boolean {
  if (
    invitationStatuses.some(
      (record) =>
        (record.status === "sent" || record.status === "pending") &&
        matchesInvitationStatusRecord(application, record),
    )
  ) {
    return true;
  }

  if (interviews.some((invite) => invite.applicationId === application.id)) return true;

  const applicationId = application.id?.trim();
  const userId = normalizeValue(application.userId);
  const applicantEmail = normalizeValue(application.applicantEmail);
  const recipientKey = userId || applicantEmail || applicationId || "";
  const jobKey = application.jobId ?? "all";
  const normalizedJobKey = normalizeValue(jobKey);

  const campaignIds = new Set([
    applicationId,
    buildInvitationCampaignId(application),
    buildLegacyInvitationCampaignId(application),
    `bulk-invite:${jobKey}:${recipientKey}`,
    `bulk-invite:${jobKey}:${applicationId}`,
  ]);

  return emailLogs.some((log) => {
    if (log.status !== "sent") return false;

    const logApplicationId = normalizeValue(log.applicationId);
    if (applicationId && logApplicationId === normalizeValue(applicationId)) return true;

    if (!log.campaignId) return false;

    const campaignId = log.campaignId.trim();
    const normalizedCampaignId = normalizeValue(campaignId);
    if (Array.from(campaignIds).some((id) => normalizeValue(id) === normalizedCampaignId)) return true;

    const jobSpecificPrefix = `bulk-invite:${normalizedJobKey}:`;
    if (normalizedCampaignId.startsWith(jobSpecificPrefix) && recipientKey) {
      return normalizedCampaignId.endsWith(`:${recipientKey}`) || normalizedCampaignId.includes(`:${recipientKey}`);
    }

    return false;
  });
}

export function shouldSkipInvitation(
  application: JobApplication,
  emailLogs: EmailLog[],
  interviews: InterviewInvitation[],
  onlyNew: boolean,
  invitationStatuses: InvitationStatusRecord[] = [],
): boolean {
  return onlyNew && hasReceivedInvitation(application, emailLogs, interviews, invitationStatuses);
}
