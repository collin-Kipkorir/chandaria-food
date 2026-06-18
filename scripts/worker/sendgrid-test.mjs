#!/usr/bin/env node
import sgMail from '@sendgrid/mail';

const key = process.env.SENDGRID_API_KEY;
const from = process.env.SENDGRID_FROM_EMAIL || 'no-reply@example.com';
const to = process.env.SENDGRID_TO_EMAIL;

if (!key) {
  console.error('SENDGRID_API_KEY not set. Set env var and retry.');
  process.exit(2);
}
if (!to) {
  console.error('SENDGRID_TO_EMAIL not set. Set env var to a recipient email for testing.');
  process.exit(2);
}

sgMail.setApiKey(key);

const msg = {
  to,
  from,
  subject: 'Test email from chandaria worker (SendGrid)',
  text: 'This is a test email sent from your local SendGrid test script.',
  html: '<strong>This is a test email sent from your local SendGrid test script.</strong>',
};

(async () => {
  try {
    const res = await sgMail.send(msg);
    console.log('SendGrid test send result:', res);
  } catch (err) {
    console.error('SendGrid test send failed:', err);
    process.exit(1);
  }
})();
