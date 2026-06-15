import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwind from "@tailwindcss/vite";

// Minimal Vite config using standard plugins. We removed the project-specific
// `@lovable.dev/vite-tanstack-config` to decouple the build from TanStack Start.
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwind()],
