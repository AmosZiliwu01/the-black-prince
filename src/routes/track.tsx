import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Loader2, PackageSearch } from "lucide-react";
import { z } from "zod";
import { StoreLayout } from "@/components/store/StoreLayout";
import { trackOrder } from "@/lib/orders.functions";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_ORDER } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ order: z.string().optional() });

export const Route = createFileRoute("/track")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Lacak Pesanan — AZ Group" },
      { name: "description", content: "Cek status pesanan AZ Group kamu menggunakan nomor pesanan." },
    ],
  }),
  component: TrackPage,
});

type TrackResult = Awaited<ReturnType<typeof trackOrder>>;

function TrackPage() {
  const { order } = Route.useSearch();
  const [query, setQuery] = useState(order ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [searched, setSearched] = useState(false);

  const run = async (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await trackOrder({ data: { order_number: num.trim() } });
      setResult(res);
    } catch {
      setResult({ found: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (order) run(order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <PackageSearch className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-3 font-display text-3xl font-bold">Lacak Pesanan Kamu</h1>
          <p className="mt-2 text-muted-foreground">Masukkan nomor pesanan untuk melihat statusnya.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(query);
          }}
          className="mt-8 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="cth. AZ-XXXXXX"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="gradient" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lacak"}
          </Button>
        </form>

        {searched && !loading && result && !result.found && (
          <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Pesanan dengan nomor tersebut tidak ditemukan. Periksa kembali dan coba lagi.
          </div>
        )}

        {result?.found && (
          <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Pesanan</p>
                <p className="font-display text-xl font-bold text-primary">{result.order.order_number}</p>
              </div>
              <Badge
                variant={
                  result.order.status === "completed"
                    ? "success"
                    : result.order.status === "cancelled"
                      ? "destructive"
                      : "accent"
                }
              >
                {ORDER_STATUS_LABELS[result.order.status]}
              </Badge>
            </div>

            {/* Progress */}
            {result.order.status !== "cancelled" && (
              <div className="mt-6">
                <div className="flex justify-between">
                  {ORDER_STATUS_ORDER.map((s, idx) => {
                    const currentIdx = ORDER_STATUS_ORDER.indexOf(result.order.status);
                    const done = idx <= currentIdx;
                    return (
                      <div key={s} className="flex flex-1 flex-col items-center text-center">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                            done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                          )}
                        >
                          {idx + 1}
                        </div>
                        <span className="mt-1 hidden text-[10px] text-muted-foreground sm:block">
                          {ORDER_STATUS_LABELS[s]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pelanggan</span>
                <span>{result.order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Roblox</span>
                <span>{result.order.roblox_username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dipesan</span>
                <span>{formatDate(result.order.created_at)}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm font-semibold">Item</p>
              <div className="space-y-1.5">
                {result.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{it.product_name} × {it.quantity}</span>
                    <span>{formatCurrency(Number(it.line_total))}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold">
                <span>Total</span>
                <span>{formatCurrency(Number(result.order.total))}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}