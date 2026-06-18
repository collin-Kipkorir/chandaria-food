Process email queue worker

This folder contains a simple scaffold for a worker that processes email jobs
pushed to Firebase Realtime Database under `emailQueue`.

Usage

1. Provide Firebase Admin credentials as a service account JSON and point the
   `GOOGLE_APPLICATION_CREDENTIALS` environment variable to that file.

2. Set `FIREBASE_DATABASE_URL` if your project doesn't use the default
   application credentials discovery.

3. Run locally (for testing):

   node ./scripts/worker/process-email-queue.mjs

Deployment

- For production, run this as a managed service (Cloud Run, EC2, DigitalOcean
  App) or convert to a Firebase Cloud Function that triggers on database
  writes.

- Replace the `sendEmail` stub with a real provider integration. Keep
  credentials in environment variables or a secrets manager.

Notes

- The current worker removes items from `emailQueue` after attempting to
  send. Failed sends are also logged under `emailLogs` with status `failed`.
  You may want to implement a dead-letter queue for repeated failures.

- This scaffold uses `firebase-admin`. Install dependencies in your
  deployment environment: `npm i firebase-admin`.

SendGrid

To use SendGrid replace the `sendEmail` stub with the SendGrid integration
already added in `process-email-queue.mjs`.

Environment variables required:

- `SENDGRID_API_KEY` — your SendGrid API key
- `SENDGRID_FROM_EMAIL` — the verified from address (optional; default used otherwise)
- `GOOGLE_APPLICATION_CREDENTIALS` — path to service account JSON for Firebase Admin
- `FIREBASE_DATABASE_URL` — your DB URL (if not autodiscovered)

Install dependencies locally before running:

```bash
npm i @sendgrid/mail firebase-admin
```

Run locally:

PowerShell example:

```powershell
# set env vars for this terminal session
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account.json"
$env:FIREBASE_DATABASE_URL = "https://<your-project>.firebaseio.com"
# optional
$env:SENDGRID_API_KEY = "<your-sendgrid-key>"
$env:SENDGRID_FROM_EMAIL = "no-reply@yourdomain.com"

npm run worker:run
```

Seeding jobs

To seed the Realtime Database with a set of hardcoded jobs (useful for dev/testing):

1. Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to a service account JSON with Realtime DB write access.
2. Optionally set `FIREBASE_DATABASE_URL`.
3. Run:

```bash
npm run seed:jobs
```

This will write a small set of example jobs under `/jobs` in your Realtime Database.

Compatibility note
------------------

The client-side `sendBulkInvitations` implementation writes queue items with the
shape expected by the worker: fields `to`, `subject`, `body` (or `html`), and
an optional `meta` object containing `campaignId` and `userId`. If you change
the worker's expected payload shape, update the client store accordingly.
