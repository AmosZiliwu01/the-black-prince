import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Instagram, Facebook, Clock } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { settingsQuery } from "@/lib/store";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Hubungi Kami — AZ Group" },
      { name: "description", content: "Hubungi tim AZ Group lewat WhatsApp, Discord, Instagram, TikTok, atau Facebook." },
    ],
  }),
  component: ContactPage,
});

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  );
}

interface ContactCard {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel: string;
  colorClass: string;
}

function ContactPage() {
  const { data: settings } = useQuery(settingsQuery());
  const contact = settings?.contact;

  const cards: ContactCard[] = [];

  if (contact?.whatsapp_number) {
    cards.push({
      key: "whatsapp",
      href: "https://wa.me/" + contact.whatsapp_number.replace(/\D/g, ""),
      icon: MessageCircle,
      label: "WhatsApp",
      sublabel: "Respon cepat untuk pertanyaan & konfirmasi pesanan",
      colorClass: "text-success",
    });
  }
  if (contact?.discord) {
    cards.push({
      key: "discord",
      href: contact.discord,
      icon: DiscordIcon,
      label: "Discord",
      sublabel: "Gabung komunitas dan dapatkan update terbaru",
      colorClass: "text-primary",
    });
  }
  if (contact?.instagram) {
    cards.push({
      key: "instagram",
      href: contact.instagram,
      icon: Instagram,
      label: "Instagram",
      sublabel: "Lihat promo dan konten terbaru kami",
      colorClass: "text-accent",
    });
  }
  if (contact?.tiktok) {
    cards.push({
      key: "tiktok",
      href: contact.tiktok,
      icon: TikTokIcon,
      label: "TikTok",
      sublabel: "Tonton konten seru seputar Roblox",
      colorClass: "text-foreground",
    });
  }
  if (contact?.facebook) {
    cards.push({
      key: "facebook",
      href: contact.facebook,
      icon: Facebook,
      label: "Facebook",
      sublabel: "Ikuti halaman resmi kami",
      colorClass: "text-primary",
    });
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Hubungi Kami</h1>
          <p className="mt-3 text-muted-foreground">
            Ada pertanyaan? Tim kami siap membantu lewat platform berikut.
          </p>
          {settings?.general.support_hours && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> {settings.general.support_hours}
            </p>
          )}
        </div>

        {cards.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <a
                  key={c.key}
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="card-hover flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card"
                >
                  <div className={`rounded-lg bg-gradient-primary/15 p-3 ${c.colorClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-display font-semibold">{c.label}</p>
                    <p className="text-sm text-muted-foreground">{c.sublabel}</p>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Kontak belum tersedia saat ini. Silakan cek kembali nanti.
          </div>
        )}
      </div>
    </StoreLayout>
  );
}