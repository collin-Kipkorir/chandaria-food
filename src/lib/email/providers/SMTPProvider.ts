import nodemailer from "nodemailer";
import type { EmailProvider, EmailPayload } from "../EmailProvider";

export class SMTPProvider implements EmailProvider {
  private transport: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const secure = process.env.SMTP_SECURE === "true";
    const username = process.env.SMTP_USERNAME;
    const password = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM_EMAIL ?? "no-reply@example.com";

    if (!host) {
      throw new Error("SMTP_HOST is required for SMTPProvider");
    }
    if (!username || !password) {
      throw new Error("SMTP_USERNAME and SMTP_PASSWORD are required for SMTPProvider");
    }

    this.transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: username, pass: password },
      from,
    });
  }

  async send(payload: EmailPayload) {
    const info = await this.transport.sendMail({
      from: process.env.SMTP_FROM_EMAIL ?? "no-reply@example.com",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
    });
    return { ok: true, info };
  }
}
