import { Link } from "@tanstack/react-router";
import { ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/cart";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock: number;
  is_featured: boolean;
  categories?: { name: string; slug: string } | null;
}

export function ProductCard({ product, symbol = "$" }: { product: StoreProduct; symbol?: string }) {
  const { addItem } = useCart();
  const soldOut = product.stock <= 0;

  const add = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      image_url: product.image_url,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="card-hover group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="relative block aspect-square overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-primary/10">
            <Zap className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.is_featured && <Badge variant="accent">Featured</Badge>}
          {soldOut && <Badge variant="destructive">Sold Out</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.categories?.name && (
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            {product.categories.name}
          </span>
        )}
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <h3 className="mt-1 line-clamp-2 font-display font-semibold leading-snug hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold">{formatCurrency(product.price, symbol)}</span>
          {product.original_price && Number(product.original_price) > Number(product.price) && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.original_price, symbol)}
            </span>
          )}
        </div>
        <div className="mt-4 flex-1" />
        <Button onClick={add} disabled={soldOut} variant="gradient" className="w-full">
          <ShoppingCart className="h-4 w-4" /> {soldOut ? "Sold Out" : "Tambah ke Keranjang"}
        </Button>
      </div>
    </div>
  );
}
