import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { settingsQuery, categoriesQuery, productsQuery } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — AZ Group | Robux, Game Passes, Limited Items" },
      {
        name: "description",
        content:
          "Browse the full AZ Group catalog: Robux, game passes, limited items and verified accounts with instant delivery.",
      },
      { property: "og:title", content: "Shop — AZ Group" },
      { property: "og:description", content: "Browse Robux, game passes, limited items and more." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const { data: settings } = useQuery(settingsQuery());
  const { data: categories } = useQuery(categoriesQuery());
  const { data: products, isLoading } = useQuery(
    productsQuery({ categorySlug: activeCat ?? undefined, search: search || undefined }),
  );
  const symbol = settings?.general.currency_symbol ?? "$";

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Shop</h1>
        <p className="mt-2 text-muted-foreground">Instant delivery on every order.</p>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCat(null)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              !activeCat ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {categories?.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.slug)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                activeCat === c.slug ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} symbol={symbol} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No products found. <Link to="/shop" className="text-primary hover:underline">Reset filters</Link>
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}
