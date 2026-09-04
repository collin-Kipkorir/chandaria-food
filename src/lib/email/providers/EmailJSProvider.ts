import type { EmailProvider, EmailPayload } from "../EmailProvider";

const EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

export class EmailJSProvider implements EmailProvider {
  private serviceId: string;
  private templateId: string;
  private userId: string;
  private privateKey: string | undefined;

  constructor() {
    const service = process.env.EMAILJS_SERVICE_ID;
    const template = process.env.EMAILJS_TEMPLATE_ID;
    const user = process.env.EMAILJS_USER_ID;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;
    
    if (!service || !template || !user) {
      const missing = [];
      if (!service) missing.push("EMAILJS_SERVICE_ID");
      if (!template) missing.push("EMAILJS_TEMPLATE_ID");
      if (!user) missing.push("EMAILJS_USER_ID");
      const message = `${missing.join(", ")} environment variable(s) required for EmailJSProvider`;
      console.error(`[EmailJSProvider] Initialization failed: ${message}`, {
        service: service ? "set" : "MISSING",
        template: template ? "set" : "MISSING", 
        user: user ? "set" : "MISSING",
        privateKey: privateKey ? "set (for strict mode)" : "not set",
      });
      throw new Error(message);
    }
    this.serviceId = service;
    this.templateId = template;
    this.userId = user;
    this.privateKey = privateKey;
  }

  async send(payload: EmailPayload) {
    const templateParams = {
      to_email: payload.to,
      to_name: payload.name ?? "",
      subject: payload.subject,
      html: payload.html,
      text: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
      reply_to: payload.replyTo ?? "",
    } as Record<string, unknown>;

    const body: Record<string, unknown> = {
      service_id: this.serviceId,
      template_id: this.templateId,
      user_id: this.userId,
      template_params: templateParams,
    };
    
    // Include private key if available (required for non-browser/strict mode)
    if (this.privateKey) {
      body.accessToken = this.privateKey;
    }

    try {
      console.log("[EmailJSProvider] Sending email to:", payload.to);
      const res = await fetch(EMAILJS_API_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      console.log(`[EmailJSProvider] Response status: ${res.status}`, text);
      
      if (!res.ok) {
        const errorMsg = `${res.status} ${text}`;
        console.error("[EmailJSProvider] Send failed:", errorMsg);
        return { ok: false, error: errorMsg };
      }
      
      console.log("[EmailJSProvider] Email sent successfully to:", payload.to);
      
      // Try to parse as JSON, but handle plain text responses (e.g., "OK")
      let info = null;
      try {
        info = text ? JSON.parse(text) : null;
      } catch {
        info = text; // If not JSON, just use the text response
      }
      
      return { ok: true, info };
    } catch (err: any) {
      const errorMsg = err?.message ?? String(err);
      console.error("[EmailJSProvider] Exception during send:", errorMsg, err);
      return { ok: false, error: errorMsg };
    }
  }
}
