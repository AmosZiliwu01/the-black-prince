import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { settingsQuery, categoriesQuery, productsQuery } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: settings } = useQuery(settingsQuery());
  const { data: categories } = useQuery(categoriesQuery());
  const { data: products, isLoading } = useQuery(productsQuery({ categorySlug: slug }));
  const symbol = settings?.general.currency_symbol ?? "$";
  const category = categories?.find((c) => c.slug === slug);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All products
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          {category?.name ?? "Category"}
        </h1>
        {category?.description && <p className="mt-2 text-muted-foreground">{category.description}</p>}

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
              No products in this category yet.
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}
