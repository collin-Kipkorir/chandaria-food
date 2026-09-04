import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwind from "@tailwindcss/vite";
import type { IncomingMessage, ServerResponse } from "http";

function rawBody(request: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    request.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function apiRouteMiddleware(serverHandler: {
  fetch: (request: Request, env: NodeJS.ProcessEnv, ctx?: unknown) => Promise<Response>;
}) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: unknown) => void,
  ) => {
    if (!req.url?.startsWith("/api/")) {
      next();
      return;
    }

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const body = await rawBody(req);
      const request = new Request(url.toString(), {
        method: req.method,
        headers: req.headers as HeadersInit,
        body: body.length ? new Uint8Array(body) : null,
      });
      const response = await serverHandler.fetch(request, process.env, undefined);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      const buffer = Buffer.from(await response.arrayBuffer());
      res.end(buffer);
    } catch (error) {
      next(error);
    }
  };
}

// Minimal Vite config using standard plugins. We removed the project-specific
// `@lovable.dev/vite-tanstack-config` to decouple the build from TanStack Start.
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    tailwind(),
    {
      name: "api-route-middleware",
      async configureServer(server) {
        const env = loadEnv(server.config.mode, process.cwd(), "");
        Object.assign(process.env, env);
        // Debug: Log loaded environment variables
        console.log("Loaded env variables:", {
          EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
          EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID ? "✓ loaded" : "✗ missing",
          EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID ? "✓ loaded" : "✗ missing",
          EMAILJS_USER_ID: process.env.EMAILJS_USER_ID ? "✓ loaded" : "✗ missing",
        });
        const serverModule = await import("./src/server");
        const serverHandler = serverModule.default ?? serverModule;
        server.middlewares.use(apiRouteMiddleware(serverHandler));
      },
      async configurePreviewServer(server) {
        const env = loadEnv(server.config.mode, process.cwd(), "");
        Object.assign(process.env, env);
        const serverModule = await import("./src/server");
        const serverHandler = serverModule.default ?? serverModule;
        server.middlewares.use(apiRouteMiddleware(serverHandler));
      },
    },
  ],
});
