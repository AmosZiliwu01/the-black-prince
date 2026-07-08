import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { settingsQuery } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dukung-admin")({
  head: () => ({
    meta: [
      { title: "Dukung Admin — AZ Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DukungAdminPage,
});

function DukungAdminPage() {
  const { data: settings, isLoading } = useQuery(settingsQuery());
  const support = settings?.support;

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-4 h-24 w-full" />
          <Skeleton className="mt-6 aspect-square w-full rounded-xl" />
        </div>
      </StoreLayout>
    );
  }

  if (!support?.support_enabled) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold">Halaman tidak tersedia</h1>
          <p className="mt-2 text-muted-foreground">Fitur ini sedang tidak aktif.</p>
          <Button asChild variant="gradient" className="mt-6">
            <Link to="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <Heart className="mx-auto h-12 w-12 text-accent" />
        <h1 className="mt-3 font-display text-3xl font-bold">{support.support_title}</h1>
        <p className="mt-3 text-muted-foreground">{support.support_message}</p>

        {support.support_qris_image_url ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card">
            <img
              src={support.support_qris_image_url}
              alt="QRIS Dukung Admin"
              className="mx-auto max-h-80 rounded-lg"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              Scan QRIS di atas menggunakan aplikasi bank atau e-wallet kamu.
            </p>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-muted-foreground">
            QRIS donasi belum tersedia saat ini.
          </div>
        )}

        <Button asChild variant="ghost" className="mt-6">
          <Link to="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </StoreLayout>
  );
}