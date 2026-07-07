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

  const applicationId = application.id?.trim();
  const userId = application.userId?.trim().toLowerCase();
  const applicantEmail = application.applicantEmail?.trim().toLowerCase();
  const recipientKey = userId || applicantEmail || applicationId || "";
  const jobKey = application.jobId ?? "all";
  const normalizedJobKey = jobKey.toLowerCase();
  const campaignIds = new Set([
    applicationId,
    buildInvitationCampaignId(application),
    buildLegacyInvitationCampaignId(application),
    `bulk-invite:${jobKey}:${recipientKey}`,
    `bulk-invite:${jobKey}:${applicationId}`,
  ]);

  return emailLogs.some((log) => {
    if (log.status !== "sent") return false;

    if (applicationId && log.applicationId === applicationId) return true;

    if (userId && log.userId?.trim().toLowerCase() === userId) return true;

    if (applicantEmail && log.to?.trim().toLowerCase() === applicantEmail) return true;

    if (!log.campaignId) return false;

    const campaignId = log.campaignId.trim();
    const normalizedCampaignId = campaignId.toLowerCase();
    if (Array.from(campaignIds).some((id) => id.toLowerCase() === normalizedCampaignId)) return true;

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
): boolean {
  return onlyNew && hasReceivedInvitation(application, emailLogs, interviews);
}
