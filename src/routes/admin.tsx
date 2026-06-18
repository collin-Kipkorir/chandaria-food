import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useCurrentUser } from "@/lib/store";
import LoginPage from "./login";
import {
  LayoutDashboard,
  Users,
  Mail,
  Calendar,
  Settings,
  Briefcase,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Admin layout is rendered via react-router-dom routes

const nav: { to: string; label: string; icon: typeof Users; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/applications", label: "Applications", icon: FileText },
  { to: "/admin/interviews", label: "Interviews", icon: Calendar },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  // RTDB debug removed
];

export default function AdminLayout() {
  const user = useCurrentUser();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Allow visiting /admin without being signed in so admins can enter credentials.
  // If the user is not signed in, render the login page here. After successful
  // login the app will navigate back to /admin and the layout will render.
  if (!user) return <LoginPage />;
  if (user.role !== "admin") return <Navigate to="/" />;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        {/* Sidebar - hidden on small screens */}
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="space-y-1">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    active ? "bg-secondary font-medium" : "hover:bg-accent",
                  )}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1">
          {/* Mobile toggle placed inside admin content so it appears within the page */}
          <div className="mb-4 md:hidden flex items-center justify-between">
            <button
              aria-label="Open admin menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-foreground"
            >
              Menu
            </button>
            <div className="text-sm font-semibold">Admin</div>
          </div>

          <Outlet />
        </main>
      </div>

      {/* Mobile drawer (overlay) remains global to the admin layout */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-60 w-80 overflow-auto bg-background p-4">
            <div className="mb-4 flex justify-end">
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-2 py-1 text-sm"
              >
                Close
              </button>
            </div>
            <nav className="space-y-1">
              {nav.map((n) => {
                const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                      active ? "bg-secondary font-medium" : "hover:bg-accent",
                    )}
                  >
                    <n.icon className="h-4 w-4" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
