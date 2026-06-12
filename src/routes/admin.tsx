import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useCurrentUser } from "@/lib/store";
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
  { to: "/admin/campaigns", label: "Campaigns", icon: Mail },
  { to: "/admin/interviews", label: "Interviews", icon: Calendar },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const user = useCurrentUser();
  const { pathname } = useLocation();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "admin") return <Navigate to="/" />;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <aside className="w-56 shrink-0">
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
