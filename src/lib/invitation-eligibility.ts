import type { EmailLog, InterviewInvitation, JobApplication } from "./types";

export function buildInvitationCampaignId(application: JobApplication): string {
  const recipientKey =
    application.userId?.trim() || application.applicantEmail.trim().toLowerCase() || application.id;
  return `bulk-invite:${application.jobId ?? "all"}:${recipientKey}`;
}

export function buildLegacyInvitationCampaignId(application: JobApplication): string {
  return `bulk-invite:${application.jobId ?? "all"}:${application.id}`;
}

export function hasReceivedInvitation(
  application: JobApplication,
  emailLogs: EmailLog[],
  interviews: InterviewInvitation[],
): boolean {
  if (interviews.some((invite) => invite.applicationId === application.id)) return true;

  const campaignIds = new Set([
    application.id,
    buildInvitationCampaignId(application),
    buildLegacyInvitationCampaignId(application),
  ]);

  return emailLogs.some(
    (log) =>
      log.status === "sent" &&
      (Boolean(log.applicationId && log.applicationId === application.id) ||
        campaignIds.has(log.campaignId ?? "")),
  );
}

export function shouldSkipInvitation(
  application: JobApplication,
  emailLogs: EmailLog[],
  interviews: InterviewInvitation[],
  onlyNew: boolean,
): boolean {
  return onlyNew && hasReceivedInvitation(application, emailLogs, interviews);
}
