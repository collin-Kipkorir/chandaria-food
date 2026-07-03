import * as Brevo from "@getbrevo/brevo";
import type { EmailProvider, EmailPayload } from "../EmailProvider";

const DEFAULT_FROM_EMAIL = process.env.BREVO_FROM_EMAIL ?? "careers@example.com";
const DEFAULT_FROM_NAME = process.env.BREVO_FROM_NAME ?? "Recruitment";

export class BrevoProvider implements EmailProvider {
  private api: any;

  constructor() {
    const key = process.env.BREVO_API_KEY;
    if (!key) {
      throw new Error("BREVO_API_KEY is required for BrevoProvider");
    }

    const client = Brevo.ApiClient.instance;
    if (client && client.authentications && client.authentications["api-key"]) {
      client.authentications["api-key"].apiKey = key;
    }

    this.api = new Brevo.TransactionalEmailsApi();
  }

  async send(payload: EmailPayload) {
    const request = {
      sender: { email: DEFAULT_FROM_EMAIL, name: DEFAULT_FROM_NAME },
      to: [{ email: payload.to, name: payload.name ?? "" }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
    };

    try {
      const result = await this.api.sendTransacEmail(request);
      return { ok: true, info: result };
    } catch (err: any) {
      if (err && typeof err === "object") {
        const status = (err.statusCode ?? err.status ?? (err.rawResponse && err.rawResponse.status)) || null;
        const message = err.message ?? (err.body && JSON.stringify(err.body)) ?? String(err);
        return { ok: false, error: status ? `${status} ${message}` : message };
      }
      return { ok: false, error: String(err) };
    }
  }
}
