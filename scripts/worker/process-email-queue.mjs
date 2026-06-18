#!/usr/bin/env node
/**
 * Worker scaffold: poll /emailQueue in Firebase Realtime Database, process
 * items, write results to /emailLogs, and remove processed queue entries.
 *
 * THIS IS A SCAFFOLD. Replace the sendEmail stub with a real provider
 * (SendGrid, SES, Mailgun) and secure credentials via environment variables
 * or a secret store. In production run this as a managed worker (Cloud Run
 * / VM) or use Firebase Cloud Functions.
 */

import admin from "firebase-admin";
import path from "path";
import sgMail from "@sendgrid/mail";

// Service account credentials are required for admin SDK. Use
// GOOGLE_APPLICATION_CREDENTIALS env var pointing to a JSON key file.
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn("GOOGLE_APPLICATION_CREDENTIALS not set — admin SDK may fail to initialize");
}

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
  });
} catch (err) {
  console.error("Failed to initialize Firebase Admin SDK:", err);
  process.exit(1);
}

const db = admin.database();

async function sendEmail(payload) {
  console.log("Sending email to", payload.to, "subject:", payload.subject);
  if (process.env.SENDGRID_API_KEY) {
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: payload.to,
        from: process.env.SENDGRID_FROM_EMAIL || "no-reply@example.com",
        subject: payload.subject || "Notification",
        text: payload.body || "",
        html: payload.html || payload.body || "",
      };
      const res = await sgMail.send(msg);
      return { ok: true, info: res };
    } catch (err) {
      console.error("SendGrid error", err);
      return { ok: false, error: String(err) };
    }
  }

  // Fallback stub when no SendGrid key provided
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true, info: "stub" };
}

async function processOnce() {
  const qRef = db.ref("emailQueue");
  const snap = await qRef.limitToFirst(50).get();
  if (!snap.exists()) return 0;
  const items = snap.val();
  const keys = Object.keys(items || {});
  let processed = 0;
  for (const key of keys) {
    const item = items[key];
    try {
      const res = await sendEmail(item);
      const log = {
        id: key,
        campaignId: item.meta?.campaignId ?? item.meta?.jobId ?? "emailQueue",
        userId: item.meta?.userId ?? item.to ?? "",
        applicationId: item.meta?.applicationId ?? null,
        interviewId: item.meta?.interviewId ?? null,
        status: res.ok ? "sent" : "failed",
        sentAt: new Date().toISOString(),
      };
      await db.ref(`emailLogs/${log.id}`).set(log);
      await db.ref(`emailQueue/${key}`).remove();
      processed++;
    } catch (err) {
      console.error("Failed to process queue item", key, err);
      // Mark as failed but keep item for retry or move to dead-letter later
      const log = {
        id: key,
        campaignId: item.meta?.campaignId ?? item.meta?.jobId ?? "emailQueue",
        userId: item.meta?.userId ?? item.to ?? "",
        applicationId: item.meta?.applicationId ?? null,
        interviewId: item.meta?.interviewId ?? null,
        status: "failed",
        sentAt: new Date().toISOString(),
      };
      await db.ref(`emailLogs/${log.id}`).set(log);
      // optionally remove or leave for retry
      await db.ref(`emailQueue/${key}`).remove();
    }
  }
  return processed;
}

async function loop() {
  console.log("Worker started — polling emailQueue");
  while (true) {
    try {
      const count = await processOnce();
      if (count === 0) await new Promise((r) => setTimeout(r, 5000));
    } catch (err) {
      console.error("Worker error", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

loop().catch((err) => {
  console.error("Uncaught worker error", err);
  process.exit(1);
});
