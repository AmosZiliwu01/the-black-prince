import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Eye, Trash2, MessageCircle, FileImage } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/admin";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — AZ Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminOrders,
});

const STATUSES = ["pending", "awaiting_verification", "verified", "processing", "completed", "cancelled"];

interface OrderItem { id: string; product_name: string; quantity: number; unit_price: number; line_total: number; }
interface Order {
  id: string; order_number: string; customer_name: string; customer_whatsapp: string;
  roblox_username: string; customer_email: string | null; status: string; total: number;
  payment_method: string | null; payment_proof_url: string | null; customer_note: string | null;
  admin_note: string | null; created_at: string; order_items: OrderItem[];
}

async function fetchOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Order[];
}

function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: fetchOrders });
  const [selected, setSelected] = useState<Order | null>(null);
  const [filter, setFilter] = useState("all");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-orders"] });

  const filtered = orders?.filter((o) => filter === "all" || o.status === filter) ?? [];

  const remove = async (o: Order) => {
    const { error } = await supabase.from("orders").delete().eq("id", o.id);
    if (error) return toast.error(error.message);
    await logActivity("delete_order", "order", { order_number: o.order_number });
    toast.success("Order deleted");
    refresh();
  };

  return (
    <AdminShell title="Orders">
      <div className="mb-4 flex items-center gap-3">
        <Label className="text-sm text-muted-foreground">Filter:</Label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="divide-y divide-border">
            {filtered.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{o.order_number}</p>
                    <Badge variant={o.status === "completed" ? "success" : o.status === "cancelled" ? "destructive" : "accent"}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {o.customer_name} · {o.roblox_username} · {formatDate(o.created_at)}
                  </p>
                </div>
                <span className="font-bold">{formatCurrency(Number(o.total))}</span>
                <Button size="sm" variant="outline" onClick={() => setSelected(o)}><Eye className="h-3.5 w-3.5" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete order {o.order_number}?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(o)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            {filtered.length === 0 && <p className="p-12 text-center text-muted-foreground">No orders found.</p>}
          </div>
        </div>
      )}

      <OrderDialog order={selected} onClose={() => setSelected(null)} onSaved={() => { refresh(); }} />
    </AdminShell>
  );
}

function OrderDialog({ order, onClose, onSaved }: { order: Order | null; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);

  if (order && lastId !== order.id) {
    setLastId(order.id);
    setStatus(order.status);
    setAdminNote(order.admin_note ?? "");
    setProofUrl(null);
    if (order.payment_proof_url) {
      supabase.storage.from("payment-proofs").createSignedUrl(order.payment_proof_url, 600).then(({ data }) => {
        if (data) setProofUrl(data.signedUrl);
      });
    }
  }
  if (!order && lastId !== null) setLastId(null);

  if (!order) return null;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: status as never, admin_note: adminNote || null })
      .eq("id", order.id);
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    await logActivity("update_order", "order", { order_number: order.order_number, status });
    toast.success("Order updated");
    setSaving(false);
    onSaved();
    onClose();
  };

  const wa = order.customer_whatsapp.replace(/\D/g, "");

  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Order {order.order_number}</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">Customer</span><p className="font-medium">{order.customer_name}</p></div>
            <div><span className="text-muted-foreground">Roblox</span><p className="font-medium">{order.roblox_username}</p></div>
            <div><span className="text-muted-foreground">WhatsApp</span><p className="font-medium">{order.customer_whatsapp}</p></div>
            <div><span className="text-muted-foreground">Payment</span><p className="font-medium">{order.payment_method ?? "—"}</p></div>
            {order.customer_email && <div className="col-span-2"><span className="text-muted-foreground">Email</span><p className="font-medium">{order.customer_email}</p></div>}
          </div>

          {order.customer_note && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <span className="text-muted-foreground">Customer note:</span> {order.customer_note}
            </div>
          )}

          <div className="rounded-lg border border-border">
            {order.order_items?.map((it) => (
              <div key={it.id} className="flex justify-between border-b border-border p-2.5 last:border-0">
                <span>{it.product_name} × {it.quantity}</span>
                <span className="font-medium">{formatCurrency(Number(it.line_total))}</span>
              </div>
            ))}
            <div className="flex justify-between p-2.5 font-bold">
              <span>Total</span><span>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>

          {order.payment_proof_url && (
            <div>
              <span className="text-muted-foreground">Payment proof</span>
              {proofUrl ? (
                <a href={proofUrl} target="_blank" rel="noreferrer" className="mt-1 block">
                  <img src={proofUrl} alt="Payment proof" className="max-h-52 rounded-lg border border-border" />
                </a>
              ) : (
                <p className="flex items-center gap-1 text-muted-foreground"><FileImage className="h-4 w-4" /> Loading...</p>
              )}
            </div>
          )}

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Admin Note</Label>
            <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="mt-1.5" rows={2} />
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </Button>
            <Button variant="gradient" className="flex-1" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
