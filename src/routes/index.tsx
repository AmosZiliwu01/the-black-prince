import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Zap, ShieldCheck, Headset, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { settingsQuery, categoriesQuery, productsQuery } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  component: Index,
});

const perks = [
  { icon: Zap, title: "Instant Delivery", desc: "Most orders delivered within minutes." },
  { icon: ShieldCheck, title: "Secure & Trusted", desc: "Safe checkout with WhatsApp confirmation." },
  { icon: Headset, title: "24/7 Support", desc: "Real humans ready to help you anytime." },
];

function Index() {
  const { data: settings } = useQuery(settingsQuery());
  const { data: categories } = useQuery(categoriesQuery());
  const { data: featured, isLoading } = useQuery(productsQuery({ featured: true }));
  const symbol = settings?.general.currency_symbol ?? "$";
  const hero = settings?.hero;

  return (
    <StoreLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroBg}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {settings?.general.tagline ?? "Premium Roblox Store"}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-6xl">
              {hero?.title ?? "Level Up Your Roblox Experience"}
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              {hero?.subtitle ??
                "Instant delivery, unbeatable prices, trusted by thousands of gamers."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="hero">
                <Link to="/shop">
                  {hero?.cta ?? "Shop Now"} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/track">Track Order</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {perks.map((p) => (
            <div key={p.title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="rounded-lg bg-gradient-primary/15 p-3 text-primary">
                <p.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Shop by Category</h2>
            <Link to="/shop" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="card-hover group relative flex aspect-[4/3] items-end overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card"
              >
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-60 transition group-hover:opacity-80" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-primary/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                <span className="relative font-display text-lg font-bold">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Featured Deals</h2>
          <Link to="/shop" className="text-sm font-medium text-primary hover:underline">
            Browse shop
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : featured && featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} symbol={symbol} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No featured products yet. Check back soon!
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
