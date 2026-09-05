import type { EmailPayload, EmailProvider } from "./EmailProvider.js";
import { MockProvider } from "./providers/MockProvider.js";

export class EmailService {
  private provider: EmailProvider | null = null;

  constructor() {
    // Delay provider creation to runtime to avoid bundler tree-shaking
    // when build-time env vars are not available.
  }

  private async createProvider(): Promise<EmailProvider> {
    const providerName = process.env.EMAIL_PROVIDER ?? "mock";

    try {
      if (providerName === "emailjs") {
        const mod = await import("./providers/EmailJSProvider.js");
        return new mod.EmailJSProvider();
      }
      if (providerName === "ses") {
        const mod = await import("./providers/AmazonSESProvider.js");
        return new mod.AmazonSESProvider();
      }
      if (providerName === "smtp") {
        const mod = await import("./providers/SMTPProvider.js");
        return new mod.SMTPProvider();
      }
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
    if (!this.provider) {
      this.provider = await this.createProvider();
    }
    return this.provider.send(payload);
  }
}
