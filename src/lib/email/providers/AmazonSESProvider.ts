import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { EmailProvider, EmailPayload } from "../EmailProvider";

export class AmazonSESProvider implements EmailProvider {
  private client: SESClient;
  private fromEmail: string;

  constructor() {
    if (!process.env.AWS_REGION) {
      throw new Error("AWS_REGION is required for AmazonSESProvider");
    }
    this.client = new SESClient({ region: process.env.AWS_REGION });
    this.fromEmail = process.env.SES_FROM_EMAIL ?? "no-reply@example.com";
  }

  async send(payload: EmailPayload) {
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: { ToAddresses: [payload.to] },
      Message: {
        Subject: { Data: payload.subject },
        Body: {
          Html: { Data: payload.html },
          Text: { Data: payload.text ?? payload.html.replace(/<[^>]+>/g, "") },
        },
      },
      ReplyToAddresses: payload.replyTo ? [payload.replyTo] : undefined,
    });
    const result = await this.client.send(command);
    return { ok: true, info: result };
  }
}
