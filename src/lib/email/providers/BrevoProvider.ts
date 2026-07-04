import type { EmailProvider, EmailPayload } from "../EmailProvider";

const DEFAULT_FROM_EMAIL = process.env.BREVO_FROM_EMAIL ?? "careers@example.com";
const DEFAULT_FROM_NAME = process.env.BREVO_FROM_NAME ?? "Recruitment";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export class BrevoProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    const key = process.env.BREVO_API_KEY;
    if (!key) {
      throw new Error("BREVO_API_KEY is required for BrevoProvider");
    }
    this.apiKey = key;
  }

  async send(payload: EmailPayload) {
    const request = {
      sender: { email: DEFAULT_FROM_EMAIL, name: DEFAULT_FROM_NAME },
      to: [{ email: payload.to, name: payload.name ?? "" }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
      params: {
        name: payload.name ?? "",
        subject: payload.subject,
      },
    };

    try {
      const response = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify(request),
      });

      const body = await response.text();
      if (!response.ok) {
        return { ok: false, error: `${response.status} ${body}` };
      }

      return { ok: true, info: body ? JSON.parse(body) : null };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }
}
