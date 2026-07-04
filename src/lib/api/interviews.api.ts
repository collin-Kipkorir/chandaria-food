import { getDatabaseValue, getFirebaseAdminDatabase, objectToArray } from "../server-firebase.ts";
import { EmailService } from "../email/EmailService.ts";
import {
  buildInvitationCampaignId,
  hasReceivedInvitation,
  shouldSkipInvitation,
} from "../invitation-eligibility.ts";
import type { EmailLog, InterviewInvitation, JobApplication, Job } from "../types.ts";

const emailService = new EmailService();
const DEFAULT_INVITATION_SUBJECT = "Interview invitation details";
const DEFAULT_INVITATION_MESSAGE =
  "Hello {{name}},\n\nWe would like to invite you to interview for the {{job}} position in {{county}}. Interview date and venue will be communicated shortly. Please review the details and confirm your availability.\n\nPlease ensure you bring the following documents to the interview:\n1. Food Handling certificate - https://example.com/food-handling-certificate\n2. Original Academic Certificates\n3. Any other relevant certificates\n\nThank you.";

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
  const withPlaceholders = escaped.replace(/\{\{link:([^}:]+):([^}]+)\}\}/g, (_match, label, url) => {
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
  return `<div style="font-family:system-ui, sans-serif;line-height:1.6;color:#111">${bodyHtml}${linkHtml}<p>Regards,<br/>Recruitment Team</p></div>`;
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

export async function previewInvitationsData(body: {
  jobId?: string | null;
  county?: string | null;
  notYetSent?: boolean;
}) {
  const [applicationsValue, emailLogsValue, interviewsValue] = await Promise.all([
    getDatabaseValue<Record<string, unknown> | null>("applications"),
    getDatabaseValue<Record<string, unknown> | null>("emailLogs"),
    getDatabaseValue<Record<string, unknown> | null>("interviews"),
  ]);
  const applications = objectToArray<JobApplication>(applicationsValue);
  const emailLogs = objectToArray<EmailLog>(emailLogsValue);
  const interviews = objectToArray<InterviewInvitation>(interviewsValue);

  let matched = applications;
  if (body.jobId) matched = matched.filter((app) => app.jobId === body.jobId);
  if (body.county) matched = matched.filter((app) => app.county === body.county);

  const alreadyInvited = matched.filter((app) => hasReceivedInvitation(app, emailLogs, interviews)).length;
  const toSend = body.notYetSent
    ? matched.filter((app) => !hasReceivedInvitation(app, emailLogs, interviews)).length
    : matched.length;

  return { matched: matched.length, alreadyInvited, toSend };
}

export async function sendInvitationsData(body: {
  jobId?: string | null;
  county?: string | null;
  notYetSent?: boolean;
  subject: string;
  message: string;
  invitationText?: string;
  invitationUrl?: string;
  interviewDate?: string;
  location?: string;
}) {
  const [applicationsValue, emailLogsValue, interviewsValue, jobsValue] = await Promise.all([
    getDatabaseValue<Record<string, unknown> | null>("applications"),
    getDatabaseValue<Record<string, unknown> | null>("emailLogs"),
    getDatabaseValue<Record<string, unknown> | null>("interviews"),
    getDatabaseValue<Record<string, unknown> | null>("jobs"),
  ]);
  const applications = objectToArray<JobApplication>(applicationsValue);
  const emailLogs = objectToArray<EmailLog>(emailLogsValue);
  const interviews = objectToArray<InterviewInvitation>(interviewsValue);
  const jobs = objectToArray<Job>(jobsValue);

  let targets = applications;
  if (body.jobId) targets = targets.filter((app) => app.jobId === body.jobId);
  if (body.county) targets = targets.filter((app) => app.county === body.county);
  if (body.notYetSent) {
    targets = targets.filter((app) => !hasReceivedInvitation(app, emailLogs, interviews));
  }

  let sent = 0;
  let skipped = 0;
  const sentItems: Array<{ applicantName: string; applicantEmail: string; subject: string; message: string; sentAt: string }> = [];

  for (const application of targets) {
    const already = shouldSkipInvitation(application, emailLogs, interviews, Boolean(body.notYetSent));
    if (already) {
      skipped++;
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
    };
    const personalized = replacePlaceholders(resolvedMessage, data);
    const html = buildHtmlBody(personalized, body.invitationUrl, body.invitationText);

    console.log(`[invites] sending to ${application.applicantEmail}`, { subject: resolvedSubject, message: personalized });

    const adminDb = getFirebaseAdminDatabase();
    const result = await emailService.send({
      to: application.applicantEmail,
      name: application.applicantName,
      subject: resolvedSubject,
      html,
      text: personalized,
    });

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
