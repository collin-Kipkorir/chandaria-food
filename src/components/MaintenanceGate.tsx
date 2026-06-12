import { useRouterState } from "@tanstack/react-router";
import { useApp, useCurrentUser } from "@/lib/store";
import { Wrench } from "lucide-react";

/**
 * Global gate: respects website_mode in settings.
 * - online: full access
 * - maintenance: only admins can use the site; others see maintenance page
 * - readonly: enforced inside store mutations (register/login blocked there)
 * - beta: enforced at login; visitors can still browse public pages
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const settings = useApp((s) => s.settings);
  const user = useCurrentUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (
    settings.websiteMode === "maintenance" &&
    user?.role !== "admin" &&
    !pathname.startsWith("/login")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow">
          <Wrench className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Under maintenance</h1>
          <p className="mt-2 text-sm text-muted-foreground">{settings.maintenanceMessage}</p>
          <p className="mt-6 text-xs text-muted-foreground">
            Admins can still{" "}
            <a href="/login" className="underline">
              sign in
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
