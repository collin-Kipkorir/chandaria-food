import { BrevoClient } from "@getbrevo/brevo";
import type { EmailProvider, EmailPayload } from "../EmailProvider";

const DEFAULT_FROM_EMAIL = process.env.BREVO_FROM_EMAIL ?? "careers@example.com";
const DEFAULT_FROM_NAME = process.env.BREVO_FROM_NAME ?? "Recruitment";

export class BrevoProvider implements EmailProvider {
  private client: ReturnType<typeof BrevoClient> | any;

  constructor() {
    const key = process.env.BREVO_API_KEY;
    if (!key) {
      throw new Error("BREVO_API_KEY is required for BrevoProvider");
    }
    this.client = new BrevoClient({ apiKey: key, timeoutInSeconds: 120, maxRetries: 2 });
  }

  async send(payload: EmailPayload) {
    const request = {
      sender: { email: DEFAULT_FROM_EMAIL, name: DEFAULT_FROM_NAME },
      to: [{ email: payload.to, name: payload.name ?? "" }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
    } as const;

    try {
      const result = await this.client.transactionalEmails.sendTransacEmail(request as any);
      return { ok: true, info: result };
    } catch (err: any) {
      // Try to surface Brevo SDK errors clearly
      if (err && typeof err === "object") {
        const status = err.statusCode ?? err.status ?? (err.rawResponse && err.rawResponse.status) || null;
        const message = err.message ?? (err.body && JSON.stringify(err.body)) ?? String(err);
        return { ok: false, error: status ? `${status} ${message}` : message };
      }
      return { ok: false, error: String(err) };
    }
  }
}
