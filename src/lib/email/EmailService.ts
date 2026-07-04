import type { EmailPayload, EmailProvider } from "./EmailProvider.js";
import { BrevoProvider } from "./providers/BrevoProvider.js";
import { AmazonSESProvider } from "./providers/AmazonSESProvider.js";
import { SMTPProvider } from "./providers/SMTPProvider.js";
import { MockProvider } from "./providers/MockProvider.js";

export class EmailService {
  private provider: EmailProvider | null = null;

  constructor() {
    this.provider = this.createProvider();
  }

  private createProvider(): EmailProvider {
    const providerName = process.env.EMAIL_PROVIDER ?? "mock";

    try {
      if (providerName === "brevo") {
        return new BrevoProvider();
      }
      if (providerName === "ses") {
        return new AmazonSESProvider();
      }
      if (providerName === "smtp") {
        return new SMTPProvider();
      }
      return new MockProvider();
    } catch (error) {
      console.warn(
        "Falling back to MockProvider because email provider initialization failed:",
        error instanceof Error ? error.message : error,
      );
      return new MockProvider();
    }
  }

  async send(payload: EmailPayload) {
    const provider = this.provider ?? this.createProvider();
    this.provider = provider;
    return provider.send(payload);
  }
}
