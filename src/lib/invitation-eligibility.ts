import type { EmailLog, InterviewInvitation, JobApplication } from "./types";

export function buildInvitationCampaignId(application: JobApplication): string {
  return `bulk-invite:${application.jobId ?? "all"}:${application.id}`;
}

export function hasReceivedInvitation(
  application: JobApplication,
  emailLogs: EmailLog[],
  interviews: InterviewInvitation[],
): boolean {
  if (interviews.some((invite) => invite.applicationId === application.id)) return true;

  const applicationSpecificCampaignIds = new Set([application.id, buildInvitationCampaignId(application)]);
  return emailLogs.some(
    (log) =>
      log.status === "sent" &&
      (Boolean(log.applicationId && log.applicationId === application.id) ||
        applicationSpecificCampaignIds.has(log.campaignId ?? "")),
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
