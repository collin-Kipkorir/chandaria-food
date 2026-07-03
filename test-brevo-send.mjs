import fs from 'fs/promises';
import pkg from '@getbrevo/brevo';

const Brevo = pkg;
const ApiClient = Brevo.ApiClient;
const TransactionalEmailsApi = Brevo.TransactionalEmailsApi;

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
      // remove surrounding quotes
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

  if (!process.env.BREVO_API_KEY) {
    console.error('BREVO_API_KEY not found in .env or environment. Aborting.');
    process.exit(1);
  }

  try {
    const client = ApiClient.instance;
    if (client && client.authentications && client.authentications['api-key']) {
      client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
    }

    const api = new TransactionalEmailsApi();
    const resp = await api.sendTransacEmail({
      sender: {
        email: process.env.BREVO_FROM_EMAIL || 'careers@example.com',
        name: process.env.BREVO_FROM_NAME || 'Recruitment',
      },
      to: [{ email: 'colloflix@gmail.com', name: 'Test Recipient' }],
      subject: 'Test email from Chandaria app',
      htmlContent: '<p>Hello — this is a test send from the Chandaria app.</p>',
      textContent: 'Hello — this is a test send from the Chandaria app.'
    });

    console.log('Brevo response:', JSON.stringify(resp, null, 2));
    process.exit(0);
  } catch (err) {
    try {
      console.error('Send error:', err instanceof Error ? err.message : String(err));
      if (err && typeof err === 'object') {
        console.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      }
    } catch (e) {
      console.error('Error while printing send error', e);
    }
    process.exit(1);
  }
})();
