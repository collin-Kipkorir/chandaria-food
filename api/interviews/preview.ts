export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { previewInvitationsData } = await import("../../src/lib/api/interviews.api.js");
    let body: unknown = req.body ?? {};
    if (typeof body === "string") {
      body = JSON.parse(body);
    } else if (body instanceof Uint8Array || Buffer.isBuffer(body)) {
      body = JSON.parse(body.toString("utf8"));
    }
    const result = await previewInvitationsData(body as Record<string, unknown>);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ error: message, stack: error instanceof Error ? error.stack : undefined });
  }
}
