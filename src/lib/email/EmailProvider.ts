export interface EmailPayload {
  to: string;
  name?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<{ ok: boolean; info?: unknown; error?: string }>;
}
