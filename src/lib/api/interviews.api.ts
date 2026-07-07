import { getDatabaseValue, getFirebaseAdminDatabase, objectToArray, setDatabaseValue } from "../server-firebase.js";
import { EmailService } from "../email/EmailService.js";
import {
  buildInvitationCampaignId,
  buildInvitationStatusRecord,
  buildInvitationStatusKey,
  hasReceivedInvitation,
  shouldSkipInvitation,
  type InvitationStatusRecord,
} from "../invitation-eligibility.js";
import type { EmailLog, InterviewInvitation, JobApplication, Job } from "../types.ts";

const emailService = new EmailService();
const DEFAULT_INVITATION_SUBJECT = "Interview invitation details";
const DEFAULT_INVITATION_MESSAGE =
  "Hello {{name}},\n\nWe would like to invite you to interview for the {{job}} position in {{county}}. Interview date and venue will be communicated shortly. Please review the details and confirm your availability.\n\nPlease ensure you bring the following documents to the interview:\n1. Submit documents - {{documentUploadUrl}}\n2. Work Ethics / Labour Clearance - {{workEthicsUrl}}\n3. Food Handler Certificate - {{foodHandlerCertUrl}}\n\nThank you.";

function replacePlaceholders(template: string, data: Record<string, string>) {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const normalized = key.trim().toLowerCase();
    if (normalized.startsWith("link:")) {
      return `{{${key.trim()}}}`;
    }
    return data[normalized] ?? `{{${key.trim()}}}`;
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderTextToHtml(message: string, invitationUrl?: string, invitationText?: string) {
  const escaped = escapeHtml(message);
  const withMarkdownLinks = escaped.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label, url) => {
    const safeLabel = escapeHtml(label.trim());
    const safeUrl = url.trim();
    return safeUrl
      ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">${safeLabel}</a>`
      : safeLabel;
  });
  const withPlaceholders = withMarkdownLinks.replace(/\{\{link:([^}:]+):([^}]+)\}\}/g, (_match, label, url) => {
    const safeLabel = label.trim();
    const safeUrl = url.trim();
    const resolvedUrl = safeUrl || invitationUrl || "";
    const resolvedLabel = safeLabel || invitationText || "Open details";
    return resolvedUrl
      ? `<a href="${resolvedUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">${resolvedLabel}</a>`
      : resolvedLabel;
  });
  const withLinks = withPlaceholders.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">${url}</a>`;
  });
  const paragraphs = withLinks
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n/g, "<br/>"))
    .filter(Boolean);

  return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
}

function buildHtmlBody(message: string, invitationUrl?: string, invitationText?: string) {
  const bodyHtml = renderTextToHtml(message, invitationUrl, invitationText);
  const linkHtml = invitationUrl
    ? `<p style="margin-top:12px;"><a href="${invitationUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">${invitationText ?? "Open details"}</a></p>`
    : "";
  return `<div style="font-family:system-ui, sans-serif;line-height:1.6;color:#111">${bodyHtml}${linkHtml}</div>`;
}

export async function getApplicantsData() {
  const applicationsValue = await getDatabaseValue<Record<string, unknown> | null>("applications");
  return objectToArray<JobApplication>(applicationsValue);
}

export async function getFiltersData() {
  const [jobsValue, appsValue] = await Promise.all([
    getDatabaseValue<Record<string, unknown> | null>("jobs"),
    getDatabaseValue<Record<string, unknown> | null>("applications"),
  ]);
  const jobs = objectToArray<Job>(jobsValue);
  const applications = objectToArray<JobApplication>(appsValue);
  const counties = Array.from(new Set(applications.map((app) => app.county ?? ""))).filter(Boolean);
  return { jobs, counties };
}

function buildInvitationRecipientKey(application: JobApplication) {
  return `${application.jobId}:${application.userId?.trim() || application.applicantEmail.trim().toLowerCase() || application.id}`;
}

function toInvitationStatusRecords(value: Record<string, unknown> | null): InvitationStatusRecord[] {
  return objectToArray<InvitationStatusRecord>(value).filter((record) => Boolean(record.status));
}

export async function previewInvitationsData(body: {
  jobId?: string | null;
  county?: string | null;
  notYetSent?: boolean;
}) {
  const onlyNew = Boolean(body.notYetSent);
  const [applicationsValue, emailLogsValue, interviewsValue, inviteStatusesValue] = await Promise.all([
    getDatabaseValue<Record<string, unknown> | null>("applications"),
    getDatabaseValue<Record<string, unknown> | null>("emailLogs"),
    getDatabaseValue<Record<string, unknown> | null>("interviews"),
    getDatabaseValue<Record<string, unknown> | null>("bulkInviteStatus"),
  ]);
  const applications = objectToArray<JobApplication>(applicationsValue);
  const emailLogs = objectToArray<EmailLog>(emailLogsValue);
  const interviews = objectToArray<InterviewInvitation>(interviewsValue);
  const invitationStatuses = toInvitationStatusRecords(inviteStatusesValue);

  let matched = applications;
  if (body.jobId) matched = matched.filter((app) => app.jobId === body.jobId);
  if (body.county) matched = matched.filter((app) => app.county === body.county);

  const uniqueMatched = Array.from(
    matched.reduce<Map<string, JobApplication>>((map, app) => {
      const key = buildInvitationRecipientKey(app);
      if (!map.has(key)) map.set(key, app);
      return map;
    }, new Map()),
  ).map(([, app]) => app);

  const alreadyInvited = uniqueMatched.filter((app) =>
    hasReceivedInvitation(app, emailLogs, interviews, invitationStatuses),
  ).length;
  const toSend = onlyNew
    ? uniqueMatched.filter((app) => !hasReceivedInvitation(app, emailLogs, interviews, invitationStatuses)).length
    : uniqueMatched.length;

  return { matched: uniqueMatched.length, alreadyInvited, toSend };
}

export async function sendInvitationsData(body: {
  jobId?: string | null;
  county?: string | null;
  notYetSent?: boolean;
  applicationIds?: string[];
  subject: string;
  message: string;
  invitationText?: string;
  invitationUrl?: string;
  interviewDate?: string;
  location?: string;
  documentUploadUrl?: string;
  workEthicsUrl?: string;
  foodHandlerCertUrl?: string;
}) {
  const [applicationsValue, emailLogsValue, interviewsValue, jobsValue, inviteStatusesValue] = await Promise.all([
    getDatabaseValue<Record<string, unknown> | null>("applications"),
    getDatabaseValue<Record<string, unknown> | null>("emailLogs"),
    getDatabaseValue<Record<string, unknown> | null>("interviews"),
    getDatabaseValue<Record<string, unknown> | null>("jobs"),
    getDatabaseValue<Record<string, unknown> | null>("bulkInviteStatus"),
  ]);
  const applications = objectToArray<JobApplication>(applicationsValue);
  const emailLogs = objectToArray<EmailLog>(emailLogsValue);
  const interviews = objectToArray<InterviewInvitation>(interviewsValue);
  const jobs = objectToArray<Job>(jobsValue);
  const invitationStatuses = toInvitationStatusRecords(inviteStatusesValue);

  const onlyNew = Boolean(body.notYetSent);

  let targets = applications;
  // If specific application IDs supplied, target only those
  if (Array.isArray(body.applicationIds) && body.applicationIds.length > 0) {
    const allowed = new Set(body.applicationIds.filter(Boolean));
    targets = targets.filter((app) => allowed.has(app.id ?? ""));
  }
  if (body.jobId) targets = targets.filter((app) => app.jobId === body.jobId);
  if (body.county) targets = targets.filter((app) => app.county === body.county);

  const uniqueTargets = Array.from(
    targets.reduce<Map<string, JobApplication>>((map, app) => {
      const key = buildInvitationRecipientKey(app);
      if (!map.has(key)) map.set(key, app);
      return map;
    }, new Map()),
  ).map(([, app]) => app);

  let filteredTargets = uniqueTargets;
  if (onlyNew) {
    const before = filteredTargets.length;
    filteredTargets = filteredTargets.filter((app) => !hasReceivedInvitation(app, emailLogs, interviews, invitationStatuses));
    const after = filteredTargets.length;
    console.log(`[invites][filter] filtered ${before - after} previously-invited applicants out of ${before}`);
  }

  let sent = 0;
  let skipped = 0;
  const sentItems: Array<{ applicantName: string; applicantEmail: string; subject: string; message: string; sentAt: string }> = [];

  for (const application of filteredTargets) {
    const already = shouldSkipInvitation(application, emailLogs, interviews, onlyNew, invitationStatuses);
    if (already) {
      skipped++;
      console.log(`[invites][skip] skipping ${application.applicantEmail} (${application.id}) - already invited`);
      continue;
    }

    const job = jobs.find((j) => j.id === application.jobId);
    const resolvedSubject = (body.subject ?? "").trim() || DEFAULT_INVITATION_SUBJECT;
    const resolvedMessage = (body.message ?? "").trim() || DEFAULT_INVITATION_MESSAGE;
    const data = {
      name: application.applicantName,
      job: job?.title ?? "",
      county: application.county ?? "",
      interview_date: body.interviewDate ?? "",
      location: body.location ?? application.county ?? "",
      companyname: job?.companyName ?? "",
      sentdate: new Date().toISOString().slice(0,10),
      hremail: "",
      documentuploadurl: body.documentUploadUrl ?? "",
      workethicsurl: body.workEthicsUrl ?? "",
      foodhandlercerturl: body.foodHandlerCertUrl ?? "",
    };
    const personalized = replacePlaceholders(resolvedMessage, data);
    const html = buildHtmlBody(personalized, body.invitationUrl, body.invitationText);

    console.log(`[invites] sending to ${application.applicantEmail}`, { subject: resolvedSubject, message: personalized });

    const adminDb = getFirebaseAdminDatabase();
    const statusKey = buildInvitationStatusKey(application);
    const statusPath = `bulkInviteStatus/${encodeURIComponent(statusKey)}`;
    const pendingStatus = buildInvitationStatusRecord(application, "pending");

    if (adminDb) {
      await adminDb.ref(statusPath).set({
        id: statusKey,
        key: statusKey,
        ...pendingStatus,
      });
    } else {
      await setDatabaseValue(statusPath, {
        id: statusKey,
        key: statusKey,
        ...pendingStatus,
      });
    }

    const result = await emailService.send({
      to: application.applicantEmail,
      name: application.applicantName,
      subject: resolvedSubject,
      html,
      text: personalized,
    });

    // Detailed logging for send result to assist in diagnosing production failures
    if (!result.ok) {
      console.error(`[invites][error] send failed for ${application.applicantEmail}`, { error: result.error });
      if (adminDb) {
        await adminDb.ref(statusPath).set({
          id: statusKey,
          key: statusKey,
          ...buildInvitationStatusRecord(application, "failed"),
        });
      } else {
        await setDatabaseValue(statusPath, {
          id: statusKey,
          key: statusKey,
          ...buildInvitationStatusRecord(application, "failed"),
        });
      }
    } else {
      console.log(`[invites][ok] sent to ${application.applicantEmail}`, { info: result.info });
      if (adminDb) {
        await adminDb.ref(statusPath).set({
          id: statusKey,
          key: statusKey,
          ...buildInvitationStatusRecord(application, "sent", new Date().toISOString()),
        });
      } else {
        await setDatabaseValue(statusPath, {
          id: statusKey,
          key: statusKey,
          ...buildInvitationStatusRecord(application, "sent", new Date().toISOString()),
        });
      }
    }

    const logId = `${Date.now()}-${application.id}`;
    if (adminDb) {
      await adminDb.ref(`emailLogs/${logId}`).set({
        id: logId,
        campaignId: buildInvitationCampaignId(application),
        userId: application.userId ?? "",
        applicationId: application.id,
        status: result.ok ? "sent" : "failed",
        sentAt: new Date().toISOString(),
      });

      const interviewId = `${Date.now()}-${application.id}-invite`;
      await adminDb.ref(`interviews/${interviewId}`).set({
        id: interviewId,
        userId: application.userId ?? "",
        subject: resolvedSubject,
        applicationId: application.id,
        companyName: job?.companyName ?? "",
        jobTitle: job?.title ?? "",
        interviewDate: data.interview_date,
        interviewTime: "",
        venue: data.location,
        message: personalized,
        bannerImageUrl: "",
        status: result.ok ? "pending" : "failed",
        createdAt: new Date().toISOString(),
      });
    } else {
      console.warn(`Firebase Admin unavailable; skipping persistence for invitation ${application.id}`);
    }

    if (result.ok) {
      sent++;
      sentItems.push({
        applicantName: application.applicantName,
        applicantEmail: application.applicantEmail,
        subject: resolvedSubject,
        message: personalized,
        sentAt: new Date().toISOString(),
      });
    }
  }

  return { sent, skipped, sentItems };
}

export async function getInterviewHistoryData() {
  const [interviewsValue, logsValue] = await Promise.all([
    getDatabaseValue<Record<string, unknown> | null>("interviews"),
    getDatabaseValue<Record<string, unknown> | null>("emailLogs"),
  ]);
  return {
    interviews: objectToArray<InterviewInvitation>(interviewsValue),
    emailLogs: objectToArray<EmailLog>(logsValue),
  };
}
