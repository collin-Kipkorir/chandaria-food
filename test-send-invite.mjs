import fs from 'fs/promises';

async function loadEnv(path = '.env') {
  try {
    const txt = await fs.readFile(path, 'utf8');
    const lines = txt.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch (err) {
    return {};
  }
}

function replacePlaceholders(template, data) {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const normalized = key.trim().toLowerCase();
    return data[normalized] ?? `{{${key.trim()}}}`;
  });
}

(async () => {
  const env = await loadEnv('.env');
  Object.assign(process.env, env);

  const to = process.env.EMAILJS_TO_EMAIL || process.env.TO_EMAIL || process.argv[2];
  if (!to) {
    console.error('Provide recipient email via EMAILJS_TO_EMAIL in .env or as first arg');
    process.exit(2);
  }

  const service = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const user = process.env.EMAILJS_USER_ID;
  const accessToken = process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_ACCESS_TOKEN || process.env.EMAILJS_KEY || process.env.EMAILJS_PRIVATEKEY;

  if (!service || !templateId) {
    console.error('EMAILJS_SERVICE_ID or EMAILJS_TEMPLATE_ID not set in .env');
    process.exit(2);
  }

  // read TEMPLATE_HTML from admin.interviews.tsx
  const src = await fs.readFile('src/routes/admin.interviews.tsx', 'utf8');
  const m = src.match(/const TEMPLATE_HTML = `(.*?)`;/s);
  if (!m) {
    console.error('Could not extract TEMPLATE_HTML from src/routes/admin.interviews.tsx');
    process.exit(1);
  }
  const tpl = m[1];

  const data = {
    name: 'Jane Doe',
    job: 'Field Interviewer',
    county: 'Nairobi',
    interview_date: 'TBD',
    location: 'Nairobi office',
    companyname: 'Chandaria Foods',
    sentdate: new Date().toISOString().slice(0,10),
    hremail: 'hr@example.com',
    documentuploadurl: process.env.DOCUMENT_UPLOAD_URL || 'https://example.com/upload',
    workethicsurl: process.env.WORK_ETHICS_URL || 'https://example.com/work-ethics',
    foodhandlercerturl: process.env.FOOD_HANDLER_CERT_URL || 'https://kwcp-certificate.vercel.app/',
  };

  const html = replacePlaceholders(tpl, data);
  const subject = `Interview Invitation for ${data.job}`;
  const text = `Hello ${data.name},\nYou have been shortlisted for ${data.job} in ${data.county}.`;

  const payload = {
    service_id: service,
    template_id: templateId,
    user_id: user,
    template_params: {
      to_email: to,
      to_name: data.name,
      subject,
      html,
      text,
    },
  };

  if (accessToken) payload.accessToken = accessToken;

  console.log('Sending invite to', to);
  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const textRes = await res.text();
    if (!res.ok) {
      console.error('EmailJS send failed:', res.status, textRes);
      process.exit(1);
    }
    console.log('EmailJS send response:', textRes || '<empty>');
  } catch (err) {
    console.error('EmailJS send error:', err);
    process.exit(1);
  }
})();
