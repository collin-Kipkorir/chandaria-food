import type { EmailPayload, EmailProvider } from "./EmailProvider.js";
import { EmailJSProvider } from "./providers/EmailJSProvider.js";
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
      if (providerName === "emailjs") {
        console.log("[EmailService] Creating EmailJSProvider...");
        return new EmailJSProvider();
      }
      if (providerName === "ses") {
        console.log("[EmailService] Creating AmazonSESProvider...");
        return new AmazonSESProvider();
      }
      if (providerName === "smtp") {
        console.log("[EmailService] Creating SMTPProvider...");
        return new SMTPProvider();
      }
      console.log("[EmailService] Creating MockProvider (default)...");
      return new MockProvider();
    } catch (error) {
      console.warn(
        `[EmailService] Failed to create '${providerName}' provider, falling back to MockProvider:`,
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
