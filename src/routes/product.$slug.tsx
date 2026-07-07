import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ShoppingCart, Zap, Minus, Plus, Truck } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { settingsQuery, productQuery } from "@/lib/store";
import { useCart } from "@/context/cart";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const { data: settings } = useQuery(settingsQuery());
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const symbol = settings?.general.currency_symbol ?? "$";

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold">Product not found</h1>
          <p className="mt-2 text-muted-foreground">This product may have been removed.</p>
          <Button asChild variant="gradient" className="mt-6">
            <Link to="/shop">Back to shop</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const soldOut = product.stock <= 0;

  const add = (goCart = false) => {
    addItem(
      {
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        image_url: product.image_url,
      },
      qty,
    );
    toast.success(`${product.name} added to cart`);
    if (goCart) navigate({ to: "/cart" });
  };

  return (
    <StoreLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-primary/10">
                <Zap className="h-20 w-20 text-primary/40" />
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {product.categories?.name && <Badge variant="secondary">{product.categories.name}</Badge>}
              {product.is_featured && <Badge variant="accent">Featured</Badge>}
              {soldOut ? <Badge variant="destructive">Sold Out</Badge> : <Badge variant="success">In Stock</Badge>}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold">{product.name}</h1>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-3xl font-bold">{formatCurrency(product.price, symbol)}</span>
              {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(product.compare_at_price, symbol)}
                </span>
              )}
            </div>

            {product.description && (
              <p className="mt-4 whitespace-pre-line text-muted-foreground">{product.description}</p>
            )}

            {product.delivery_info && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                <Truck className="mt-0.5 h-4 w-4 text-primary" />
                <span>{product.delivery_info}</span>
              </div>
            )}

            {!soldOut && (
              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-border">
                  <button className="p-2.5 hover:text-primary" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-semibold">{qty}</span>
                  <button className="p-2.5 hover:text-primary" onClick={() => setQty((q) => q + 1)}>
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => add(false)} disabled={soldOut} variant="outline" size="lg">
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
              <Button onClick={() => add(true)} disabled={soldOut} variant="gradient" size="lg">
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
