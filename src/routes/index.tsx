import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chandarana Foodplus — Careers" },
      {
        name: "description",
        content:
          "Join Chandarana Foodplus. Browse open roles across Kenya and apply online — no account required.",
      },
    ],
  }),
  component: App,
});
