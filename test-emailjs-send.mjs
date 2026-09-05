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

(async () => {
  const env = await loadEnv('.env');
  Object.assign(process.env, env);

  const service = process.env.EMAILJS_SERVICE_ID;
  const template = process.env.EMAILJS_TEMPLATE_ID;
  const user = process.env.EMAILJS_USER_ID;
  const to = process.env.EMAILJS_TO_EMAIL;

  if (!service || !template || !user) {
    console.error('EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID or EMAILJS_USER_ID not set. Set them in .env or the environment.');
    process.exit(2);
  }
  if (!to) {
    console.error('EMAILJS_TO_EMAIL not set. Set env var to a recipient email for testing.');
    process.exit(2);
  }

  const payload = {
    service_id: service,
    template_id: template,
    user_id: user,
    template_params: {
      to_email: to,
      to_name: 'Test Recipient',
      subject: 'Test email from Chandaria (EmailJS)',
      html: '<p>Hello — this is a test send from the Chandaria app using EmailJS.</p>',
      text: 'Hello — this is a test send from the Chandaria app using EmailJS.'
    }
  };

  // Include private key when EmailJS account is in strict mode
  const privateKey = process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_PRIVATEKEY || process.env.EMAILJS_KEY;
  if (privateKey) {
    // Send as accessToken which the REST API accepts for strict-mode auth
    payload.accessToken = privateKey;
  }

  // Debug: log payload structure but mask the private key value
  const masked = Object.assign({}, payload, { private_key: privateKey ? '***PRIVATE_KEY***' : undefined });
  console.log('Sending EmailJS payload:', {
    service_id: masked.service_id,
    template_id: masked.template_id,
    user_id: masked.user_id,
    has_private_key: !!masked.private_key,
    template_params_keys: Object.keys(masked.template_params || {}),
  });

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error('EmailJS send failed:', res.status, text);
      process.exit(1);
    }
    console.log('EmailJS send response:', text || '<empty>');
  } catch (err) {
    console.error('EmailJS send error:', err);
    process.exit(1);
  }
})();
