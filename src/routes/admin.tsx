import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useCurrentUser } from "@/lib/store";
import LoginPage from "./login";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Briefcase,
  FileText,
  ShieldCheck,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Admin layout is rendered via react-router-dom routes

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/applications", label: "Applications", icon: FileText },
  { to: "/admin/interviews", label: "Interviews", icon: Calendar },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const mobileNav = nav.slice(0, 5);

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
    <div className="min-h-screen bg-[#f5f7f3] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-brand-green/10 bg-brand-green-deep/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/15 ring-1 ring-brand-gold/40">
              <ShieldCheck className="h-5 w-5 text-brand-gold" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-gold/90">
                AjiraConnect
              </p>
              <p className="truncate text-sm font-semibold text-white">Admin Portal</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition",
                    active
                      ? "bg-brand-gold text-brand-green-deep shadow-lg shadow-brand-gold/20"
                      : "text-white/80 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <n.icon className="h-3.5 w-3.5" />
                  {n.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-white/80 sm:flex">
              <Bell className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Live</span>
            </div>
            <button
              aria-label="Open admin menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:py-8">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-24 rounded-2xl border border-brand-green/10 bg-white p-4 shadow-sm shadow-brand-green/5">
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-brand-green-deep px-3 py-2 text-white">
              <ShieldCheck className="h-4 w-4 text-brand-gold" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em]">Operations</span>
            </div>
            <nav className="space-y-1.5">
              {nav.map((n) => {
                const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-brand-green-deep text-white shadow-sm"
                        : "text-slate-600 hover:bg-brand-green/5 hover:text-brand-green-deep",
                    )}
                  >
                    <n.icon className="h-4 w-4" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 border-t border-brand-green/10 bg-white/95 p-2 shadow-[0_-12px_32px_rgba(7,53,44,0.12)] backdrop-blur md:hidden transition",
          mobileOpen ? "translate-y-0" : "translate-y-0",
        )}
      >
        <nav className="grid grid-cols-5 gap-1">
          {mobileNav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition",
                  active
                    ? "bg-brand-green-deep text-white"
                    : "text-slate-500 hover:bg-brand-green/5 hover:text-brand-green-deep",
                )}
              >
                <n.icon className="h-4 w-4" />
                <span className="leading-none">{n.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
