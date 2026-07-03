import type { EmailPayload } from "./EmailProvider";
import { BrevoProvider } from "./providers/BrevoProvider";
import { AmazonSESProvider } from "./providers/AmazonSESProvider";
import { SMTPProvider } from "./providers/SMTPProvider";
import { MockProvider } from "./providers/MockProvider";

export class EmailService {
  private provider: { send(payload: EmailPayload): Promise<{ ok: boolean; info?: unknown; error?: string }> };

  constructor() {
    const provider = process.env.EMAIL_PROVIDER ?? "mock";
    if (provider === "brevo") {
      this.provider = new BrevoProvider();
    } else if (provider === "ses") {
      this.provider = new AmazonSESProvider();
    } else if (provider === "smtp") {
      this.provider = new SMTPProvider();
    } else {
      this.provider = new MockProvider();
    }
  }

  async send(payload: EmailPayload) {
    return this.provider.send(payload);
  }
}
