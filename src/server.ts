import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

import { getGreetingHandler } from "./lib/api/example.functions";
import {
  getApplicantsData,
  getFiltersData,
  previewInvitationsData,
  sendInvitationsData,
  getInterviewHistoryData,
} from "./lib/api/interviews.api";

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

      if (url.pathname === "/api/applicants" && request.method === "GET") {
        const result = await getApplicantsData();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.pathname === "/api/filters" && request.method === "GET") {
        const result = await getFiltersData();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.pathname === "/api/interviews/preview") {
        if (request.method === "OPTIONS") {
          return new Response(null, {
            status: 204,
            headers: {
              "access-control-allow-origin": "*",
              "access-control-allow-methods": "POST, OPTIONS",
              "access-control-allow-headers": "Content-Type",
            },
          });
        }
        if (request.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: {
              "content-type": "application/json",
              "access-control-allow-origin": "*",
              "allow": "POST, OPTIONS",
            },
          });
        }

        const raw = await request.text();
        console.log("API /api/interviews/preview raw body:", raw);
        const body = raw ? JSON.parse(raw) : {};
        const result = await previewInvitationsData(body);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
          },
        });
      }

      if (url.pathname === "/api/interviews/send") {
        if (request.method === "OPTIONS") {
          return new Response(null, {
            status: 204,
            headers: {
              "access-control-allow-origin": "*",
              "access-control-allow-methods": "POST, OPTIONS",
              "access-control-allow-headers": "Content-Type",
            },
          });
        }
        if (request.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: {
              "content-type": "application/json",
              "access-control-allow-origin": "*",
              "allow": "POST, OPTIONS",
            },
          });
        }

        const raw = await request.text();
        console.log("API /api/interviews/send raw body:", raw);
        const body = raw ? JSON.parse(raw) : {};
        const result = await sendInvitationsData(body);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
          },
        });
      }

      if (url.pathname === "/api/interviews/history" && request.method === "GET") {
        const result = await getInterviewHistoryData();
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
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(error);
      const url = new URL(request.url);

      if (url.pathname.startsWith("/api/")) {
        const payload: Record<string, unknown> = { error: error.message };
        if (process.env.NODE_ENV !== "production") {
          payload.stack = error.stack;
        }
        return new Response(JSON.stringify(payload), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
