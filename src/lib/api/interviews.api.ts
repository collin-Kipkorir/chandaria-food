import { getDatabaseValue, getFirebaseAdminDatabase, objectToArray } from "../server-firebase";
import { EmailService } from "../email/EmailService";
import type { EmailLog, InterviewInvitation, JobApplication, Job } from "../types";

const emailService = new EmailService();

function replacePlaceholders(template: string, data: Record<string, string>) {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const normalized = key.trim().toLowerCase();
    return data[normalized] ?? "";
  });
}

function buildHtmlBody(message: string, invitationUrl?: string, invitationText?: string) {
  const linkHtml = invitationUrl
    ? `<p><a href="${invitationUrl}" style="color:#2563eb;text-decoration:none;">${invitationText ?? "Open details"}</a></p>`
    : "";
  return `<div style="font-family:system-ui, sans-serif;line-height:1.6;color:#111"><p>${message}</p>${linkHtml}<p>Regards,<br/>Recruitment Team</p></div>`;
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

function hasReceivedInvitation(application: JobApplication, emailLogs: EmailLog[], interviews: InterviewInvitation[]) {
  if (interviews.some((invite) => invite.applicationId === application.id)) return true;
  const userId = application.userId ?? "";
  return emailLogs.some(
    (log) =>
      log.status === "sent" &&
      ((log.applicationId && log.applicationId === application.id) ||
        (userId !== "" && log.userId === userId && log.campaignId === application.jobId)),
  );
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

  for (const application of targets) {
    const already = hasReceivedInvitation(application, emailLogs, interviews);
    if (already) {
      skipped++;
      continue;
    }

    const job = jobs.find((j) => j.id === application.jobId);
    const data = {
      name: application.applicantName,
      job: job?.title ?? "",
      county: application.county ?? "",
      interview_date: body.interviewDate ?? "",
      location: body.location ?? application.county ?? "",
    };
    const personalized = replacePlaceholders(body.message, data);
    const html = buildHtmlBody(personalized, body.invitationUrl, body.invitationText);

    const adminDb = getFirebaseAdminDatabase();
    if (!adminDb) {
      throw new Error(
        "Unable to write invitation records because Firebase Admin is unavailable. Set GOOGLE_APPLICATION_CREDENTIALS or configure an admin credential source.",
      );
    }

    const result = await emailService.send({
      to: application.applicantEmail,
      name: application.applicantName,
      subject: body.subject,
      html,
      text: personalized,
    });

    const logId = `${Date.now()}-${application.id}`;
    await adminDb.ref(`emailLogs/${logId}`).set({
      id: logId,
      campaignId: body.jobId ?? "bulk-invite",
      userId: application.userId ?? "",
      applicationId: application.id,
      status: result.ok ? "sent" : "failed",
      sentAt: new Date().toISOString(),
    });

    const interviewId = `${Date.now()}-${application.id}-invite`;
    await adminDb.ref(`interviews/${interviewId}`).set({
      id: interviewId,
      userId: application.userId ?? "",
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

    if (result.ok) sent++;
  }

  return { sent, skipped };
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
