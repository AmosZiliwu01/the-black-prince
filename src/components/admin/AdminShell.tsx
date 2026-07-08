import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Settings,
  ScrollText,
  LogOut,
  Loader2,
  ExternalLink,
  Users,
  Star,
  HelpCircle,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Pesanan", icon: ShoppingBag },
  { to: "/admin/products", label: "Produk", icon: Package },
  { to: "/admin/categories", label: "Kategori", icon: FolderTree },
  { to: "/admin/groups", label: "Join Grup", icon: Users },
  { to: "/admin/testimonials", label: "Testimoni", icon: Star },
  { to: "/admin/faqs", label: "FAQ", icon: HelpCircle },
  { to: "/admin/settings", label: "Pengaturan", icon: Settings },
  { to: "/admin/activity", label: "Log Aktivitas", icon: ScrollText },
];

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const { session, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) {
      navigate({ to: "/admin/login" });
    }
  }, [loading, session, isAdmin, navigate]);

  if (loading || !session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <img src={logo} alt="AZ Group" width={32} height={32} className="h-8 w-8" />
          <span className="font-display font-bold">AZ Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-sidebar-border p-3">
          <a
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ExternalLink className="h-4 w-4" /> View Store
          </a>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/admin/login" });
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
          <h1 className="font-display text-xl font-bold">{title}</h1>
          <div className="flex items-center gap-2 md:hidden">
            <Button asChild variant="ghost" size="sm">
              <a href="/">Store</a>
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/admin/login" }); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-border p-2 md:hidden">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium",
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-muted-foreground",
                )}
              >
                <n.icon className="h-3.5 w-3.5" /> {n.label}
              </Link>
            );
          })}
        </div>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
