import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, DollarSign, Clock, Package, ArrowRight } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — AZ Admin" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

async function fetchStats() {
  const [orders, products] = await Promise.all([
    supabase.from("orders").select("id, order_number, customer_name, status, total, created_at").order("created_at", { ascending: false }),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);
  const rows = orders.data ?? [];
  const revenue = rows
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + Number(o.total), 0);
  const pending = rows.filter((o) => o.status === "pending" || o.status === "awaiting_verification").length;
  return {
    totalOrders: rows.length,
    revenue,
    pending,
    productCount: products.count ?? 0,
    recent: rows.slice(0, 6),
  };
}

function Dashboard() {
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: fetchStats });

  const cards = [
    { label: "Total Orders", value: data?.totalOrders ?? 0, icon: ShoppingBag },
    { label: "Revenue (completed)", value: formatCurrency(data?.revenue ?? 0), icon: DollarSign },
    { label: "Pending", value: data?.pending ?? 0, icon: Clock },
    { label: "Products", value: data?.productCount ?? 0, icon: Package },
  ];

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display font-bold">Recent Orders</h2>
          <Link to="/admin/orders" className="flex items-center gap-1 text-sm text-primary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {data?.recent.length ? (
            data.recent.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{o.order_number}</p>
                  <p className="text-sm text-muted-foreground">{o.customer_name} · {formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatCurrency(Number(o.total))}</span>
                  <Badge variant={o.status === "completed" ? "success" : o.status === "cancelled" ? "destructive" : "accent"}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-muted-foreground">No orders yet.</p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
