import type { EmailProvider, EmailPayload } from "../EmailProvider";

export class MockProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    console.log("MockProvider send", JSON.stringify(payload, null, 2));
    return { ok: true, info: { provider: "mock" } };
  }
}
