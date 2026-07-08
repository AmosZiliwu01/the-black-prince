import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2, ShoppingBag, Zap } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { useCart } from "@/context/cart";
import { settingsQuery } from "@/lib/store";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

const cartStockQuery = (productIds: string[]) =>
  queryOptions({
    queryKey: ["cart-stock", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return {} as Record<string, number>;
      const { data, error } = await supabase.from("products").select("id, stock").in("id", productIds);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) map[row.id] = row.stock;
      return map;
    },
    enabled: productIds.length > 0,
  });

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Keranjang Kamu — AZ Group" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const { data: settings } = useQuery(settingsQuery());
  const symbol = settings?.general.currency_symbol ?? "Rp";

  const productIds = items.map((i) => i.product_id);
  const { data: stockMap } = useQuery(cartStockQuery(productIds));

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/40" />
          <h1 className="mt-4 font-display text-2xl font-bold">Keranjang kamu kosong</h1>
          <p className="mt-2 text-muted-foreground">Tambahkan produk untuk mulai belanja.</p>
          <Button asChild variant="gradient" className="mt-6">
            <Link to="/shop">Jelajahi Toko</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Keranjang Kamu</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {items.map((item) => {
              const maxStock = stockMap?.[item.product_id];
              const overStock = maxStock !== undefined && item.quantity > maxStock;

              return (
                <div key={item.product_id} className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-primary/10">
                        <Zap className="h-6 w-6 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link to="/product/$slug" params={{ slug: item.slug }} className="font-semibold hover:text-primary">
                      {item.name}
                    </Link>
                    <span className="text-sm text-muted-foreground">{formatCurrency(item.price, symbol)}</span>
                    {overStock && (
                      <span className="mt-1 text-xs font-medium text-destructive">
                        Stok tersisa hanya {maxStock}, kurangi jumlah untuk melanjutkan.
                      </span>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-lg border border-border">
                        <button className="p-2 hover:text-primary" onClick={() => setQuantity(item.product_id, item.quantity - 1)}>
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          className="p-2 hover:text-primary disabled:opacity-30 disabled:hover:text-inherit"
                          onClick={() => setQuantity(item.product_id, item.quantity + 1)}
                          disabled={maxStock !== undefined && item.quantity >= maxStock}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.product_id)}
                        aria-label="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="font-bold">{formatCurrency(item.price * item.quantity, symbol)}</div>
                </div>
              );
            })}
          </div>

          <div className="h-fit rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">Ringkasan Pesanan</h2>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal, symbol)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-4 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(subtotal, symbol)}</span>
            </div>
            {items.some((item) => {
              const maxStock = stockMap?.[item.product_id];
              return maxStock !== undefined && item.quantity > maxStock;
            }) ? (
              <p className="mt-3 text-center text-xs text-destructive">
                Ada item yang melebihi stok tersedia. Sesuaikan jumlah sebelum checkout.
              </p>
            ) : null}
            <Button
              asChild
              variant="gradient"
              size="lg"
              className="mt-6 w-full"
              disabled={items.some((item) => {
                const maxStock = stockMap?.[item.product_id];
                return maxStock !== undefined && item.quantity > maxStock;
              })}
            >
              <Link to="/checkout">Lanjut ke Checkout</Link>
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full">
              <Link to="/shop">Lanjut Belanja</Link>
            </Button>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}