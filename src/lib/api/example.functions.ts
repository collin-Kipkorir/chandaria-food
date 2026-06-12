import { z } from "zod";

import { getServerConfig } from "../config.server";

const greetingSchema = z.object({ name: z.string().min(1) });

// Server-side handler — can be imported by the server entry to serve an API
// route. Kept in this module to preserve the example, but it's plain code
// with no dependency on TanStack Start.
export async function getGreetingHandler(body: unknown) {
  const parsed = greetingSchema.parse(body);
  const config = getServerConfig();
  return {
    greeting: `Hello, ${parsed.name}!`,
    mode: config.nodeEnv ?? "unknown",
  };
}

// Client helper that calls the server endpoint. This is optional; callers
// can also call fetch('/api/getGreeting', ... ) directly.
export async function callGetGreeting(name: string) {
  const res = await fetch("/api/getGreeting", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
