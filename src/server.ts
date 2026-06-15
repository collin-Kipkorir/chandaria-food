import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

import { getGreetingHandler } from "./lib/api/example.functions";

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // Lightweight API route replacement for the example createServerFn.
      if (url.pathname === "/api/getGreeting" && request.method === "POST") {
        const bodyText = await request.text();
        let body: unknown = undefined;
        try {
          body = bodyText ? JSON.parse(bodyText) : undefined;
        } catch (e) {
          return new Response("Invalid JSON", { status: 400 });
        }
        const result = await getGreetingHandler(body);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      // No SSR handler present (TanStack start removed). Return 404 for unknown
      // routes — existing SSR behavior should be replaced by a proper Vite SSR
      // entry if you need server rendering.
      return new Response("Not Found", { status: 404 });
    } catch (e) {
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
