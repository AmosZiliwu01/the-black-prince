import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ScrollText } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({ meta: [{ title: "Activity Log — AZ Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminActivity,
});

interface Log { id: string; action: string; entity: string | null; details: Record<string, unknown> | null; created_at: string; }

async function fetchLogs() {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as Log[];
}

function AdminActivity() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-activity"], queryFn: fetchLogs });

  return (
    <AdminShell title="Activity Log">
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="divide-y divide-border">
            {data?.map((l) => (
              <div key={l.id} className="flex items-start gap-3 p-4">
                <div className="rounded-lg bg-gradient-primary/15 p-2 text-primary"><ScrollText className="h-4 w-4" /></div>
                <div className="flex-1">
                  <p className="font-medium">{l.action.replace(/_/g, " ")}</p>
                  <p className="text-sm text-muted-foreground">
                    {l.entity ?? ""} {l.details && Object.keys(l.details).length > 0 ? `· ${JSON.stringify(l.details)}` : ""}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(l.created_at)}</span>
              </div>
            ))}
            {data?.length === 0 && <p className="p-12 text-center text-muted-foreground">No activity yet.</p>}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
