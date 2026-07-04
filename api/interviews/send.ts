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
    const { sendInvitationsData } = await import("../../src/lib/api/interviews.api.ts");
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const result = await sendInvitationsData(body);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ error: message, stack: error instanceof Error ? error.stack : undefined });
  }
}
