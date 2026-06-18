#!/usr/bin/env node
import admin from 'firebase-admin';
import { randomUUID } from 'crypto';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn('GOOGLE_APPLICATION_CREDENTIALS not set — trying application default credentials');
}

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
  });
} catch (err) {
  console.error('Failed to initialize firebase-admin:', err);
  process.exit(1);
}

const db = admin.database();

async function pushTest() {
  const key = randomUUID();
  const payload = {
    id: key,
    to: process.env.TEST_EMAIL_TO || 'applicant@example.com',
    subject: process.env.TEST_EMAIL_SUBJECT || 'Test invitation',
    body: process.env.TEST_EMAIL_BODY || 'This is a test invitation. Click: https://example.com',
    meta: {
      campaignId: process.env.TEST_CAMPAIGN_ID || 'test-campaign',
      userId: process.env.TEST_USER_ID || '',
    },
    createdAt: new Date().toISOString(),
  };

  try {
    await db.ref(`emailQueue/${key}`).set(payload);
    console.log('Enqueued test email with key', key);
    process.exit(0);
  } catch (err) {
    console.error('Failed to enqueue test email', err);
    process.exit(1);
  }
}

pushTest();
