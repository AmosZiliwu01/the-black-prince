import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, ExternalLink } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { communityGroupsQuery } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/join-grup")({
  head: () => ({
    meta: [
      { title: "Join Grup — AZ Group" },
      { name: "description", content: "Gabung grup komunitas dan private server AZ Group untuk berbagai game." },
    ],
  }),
  component: JoinGrupPage,
});

function JoinGrupPage() {
  const { data: groups, isLoading } = useQuery(communityGroupsQuery());

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Join Grup</h1>
          <p className="mt-3 text-muted-foreground">
            Gabung komunitas dan private server kami untuk pengalaman bermain yang lebih seru.
          </p>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <div key={g.id} className="card-hover flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
                  <div className="relative aspect-video overflow-hidden bg-gradient-primary/10">
                    {g.image_url ? (
                      <img src={g.image_url} alt={g.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Users className="h-10 w-10 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-medium uppercase tracking-wide text-primary">{g.game_name}</span>
                    <h3 className="mt-1 font-display font-semibold leading-snug">{g.name}</h3>
                    {g.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
                    )}
                    {g.member_count && (
                      <p className="mt-2 text-xs text-muted-foreground">{g.member_count}</p>
                    )}
                    <div className="mt-4 flex-1" />
                    <Button asChild variant="gradient" className="w-full">
                      <a href={g.link_url} target="_blank" rel="noreferrer">
                        Gabung Sekarang <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Belum ada grup yang tersedia saat ini.
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}